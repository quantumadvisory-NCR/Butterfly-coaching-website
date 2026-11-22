import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogListing, listingPageCount } from "@/components/site/blog-listing";
import { getMediaMap, getPosts, getSettings } from "@/lib/content/public";
import { pageNumber } from "@/lib/search-params";
import { buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string | string[] }> };

async function findTag(slug: string) {
  for (const post of await getPosts()) {
    const match = post.tags.find((t) => t.slug === slug);
    if (match) return match;
  }
  return null;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ slug }, { page }] = await Promise.all([params, searchParams]);
  const [tag, settings, media, posts] = await Promise.all([findTag(slug), getSettings(), getMediaMap(), getPosts()]);
  if (!tag) return {};
  const n = pageNumber(page);
  const pages = listingPageCount(posts.filter((p) => p.tags.some((t) => t.slug === tag.slug)).length, false);
  return buildMetadata({
    title: `Articles about ${tag.name}`,
    description: `Articles tagged ${tag.name} from Butterfly Coaching Academy.`,
    path: `/blog/tag/${tag.slug}/`,
    page: n,
    media,
    noindex: n > pages,
    settings,
  });
}

export default async function BlogTagPage({ params, searchParams }: Props) {
  const [{ slug }, { page }] = await Promise.all([params, searchParams]);
  const tag = await findTag(slug);
  if (!tag) notFound();
  return (
    <BlogListing
      heading={`Articles about ${tag.name}`}
      basePath={`/blog/tag/${tag.slug}/`}
      filter={(post) => post.tags.some((t) => t.slug === tag.slug)}
      page={pageNumber(page)}
      crumbs={[
        { label: "Resources", href: "/blog/" },
        { label: tag.name, href: `/blog/tag/${tag.slug}/` },
      ]}
    />
  );
}
