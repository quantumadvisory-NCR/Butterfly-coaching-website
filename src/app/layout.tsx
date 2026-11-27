import type { Metadata, Viewport } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import { getMediaMap, getSettings } from "@/lib/content/public";
import { siteUrl } from "@/lib/env";
import "./globals.css";

/* Two typefaces for the whole site (the owner's brief of 25 November 2026):
   Playfair Display SemiBold for headings and large numbers, Plus Jakarta Sans
   for everything else. They are fixed here, not chosen in the admin. */
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["600"], variable: "--ff-playfair", display: "swap" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--ff-jakarta", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const [settings, media] = await Promise.all([getSettings(), getMediaMap()]);
  const favicon = settings.brand.favicon ? media[settings.brand.favicon] : null;
  const og = settings.brand.defaultOgImage ? media[settings.brand.defaultOgImage] : null;
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: settings.brand.siteName, template: `%s | ${settings.brand.siteName}` },
    description: settings.brand.defaultDescription,
    applicationName: settings.brand.siteName,
    formatDetection: { telephone: false },
    icons: favicon ? { icon: favicon.url, apple: favicon.url } : undefined,
    openGraph: {
      siteName: settings.brand.siteName,
      locale: "en_IN",
      type: "website",
      images: og ? [{ url: og.url, width: og.width ?? undefined, height: og.height ?? undefined, alt: og.alt }] : undefined,
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fcfcfc",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { theme } = await getSettings();
  // Values are validated as 6-digit hex colours and known font keys in parseSettingsGroup().
  const themeCss = `:root{--bca-primary:${theme.primary};--bca-navy:${theme.navy};--bca-accent:${theme.accent};--bca-background:${theme.background};--bca-ink:${theme.ink}}`;
  const fonts = `${playfair.variable} ${jakarta.variable}`;
  return (
    <html lang="en" data-scroll-behavior="smooth" className={fonts}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeCss }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
