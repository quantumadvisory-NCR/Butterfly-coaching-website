import { readLocalFile } from "@/lib/storage";

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
  pdf: "application/pdf",
};

/**
 * Serves uploads from .local/uploads in local development mode. In production
 * media is served straight from Supabase Storage and this route returns 404.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params;
  const storageKey = key.join("/");
  const extension = storageKey.split(".").pop()?.toLowerCase() ?? "";
  const type = TYPES[extension];
  if (!type) return new Response("Not found", { status: 404 });

  let body: Buffer | null = null;
  try {
    body = await readLocalFile(storageKey);
  } catch {
    body = null;
  }
  if (!body) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": type,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      ...(type === "application/pdf" ? { "Content-Disposition": "inline" } : {}),
    },
  });
}
