"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useState } from "react";
import { CONSENT_EVENT, type Consent, captureUtm, getConsent, setConsent, track } from "@/lib/analytics";

type Props = {
  ga4Id: string | null;
  gtmId: string | null;
  /** When true nothing loads until the visitor accepts. */
  requireConsent: boolean;
};

/**
 * Loads Google Analytics / Tag Manager (only when configured and permitted),
 * records clicks on any element marked with data-track, and shows the consent
 * banner when one is needed.
 */
export function Analytics({ ga4Id, gtmId, requireConsent }: Props) {
  const pathname = usePathname();
  const configured = Boolean(ga4Id || gtmId);
  const [consent, setConsentState] = useState<Consent | "loading">("loading");

  useEffect(() => {
    window.__bcaAnalytics = { requireConsent };
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads localStorage once after mount
    setConsentState(getConsent());
    const onConsent = (event: Event) => setConsentState((event as CustomEvent<Consent>).detail);
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
  }, [requireConsent]);

  const enabled = configured && consent !== "loading" && (!requireConsent || consent === "granted");

  useEffect(() => {
    if (enabled) captureUtm();
  }, [enabled]);

  // One delegated listener covers every CTA, WhatsApp, phone, email and download link.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const el = (event.target as Element | null)?.closest<HTMLElement>("[data-track]");
      if (!el?.dataset.track) return;
      track(el.dataset.track, {
        link_text: el.dataset.trackLabel ?? el.textContent?.trim().slice(0, 80),
        link_url: el instanceof HTMLAnchorElement ? el.href : undefined,
        page_path: window.location.pathname,
      });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // Single-page navigations are not page loads, so report them explicitly.
  useEffect(() => {
    if (enabled && typeof window.gtag === "function") {
      window.gtag("event", "page_view", { page_path: pathname });
    }
  }, [enabled, pathname]);

  const showBanner = configured && requireConsent && consent === "unset";

  useEffect(() => {
    document.documentElement.toggleAttribute("data-consent-open", showBanner);
  }, [showBanner]);

  return (
    <>
      {enabled && ga4Id && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${ga4Id}',{anonymize_ip:true});`}
          </Script>
        </>
      )}
      {enabled && gtmId && (
        <Script id="gtm-init" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`}
        </Script>
      )}
      {showBanner && (
        <div
          role="region"
          aria-label="Cookie consent"
          className="fixed inset-x-3 bottom-3 z-[var(--z-toast)] mx-auto max-w-xl rounded-card border border-sky-line bg-surface p-5 shadow-lift sm:left-4 sm:right-auto sm:mx-0"
        >
          <p className="text-[0.9375rem]">
            We would like to use analytics cookies to understand how this site is used. Nothing is collected unless you agree.{" "}
            <Link href="/privacy-policy/" className="font-semibold text-navy underline">
              Privacy policy
            </Link>
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setConsent("granted")}>
              Accept analytics
            </button>
            <button type="button" className="btn btn-quiet btn-sm" onClick={() => setConsent("denied")}>
              Decline
            </button>
          </div>
        </div>
      )}
    </>
  );
}
