/**
 * Campaign parameters (utm_source and friends) as people read them. Used by
 * the enquiry inbox, the notification email and the CSV export. No
 * dependencies, so the browser can use it too.
 */

export const UTM_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

export const UTM_LABELS: Record<(typeof UTM_PARAMS)[number], string> = {
  utm_source: "Source",
  utm_medium: "Medium",
  utm_campaign: "Campaign",
  utm_content: "Content",
  utm_term: "Term",
};

/** Proper names for the usual sources. Anything else is shown as it was written in the link. */
const SOURCE_NAMES: Record<string, string> = {
  linkedin: "LinkedIn",
  facebook: "Facebook",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  youtube: "YouTube",
  google: "Google",
  twitter: "X (Twitter)",
  x: "X (Twitter)",
  newsletter: "Newsletter",
  email: "Email",
};

export function sourceName(source: string): string {
  return SOURCE_NAMES[source.trim().toLowerCase()] ?? source;
}

/** One line, for example "LinkedIn (social), campaign anup-communication-practice, organic-anup". */
export function describeUtm(utm: Record<string, string> | null | undefined): string | null {
  if (!utm) return null;
  const parts: string[] = [];
  if (utm.utm_source) parts.push(`${sourceName(utm.utm_source)}${utm.utm_medium ? ` (${utm.utm_medium})` : ""}`);
  else if (utm.utm_medium) parts.push(utm.utm_medium);
  if (utm.utm_campaign) parts.push(`campaign ${utm.utm_campaign}`);
  if (utm.utm_content) parts.push(utm.utm_content);
  if (utm.utm_term) parts.push(`term ${utm.utm_term}`);
  return parts.length > 0 ? parts.join(", ") : null;
}
