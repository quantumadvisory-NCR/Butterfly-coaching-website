import "server-only";
import type { MediaView } from "@/app/admin/actions/operations";
import { type MediaRow, listMedia } from "./media-store";

/** A media item in the client-safe shape the library and pickers use. */
export function toMediaView(m: MediaRow): MediaView {
  return {
    id: m.id,
    kind: m.kind,
    source: m.source,
    storage: m.storage,
    url: m.url,
    filename: m.filename,
    mimeType: m.mimeType,
    sizeBytes: m.sizeBytes,
    width: m.width,
    height: m.height,
    alt: m.alt,
    caption: m.caption,
    credit: m.credit,
    licence: m.licence,
    sourceUrl: m.sourceUrl,
    focalX: m.focalX,
    focalY: m.focalY,
    createdAt: m.createdAt.toISOString(),
  };
}

/** The whole media library, newest first. */
export async function mediaViews(): Promise<MediaView[]> {
  return (await listMedia()).map(toMediaView);
}
