import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

/**
 * Canonical form of a site path: lower-case, leading and trailing slash,
 * no query or hash. "/About-Us" -> "/about-us/", "" -> "/".
 */
export function normalisePath(input: string): string {
  const [pathOnly = ""] = input.split(/[?#]/);
  const segments = pathOnly
    .split("/")
    .map((segment) => slugify(decodeURIComponentSafe(segment)))
    .filter(Boolean);
  return segments.length ? `/${segments.join("/")}/` : "/";
}

function decodeURIComponentSafe(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Paths owned by fixed routes; CMS pages, posts and programmes may not use them. */
export const RESERVED_PREFIXES = ["/admin/", "/api/", "/blog/", "/preview/", "/media/", "/images/", "/_next/"];

export function isReservedPath(path: string) {
  return RESERVED_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix));
}

const dateFormatter = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" });
const shortDateFormatter = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});

export function formatDate(value: string | Date | null | undefined, style: "long" | "short" = "long") {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return (style === "long" ? dateFormatter : shortDateFormatter).format(date);
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return `${dateTimeFormatter.format(date)} IST`;
}

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > max * 0.6 ? lastSpace : max).replace(/[,.;:\s]+$/, "")}...`;
}

/** Minutes to read at roughly 220 words per minute. */
export function readingMinutes(html: string): number {
  const words = stripHtml(html).split(" ").filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

/** Formats numeric hours without a trailing ".0": "77.0" -> "77". */
export function formatHours(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return n.toLocaleString("en-IN", { maximumFractionDigits: 1 });
}

export function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}

export function youtubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/))([\w-]{11})/);
  return match?.[1] ?? null;
}
