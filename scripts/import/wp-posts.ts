/**
 * One-off content migration: converts the WordPress REST export of the legacy
 * BCA blog (.local/raw/html/posts.json) into seed/data/posts.json.
 *
 *   curl "https://butterflycoachingacademy.com/wp-json/wp/v2/posts?per_page=100&_embed=1" -o .local/raw/html/posts.json
 *   tsx scripts/import/wp-posts.ts
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import sanitizeHtml from "sanitize-html";

type WpPost = {
  slug: string;
  date_gmt: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  _embedded?: {
    "wp:featuredmedia"?: { source_url?: string; alt_text?: string; media_details?: { width?: number; height?: number } }[];
    "wp:term"?: { taxonomy: string; name: string; slug: string }[][];
  };
};

const decode = (s: string) =>
  s
    .replace(/&#8217;|&#8216;/g, "'")
    .replace(/&#8220;|&#8221;/g, '"')
    .replace(/&#8211;|&#8212;/g, "-")
    .replace(/&#8230;/g, "...")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#038;/g, "&")
    .replace(/&hellip;/g, "...");

const text = (html: string) =>
  decode(sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }))
    .replace(/\s+/g, " ")
    .trim();

function cleanContent(html: string) {
  const cleaned = sanitizeHtml(html, {
    allowedTags: ["p", "h2", "h3", "h4", "ul", "ol", "li", "strong", "em", "b", "i", "a", "blockquote", "br"],
    allowedAttributes: { a: ["href"] },
    transformTags: { b: "strong", i: "em", h1: "h2" },
    exclusiveFilter: (frame) => ["p", "h2", "h3", "h4", "li"].includes(frame.tag) && !frame.text.trim(),
  });
  return cleaned
    .replace(/—|–/g, "-")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

/**
 * A summary for the blog index, taken from the article's own words: the first
 * substantial paragraph after the newsletter greeting, cut at a sentence end.
 * (WordPress's automatic excerpts were all "Dear community, welcome to...".)
 */
function summarise(contentHtml: string): string {
  const paragraphs = [...contentHtml.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => text(m[1] ?? ""));
  const greeting = /^(dear|greetings|welcome to|hello|hi |we hope|hope )/i;
  const body = paragraphs.find((p) => p.length > 90 && !greeting.test(p)) ?? paragraphs.find((p) => p.length > 90) ?? paragraphs[0] ?? "";
  // A quotation cut off mid-way would leave an unmatched opening mark.
  const tidy = (s: string) => (/^[“"]/.test(s) && !/[”"]/.test(s.slice(1)) ? s.slice(1) : s);
  if (body.length <= 180) return tidy(body);
  const cut = body.slice(0, 180);
  const sentenceEnd = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("? "), cut.lastIndexOf("! "));
  return tidy(sentenceEnd > 80 ? cut.slice(0, sentenceEnd + 1) : `${cut.slice(0, cut.lastIndexOf(" "))}...`);
}

const raw = JSON.parse(readFileSync(".local/raw/html/posts.json", "utf8")) as WpPost[];

const posts = raw.map((p) => {
  const terms = (p._embedded?.["wp:term"] ?? []).flat();
  const featured = p._embedded?.["wp:featuredmedia"]?.[0];
  const contentHtml = cleanContent(p.content.rendered);
  const excerpt = summarise(contentHtml);
  return {
    slug: p.slug,
    title: decode(text(p.title.rendered)),
    publishedAt: `${p.date_gmt}Z`,
    excerpt,
    contentHtml,
    categories: terms.filter((t) => t.taxonomy === "category").map((t) => ({ name: decode(t.name), slug: t.slug })),
    tags: terms.filter((t) => t.taxonomy === "post_tag").map((t) => ({ name: decode(t.name), slug: t.slug })),
    legacyFeaturedImage: featured?.source_url ?? null,
  };
});

mkdirSync("seed/data", { recursive: true });
writeFileSync("seed/data/posts.json", `${JSON.stringify(posts, null, 2)}\n`);

for (const p of posts) {
  console.log(
    `${p.publishedAt.slice(0, 10)}  ${p.slug}\n    words=${text(p.contentHtml).split(" ").length} cats=[${p.categories.map((c) => c.slug)}] tags=[${p.tags.map((t) => t.slug)}]\n    img=${p.legacyFeaturedImage?.split("/").pop()}`,
  );
}
