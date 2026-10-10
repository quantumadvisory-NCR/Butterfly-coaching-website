import Image, { getImageProps } from "next/image";
import type { MediaItem } from "@/lib/content/public";
import { cn } from "@/lib/utils";

const focal = (media: MediaItem) => `${Math.round(media.focalX * 100)}% ${Math.round(media.focalY * 100)}%`;
const isVector = (media: MediaItem) => media.mimeType === "image/svg+xml" || media.url.endsWith(".svg");

type Props = {
  media: MediaItem | null | undefined;
  /** How wide the image renders at each breakpoint. Required for correct responsive loading. */
  sizes: string;
  /** Fill the (relatively positioned, sized) parent and crop around the focal point. */
  fill?: boolean;
  /** Load eagerly and preload. Only for the largest image above the fold. */
  preload?: boolean;
  /** Overrides the library alt text. Pass "" for decorative use. */
  alt?: string;
  className?: string;
  quality?: 70 | 75 | 85;
};

/**
 * Renders a media library image through next/image: responsive AVIF/WebP,
 * reserved dimensions (no layout shift), lazy loading by default and
 * focal-point cropping.
 */
export function MediaImage({ media, sizes, fill, preload, alt, className, quality = 75 }: Props) {
  if (!media || media.kind !== "image") return null;
  const altText = alt ?? media.alt;
  const shared = {
    src: media.url,
    sizes,
    quality,
    preload,
    // A preloaded image is the main image on screen, so ask the browser to fetch it first.
    fetchPriority: preload ? ("high" as const) : undefined,
    unoptimized: isVector(media),
  };
  if (fill) {
    return <Image {...shared} alt={altText} fill className={cn("object-cover", className)} style={{ objectPosition: focal(media) }} />;
  }
  return (
    <Image
      {...shared}
      alt={altText}
      width={media.width ?? 1200}
      height={media.height ?? 800}
      className={cn("h-auto w-full", className)}
    />
  );
}

/**
 * Art direction: a wide crop for stacked layouts and a tall crop for the
 * split layout on large screens. The browser downloads only the one it uses.
 */
export function ArtDirectedImage({
  wide,
  tall,
  alt,
  tallFrom = "64rem",
  className,
}: {
  wide: MediaItem;
  tall?: MediaItem | null;
  alt?: string;
  /** Breakpoint from which the tall crop is used. */
  tallFrom?: string;
  className?: string;
}) {
  const altText = alt ?? wide.alt;
  const wideProps = getImageProps({
    src: wide.url,
    alt: altText,
    width: wide.width ?? 1600,
    height: wide.height ?? 1067,
    sizes: "(min-width: 64rem) 46vw, 100vw",
    quality: 75,
    // The hero image is the largest thing on the first screen: load it straight away, ahead of everything else.
    loading: "eager",
    fetchPriority: "high",
  }).props;

  if (!tall) {
    return (
      // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- props come from next/image
      <img {...wideProps} className={cn("h-full w-full object-cover", className)} style={{ objectPosition: focal(wide) }} />
    );
  }

  const tallProps = getImageProps({
    src: tall.url,
    alt: altText,
    width: tall.width ?? 1200,
    height: tall.height ?? 1500,
    sizes: "(min-width: 64rem) 46vw, 100vw",
    quality: 75,
  }).props;

  return (
    <picture className="block size-full" style={{ "--focal-wide": focal(wide), "--focal-tall": focal(tall) } as React.CSSProperties}>
      <source media={`(min-width: ${tallFrom})`} srcSet={tallProps.srcSet} sizes={tallProps.sizes} />
      {/* eslint-disable-next-line jsx-a11y/alt-text -- alt is included in the props from next/image */}
      <img {...wideProps} className={cn("art-directed h-full w-full object-cover", className)} />
    </picture>
  );
}

export { focal as focalPosition };
