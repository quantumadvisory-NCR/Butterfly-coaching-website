import "server-only";
import { type MediaMap, getMediaMap, getNavigation, getSettings } from "@/lib/content/public";
import { resolveHref } from "@/lib/settings";

export type LogoAsset = { src: string; width: number; height: number };

const FALLBACK_LIGHT: LogoAsset = { src: "/images/brand/bca-logo-on-light.svg", width: 319, height: 89 };
const FALLBACK_DARK: LogoAsset = { src: "/images/brand/bca-logo-on-dark.svg", width: 319, height: 89 };

function logo(media: MediaMap, id: string | null, fallback: LogoAsset): LogoAsset {
  const item = id ? media[id] : null;
  if (!item) return fallback;
  return { src: item.url, width: item.width ?? fallback.width, height: item.height ?? fallback.height };
}

/** Everything the header and footer need, resolved once per request. */
export async function getSiteChrome() {
  const [settings, navigation, media] = await Promise.all([getSettings(), getNavigation(), getMediaMap()]);
  const headerCta = settings.header.cta.label && settings.header.cta.href
    ? { label: settings.header.cta.label, href: resolveHref(settings.header.cta.href, settings) }
    : null;
  const announcement =
    settings.header.announcementEnabled && settings.header.announcementText
      ? {
          text: settings.header.announcementText,
          link:
            settings.header.announcementLink.label && settings.header.announcementLink.href
              ? { label: settings.header.announcementLink.label, href: resolveHref(settings.header.announcementLink.href, settings) }
              : null,
        }
      : null;
  return {
    settings,
    navigation,
    media,
    logoLight: logo(media, settings.brand.logoLight, FALLBACK_LIGHT),
    logoDark: logo(media, settings.brand.logoDark, FALLBACK_DARK),
    headerCta,
    announcement,
  };
}
