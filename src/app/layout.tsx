import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Caveat, Inter, Manrope, Newsreader, Plus_Jakarta_Sans, Schibsted_Grotesk } from "next/font/google";
import { getMediaMap, getSettings } from "@/lib/content/public";
import { siteUrl } from "@/lib/env";
import "./globals.css";

/* The November 2026 design: Bricolage Grotesque for headings, Inter for text and
   Caveat for the handwritten notes. The homepage, header and footer always use
   them; other pages follow Admin > Settings > Colours and typography, where Plus
   Jakarta Sans (the earlier brand typeface) and the alternates can still be
   chosen. Browsers download a font file only if a page actually uses it. */
// The optical-size axis lets the large headings tighten exactly as in the design.
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--ff-bricolage", display: "swap", axes: ["opsz"] });
const inter = Inter({ subsets: ["latin"], variable: "--ff-inter", display: "swap" });
const caveat = Caveat({ subsets: ["latin"], weight: ["600", "700"], variable: "--ff-caveat", display: "swap", preload: false });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap", preload: false });
const schibsted = Schibsted_Grotesk({ subsets: ["latin"], variable: "--font-schibsted", display: "swap", preload: false });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap", preload: false });
const newsreader = Newsreader({ subsets: ["latin"], variable: "--font-newsreader", display: "swap", preload: false });

const FONT_VARS: Record<string, string> = {
  bricolage: "var(--ff-bricolage)",
  inter: "var(--ff-inter)",
  jakarta: "var(--font-jakarta)",
  schibsted: "var(--font-schibsted)",
  manrope: "var(--font-manrope)",
  newsreader: "var(--font-newsreader)",
};

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
  const themeCss = `:root{--bca-primary:${theme.primary};--bca-navy:${theme.navy};--bca-accent:${theme.accent};--bca-background:${theme.background};--bca-ink:${theme.ink};--font-heading:${FONT_VARS[theme.headingFont] ?? FONT_VARS.bricolage};--font-body:${FONT_VARS[theme.bodyFont] ?? FONT_VARS.inter}}`;
  const fonts = [bricolage, inter, caveat, jakarta, schibsted, manrope, newsreader].map((font) => font.variable).join(" ");
  return (
    <html lang="en" data-scroll-behavior="smooth" className={fonts}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeCss }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
