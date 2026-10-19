import type { MediaItem, MediaMap } from "@/lib/content/public";
import type { BlockData, BlockType } from "@/lib/blocks/registry";
import type { LinkValue } from "@/lib/blocks/fields";
import { type SiteSettings, resolveHref } from "@/lib/settings";

export type Crumb = { label: string; href: string };

/** Everything a block needs besides its own data. */
export type BlockContext = {
  media: MediaMap;
  settings: SiteSettings;
  /** Breadcrumb trail for the current page (empty on the homepage). */
  breadcrumbs: Crumb[];
  /** True when rendering an unpublished draft inside the admin preview. */
  preview: boolean;
  /** Index of the block on the page. The first block may preload its image. */
  index: number;
  /** Type and layout of the blocks either side, so a hero and an overlapping panel can fit together. */
  prev?: { type: string; layout?: string; variant?: string } | null;
  next?: { type: string; layout?: string; variant?: string } | null;
};

export type BlockProps<T extends BlockType> = { data: BlockData[T]; ctx: BlockContext };

export function pickMedia(ctx: BlockContext, id: string | null | undefined): MediaItem | null {
  return id ? (ctx.media[id] ?? null) : null;
}

/** A usable button: has both a label and a destination, with special targets resolved. */
export function usableLink(link: LinkValue | undefined, settings: SiteSettings): LinkValue | null {
  if (!link?.label || !link.href) return null;
  return { label: link.label, href: resolveHref(link.href, settings) };
}
