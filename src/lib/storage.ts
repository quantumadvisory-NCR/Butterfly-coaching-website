/**
 * File storage for uploaded media. Supabase Storage in production; the local
 * disk (.local/uploads, served by /media/...) in local development mode.
 */
import "server-only";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { supabaseAdmin } from "@/lib/auth/supabase";
import { backendMode } from "@/lib/env";

const LOCAL_ROOT = path.resolve(".local/uploads");
const bucket = () => process.env.SUPABASE_STORAGE_BUCKET || "media";

export type StoredFile = { storage: "local" | "supabase"; storageKey: string; url: string };

function safeKey(key: string) {
  const clean = key.replace(/\\/g, "/").replace(/^\/+/, "");
  if (clean.includes("..") || !/^[a-z0-9/_.-]+$/i.test(clean)) throw new Error("Invalid storage key.");
  return clean;
}

export async function storeFile(key: string, body: Buffer, contentType: string): Promise<StoredFile> {
  const storageKey = safeKey(key);
  if (backendMode() === "supabase") {
    const client = supabaseAdmin();
    const { error } = await client.storage.from(bucket()).upload(storageKey, body, {
      contentType,
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) throw new Error(`Upload failed: ${error.message}`);
    const { data } = client.storage.from(bucket()).getPublicUrl(storageKey);
    return { storage: "supabase", storageKey, url: data.publicUrl };
  }
  const target = path.join(LOCAL_ROOT, storageKey);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, body);
  return { storage: "local", storageKey, url: `/media/${storageKey}` };
}

/** Public address of a file in the Supabase bucket. */
export function storedUrl(key: string): string {
  return supabaseAdmin().storage.from(bucket()).getPublicUrl(safeKey(key)).data.publicUrl;
}

/**
 * A one-time address the browser can upload one file to, straight into the
 * Supabase bucket (valid for two hours). Null in local mode, where uploads go
 * through the server instead.
 */
export async function createUploadUrl(key: string): Promise<string | null> {
  if (backendMode() !== "supabase") return null;
  const { data, error } = await supabaseAdmin().storage.from(bucket()).createSignedUploadUrl(safeKey(key));
  if (error || !data) throw new Error(`Could not prepare the upload: ${error?.message ?? "no address returned"}`);
  return data.signedUrl;
}

/** The whole of a file in the Supabase bucket, or null when it is not there. */
export async function readStoredFile(key: string): Promise<Buffer | null> {
  const { data, error } = await supabaseAdmin().storage.from(bucket()).download(safeKey(key));
  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}

/** The first bytes and total size of a file in the bucket, without downloading all of it (videos can be large). */
export async function readStoredHead(key: string): Promise<{ bytes: Buffer; size: number } | null> {
  const response = await fetch(storedUrl(key), { headers: { Range: "bytes=0-63" }, cache: "no-store" });
  if (response.status !== 206 && response.status !== 200) return null;
  const bytes = Buffer.from(await response.arrayBuffer()).subarray(0, 64);
  const range = response.headers.get("content-range")?.match(/\/(\d+)$/);
  const size = range ? Number(range[1]) : Number(response.headers.get("content-length") ?? bytes.length);
  return { bytes, size };
}

export async function removeFile(storage: string, storageKey: string | null) {
  if (!storageKey) return;
  if (storage === "supabase") {
    await supabaseAdmin().storage.from(bucket()).remove([safeKey(storageKey)]);
  } else if (storage === "local") {
    await unlink(path.join(LOCAL_ROOT, safeKey(storageKey))).catch(() => {});
  }
}

/** Reads a locally stored upload. Local mode only. */
export async function readLocalFile(storageKey: string): Promise<Buffer | null> {
  if (backendMode() !== "local") return null;
  try {
    return await readFile(path.join(LOCAL_ROOT, safeKey(storageKey)));
  } catch {
    return null;
  }
}
