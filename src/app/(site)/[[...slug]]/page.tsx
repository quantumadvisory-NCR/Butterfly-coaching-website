import type { Metadata } from "next";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { BlockRenderer } from "@/components/blocks";
import type { Crumb } from "@/components/blocks/types";
import { JsonLd } from "@/components/site/json-ld";
import { PostTemplate } from "@/components/site/post-template";
import { ProgrammeTemplate } from "@/components/site/programme-template";
import { TrackEvent } from "@/components/site/track-event";
import { getSiteChrome } from "@/lib/content/chrome";
import { type Resolved, getPublishedPage, resolvePath } from "@/lib/content/public";
import { breadcrumbJsonLd, buildMetadata, organisationJsonLd } from "@/lib/seo";
import { stripHtml } from "@/lib/utils";

/**
 * One route serves every CMS page, programme detail page and blog post, so the
 * owner can create pages at any URL and legacy WordPress URLs keep working.
 * Pages render on first request and are then cached until content changes.
 */
export const revalidate = 3600;
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug?: string[] }> };

const toPath = (slug?: string[]) => `/${(slug ?? []).join("/")}`;

async function crumbsFor(resolved: Resolved): Promise<Crumb[]> {
  if (resolved.kind === "programme") {
    return [
      { label: "Programmes", href: "/coaching-certifications/" },
      { label: resolved.programme.name, href: resolved.programme.path },
    ];
  }
  if (resolved.kind === "post") {
    return [
      { label: "Resources", href: "/blog/" },
      { label: resolved.post.title, href: `/${resolved.post.slug}/` },
    ];
  }
  if (resolved.kind !== "page" || resolved.page.path === "/") return [];
  // Walk up the URL and include each ancestor that is itself a published page.
  const segments = resolved.page.path.split("/").filter(Boolean);
  const crumbs: Crumb[] = [];
  for (let i = 1; i < segments.length; i += 1) {
    const ancestorPath = `/${segments.slice(0, i).join("/")}/`;
    const ancestor = await getPublishedPage(ancestorPath);
    if (ancestor) crumbs.push({ label: ancestor.title, href: ancestor.path });
  }
  crumbs.push({ label: resolved.page.title, href: resolved.page.path });
  return crumbs;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [resolved, chrome] = await Promise.all([resolvePath(toPath(slug)), getSiteChrome()]);
  const { settings, media } = chrome;
  if (!resolved || resolved.kind === "redirect") return {};

  if (resolved.kind === "page") {
    const { page } = resolved;
    const home = page.path === "/";
    return buildMetadata({
      title: page.seoTitle || (home ? `${settings.brand.siteName}: ICF coach training that stays with you` : page.title),
      absoluteTitle: home,
      description: page.seoDescription,
      path: page.path,
      image: media[page.ogImageId ?? ""] ?? media[settings.brand.defaultOgImage ?? ""] ?? null,
      noindex: page.noindex,
      settings,
    });
  }
  if (resolved.kind === "programme") {
    const p = resolved.programme;
    return buildMetadata({
      title: p.seoTitle || p.name,
      description: p.seoDescription || p.summary,
      path: p.path,
      image: media[p.heroImageId ?? ""] ?? null,
      settings,
    });
  }
  const { post } = resolved;
  return buildMetadata({
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt || stripHtml(post.contentHtml).slice(0, 160),
    path: `/${post.slug}/`,
    image: media[post.featuredImageId ?? ""] ?? null,
    type: "article",
    publishedTime: post.publishedAt,
    settings,
  });
}

export default async function CatchAllPage({ params }: Props) {
  const { slug } = await params;
  const resolved = await resolvePath(toPath(slug));
  if (!resolved) notFound();
  if (resolved.kind === "redirect") {
    if (resolved.permanent) permanentRedirect(resolved.destination);
    redirect(resolved.destination);
  }

  const chrome = await getSiteChrome();
  const breadcrumbs = await crumbsFor(resolved);
  const ctx = { media: chrome.media, settings: chrome.settings, preview: false };
  const crumbData = breadcrumbs.length > 0 ? <JsonLd data={breadcrumbJsonLd(breadcrumbs)} /> : null;

  if (resolved.kind === "programme") {
    return (
      <>
        <ProgrammeTemplate programme={resolved.programme} ctx={ctx} breadcrumbs={breadcrumbs} />
        {crumbData}
      </>
    );
  }
  if (resolved.kind === "post") {
    return (
      <>
        <PostTemplate post={resolved.post} ctx={ctx} breadcrumbs={breadcrumbs} />
        {crumbData}
      </>
    );
  }

  const { page } = resolved;
  return (
    <>
      <BlockRenderer sections={page.sections} ctx={{ ...ctx, breadcrumbs }} />
      {crumbData}
      {page.path === "/" && <JsonLd data={organisationJsonLd(chrome.settings, chrome.logoDark.src)} />}
      {page.path === "/thank-you/" && <TrackEvent name="generate_lead" />}
    </>
  );
}
