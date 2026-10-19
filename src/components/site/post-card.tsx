import Link from "next/link";
import { MediaImage } from "@/components/ui/media-image";
import type { MediaItem, PostView } from "@/lib/content/public";
import { formatDate, readingMinutes } from "@/lib/utils";

export function PostCard({ post, image, showExcerpt = false }: { post: PostView; image: MediaItem | null; showExcerpt?: boolean }) {
  return (
    <li className="group relative isolate flex flex-col">
      <div className="relative aspect-[16/10] overflow-hidden rounded-card bg-tint-deep">
        {image && (
          <MediaImage
            media={image}
            fill
            alt=""
            sizes="(min-width: 64rem) 31vw, (min-width: 48rem) 46vw, 100vw"
            className="transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        )}
      </div>
      <p className="mt-5 text-sm text-muted">
        <time dateTime={post.publishedAt ?? undefined}>{formatDate(post.publishedAt)}</time> <span aria-hidden>·</span> {readingMinutes(post.contentHtml)} min read
      </p>
      <h3 className="mt-2 text-h3">
        <Link href={`/${post.slug}/`} className="outline-none after:absolute after:inset-0 after:z-10 group-hover:text-primary focus-visible:underline">
          {post.title}
        </Link>
      </h3>
      {showExcerpt && post.excerpt && <p className="mt-2.5 text-[0.9688rem]">{post.excerpt}</p>}
    </li>
  );
}
