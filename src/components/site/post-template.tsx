import Link from "next/link";
import type { BlockContext, Crumb } from "@/components/blocks/types";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { JsonLd } from "@/components/site/json-ld";
import { PostCard } from "@/components/site/post-card";
import { ButtonLink } from "@/components/ui/button-link";
import { MediaImage } from "@/components/ui/media-image";
import { RichText } from "@/components/ui/section";
import { type PostView, getPosts } from "@/lib/content/public";
import { siteUrl } from "@/lib/env";
import { absoluteUrl } from "@/lib/seo";
import { resolveHref } from "@/lib/settings";
import { formatDate, readingMinutes } from "@/lib/utils";

export async function PostTemplate({
  post,
  ctx,
  breadcrumbs,
}: {
  post: PostView;
  ctx: Omit<BlockContext, "index" | "breadcrumbs">;
  breadcrumbs: Crumb[];
}) {
  const image = ctx.media[post.featuredImageId ?? ""] ?? null;
  const related = (await getPosts()).filter((p) => p.id !== post.id).slice(0, 3);
  return (
    <>
      <article>
        <header className="bg-sky">
          <div className="container-prose pb-10 pt-5 md:pb-14">
            <Breadcrumbs items={breadcrumbs} />
            {post.categories.length > 0 && (
              <p className="eyebrow mt-4">
                {post.categories.map((c, i) => (
                  <span key={c.id}>
                    {i > 0 && ", "}
                    <Link href={`/blog/category/${c.slug}/`} className="inline-flex min-h-11 items-center hover:underline">
                      {c.name}
                    </Link>
                  </span>
                ))}
              </p>
            )}
            <h1 className="mt-3 text-h1">{post.title}</h1>
            <p className="mt-5 text-[0.9375rem] text-muted">
              {post.authorName} <span aria-hidden>·</span> <time dateTime={post.publishedAt ?? undefined}>{formatDate(post.publishedAt)}</time>{" "}
              <span aria-hidden>·</span> {readingMinutes(post.contentHtml)} min read
            </p>
          </div>
        </header>

        {image && (
          <div className="bg-[linear-gradient(to_bottom,var(--color-sky)_50%,var(--color-surface)_50%)]">
            <div className="container-site">
              <div className="relative mx-auto aspect-[16/9] max-w-4xl overflow-hidden rounded-card">
                <MediaImage media={image} fill preload sizes="(min-width: 64rem) 56rem, 100vw" />
              </div>
            </div>
          </div>
        )}

        <div className="container-prose py-10 md:py-14">
          <RichText html={post.contentHtml} className="prose-lg" />
          {post.tags.length > 0 && (
            <ul className="mt-10 flex flex-wrap gap-2 border-t border-sky-line pt-6" aria-label="Tags">
              {post.tags.map((tag) => (
                <li key={tag.id}>
                  <Link href={`/blog/tag/${tag.slug}/`} className="inline-flex min-h-10 items-center rounded-full bg-sky px-4 text-sm font-semibold text-navy hover:bg-sky-deep">
                    {tag.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-10 rounded-card bg-sky p-6 md:p-8">
            <h2 className="text-h3">Thinking about coach training?</h2>
            <p className="mt-2">Talk through your options with us. No obligation, just a useful conversation.</p>
            <div className="mt-5">
              <ButtonLink href={resolveHref("booking", ctx.settings)}>Book a discovery call</ButtonLink>
            </div>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="section-space border-t border-sky-line bg-surface">
          <div className="container-site">
            <h2 className="text-h2">Keep reading</h2>
            <ul className="mt-9 grid gap-x-6 gap-y-10 md:grid-cols-3">
              {related.map((p) => (
                <PostCard key={p.id} post={p} image={ctx.media[p.featuredImageId ?? ""] ?? null} />
              ))}
            </ul>
          </div>
        </section>
      )}

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.excerpt || undefined,
          datePublished: post.publishedAt ?? undefined,
          dateModified: post.updatedAt,
          mainEntityOfPage: absoluteUrl(`/${post.slug}/`),
          image: image ? absoluteUrl(image.url) : undefined,
          author: { "@type": "Organization", name: post.authorName },
          publisher: { "@type": "EducationalOrganization", "@id": `${siteUrl()}/#organization`, name: ctx.settings.brand.siteName },
        }}
      />
    </>
  );
}
