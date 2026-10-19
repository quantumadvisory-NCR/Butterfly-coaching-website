import type { SiteSettings } from "@/lib/settings";

type Header = Pick<SiteSettings["header"], "announcementEnabled" | "announcementText" | "announcementDate">;

/** Today's date in India as YYYY-MM-DD, so a cohort date expires at the end of its own day. */
export function todayInIndia(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** The announcement bar's text, or (when hidden) the reason, in words the admin can act on. */
export type AnnouncementState = { text: string; hidden: null } | { text: null; hidden: string };

/**
 * Resolves the announcement bar. It is hidden when the bar is off, when the
 * text uses {date} but no date is set or the date has passed, or when the text
 * still holds a placeholder such as [DATE] or [X]. Visitors must never see an
 * unfinished announcement. Shared by the website and the admin's live preview.
 */
export function announcementState(header: Header, now = new Date()): AnnouncementState {
  const raw = header.announcementText.trim();
  if (!header.announcementEnabled) return { text: null, hidden: "“Show the announcement bar” is switched off." };
  if (!raw) return { text: null, hidden: "There is no announcement text." };
  let text = raw;
  if (raw.includes("{date}")) {
    const date = header.announcementDate;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { text: null, hidden: "The text uses {date}, but no cohort start date is set." };
    if (date < todayInIndia(now)) return { text: null, hidden: "The cohort start date has passed. Set the next date, or take {date} out of the text." };
    const formatted = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
    text = raw.replaceAll("{date}", formatted);
  }
  if (/\[[^\]]*\]|\{[^}]*\}/.test(text)) return { text: null, hidden: "The text still contains a placeholder such as [DATE] or [X]." };
  return { text, hidden: null };
}

/** The bar's text as visitors see it, or null when it is hidden. */
export function resolveAnnouncement(header: Header, now = new Date()): string | null {
  return announcementState(header, now).text;
}
