import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogListing } from "@/components/site/blog-listing";
import { getPosts, getSettings } from "@/lib/content/public";
import { buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };

async function findCategory(slug: string) {
  for (const post of await getPosts()) {
    const match = post.categories.find((c) => c.slug === slug);
    if (match) return match;
  }
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [category, settings] = await Promise.all([findCategory(slug), getSettings()]);
  if (!category) return {};
  return buildMetadata({
    title: `${category.name} articles`,
    description: `Articles filed under ${category.name} from Butterfly Coaching Academy.`,
    path: `/blog/category/${category.slug}/`,
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
      page={Number(page) || 1}
      activeCategory={category.slug}
      crumbs={[
        { label: "Resources", href: "/blog/" },
        { label: category.name, href: `/blog/category/${category.slug}/` },
      ]}
    />
  );
}
