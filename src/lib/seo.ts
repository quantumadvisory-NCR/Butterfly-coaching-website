import type { Metadata } from "next";
import type { MediaItem } from "@/lib/content/public";
import { siteUrl } from "@/lib/env";
import type { SiteSettings } from "@/lib/settings";
import { truncate } from "@/lib/utils";

export function absoluteUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

type Input = {
  /** Page title without the site name. */
  title: string;
  description?: string | null;
  path: string;
  image?: MediaItem | null;
  /** The media library: when the page has no image, the default sharing image (Settings > Brand) is used. */
  media?: Record<string, MediaItem>;
  /** Page of a paginated listing: from 2 up it gets its own canonical URL (?page=n) and "(page n)" in the title. */
  page?: number;
  noindex?: boolean;
  type?: "website" | "article";
  publishedTime?: string | null;
  settings: SiteSettings;
  /** Use the title exactly as given (homepage). */
  absoluteTitle?: boolean;
};

/** Longest title that still gets " | site name" added; longer ones are cut short in search results. */
const SUFFIXED_TITLE_MAX = 60;

/**
 * The title as the layout's template should treat it. " | Butterfly Coaching
 * Academy" is added only when the title does not already name the academy and
 * the whole stays short enough to show in full in search results.
 */
function pageTitle(title: string, siteName: string, absolute?: boolean): Metadata["title"] {
  if (absolute) return { absolute: title };
  const namesBrand = title.toLowerCase().includes(siteName.toLowerCase());
  const tooLong = `${title} | ${siteName}`.length > SUFFIXED_TITLE_MAX;
  return namesBrand || tooLong ? { absolute: title } : title;
}

/** Unique title, description, canonical URL and Open Graph / Twitter tags for a page. */
export function buildMetadata(input: Input): Metadata {
  const { settings } = input;
  const description = truncate((input.description || settings.brand.defaultDescription).trim(), 160);
  const paged = input.page && input.page > 1 ? input.page : 0;
  const title = paged ? `${input.title} (page ${paged})` : input.title;
  const url = absoluteUrl(paged ? `${input.path}?page=${paged}` : input.path);
  const fallback = input.media && settings.brand.defaultOgImage ? input.media[settings.brand.defaultOgImage] : null;
  const chosen = input.image ?? fallback ?? null;
  const image = chosen && chosen.kind === "image" ? chosen : null;
  const images = image
    ? [{ url: absoluteUrl(image.url), width: image.width ?? undefined, height: image.height ?? undefined, alt: image.alt }]
    : undefined;
  return {
    title: pageTitle(title, settings.brand.siteName, input.absoluteTitle),
    description,
    alternates: { canonical: url },
    robots: input.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      type: input.type ?? "website",
      url,
      siteName: settings.brand.siteName,
      title,
      description,
      locale: "en_IN",
      images,
      ...(input.type === "article" && input.publishedTime ? { publishedTime: input.publishedTime } : {}),
    },
    twitter: { card: image ? "summary_large_image" : "summary", title, description, images: images?.map((i) => i.url) },
  };
}

/** Organisation structured data built only from verified settings. */
export function organisationJsonLd(settings: SiteSettings, logoUrl: string) {
  const { contact, social, brand } = settings;
  const sameAs = Object.values(social).filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": `${siteUrl()}/#organization`,
    name: brand.siteName,
    legalName: contact.legalName || undefined,
    url: siteUrl(),
    logo: absoluteUrl(logoUrl),
    email: contact.email || undefined,
    telephone: contact.phoneE164 || undefined,
    address: contact.addressLines.length
      ? { "@type": "PostalAddress", streetAddress: contact.addressLines.join(", "), addressCountry: "IN" }
      : undefined,
    sameAs: sameAs.length ? sameAs : undefined,
  };
}

export function breadcrumbJsonLd(items: { label: string; href: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ label: "Home", href: "/" }, ...items].map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      item: absoluteUrl(item.href),
    })),
  };
}
