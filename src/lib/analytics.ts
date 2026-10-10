/**
 * Browser-side analytics helpers. Nothing is sent anywhere unless an
 * analytics ID is configured in Site settings AND (when the consent banner is
 * on) the visitor has agreed.
 */

export type Consent = "granted" | "denied" | "unset";

const CONSENT_KEY = "bca-consent";
const UTM_KEY = "bca-utm";
export const CONSENT_EVENT = "bca:consent";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __bcaAnalytics?: { requireConsent: boolean };
  }
}

export function getConsent(): Consent {
  if (typeof window === "undefined") return "unset";
  try {
    const value = window.localStorage.getItem(CONSENT_KEY);
    return value === "granted" || value === "denied" ? value : "unset";
  } catch {
    return "unset";
  }
}

export function setConsent(value: Exclude<Consent, "unset">) {
  try {
    window.localStorage.setItem(CONSENT_KEY, value);
  } catch {
    // Storage unavailable (private mode): consent simply lasts for this page view.
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
}

function allowed() {
  if (typeof window === "undefined") return false;
  const requireConsent = window.__bcaAnalytics?.requireConsent ?? true;
  return !requireConsent || getConsent() === "granted";
}

/** Sends a conversion event (form_submit, whatsapp_click, phone_click, cta_click, download ...). */
export function track(event: string, params: Record<string, unknown> = {}) {
  if (!allowed()) return;
  if (typeof window.gtag === "function") window.gtag("event", event, params);
  else if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event, ...params });
}

const UTM_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];

/** Remembers campaign parameters for this browser session, with consent. */
export function captureUtm() {
  if (!allowed()) return;
  try {
    const params = new URLSearchParams(window.location.search);
    const found: Record<string, string> = {};
    for (const key of UTM_PARAMS) {
      const value = params.get(key);
      if (value) found[key] = value.slice(0, 120);
    }
    if (Object.keys(found).length > 0) window.sessionStorage.setItem(UTM_KEY, JSON.stringify(found));
  } catch {
    // ignore
  }
}

export function readUtm(): Record<string, string> {
  if (!allowed()) return {};
  try {
    return JSON.parse(window.sessionStorage.getItem(UTM_KEY) ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}
