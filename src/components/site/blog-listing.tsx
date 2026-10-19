import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { JsonLd } from "@/components/site/json-ld";
import { PostCard } from "@/components/site/post-card";
import { MediaImage } from "@/components/ui/media-image";
import { type PostView, type TermView, getMediaMap, getPosts, searchPosts } from "@/lib/content/public";
import { breadcrumbJsonLd } from "@/lib/seo";
import { cn, formatDate, readingMinutes } from "@/lib/utils";

const PER_PAGE = 9;

type Props = {
  heading: string;
  intro?: string;
  /** Base path for pagination and the search form, e.g. "/blog/" or "/blog/category/general/". */
  basePath: string;
  filter?: (post: PostView) => boolean;
  query?: string;
  page?: number;
  crumbs: { label: string; href: string }[];
  activeCategory?: string;
};

function uniqueTerms(posts: PostView[], pick: (p: PostView) => TermView[]) {
  const map = new Map<string, TermView & { count: number }>();
  for (const post of posts) {
    for (const term of pick(post)) {
      const existing = map.get(term.slug);
      if (existing) existing.count += 1;
      else map.set(term.slug, { ...term, count: 1 });
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export async function BlogListing({ heading, intro, basePath, filter, query = "", page = 1, crumbs, activeCategory }: Props) {
  const [all, media] = await Promise.all([getPosts(), getMediaMap()]);
  const categories = uniqueTerms(all, (p) => p.categories);
  const tags = uniqueTerms(all, (p) => p.tags);
  const filtered = searchPosts(filter ? all.filter(filter) : all, query);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const current = Math.min(Math.max(1, page), pageCount);
  const lead = current === 1 && !query && !filter ? filtered[0] : undefined;
  const rest = (lead ? filtered.slice(1) : filtered).slice((current - 1) * PER_PAGE, current * PER_PAGE);
  const pageHref = (n: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (n > 1) params.set("page", String(n));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  const leadImage = lead ? (media[lead.featuredImageId ?? ""] ?? null) : null;

  return (
    <>
      <section className="bg-cream">
        <div className="container-site pb-10 pt-5 md:pb-14">
          <Breadcrumbs items={crumbs} />
          <div className="mt-6 flex flex-col gap-7 md:mt-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-h1">{heading}</h1>
              {intro && <p className="mt-4 text-lead">{intro}</p>}
            </div>
            <form action="/blog/" method="get" role="search" className="w-full lg:max-w-sm">
              <label htmlFor="blog-search" className="field-label">
                Search articles
              </label>
              <div className="flex gap-2">
                <input id="blog-search" name="q" type="search" defaultValue={query} className="field-input min-w-0 flex-1" />
                <button type="submit" className="btn btn-blue shrink-0 px-4" aria-label="Search">
                  <MagnifyingGlassIcon aria-hidden weight="bold" className="size-5" />
                </button>
              </div>
            </form>
          </div>

          {categories.length > 1 && (
            <nav aria-label="Categories" className="mt-8">
              <ul className="flex flex-wrap gap-2">
                <li>
                  <Link href="/blog/" className={cn("inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold", !activeCategory ? "bg-navy text-white" : "bg-surface text-navy hover:bg-tint-deep")}>
                    All articles
                  </Link>
                </li>
                {categories.map((category) => (
                  <li key={category.slug}>
                    <Link
                      href={`/blog/category/${category.slug}/`}
                      className={cn(
                        "inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold",
                        activeCategory === category.slug ? "bg-navy text-white" : "bg-surface text-navy hover:bg-tint-deep",
                      )}
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </section>

      <section className="section-space bg-cream">
        <div className="container-site">
          {query && (
            <p role="status" className="mb-8 text-lead">
              {filtered.length === 0 ? "No articles match" : `${filtered.length} ${filtered.length === 1 ? "article matches" : "articles match"}`} “{query}”.{" "}
              <Link href={basePath} className="font-semibold text-primary underline">
                Clear search
              </Link>
            </p>
          )}

          {filtered.length === 0 && !query && <p className="text-lead">New articles are on the way. Please check back soon.</p>}

          {lead && (
            <article className="group relative isolate mb-12 grid items-center gap-7 md:mb-16 lg:grid-cols-2 lg:gap-12">
              <div className="relative aspect-[16/10] overflow-hidden rounded-card bg-tint-deep lg:rounded-tl-[var(--radius-wing)]">
                {leadImage && (
                  <MediaImage media={leadImage} fill alt="" preload sizes="(min-width: 64rem) 46vw, 100vw" className="transition-transform duration-700 ease-out group-hover:scale-[1.03]" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted">
                  <time dateTime={lead.publishedAt ?? undefined}>{formatDate(lead.publishedAt)}</time> <span aria-hidden>·</span> {readingMinutes(lead.contentHtml)} min read
                </p>
                <h2 className="mt-3 text-h2">
                  <Link href={`/${lead.slug}/`} className="outline-none after:absolute after:inset-0 after:z-10 group-hover:text-primary focus-visible:underline">
                    {lead.title}
                  </Link>
                </h2>
                {lead.excerpt && <p className="mt-4 text-lead">{lead.excerpt}</p>}
              </div>
            </article>
          )}

          {rest.length > 0 && (
            <ul className="grid gap-x-6 gap-y-11 md:grid-cols-2 lg:grid-cols-3">
              {rest.map((post) => (
                <PostCard key={post.id} post={post} image={media[post.featuredImageId ?? ""] ?? null} showExcerpt />
              ))}
            </ul>
          )}

          {pageCount > 1 && (
            <nav aria-label="Pagination" className="mt-12 flex items-center justify-between gap-4 border-t border-line pt-6">
              {current > 1 ? (
                <Link href={pageHref(current - 1)} className="btn btn-quiet btn-sm" rel="prev">
                  Newer
                </Link>
              ) : (
                <span />
              )}
              <p className="text-sm text-muted">
                Page {current} of {pageCount}
              </p>
              {current < pageCount ? (
                <Link href={pageHref(current + 1)} className="btn btn-quiet btn-sm" rel="next">
                  Older
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}

          {tags.length > 0 && (
            <div className="mt-14 border-t border-line pt-8">
              <h2 className="text-h3">Browse by topic</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <li key={tag.slug}>
                    <Link href={`/blog/tag/${tag.slug}/`} className="inline-flex min-h-11 items-center rounded-full bg-tint px-4 text-sm font-semibold text-navy hover:bg-tint-deep">
                      {tag.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
    </>
  );
}
