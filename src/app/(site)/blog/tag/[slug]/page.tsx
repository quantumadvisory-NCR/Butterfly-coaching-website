import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogListing } from "@/components/site/blog-listing";
import { getPosts, getSettings } from "@/lib/content/public";
import { buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };

async function findTag(slug: string) {
  for (const post of await getPosts()) {
    const match = post.tags.find((t) => t.slug === slug);
    if (match) return match;
  }
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [tag, settings] = await Promise.all([findTag(slug), getSettings()]);
  if (!tag) return {};
  return buildMetadata({
    title: `Articles about ${tag.name}`,
    description: `Articles tagged ${tag.name} from Butterfly Coaching Academy.`,
    path: `/blog/tag/${tag.slug}/`,
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
      page={Number(page) || 1}
      crumbs={[
        { label: "Resources", href: "/blog/" },
        { label: tag.name, href: `/blog/tag/${tag.slug}/` },
      ]}
    />
  );
}
