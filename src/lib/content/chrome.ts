import "server-only";
import { type MediaMap, getMediaMap, getNavigation, getSettings } from "@/lib/content/public";
import { type SiteSettings, resolveHref } from "@/lib/settings";

export type LogoAsset = { src: string; width: number; height: number };

const FALLBACK_LIGHT: LogoAsset = { src: "/images/brand/bca-logo-on-light.svg", width: 319, height: 89 };
const FALLBACK_DARK: LogoAsset = { src: "/images/brand/bca-logo-on-dark.svg", width: 319, height: 89 };

function logo(media: MediaMap, id: string | null, fallback: LogoAsset): LogoAsset {
  const item = id ? media[id] : null;
  if (!item) return fallback;
  return { src: item.url, width: item.width ?? fallback.width, height: item.height ?? fallback.height };
}

/** Today's date in India as YYYY-MM-DD, so a cohort date expires at the end of its own day. */
function todayInIndia(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/**
 * Resolves the announcement bar text. Returns null (bar hidden) when the bar is
 * off, when the text uses {date} but no date is set or the date has passed, or
 * when the text still holds a placeholder such as [DATE] or [X]. Visitors must
 * never see an unfinished announcement.
 */
export function resolveAnnouncement(header: SiteSettings["header"], now = new Date()): string | null {
  const raw = header.announcementText.trim();
  if (!header.announcementEnabled || !raw) return null;
  let text = raw;
  if (raw.includes("{date}")) {
    const date = header.announcementDate;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < todayInIndia(now)) return null;
    const formatted = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
    text = raw.replaceAll("{date}", formatted);
  }
  if (/\[[^\]]*\]|\{[^}]*\}/.test(text)) return null;
  return text;
}

/** Everything the header and footer need, resolved once per request. */
export async function getSiteChrome() {
  const [settings, navigation, media] = await Promise.all([getSettings(), getNavigation(), getMediaMap()]);
  const headerCta = settings.header.cta.label && settings.header.cta.href
    ? { label: settings.header.cta.label, href: resolveHref(settings.header.cta.href, settings) }
    : null;
  const announcementText = resolveAnnouncement(settings.header);
  const announcement = announcementText
    ? {
        text: announcementText,
        link:
          settings.header.announcementLink.label && settings.header.announcementLink.href
            ? { label: settings.header.announcementLink.label, href: resolveHref(settings.header.announcementLink.href, settings) }
            : null,
      }
    : null;
  const supportLinks = settings.support.links
    .filter((link) => link.label && link.href)
    .map((link) => ({ label: link.label, description: link.description, href: resolveHref(link.href, settings), kind: link.href.trim().toLowerCase() }));
  const support =
    settings.support.enabled && supportLinks.length > 0 ? { heading: settings.support.heading, body: settings.support.body, links: supportLinks } : null;
  return {
    settings,
    navigation,
    media,
    logoLight: logo(media, settings.brand.logoLight, FALLBACK_LIGHT),
    logoDark: logo(media, settings.brand.logoDark, FALLBACK_DARK),
    headerCta,
    announcement,
    support,
  };
}
