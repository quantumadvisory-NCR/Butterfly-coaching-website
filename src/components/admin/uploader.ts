/**
 * Sends one file to the media library from the browser, reporting progress.
 *
 * 1. Ask the server for a ticket (it checks the declared type and size).
 * 2. Production: send the file straight to storage at the one-time address,
 *    then ask the server to check it and add it to the library. Local
 *    development: send it to the server, which does both.
 */
import { ACCEPT, KIND_NOUN, UPLOAD_LIMITS, extensionOf, uploadKindFor } from "@/lib/media-kinds";

export type UploadPhase = "starting" | "uploading" | "checking";
export type UploadProgress = { phase: UploadPhase; fraction: number };
export type UploadResult = { ok: true; id: string } | { ok: false; message: string };

const UNSUPPORTED = "This type of file is not supported. Upload a JPG, PNG, WebP, AVIF or GIF image, an MP4 or WebM video, or a PDF.";
const FAILED = "The upload failed. Check your connection and try again.";

const TYPE_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
  mp4: "video/mp4",
  m4v: "video/mp4",
  webm: "video/webm",
  pdf: "application/pdf",
};

/** A reason to refuse the file before sending anything, or null. The server checks again. */
export function preflight(file: File): string | null {
  const kind = uploadKindFor(file);
  if (!kind) return UNSUPPORTED;
  if (file.size === 0) return "The file is empty.";
  if (file.size > UPLOAD_LIMITS[kind]) {
    return `${file.name} is larger than ${UPLOAD_LIMITS[kind] / 1024 / 1024} MB, the limit for ${kind === "file" ? "a PDF" : `an ${KIND_NOUN[kind]}`}. Please make it smaller and try again.`;
  }
  const type = contentType(file);
  if (type === "image/heic" || type === "image/heif") return "iPhone HEIC photos do not show in every browser. Save the photo as JPG and upload it again.";
  if (type === "video/quicktime") return "This is a QuickTime (.mov) video. Export or share it as MP4 so it plays in every browser, then upload it again.";
  if (!ACCEPT[kind].split(",").includes(type)) return UNSUPPORTED;
  return null;
}

function contentType(file: File) {
  return file.type || TYPE_BY_EXTENSION[extensionOf(file.name)] || "";
}

type Sent = { status: number; body: unknown };

/** XMLHttpRequest rather than fetch, for upload progress. */
function send(method: string, url: string, body: XMLHttpRequestBodyInit, headers: Record<string, string>, onProgress?: (fraction: number) => void): Promise<Sent> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    for (const [name, value] of Object.entries(headers)) xhr.setRequestHeader(name, value);
    if (onProgress) xhr.upload.onprogress = (event) => event.lengthComputable && onProgress(event.loaded / event.total);
    xhr.onload = () => {
      let parsed: unknown = null;
      try {
        parsed = JSON.parse(xhr.responseText);
      } catch {
        parsed = null;
      }
      resolve({ status: xhr.status, body: parsed });
    };
    xhr.onerror = () => resolve({ status: 0, body: null });
    xhr.ontimeout = () => resolve({ status: 0, body: null });
    xhr.send(body);
  });
}

type ApiReply = { ok?: boolean; id?: string; message?: string; mode?: "server" | "direct"; url?: string; path?: string; ticket?: string };

function reply(sent: Sent): ApiReply {
  return (sent.body && typeof sent.body === "object" ? sent.body : {}) as ApiReply;
}

function result(sent: Sent): UploadResult {
  const body = reply(sent);
  if (body.ok && body.id) return { ok: true, id: body.id };
  if (body.message) return { ok: false, message: body.message };
  return { ok: false, message: sent.status === 413 ? "The file is too large." : FAILED };
}

/** What storage says when it refuses a file, in plain words. */
function storageProblem(sent: Sent): string {
  const body = reply(sent) as { message?: string; error?: string };
  const text = `${body.error ?? ""} ${body.message ?? ""}`.toLowerCase();
  if (text.includes("mime")) return "The file store does not take this type of file yet. Ask a site owner to apply the latest storage update (migration 0006).";
  if (sent.status === 413 || text.includes("size") || text.includes("large")) return "The file store refused the file because it is too large.";
  return FAILED;
}

const json = (url: string, data: unknown) => send("POST", url, JSON.stringify(data), { "Content-Type": "application/json" });

export async function uploadFile(file: File, options: { replaceId?: string; onProgress?: (progress: UploadProgress) => void } = {}): Promise<UploadResult> {
  const { replaceId, onProgress } = options;
  const problem = preflight(file);
  if (problem) return { ok: false, message: problem };
  onProgress?.({ phase: "starting", fraction: 0 });

  const asked = await json("/api/admin/media/ticket/", { name: file.name, size: file.size, type: contentType(file), replace: replaceId });
  const ticket = reply(asked);
  if (!ticket.ok) return result(asked);

  const uploading = (fraction: number) => onProgress?.(fraction >= 1 ? { phase: "checking", fraction: 1 } : { phase: "uploading", fraction });

  if (ticket.mode !== "direct" || !ticket.url || !ticket.path || !ticket.ticket) {
    const form = new FormData();
    form.append("file", file);
    if (replaceId) form.append("replace", replaceId);
    return result(await send("POST", "/api/admin/media/", form, {}, uploading));
  }

  const stored = await send("PUT", ticket.url, file, { "Content-Type": contentType(file), "Cache-Control": "max-age=31536000", "x-upsert": "false" }, uploading);
  if (stored.status < 200 || stored.status >= 300) return { ok: false, message: storageProblem(stored) };
  onProgress?.({ phase: "checking", fraction: 1 });
  return result(await json("/api/admin/media/complete/", { path: ticket.path, ticket: ticket.ticket, name: file.name, replace: replaceId }));
}
