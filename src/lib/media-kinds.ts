/**
 * What the media library accepts, shared by the upload screen (browser) and the
 * server. The browser uses it only to choose a route and to warn early; the
 * server checks every file's real contents before keeping it.
 */
export type UploadKind = "image" | "video" | "file";

const MB = 1024 * 1024;

/** Largest file of each kind. Images are resized and re-encoded after upload, so phone photos are fine. */
export const UPLOAD_LIMITS: Record<UploadKind, number> = { image: 20 * MB, file: 25 * MB, video: 50 * MB };

export const ACCEPT: Record<UploadKind, string> = {
  image: "image/jpeg,image/png,image/webp,image/avif,image/gif",
  video: "video/mp4,video/webm",
  file: "application/pdf",
};
export const ACCEPT_ALL = `${ACCEPT.image},${ACCEPT.video},${ACCEPT.file}`;

const EXTENSIONS: Record<string, UploadKind> = {
  jpg: "image",
  jpeg: "image",
  png: "image",
  webp: "image",
  avif: "image",
  gif: "image",
  mp4: "video",
  m4v: "video",
  webm: "video",
  mov: "video",
  pdf: "file",
};

export function extensionOf(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

/** The kind a file claims to be, from its type or name. Null when the library does not take it. */
export function uploadKindFor(file: { name: string; type?: string }): UploadKind | null {
  const type = file.type ?? "";
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  if (type === "application/pdf") return "file";
  return EXTENSIONS[extensionOf(file.name)] ?? null;
}

export const formatBytes = (bytes: number | null | undefined) =>
  !bytes ? "" : bytes >= MB ? `${(bytes / MB).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export const KIND_NOUN: Record<UploadKind, string> = { image: "image", video: "video", file: "PDF" };
