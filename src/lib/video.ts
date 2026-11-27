import { youtubeId } from "@/lib/utils";

/** Sent (bubbling) when a story video starts, so a moving stories carousel around it stops. */
export const STORY_PLAY_EVENT = "bca-story-play";

/** A video file editors may use: one on this site ("/videos/...") or in the media library's storage. */
export function videoFileUrl(url: string): string | null {
  const value = url.trim();
  return /^\/(?!\/)|^https:\/\/[a-z0-9-]+\.supabase\.co\//i.test(value) && /\.(mp4|webm|mov)(\?|#|$)/i.test(value) ? value : null;
}

/** True when a testimonial's video link is something the site can play: a YouTube link or a video file. */
export function isPlayableVideo(url: string | null | undefined): boolean {
  return Boolean(url && (youtubeId(url) || videoFileUrl(url)));
}
