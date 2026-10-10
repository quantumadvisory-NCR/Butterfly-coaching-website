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
