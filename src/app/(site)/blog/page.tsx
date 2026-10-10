import type { Metadata } from "next";
import { BlogListing } from "@/components/site/blog-listing";
import { getSettings } from "@/lib/content/public";
import { buildMetadata } from "@/lib/seo";

type Props = { searchParams: Promise<{ q?: string; page?: string }> };

const INTRO = "Notes on coaching practice, leadership and personal change from the Butterfly Coaching Academy community.";

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const [{ q }, settings] = await Promise.all([searchParams, getSettings()]);
  return buildMetadata({
    title: q ? `Search results for "${q.slice(0, 60)}"` : "Resources and insights",
    description: INTRO,
    path: "/blog/",
    // Search result pages add no value to search engines.
    noindex: Boolean(q),
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
      query={(q ?? "").trim().slice(0, 80)}
      page={Number(page) || 1}
      crumbs={[{ label: "Resources", href: "/blog/" }]}
    />
  );
}
