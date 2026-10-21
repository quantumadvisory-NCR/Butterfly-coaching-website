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
  { type: "boolean", name: "announcementEnabled", label: "Show the announcement bar", help: "The thin yellow strip above the menu." },
  {
    type: "text",
    name: "announcementText",
    label: "Announcement text",
    help: 'For example "Next ACC cohort enrolling now · Limited seats". To show a date, write {date} where it should appear, e.g. "Next ACC cohort starts {date} · Limited seats": the bar then stays hidden while no date is set, and hides itself once that date has passed.',
    maxLength: 140,
  },
  {
    type: "date",
    name: "announcementDate",
    label: "Cohort start date",
    help: "Shown in place of {date}, written out in full (for example 12 January 2027).",
  },
  { type: "link", name: "announcementLink", label: "Announcement link", help: 'For example "Reserve yours" linking to /level-1-acc-coach-program/.' },
  { type: "link", name: "cta", label: "Header button" },
] as const satisfies readonly Field[];

const support = [
  { type: "boolean", name: "enabled", label: 'Show the "Need help?" button', help: "A small button in the bottom corner of every page, next to WhatsApp." },
  { type: "text", name: "heading", label: "Panel heading", maxLength: 80 },
  { type: "textarea", name: "body", label: "Panel text", maxLength: 240, rows: 2 },
  {
    type: "list",
    name: "links",
    label: "Options in the panel",
    itemLabel: "Option",
    titleField: "label",
    max: 5,
    fields: [
      { type: "text", name: "label", label: "Label", required: true, maxLength: 40 },
      {
        type: "url",
        name: "href",
        label: "Link",
        required: true,
        help: 'A page such as /coaching-certifications/, or one of the shortcuts "booking", "whatsapp" or "phone".',
      },
      { type: "text", name: "description", label: "Short description", maxLength: 80 },
    ],
  },
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
  { type: "color", name: "primary", label: "Links and secondary buttons", help: "The brand value is charcoal #2B2B2B." },
  { type: "color", name: "navy", label: "Headings and dark sections", help: "The brand value is charcoal #2B2B2B." },
  { type: "color", name: "accent", label: "Butterfly yellow", help: "Primary buttons, highlights and the announcement bar." },
  {
    type: "color",
    name: "background",
    label: "Page background",
    help: "Behind every page of the website and the admin. The brand value is #FCFCFC, the grey-white of the logo artwork.",
  },
  { type: "color", name: "ink", label: "Body text", help: "The brand value is mid gray #5F5F5F." },
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
  header: { label: "Header and announcement", fields: header },
  support: { label: "Need help panel", fields: support },
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
  support: DataOf<typeof support>;
  footer: DataOf<typeof footer>;
  newsletter: DataOf<typeof newsletter>;
  integrations: DataOf<typeof integrations>;
  theme: DataOf<typeof theme>;
};

/** Design tokens: see docs/BRAND_SYSTEM.md. The page background #FCFCFC is the grey-white of the BCA logo artwork. */
export const DEFAULT_THEME: SiteSettings["theme"] = {
  primary: "#2b2b2b",
  navy: "#2b2b2b",
  accent: "#f5ba00",
  background: "#fcfcfc",
  ink: "#5f5f5f",
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
    // Off until the owner sets a confirmed cohort date: the bar never shows a placeholder.
    announcementEnabled: true,
    announcementText: "Next ACC cohort enrolling now · Limited seats",
    announcementDate: "",
    announcementLink: { label: "Reserve yours", href: "/level-1-acc-coach-program/" },
    cta: { label: "Book a discovery call", href: "booking" },
  },
  support: {
    enabled: true,
    heading: "Not sure where to start?",
    body: "Tell us what you're looking for and we'll help you find the right next step.",
    links: [
      { label: "Explore programmes", href: "/coaching-certifications/", description: "Compare the ACC, PCC and MCC pathways" },
      { label: "Book a discovery call", href: "booking", description: "A short conversation about your goals" },
      { label: "WhatsApp us", href: "whatsapp", description: "Quick questions, answered by our team" },
      { label: "Send an enquiry", href: "/contact-us/#enquire", description: "We reply by email or phone" },
    ],
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
    for (const token of ["primary", "navy", "accent", "background", "ink"] as const) {
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
