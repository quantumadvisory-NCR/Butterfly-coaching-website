/**
 * Media library persistence: uploads, replacement, usage lookups and safe
 * deletion. Callers must have authorised the user first.
 */
import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { desc, eq, sql } from "drizzle-orm";
import sharp from "sharp";
import { db } from "@/lib/db";
import * as s from "@/lib/db/schema";
import { sessionSecret } from "@/lib/env";
import { KIND_NOUN, UPLOAD_LIMITS, type UploadKind, uploadKindFor } from "@/lib/media-kinds";
import { type StoredFile, createUploadUrl, readStoredFile, readStoredHead, removeFile, storeFile, storedUrl } from "@/lib/storage";
import { slugify } from "@/lib/utils";

export type MediaRow = s.Media;

export async function listMedia(): Promise<MediaRow[]> {
  return db().select().from(s.media).orderBy(desc(s.media.createdAt), desc(s.media.filename));
}

export async function getMedia(id: string): Promise<MediaRow | null> {
  const [row] = await db().select().from(s.media).where(eq(s.media.id, id)).limit(1);
  return row ?? null;
}

/* ---- checking files --------------------------------------------------------- */

const IMAGE_FORMATS: Record<string, { ext: string; mime: string }> = {
  jpeg: { ext: "jpg", mime: "image/jpeg" },
  png: { ext: "png", mime: "image/png" },
  webp: { ext: "webp", mime: "image/webp" },
  avif: { ext: "avif", mime: "image/avif" },
  gif: { ext: "gif", mime: "image/gif" },
};

const MAX_EDGE = 2400;
const ACCEPTED = "Upload a JPG, PNG, WebP, AVIF or GIF image, an MP4 or WebM video, or a PDF.";

type Checked = { kind: UploadKind; ext: string; mime: string; size: number; width: number | null; height: number | null };
type Prepared = Checked & { body: Buffer };
type Sniffed = { kind: "video" | "file"; ext: string; mime: string } | { kind: "image" } | { error: string };

/** ISO base-media brands that are still pictures (HEIC, AVIF), not videos. */
const PICTURE_BRANDS = new Set(["avif", "avis", "heic", "heix", "hevc", "hevx", "mif1", "msf1"]);

/** What a file really is, from its first bytes. Names and declared types are never trusted. */
export function sniff(head: Buffer): Sniffed {
  if (head.subarray(0, 5).toString("latin1") === "%PDF-") return { kind: "file", ext: "pdf", mime: "application/pdf" };
  if (head.subarray(4, 8).toString("latin1") === "ftyp") {
    const brand = head.subarray(8, 12).toString("latin1");
    if (PICTURE_BRANDS.has(brand.trim())) return { kind: "image" };
    if (brand === "qt  ") return { error: "This is a QuickTime (.mov) video. Export or share it as MP4 so it plays in every browser, then upload it again." };
    if (/^M4[AB]/.test(brand)) return { error: "Audio files are not supported. Upload an MP4 or WebM video." };
    return { kind: "video", ext: "mp4", mime: "video/mp4" };
  }
  if (head.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) {
    return head.includes("webm", 0, "latin1")
      ? { kind: "video", ext: "webm", mime: "video/webm" }
      : { error: "This video format is not supported. Upload an MP4 or WebM video." };
  }
  return { kind: "image" };
}

const tooLarge = (kind: UploadKind) =>
  `The file is larger than ${UPLOAD_LIMITS[kind] / 1024 / 1024} MB, the limit for ${kind === "file" ? "a PDF" : `an ${kind}`}. Please make it smaller and try again.`;

/**
 * Checks what the file really is and makes images safe to serve: decoded and
 * re-encoded with sharp, which strips EXIF data such as GPS location and
 * removes anything hidden in the file. SVG is rejected because it can carry
 * scripts. PDFs and videos are kept byte for byte once their type is confirmed.
 */
async function prepare(input: Buffer, claimed?: UploadKind | null): Promise<Prepared | { error: string }> {
  if (input.length === 0) return { error: "The file is empty." };
  const sniffed = sniff(input.subarray(0, 64));
  if ("error" in sniffed) return sniffed;
  // A file named as a video or PDF whose contents are something else.
  if (claimed && claimed !== "image" && sniffed.kind !== claimed) {
    return { error: claimed === "video" ? "This file is not a playable MP4 or WebM video. Export it again as MP4 and upload it." : "This file is not a real PDF. Save or export it as PDF and upload it again." };
  }
  if (sniffed.kind !== "image") {
    if (input.length > UPLOAD_LIMITS[sniffed.kind]) return { error: tooLarge(sniffed.kind) };
    return { body: input, ext: sniffed.ext, mime: sniffed.mime, kind: sniffed.kind, size: input.length, width: null, height: null };
  }
  if (input.length > UPLOAD_LIMITS.image) return { error: tooLarge("image") };

  try {
    const meta = await sharp(input, { animated: true }).metadata();
    // sharp reports AVIF as "heif" with av1 compression. HEIC (hevc) is not web-safe and is rejected.
    const kind = meta.format === "heif" ? (meta.compression === "av1" ? "avif" : "") : (meta.format ?? "");
    const format = IMAGE_FORMATS[kind];
    if (!format) {
      return { error: meta.format === "heif" ? "iPhone HEIC photos do not show in every browser. Save the photo as JPG and upload it again." : ACCEPTED };
    }

    // Animated images are kept as they are (re-encoding would drop frames).
    if ((meta.pages ?? 1) > 1) {
      return { body: input, ...format, kind: "image", size: input.length, width: meta.width ?? null, height: meta.pageHeight ?? meta.height ?? null };
    }

    const pipeline = sharp(input).rotate().resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true });
    const encoded =
      kind === "jpeg"
        ? pipeline.jpeg({ quality: 86, mozjpeg: true })
        : kind === "png"
          ? pipeline.png({ compressionLevel: 9 })
          : kind === "webp"
            ? pipeline.webp({ quality: 86 })
            : kind === "avif"
              ? pipeline.avif({ quality: 60 })
              : pipeline;
    const { data, info } = await encoded.toBuffer({ resolveWithObject: true });
    return { body: data, ...format, kind: "image", size: data.length, width: info.width, height: info.height };
  } catch {
    return { error: `This file could not be read as an image. ${ACCEPTED}` };
  }
}

function storageKeyFor(filename: string, ext: string, folder = "uploads") {
  const now = new Date();
  const base = slugify(filename.replace(/\.[^.]+$/, "")).slice(0, 60) || "file";
  return `${folder}/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${base}-${randomBytes(4).toString("hex")}.${ext}`;
}

/** A replacement must be the same kind of thing, so every place that uses the item keeps working. */
async function checkReplace(replaceId: string | undefined, kind: UploadKind): Promise<string | null> {
  if (!replaceId) return null;
  const existing = await getMedia(replaceId);
  if (!existing) return "That media item no longer exists.";
  if (existing.kind === kind) return null;
  const noun = KIND_NOUN[existing.kind];
  return `Replace this ${noun} with another ${noun}.`;
}

/** Saves a checked file as a new library item, or swaps the file behind an existing one (every use updates). */
async function keep(file: Checked, stored: StoredFile, userId: string, replaceId?: string): Promise<MediaRow> {
  const values = {
    storage: stored.storage,
    storageKey: stored.storageKey,
    url: stored.url,
    filename: stored.storageKey.split("/").pop()!,
    mimeType: file.mime,
    sizeBytes: file.size,
    width: file.width,
    height: file.height,
  };
  if (!replaceId) {
    const [row] = await db()
      .insert(s.media)
      .values({ ...values, kind: file.kind, source: "upload", alt: "", createdBy: userId })
      .returning();
    return row!;
  }
  const existing = await getMedia(replaceId);
  const [row] = await db()
    .update(s.media)
    .set({ ...values, focalX: 0.5, focalY: 0.5, updatedAt: new Date() })
    .where(eq(s.media.id, replaceId))
    .returning();
  if (existing) await removeFile(existing.storage, existing.storageKey).catch(() => {});
  return row!;
}

/* ---- uploads ------------------------------------------------------------------ */

/** Upload through the server, used in local development where there is no request size limit. */
export async function uploadMedia(file: File, userId: string, replaceId?: string): Promise<{ media: MediaRow } | { error: string }> {
  const claimed = uploadKindFor(file);
  if (claimed && file.size > UPLOAD_LIMITS[claimed]) return { error: tooLarge(claimed) };
  const prepared = await prepare(Buffer.from(await file.arrayBuffer()), claimed);
  if ("error" in prepared) return prepared;
  const problem = await checkReplace(replaceId, prepared.kind);
  if (problem) return { error: problem };
  const stored = await storeFile(storageKeyFor(file.name, prepared.ext), prepared.body, prepared.mime);
  return { media: await keep(prepared, stored, userId, replaceId) };
}

/*
 * Direct uploads (production). Vercel refuses request bodies over about 4.5 MB,
 * so the browser sends the file straight to Supabase Storage with a one-time
 * signed address, then asks the server to check it and add it to the library.
 * The ticket ties that second call to the person and the address they were given.
 */

const TICKET_LIFETIME_MS = 2 * 60 * 60 * 1000;

const sign = (value: string) => createHmac("sha256", sessionSecret()).update(value).digest("base64url");

export type UploadTicket = { mode: "server" } | { mode: "direct"; url: string; path: string; ticket: string };

export async function createUploadTicket(
  file: { name: string; size: number; type: string },
  userId: string,
  replaceId?: string,
): Promise<UploadTicket | { error: string }> {
  const kind = uploadKindFor(file);
  if (!kind) return { error: ACCEPTED };
  if (!(file.size > 0)) return { error: "The file is empty." };
  if (file.size > UPLOAD_LIMITS[kind]) return { error: tooLarge(kind) };
  const problem = await checkReplace(replaceId, kind);
  if (problem) return { error: problem };

  // Images land in a holding folder: the library keeps the checked, re-encoded copy.
  const ext = kind === "file" ? "pdf" : kind === "video" ? (file.type === "video/webm" ? "webm" : "mp4") : "upload";
  const path = storageKeyFor(file.name, ext, kind === "image" ? "incoming" : "uploads");
  const url = await createUploadUrl(path);
  if (!url) return { mode: "server" };
  const expires = Date.now() + TICKET_LIFETIME_MS;
  return { mode: "direct", url, path, ticket: `${expires}.${sign(`${userId}|${path}|${expires}`)}` };
}

function validTicket(ticket: string, userId: string, path: string) {
  const [expires = "", signature = ""] = ticket.split(".");
  const expected = Buffer.from(sign(`${userId}|${path}|${expires}`));
  const given = Buffer.from(signature);
  return given.length === expected.length && timingSafeEqual(given, expected) && Number(expires) > Date.now();
}

export async function finishDirectUpload(
  input: { path: string; ticket: string; name: string },
  userId: string,
  replaceId?: string,
): Promise<{ media: MediaRow } | { error: string }> {
  if (!validTicket(input.ticket, userId, input.path)) return { error: "This upload has expired. Please upload the file again." };
  let kept = false;
  try {
    if (input.path.startsWith("incoming/")) {
      // An image: fetch it, check and re-encode it, keep the clean copy, drop the original.
      const original = await readStoredFile(input.path);
      if (!original) return { error: "The upload did not arrive. Please try again." };
      const prepared = await prepare(original);
      if ("error" in prepared) return prepared;
      const problem = await checkReplace(replaceId, prepared.kind);
      if (problem) return { error: problem };
      const stored = await storeFile(storageKeyFor(input.name, prepared.ext), prepared.body, prepared.mime);
      return { media: await keep(prepared, stored, userId, replaceId) };
    }

    // A PDF or video stays where it landed once its first bytes and size check out.
    const head = await readStoredHead(input.path);
    if (!head) return { error: "The upload did not arrive. Please try again." };
    const sniffed = sniff(head.bytes);
    if ("error" in sniffed) return sniffed;
    if (sniffed.kind === "image" || !input.path.endsWith(`.${sniffed.ext}`)) {
      return { error: "The file's contents do not match its type. Upload an MP4 or WebM video, or a PDF." };
    }
    if (head.size > UPLOAD_LIMITS[sniffed.kind]) return { error: tooLarge(sniffed.kind) };
    const problem = await checkReplace(replaceId, sniffed.kind);
    if (problem) return { error: problem };
    const file: Checked = { kind: sniffed.kind, ext: sniffed.ext, mime: sniffed.mime, size: head.size, width: null, height: null };
    const media = await keep(file, { storage: "supabase", storageKey: input.path, url: storedUrl(input.path) }, userId, replaceId);
    kept = true;
    return { media };
  } finally {
    // The original is never left behind: images were copied, rejected files are unwanted.
    if (!kept) await removeFile("supabase", input.path).catch(() => {});
  }
}

/* ---- usage --------------------------------------------------------------- */

export type MediaUsage = { label: string; href: string | null; live: boolean };

/**
 * Everywhere a media item is referenced, so it is never deleted out from under a page.
 * Images and PDFs are referenced by id; videos are linked by their address.
 */
export async function findMediaUsage(id: string): Promise<MediaUsage[]> {
  const like = `%${id}%`;
  const item = await getMedia(id);
  // A video's address, or the id again (which never appears as an address) for everything else.
  const address = item?.kind === "video" ? item.url : id;
  const linked = `%${address}%`;
  const rows = await db().execute<{ label: string; href: string | null; live: boolean }>(sql`
    select 'Page: ' || p.title || ' (published version)' as label, '/admin/pages/' || p.id || '/' as href, true as live
      from pages p join revisions r on r.id = p.published_revision_id
      where p.status = 'published' and (r.snapshot::text like ${like} or r.snapshot::text like ${linked})
    union all
    select 'Page: ' || p.title || ' (draft)' as label, '/admin/pages/' || p.id || '/' as href, false as live
      from pages p
      where p.og_image_id = ${id}
        or exists (select 1 from page_sections ps where ps.page_id = p.id and (ps.data::text like ${like} or ps.data::text like ${linked}))
    union all
    select 'Testimonial video: ' || name, '/admin/testimonials/' || id || '/', status = 'approved' from testimonials where video_url = ${address}
    union all
    select 'Programme: ' || name, '/admin/programmes/' || id || '/', status = 'published'
      from programmes where ${id} in (badge_id::text, hero_image_id::text, card_image_id::text, brochure_id::text)
    union all
    select 'Faculty: ' || name, '/admin/faculty/' || id || '/', status = 'published' from faculty where photo_id = ${id}
    union all
    select 'Testimonial: ' || name, '/admin/testimonials/' || id || '/', status = 'approved' from testimonials where photo_id = ${id}
    union all
    select 'Article: ' || title, '/admin/blog/' || id || '/', status = 'published' from posts where featured_image_id = ${id}
    union all
    select 'Resource: ' || title, '/admin/resources/' || id || '/', status = 'published' from resources where ${id} in (file_id::text, cover_id::text)
    union all
    select 'Site settings: ' || key, '/admin/settings/', true from site_settings where value::text like ${like}
  `);
  return [...rows];
}

export async function deleteMedia(id: string, force: boolean): Promise<{ ok: true } | { ok: false; usage: MediaUsage[]; message: string }> {
  const existing = await getMedia(id);
  if (!existing) return { ok: true };
  const usage = await findMediaUsage(id);
  const live = usage.filter((u) => u.live);
  if (live.length > 0) {
    return { ok: false, usage, message: "This item is used on the live site. Replace it in the places listed below before deleting it." };
  }
  if (usage.length > 0 && !force) {
    return { ok: false, usage, message: "This item is used in drafts. Deleting it will leave those sections without an image." };
  }
  await db().delete(s.media).where(eq(s.media.id, id));
  await removeFile(existing.storage, existing.storageKey).catch(() => {});
  return { ok: true };
}
