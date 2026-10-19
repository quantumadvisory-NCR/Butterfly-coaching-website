import { describe, expect, it } from "vitest";
import { toCsv } from "@/lib/admin/csv";
import { announcementState } from "@/lib/announcement";
import { resolveAnnouncement } from "@/lib/content/chrome";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { sanitisePlainText, sanitiseRichText } from "@/lib/sanitise";
import { DEFAULT_SETTINGS, DEFAULT_THEME, parseSettingsGroup, resolveHref, telHref, whatsappHref } from "@/lib/settings";
import { formatHours, isReservedPath, normalisePath, readingMinutes, slugify, truncate, youtubeId } from "@/lib/utils";
import { enquirySchema, newsletterSchema } from "@/lib/validation/forms";

describe("paths and slugs", () => {
  it("normalises paths to a canonical form", () => {
    expect(normalisePath("")).toBe("/");
    expect(normalisePath("/About-Us")).toBe("/about-us/");
    expect(normalisePath("services//corporate programs/?x=1#y")).toBe("/services/corporate-programs/");
  });
  it("slugifies text", () => {
    expect(slugify("Level 1: ACC & PCC Programme!")).toBe("level-1-acc-and-pcc-programme");
    expect(slugify("Café déjà vu")).toBe("cafe-deja-vu");
  });
  it("protects reserved prefixes", () => {
    expect(isReservedPath("/admin/pages/")).toBe(true);
    expect(isReservedPath("/blog/")).toBe(true);
    expect(isReservedPath("/about-us/")).toBe(false);
  });
});

describe("formatting helpers", () => {
  it("formats hours without trailing zeros", () => {
    expect(formatHours("77.0")).toBe("77");
    expect(formatHours("2500")).toBe("2,500");
    expect(formatHours(null)).toBeNull();
  });
  it("truncates on a word boundary", () => {
    expect(truncate("The quick brown fox jumps over the lazy dog", 20)).toBe("The quick brown fox...");
    expect(truncate("Short", 20)).toBe("Short");
  });
  it("estimates reading time", () => {
    expect(readingMinutes(`<p>${"word ".repeat(440)}</p>`)).toBe(2);
  });
  it("extracts YouTube ids", () => {
    expect(youtubeId("https://www.youtube.com/watch?v=Um6HmH2ri34")).toBe("Um6HmH2ri34");
    expect(youtubeId("https://youtu.be/Um6HmH2ri34?t=3")).toBe("Um6HmH2ri34");
    expect(youtubeId("https://example.com/watch?v=Um6HmH2ri34")).toBeNull();
  });
});

describe("sanitising", () => {
  it("removes scripts, handlers and unsafe links from rich text", () => {
    const dirty = '<h1>T</h1><p style="color:red" onclick="x()">A <a href="javascript:alert(1)">b</a><img src=x onerror=alert(1)><iframe src="//e"></iframe></p>';
    const clean = sanitiseRichText(dirty);
    expect(clean).not.toMatch(/script|onclick|onerror|javascript:|iframe|img|style/i);
    expect(clean).toContain("<h2>T</h2>");
  });
  it("opens external links safely and leaves internal links alone", () => {
    expect(sanitiseRichText('<a href="https://icf.org">x</a>')).toBe('<a href="https://icf.org" target="_blank" rel="noopener noreferrer">x</a>');
    expect(sanitiseRichText('<a href="/contact-us/" target="_blank">x</a>')).toBe('<a href="/contact-us/">x</a>');
  });
  it("reduces plain text to text", () => {
    expect(sanitisePlainText("<b>Asha</b> <script>x</script>& Co")).toBe("Asha & Co");
  });
});

describe("CSV export", () => {
  it("quotes cells and neutralises spreadsheet formulas", () => {
    const csv = toCsv(["Name", "Message"], [["Asha", '=HYPERLINK("http://evil")'], ['Say "hi"', "+1 day"]]);
    expect(csv).toContain(`"'=HYPERLINK(""http://evil"")"`);
    expect(csv).toContain(`"Say ""hi"""`);
    expect(csv).toContain(`"'+1 day"`);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });
});

describe("passwords", () => {
  it("verifies a correct password and rejects a wrong one", () => {
    const hash = hashPassword("correct horse battery 9");
    expect(hash).not.toContain("correct horse");
    expect(verifyPassword("correct horse battery 9", hash)).toBe(true);
    expect(verifyPassword("wrong password 9", hash)).toBe(false);
    expect(verifyPassword("x", "not-a-hash")).toBe(false);
  });
  it("salts every hash", () => {
    expect(hashPassword("same password 1")).not.toBe(hashPassword("same password 1"));
  });
});

describe("settings", () => {
  it("falls back to verified defaults for invalid colours", () => {
    const theme = parseSettingsGroup("theme", { primary: "red; background:url(x)", navy: "#123456" });
    expect(theme.primary).toBe(DEFAULT_THEME.primary);
    expect(theme.navy).toBe("#123456");
  });
  it("uses the documented palette, with the logo's grey-white #FCFCFC page background, by default", () => {
    expect(DEFAULT_THEME).toMatchObject({ primary: "#0068bf", navy: "#0f256a", accent: "#f5ba00", background: "#fcfcfc", ink: "#444746" });
  });
  it("gives a theme saved under the old pale-blue scheme the current page background", () => {
    // Saved before the redesign: it has "sky" and no "background".
    const theme = parseSettingsGroup("theme", { primary: "#0068bf", navy: "#0f256a", accent: "#f5ba00", sky: "#eff7ff", ink: "#444746" });
    expect(theme.background).toBe("#fcfcfc");
    expect(theme).not.toHaveProperty("sky");
  });
  it("fills in settings groups that did not exist when the settings were saved", () => {
    const support = parseSettingsGroup("support", undefined);
    expect(support.enabled).toBe(true);
    expect(support.links.map((l) => l.href)).toEqual(["/coaching-certifications/", "booking", "whatsapp", "/contact-us/#enquire"]);
  });
  it("resolves link shortcuts", () => {
    const s = DEFAULT_SETTINGS;
    expect(resolveHref("booking", s)).toBe("/contact-us/?intent=discovery_call#enquire");
    expect(resolveHref("booking", { ...s, integrations: { ...s.integrations, bookingUrl: "https://cal.com/bca" } })).toBe("https://cal.com/bca");
    expect(resolveHref("whatsapp", s)).toMatch(/^https:\/\/wa\.me\/919610093337/);
    expect(resolveHref("/about-us/", s)).toBe("/about-us/");
  });
  it("builds the verified contact links", () => {
    expect(telHref(DEFAULT_SETTINGS.contact)).toBe("tel:+919610093337");
    expect(whatsappHref(DEFAULT_SETTINGS.contact, "")).toBe("https://wa.me/919610093337");
  });
});

describe("form validation", () => {
  const base = { type: "general", name: "Asha Rao", email: "ASHA@Example.com", message: "I would like to know more." };
  it("accepts a valid enquiry and normalises the email", () => {
    const parsed = enquirySchema.safeParse(base);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.email).toBe("asha@example.com");
  });
  it("requires a message for general enquiries", () => {
    expect(enquirySchema.safeParse({ ...base, message: "" }).success).toBe(false);
  });
  it("requires an organisation for corporate enquiries", () => {
    expect(enquirySchema.safeParse({ ...base, type: "corporate" }).success).toBe(false);
    expect(enquirySchema.safeParse({ ...base, type: "corporate", organisation: "Acme Ltd" }).success).toBe(true);
  });
  it("rejects bad emails, phones and unknown types", () => {
    expect(enquirySchema.safeParse({ ...base, email: "nope" }).success).toBe(false);
    expect(enquirySchema.safeParse({ ...base, phone: "call me" }).success).toBe(false);
    expect(enquirySchema.safeParse({ ...base, type: "admin" }).success).toBe(false);
  });
  it("validates newsletter emails", () => {
    expect(newsletterSchema.safeParse({ email: "a@b.co" }).success).toBe(true);
    expect(newsletterSchema.safeParse({ email: "a@b" }).success).toBe(false);
  });
});

describe("announcement bar", () => {
  const header = { ...DEFAULT_SETTINGS.header, announcementEnabled: true, announcementText: "Next ACC cohort starts {date} · Limited seats" };
  const today = new Date("2026-10-19T06:00:00Z");

  it("shows the owner's chosen wording by default, with no date needed", () => {
    expect(resolveAnnouncement(DEFAULT_SETTINGS.header, today)).toBe("Next ACC cohort enrolling now · Limited seats");
    expect(DEFAULT_SETTINGS.header.announcementLink).toEqual({ label: "Reserve yours", href: "/level-1-acc-coach-program/" });
  });

  it("puts the cohort date into the text, written out in full", () => {
    expect(resolveAnnouncement({ ...header, announcementDate: "2027-01-12" }, today)).toBe("Next ACC cohort starts 12 January 2027 · Limited seats");
  });
  it("stays hidden while the text needs a date that has not been set", () => {
    expect(resolveAnnouncement({ ...header, announcementDate: "" }, today)).toBeNull();
  });
  it("hides itself once the cohort date has passed, but not on the day itself", () => {
    expect(resolveAnnouncement({ ...header, announcementDate: "2026-10-18" }, today)).toBeNull();
    expect(resolveAnnouncement({ ...header, announcementDate: "2026-10-19" }, today)).toContain("19 October 2026");
  });
  it("never shows an unfinished placeholder", () => {
    expect(resolveAnnouncement({ ...header, announcementText: "Next ACC cohort starts [DATE] · Limited seats" }, today)).toBeNull();
    expect(resolveAnnouncement({ ...header, announcementText: "Join [X]+ coaches" }, today)).toBeNull();
  });
  it("shows plain text with no date as written, and nothing when switched off", () => {
    expect(resolveAnnouncement({ ...header, announcementText: "Applications are open" }, today)).toBe("Applications are open");
    expect(resolveAnnouncement({ ...header, announcementEnabled: false, announcementText: "Applications are open" }, today)).toBeNull();
  });
  it("tells the admin why the bar is hidden", () => {
    expect(announcementState({ ...header, announcementEnabled: false }, today).hidden).toMatch(/switched off/);
    expect(announcementState({ ...header, announcementText: "  " }, today).hidden).toMatch(/no announcement text/);
    expect(announcementState({ ...header, announcementDate: "" }, today).hidden).toMatch(/no cohort start date/);
    expect(announcementState({ ...header, announcementDate: "2026-10-18" }, today).hidden).toMatch(/has passed/);
    expect(announcementState({ ...header, announcementText: "Starts [DATE]" }, today).hidden).toMatch(/placeholder/);
    expect(announcementState({ ...header, announcementDate: "2027-01-12" }, today)).toEqual({ text: "Next ACC cohort starts 12 January 2027 · Limited seats", hidden: null });
  });
});
