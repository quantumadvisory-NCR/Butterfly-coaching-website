import type { MetadataRoute } from "next";
import { getPosts, getProgrammes, getPublishedPagePaths } from "@/lib/content/public";
import { absoluteUrl } from "@/lib/seo";

// Built from the database on request (cached by the content tag), so new
// pages appear without a redeploy.
export const dynamic = "force-dynamic";

const EXCLUDED = new Set(["/thank-you/"]);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pages, programmes, posts] = await Promise.all([getPublishedPagePaths(), getProgrammes(), getPosts()]);
  const seen = new Set<string>();
  const entries: MetadataRoute.Sitemap = [];
  const add = (path: string, lastModified?: string | null, priority = 0.6) => {
    if (seen.has(path) || EXCLUDED.has(path)) return;
    seen.add(path);
    entries.push({ url: absoluteUrl(path), lastModified: lastModified ? new Date(lastModified) : undefined, priority });
  };

  for (const page of pages) if (!page.noindex) add(page.path, page.updatedAt, page.path === "/" ? 1 : 0.7);
  for (const programme of programmes) if (programme.kind === "certification") add(programme.path, programme.updatedAt, 0.9);
  add("/blog/", posts[0]?.updatedAt, 0.6);
  for (const post of posts) add(`/${post.slug}/`, post.updatedAt, 0.5);
  return entries;
}
