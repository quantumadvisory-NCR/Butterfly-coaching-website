import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogListing, listingPageCount } from "@/components/site/blog-listing";
import { getMediaMap, getPosts, getSettings } from "@/lib/content/public";
import { pageNumber } from "@/lib/search-params";
import { buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string | string[] }> };

async function findCategory(slug: string) {
  for (const post of await getPosts()) {
    const match = post.categories.find((c) => c.slug === slug);
    if (match) return match;
  }
  return null;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ slug }, { page }] = await Promise.all([params, searchParams]);
  const [category, settings, media, posts] = await Promise.all([findCategory(slug), getSettings(), getMediaMap(), getPosts()]);
  if (!category) return {};
  const n = pageNumber(page);
  const pages = listingPageCount(posts.filter((p) => p.categories.some((c) => c.slug === category.slug)).length, false);
  return buildMetadata({
    title: `${category.name} articles`,
    description: `Articles filed under ${category.name} from Butterfly Coaching Academy.`,
    path: `/blog/category/${category.slug}/`,
    page: n,
    media,
    noindex: n > pages,
    settings,
  });
}

export default async function BlogCategoryPage({ params, searchParams }: Props) {
  const [{ slug }, { page }] = await Promise.all([params, searchParams]);
  const category = await findCategory(slug);
  if (!category) notFound();
  return (
    <BlogListing
      heading={`${category.name} articles`}
      basePath={`/blog/category/${category.slug}/`}
      filter={(post) => post.categories.some((c) => c.slug === category.slug)}
      page={pageNumber(page)}
      activeCategory={category.slug}
      crumbs={[
        { label: "Resources", href: "/blog/" },
        { label: category.name, href: `/blog/category/${category.slug}/` },
      ]}
    />
  );
}
