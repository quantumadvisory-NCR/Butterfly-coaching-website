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
  noindex?: boolean;
  type?: "website" | "article";
  publishedTime?: string | null;
  settings: SiteSettings;
  /** Use the title exactly as given (homepage). */
  absoluteTitle?: boolean;
};

/** Unique title, description, canonical URL and Open Graph / Twitter tags for a page. */
export function buildMetadata(input: Input): Metadata {
  const { settings } = input;
  const description = truncate((input.description || settings.brand.defaultDescription).trim(), 160);
  const url = absoluteUrl(input.path);
  const image = input.image && input.image.kind === "image" ? input.image : null;
  const images = image
    ? [{ url: absoluteUrl(image.url), width: image.width ?? undefined, height: image.height ?? undefined, alt: image.alt }]
    : undefined;
  return {
    title: input.absoluteTitle ? { absolute: input.title } : input.title,
    description,
    alternates: { canonical: url },
    robots: input.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      type: input.type ?? "website",
      url,
      siteName: settings.brand.siteName,
      title: input.title,
      description,
      locale: "en_IN",
      images,
      ...(input.type === "article" && input.publishedTime ? { publishedTime: input.publishedTime } : {}),
    },
    twitter: { card: image ? "summary_large_image" : "summary", title: input.title, description, images: images?.map((i) => i.url) },
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
