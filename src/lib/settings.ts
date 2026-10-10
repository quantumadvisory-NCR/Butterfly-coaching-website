/**
 * Global site settings. Each group is stored as one JSON row in site_settings
 * and edited in Admin > Settings. Field declarations double as the form.
 */
import { type DataOf, type Field, defaultsFor, objectSchema } from "@/lib/blocks/fields";

const contact = [
  { type: "text", name: "legalName", label: "Registered business name", maxLength: 120 },
  { type: "text", name: "phoneDisplay", label: "Phone number as displayed", maxLength: 30 },
  {
    type: "text",
    name: "phoneE164",
    label: "Phone number for click-to-call",
    help: "International format with no spaces, e.g. +919610093337.",
    maxLength: 20,
  },
  {
    type: "text",
    name: "whatsappNumber",
    label: "WhatsApp number",
    help: "Digits only with country code, e.g. 919610093337.",
    maxLength: 20,
  },
  { type: "text", name: "whatsappMessage", label: "Pre-filled WhatsApp message", maxLength: 200 },
  { type: "text", name: "email", label: "Public email address", maxLength: 120 },
  { type: "stringList", name: "addressLines", label: "Address", itemLabel: "Address line" },
  {
    type: "url",
    name: "mapEmbedUrl",
    label: "Google Maps embed link",
    help: 'In Google Maps choose Share > Embed a map and paste only the address inside src="...". Leave empty to show a link instead.',
  },
] as const satisfies readonly Field[];

const social = [
  { type: "url", name: "linkedin", label: "LinkedIn" },
  { type: "url", name: "instagram", label: "Instagram" },
  { type: "url", name: "facebook", label: "Facebook" },
  { type: "url", name: "youtube", label: "YouTube" },
  { type: "url", name: "x", label: "X (Twitter)" },
] as const satisfies readonly Field[];

const header = [
  { type: "boolean", name: "announcementEnabled", label: "Show the announcement bar" },
  { type: "text", name: "announcementText", label: "Announcement text", maxLength: 140 },
  { type: "link", name: "announcementLink", label: "Announcement link" },
  { type: "link", name: "cta", label: "Header button" },
] as const satisfies readonly Field[];

const footer = [
  { type: "textarea", name: "tagline", label: "Short description under the logo", maxLength: 240, rows: 3 },
  { type: "text", name: "copyrightName", label: "Name in the copyright line", maxLength: 120 },
] as const satisfies readonly Field[];

const newsletter = [
  { type: "boolean", name: "enabled", label: "Show newsletter signup in the footer" },
  { type: "text", name: "heading", label: "Heading", maxLength: 80 },
  { type: "textarea", name: "body", label: "Text", maxLength: 240, rows: 2 },
  { type: "text", name: "consentText", label: "Consent line under the form", maxLength: 240 },
] as const satisfies readonly Field[];

const integrations = [
  {
    type: "url",
    name: "bookingUrl",
    label: "Booking link",
    help: 'Calendly, Cal.com or similar. When empty, "Book a discovery call" opens the enquiry form instead.',
  },
  { type: "text", name: "ga4Id", label: "Google Analytics 4 measurement ID", placeholder: "G-XXXXXXXXXX", maxLength: 20 },
  { type: "text", name: "gtmId", label: "Google Tag Manager container ID", placeholder: "GTM-XXXXXXX", maxLength: 20 },
  {
    type: "boolean",
    name: "consentBanner",
    label: "Ask visitors for consent before loading analytics",
    help: "Recommended. Analytics never loads before the visitor agrees.",
  },
] as const satisfies readonly Field[];

export const HEADING_FONTS = [
  { value: "jakarta", label: "Plus Jakarta Sans (BCA default)" },
  { value: "schibsted", label: "Schibsted Grotesk" },
  { value: "manrope", label: "Manrope" },
  { value: "newsreader", label: "Newsreader (serif)" },
] as const;

export const BODY_FONTS = [
  { value: "jakarta", label: "Plus Jakarta Sans (BCA default)" },
  { value: "manrope", label: "Manrope" },
] as const;

const theme = [
  { type: "color", name: "primary", label: "Primary blue", help: "Links, secondary buttons and highlights." },
  { type: "color", name: "navy", label: "Navy", help: "Headings and dark sections." },
  { type: "color", name: "accent", label: "Accent yellow", help: "Primary buttons." },
  { type: "color", name: "sky", label: "Pale blue background" },
  { type: "color", name: "ink", label: "Body text" },
  { type: "select", name: "headingFont", label: "Heading typeface", options: HEADING_FONTS },
  { type: "select", name: "bodyFont", label: "Body typeface", options: BODY_FONTS },
] as const satisfies readonly Field[];

const brand = [
  { type: "text", name: "siteName", label: "Site name", required: true, maxLength: 80 },
  { type: "image", name: "logoLight", label: "Logo for light backgrounds (header)" },
  { type: "image", name: "logoDark", label: "Logo for dark backgrounds (footer)" },
  { type: "image", name: "favicon", label: "Favicon", help: "Square image, at least 256 x 256." },
  { type: "image", name: "defaultOgImage", label: "Default social sharing image" },
  { type: "textarea", name: "defaultDescription", label: "Default meta description", maxLength: 200, rows: 2 },
] as const satisfies readonly Field[];

export const SETTINGS_GROUPS = {
  brand: { label: "Brand and logo", fields: brand },
  contact: { label: "Contact details", fields: contact },
  social: { label: "Social links", fields: social },
  header: { label: "Header", fields: header },
  footer: { label: "Footer", fields: footer },
  newsletter: { label: "Newsletter", fields: newsletter },
  integrations: { label: "Booking and analytics", fields: integrations },
  theme: { label: "Colours and typography", fields: theme },
} as const;

export type SettingsKey = keyof typeof SETTINGS_GROUPS;

export type SiteSettings = {
  brand: DataOf<typeof brand>;
  contact: DataOf<typeof contact>;
  social: DataOf<typeof social>;
  header: DataOf<typeof header>;
  footer: DataOf<typeof footer>;
  newsletter: DataOf<typeof newsletter>;
  integrations: DataOf<typeof integrations>;
  theme: DataOf<typeof theme>;
};

/** Design tokens. Colour values verified against ipeccoaching.com: see docs/BRAND_SYSTEM.md. */
export const DEFAULT_THEME: SiteSettings["theme"] = {
  primary: "#0068bf",
  navy: "#0f256a",
  accent: "#f5ba00",
  sky: "#eff7ff",
  ink: "#444746",
  headingFont: "jakarta",
  bodyFont: "jakarta",
};

export const DEFAULT_SETTINGS: SiteSettings = {
  brand: {
    siteName: "Butterfly Coaching Academy",
    logoLight: null,
    logoDark: null,
    favicon: null,
    defaultOgImage: null,
    defaultDescription:
      "ICF-accredited coach training built on practice, spaced review and founder mentoring. ACC, PCC and MCC pathways, mentoring and corporate programmes.",
  },
  contact: {
    legalName: "Butterfly Coaching Academy Pvt. Limited",
    phoneDisplay: "+91 96100 93337",
    phoneE164: "+919610093337",
    whatsappNumber: "919610093337",
    whatsappMessage: "Hello, I would like to know more about Butterfly Coaching Academy.",
    email: "contact@butterflycoachingacademy.com",
    addressLines: ["Flat No T-8118A, 8th Floor, Block 30", "Rangoli Gardens", "Jaipur 302034"],
    mapEmbedUrl: "",
  },
  social: { linkedin: "", instagram: "", facebook: "", youtube: "", x: "" },
  header: {
    announcementEnabled: false,
    announcementText: "",
    announcementLink: { label: "", href: "" },
    cta: { label: "Book a discovery call", href: "booking" },
  },
  footer: {
    tagline: "Coach education, mentoring and leadership development built on practice, reflection and feedback.",
    copyrightName: "Butterfly Coaching Academy Pvt. Limited",
  },
  newsletter: {
    enabled: true,
    heading: "Ideas on coaching, in your inbox",
    body: "Occasional notes on coaching practice and upcoming cohorts.",
    consentText: "We only use your email to send the newsletter. Unsubscribe at any time.",
  },
  integrations: { bookingUrl: "", ga4Id: "", gtmId: "", consentBanner: true },
  theme: DEFAULT_THEME,
};

const HEX = /^#[0-9a-f]{6}$/i;

/** Validates one settings group, falling back to defaults for missing or invalid values. */
export function parseSettingsGroup<K extends SettingsKey>(key: K, value: unknown): SiteSettings[K] {
  const fields = SETTINGS_GROUPS[key].fields;
  const fallback = { ...defaultsFor(fields), ...DEFAULT_SETTINGS[key] } as Record<string, unknown>;
  const stored = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  // Validate field by field, so one bad value never discards the rest of the group.
  for (const field of fields) {
    const candidate = field.name in stored ? stored[field.name] : fallback[field.name];
    const parsed = objectSchema([field]).safeParse({ [field.name]: candidate });
    data[field.name] = parsed.success ? (parsed.data as Record<string, unknown>)[field.name] : fallback[field.name];
  }
  if (key === "theme") {
    for (const token of ["primary", "navy", "accent", "sky", "ink"] as const) {
      if (!HEX.test(String(data[token]))) data[token] = DEFAULT_THEME[token];
    }
  }
  return data as SiteSettings[K];
}

export function settingsSchema(key: SettingsKey) {
  return objectSchema(SETTINGS_GROUPS[key].fields);
}

/* ---- derived helpers ------------------------------------------------------ */

export function whatsappHref(contactSettings: SiteSettings["contact"], message?: string) {
  const number = contactSettings.whatsappNumber.replace(/\D/g, "");
  if (!number) return null;
  const text = message ?? contactSettings.whatsappMessage;
  return `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function telHref(contactSettings: SiteSettings["contact"]) {
  const number = contactSettings.phoneE164.replace(/[^\d+]/g, "");
  return number ? `tel:${number}` : null;
}

export function mapsSearchHref(contactSettings: SiteSettings["contact"]) {
  const query = [contactSettings.legalName, ...contactSettings.addressLines].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/**
 * Resolves the special link targets editors can use in any button:
 *   "booking"  -> the booking link, or the discovery-call form when none is set
 *   "whatsapp" -> WhatsApp chat with the configured number
 *   "phone"    -> click-to-call
 */
export function resolveHref(href: string, settings: Pick<SiteSettings, "contact" | "integrations">): string {
  const key = href.trim().toLowerCase();
  if (key === "booking") return settings.integrations.bookingUrl || "/contact-us/?intent=discovery_call#enquire";
  if (key === "whatsapp") return whatsappHref(settings.contact) ?? "/contact-us/";
  if (key === "phone") return telHref(settings.contact) ?? "/contact-us/";
  return href;
}
