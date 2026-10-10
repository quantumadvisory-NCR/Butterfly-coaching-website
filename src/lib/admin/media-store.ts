/**
 * Media library persistence: uploads, replacement, usage lookups and safe
 * deletion. Callers must have authorised the user first.
 */
import "server-only";
import { randomBytes } from "node:crypto";
import { desc, eq, sql } from "drizzle-orm";
import sharp from "sharp";
import { db } from "@/lib/db";
import * as s from "@/lib/db/schema";
import { maxUploadBytes } from "@/lib/env";
import { removeFile, storeFile } from "@/lib/storage";
import { slugify } from "@/lib/utils";

export type MediaRow = s.Media;

export async function listMedia(): Promise<MediaRow[]> {
  return db().select().from(s.media).orderBy(desc(s.media.createdAt), desc(s.media.filename));
}

export async function getMedia(id: string): Promise<MediaRow | null> {
  const [row] = await db().select().from(s.media).where(eq(s.media.id, id)).limit(1);
  return row ?? null;
}

/* ---- upload -------------------------------------------------------------- */

const IMAGE_FORMATS: Record<string, { ext: string; mime: string }> = {
  jpeg: { ext: "jpg", mime: "image/jpeg" },
  png: { ext: "png", mime: "image/png" },
  webp: { ext: "webp", mime: "image/webp" },
  avif: { ext: "avif", mime: "image/avif" },
  gif: { ext: "gif", mime: "image/gif" },
};

const MAX_EDGE = 2400;

type Prepared = { body: Buffer; ext: string; mime: string; kind: "image" | "file"; width: number | null; height: number | null };

/**
 * Checks what the file really is (never trusting the name or declared type)
 * and makes images safe to serve: decoded and re-encoded with sharp, which
 * strips EXIF data such as GPS location and removes anything hidden in the
 * file. SVG is rejected because it can carry scripts.
 */
async function prepare(file: File): Promise<Prepared | { error: string }> {
  if (file.size === 0) return { error: "The file is empty." };
  if (file.size > maxUploadBytes()) {
    return { error: `The file is larger than ${Math.round(maxUploadBytes() / 1024 / 1024)} MB. Please reduce it and try again.` };
  }
  const input = Buffer.from(await file.arrayBuffer());

  if (input.subarray(0, 5).toString("latin1") === "%PDF-") {
    return { body: input, ext: "pdf", mime: "application/pdf", kind: "file", width: null, height: null };
  }

  try {
    const meta = await sharp(input, { animated: true }).metadata();
    // sharp reports AVIF as "heif" with av1 compression. HEIC (hevc) is not web-safe and is rejected.
    const kind = meta.format === "heif" ? (meta.compression === "av1" ? "avif" : "") : (meta.format ?? "");
    const format = IMAGE_FORMATS[kind];
    if (!format) return { error: "Upload a JPG, PNG, WebP, AVIF or GIF image, or a PDF." };

    // Animated images are kept as they are (re-encoding would drop frames).
    if ((meta.pages ?? 1) > 1) {
      return { body: input, ...format, kind: "image", width: meta.width ?? null, height: meta.pageHeight ?? meta.height ?? null };
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
    return { body: data, ...format, kind: "image", width: info.width, height: info.height };
  } catch {
    return { error: "This file could not be read as an image. Upload a JPG, PNG, WebP, AVIF or GIF image, or a PDF." };
  }
}

function storageKeyFor(filename: string, ext: string) {
  const now = new Date();
  const base = slugify(filename.replace(/\.[^.]+$/, "")).slice(0, 60) || "file";
  return `uploads/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${base}-${randomBytes(4).toString("hex")}.${ext}`;
}

export async function uploadMedia(file: File, userId: string): Promise<{ media: MediaRow } | { error: string }> {
  const prepared = await prepare(file);
  if ("error" in prepared) return prepared;
  const stored = await storeFile(storageKeyFor(file.name, prepared.ext), prepared.body, prepared.mime);
  const [row] = await db()
    .insert(s.media)
    .values({
      kind: prepared.kind,
      source: "upload",
      storage: stored.storage,
      storageKey: stored.storageKey,
      url: stored.url,
      filename: stored.storageKey.split("/").pop()!,
      mimeType: prepared.mime,
      sizeBytes: prepared.body.length,
      width: prepared.width,
      height: prepared.height,
      alt: "",
      createdBy: userId,
    })
    .returning();
  return { media: row! };
}

/** Swaps the file behind an existing media item. Every place that uses it updates automatically. */
export async function replaceMedia(id: string, file: File): Promise<{ media: MediaRow } | { error: string }> {
  const existing = await getMedia(id);
  if (!existing) return { error: "That media item no longer exists." };
  const prepared = await prepare(file);
  if ("error" in prepared) return prepared;
  if (prepared.kind !== existing.kind) return { error: `Replace this ${existing.kind} with another ${existing.kind}.` };
  const stored = await storeFile(storageKeyFor(file.name, prepared.ext), prepared.body, prepared.mime);
  const [row] = await db()
    .update(s.media)
    .set({
      storage: stored.storage,
      storageKey: stored.storageKey,
      url: stored.url,
      filename: stored.storageKey.split("/").pop()!,
      mimeType: prepared.mime,
      sizeBytes: prepared.body.length,
      width: prepared.width,
      height: prepared.height,
      focalX: 0.5,
      focalY: 0.5,
      updatedAt: new Date(),
    })
    .where(eq(s.media.id, id))
    .returning();
  await removeFile(existing.storage, existing.storageKey).catch(() => {});
  return { media: row! };
}

/* ---- usage --------------------------------------------------------------- */

export type MediaUsage = { label: string; href: string | null; live: boolean };

/** Everywhere a media item is referenced, so it is never deleted out from under a page. */
export async function findMediaUsage(id: string): Promise<MediaUsage[]> {
  const like = `%${id}%`;
  const rows = await db().execute<{ label: string; href: string | null; live: boolean }>(sql`
    select 'Page: ' || p.title || ' (published version)' as label, '/admin/pages/' || p.id || '/' as href, true as live
      from pages p join revisions r on r.id = p.published_revision_id
      where p.status = 'published' and r.snapshot::text like ${like}
    union all
    select 'Page: ' || p.title || ' (draft)' as label, '/admin/pages/' || p.id || '/' as href, false as live
      from pages p
      where p.og_image_id = ${id} or exists (select 1 from page_sections ps where ps.page_id = p.id and ps.data::text like ${like})
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
