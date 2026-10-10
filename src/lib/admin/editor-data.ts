import "server-only";
import type { MediaView } from "@/app/admin/actions/operations";
import { listMedia } from "./media-store";

/** The media library in the client-safe shape the pickers use. */
export async function mediaViews(): Promise<MediaView[]> {
  return (await listMedia()).map((m) => ({
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
  }));
}
