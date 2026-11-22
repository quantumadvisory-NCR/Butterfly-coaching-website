import type { Metadata } from "next";
import { BlogListing, listingPageCount } from "@/components/site/blog-listing";
import { getMediaMap, getPosts, getSettings } from "@/lib/content/public";
import { firstParam, pageNumber } from "@/lib/search-params";
import { buildMetadata } from "@/lib/seo";

type Props = { searchParams: Promise<{ q?: string | string[]; page?: string | string[] }> };

const INTRO = "Notes on coaching practice, leadership and personal change from the Butterfly Coaching Academy community.";

/** The search words from the address, tidied and capped. */
const searchQuery = (q: string | string[] | undefined) => firstParam(q).trim().slice(0, 80);

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const [{ q, page }, settings, media, posts] = await Promise.all([searchParams, getSettings(), getMediaMap(), getPosts()]);
  const query = searchQuery(q);
  const n = pageNumber(page);
  const pages = listingPageCount(posts.length, !query);
  return buildMetadata({
    title: query ? `Search results for "${query.slice(0, 60)}"` : "Resources and insights",
    description: INTRO,
    path: "/blog/",
    page: n,
    media,
    // Search results, and pages past the last, add no value to search engines.
    noindex: Boolean(query) || n > pages,
    settings,
  });
}

export default async function BlogIndexPage({ searchParams }: Props) {
  const { q, page } = await searchParams;
  return (
    <BlogListing
      heading="Resources and insights"
      intro={INTRO}
      basePath="/blog/"
      query={searchQuery(q)}
      page={pageNumber(page)}
      crumbs={[{ label: "Resources", href: "/blog/" }]}
    />
  );
}
