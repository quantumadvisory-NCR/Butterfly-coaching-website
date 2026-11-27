import { describe, expect, it } from "vitest";
import { toCsv } from "@/lib/admin/csv";
import { announcementState } from "@/lib/announcement";
import { describeUtm, sourceName } from "@/lib/campaign";
import { resolveAnnouncement } from "@/lib/content/chrome";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { sanitisePlainText, sanitiseRichText } from "@/lib/sanitise";
import { firstParam, pageCount, pageNumber } from "@/lib/search-params";
import { DEFAULT_SETTINGS, DEFAULT_THEME, openMasterClasses, parseSettingsGroup, resolveHref, telHref, whatsappHref } from "@/lib/settings";
import { brochureFile, downloadHref, formatHours, isReservedPath, normalisePath, readingMinutes, slugify, truncate, youtubeId } from "@/lib/utils";
import { isPlayableVideo, videoFileUrl } from "@/lib/video";
import { UPLOAD_LIMITS, formatBytes, uploadKindFor } from "@/lib/media-kinds";
import { sniff } from "@/lib/admin/media-store";
import { preflight } from "@/components/admin/uploader";
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
    expect(isReservedPath("/enquire/")).toBe(true);
    expect(isReservedPath("/about-us/")).toBe(false);
  });
});

describe("master classes and campaign links", () => {
  it("offers the launch master class under the short name used in shared links", () => {
    const classes = openMasterClasses(DEFAULT_SETTINGS);
    expect(classes.map((c) => c.slug)).toContain("leaders-communication");
    expect(classes.find((c) => c.slug === "leaders-communication")?.name).toBe("How Leaders Can Develop Communication");
  });

  it("makes short names safe for links and leaves out hidden or repeated classes", () => {
    const base = { label: "", summary: "", image: null };
    const classes = openMasterClasses({
      masterClasses: {
        formIntro: "",
        classes: [
          { ...base, name: "Power of Presence", slug: " Power of Presence ", hidden: false },
          { ...base, name: "Hidden class", slug: "hidden-class", hidden: true },
          { ...base, name: "Duplicate", slug: "power-of-presence", hidden: false },
          { ...base, name: "No short name", slug: "", hidden: false },
        ],
      },
    });
    expect(classes.map((c) => c.slug)).toEqual(["power-of-presence", "no-short-name"]);
  });

  it("keeps the master class settings valid after a round trip", () => {
    expect(parseSettingsGroup("masterClasses", DEFAULT_SETTINGS.masterClasses)).toEqual(DEFAULT_SETTINGS.masterClasses);
    // A group that was never saved falls back to the launch class.
    expect(parseSettingsGroup("masterClasses", undefined).classes[0]?.slug).toBe("leaders-communication");
  });

  it("describes where an enquiry came from in plain words", () => {
    expect(sourceName("linkedin")).toBe("LinkedIn");
    expect(sourceName("partner-site")).toBe("partner-site");
    expect(
      describeUtm({ utm_source: "linkedin", utm_medium: "social", utm_campaign: "anup-communication-practice", utm_content: "organic-anup" }),
    ).toBe("LinkedIn (social), campaign anup-communication-practice, organic-anup");
    expect(describeUtm({})).toBeNull();
    expect(describeUtm(null)).toBeNull();
  });

  it("accepts master class enquiries without an organisation or message", () => {
    const result = enquirySchema.safeParse({ type: "masterclass", name: "Asha Rao", email: "asha@example.com" });
    expect(result.success).toBe(true);
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
  it("uses the documented gray and yellow palette, with the logo's grey-white #FCFCFC page background, by default", () => {
    expect(DEFAULT_THEME).toMatchObject({ primary: "#2b2b2b", navy: "#2b2b2b", accent: "#f5ba00", background: "#fcfcfc", ink: "#5f5f5f" });
  });
  it("has no typeface choice: the fonts are fixed in the code, and an old saved choice is ignored", () => {
    expect(DEFAULT_THEME).not.toHaveProperty("headingFont");
    const theme = parseSettingsGroup("theme", { headingFont: "jakarta", bodyFont: "manrope", accent: "#f5ba00" });
    expect(theme).not.toHaveProperty("headingFont");
    expect(theme).not.toHaveProperty("bodyFont");
    expect(theme.accent).toBe("#f5ba00");
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
    expect(resolveAnnouncement(DEFAULT_SETTINGS.header, today)).toBe("Know about our next cohort · Limited seats");
    expect(DEFAULT_SETTINGS.header.announcementLink).toEqual({ label: "Reserve my seat", href: "/level-1-acc-coach-program/" });
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

describe("page addresses and paging", () => {
  it("takes the first value of a repeated parameter", () => {
    expect(firstParam(undefined)).toBe("");
    expect(firstParam("coaching")).toBe("coaching");
    expect(firstParam(["coaching", "leadership"])).toBe("coaching");
    expect(firstParam([])).toBe("");
  });

  it("reads only whole page numbers from 1", () => {
    expect(pageNumber("2")).toBe(2);
    expect(pageNumber(["3", "5"])).toBe(3);
    for (const odd of [undefined, "", "0", "-2", "1.5", "abc", "1e400", "9007199254740993"]) expect(pageNumber(odd), String(odd)).toBe(1);
  });

  it("counts pages, with an extra item on page 1 when a listing opens with a lead post", () => {
    expect(pageCount(0, 9)).toBe(1);
    expect(pageCount(9, 9)).toBe(1);
    expect(pageCount(10, 9)).toBe(2);
    // The blog index: one lead post plus nine cards fit on page 1.
    expect(pageCount(10, 9, 1)).toBe(1);
    expect(pageCount(11, 9, 1)).toBe(2);
    expect(pageCount(0, 9, 1)).toBe(1);
  });
});

describe("brochure downloads and story videos", () => {
  it("makes brochure links download, including files in the media library", () => {
    expect(brochureFile("level-1-acc")).toBe("BCA-level-1-acc-brochure.pdf");
    // A file on this site downloads through the link's download attribute, so the address stays as it is.
    expect(downloadHref("/media/brochures/l1.pdf", "BCA-level-1-acc-brochure.pdf")).toBe("/media/brochures/l1.pdf");
    // Supabase Storage sends a file as a download when the address asks for it.
    expect(downloadHref("https://abc123.supabase.co/storage/v1/object/public/media/l1.pdf", "BCA-level-1-acc-brochure.pdf")).toBe(
      "https://abc123.supabase.co/storage/v1/object/public/media/l1.pdf?download=BCA-level-1-acc-brochure.pdf",
    );
    expect(downloadHref("https://abc123.supabase.co/x.pdf?v=2", "a b.pdf")).toBe("https://abc123.supabase.co/x.pdf?v=2&download=a%20b.pdf");
  });

  it("plays YouTube links and video files on this site or in the media library, nothing else", () => {
    expect(isPlayableVideo("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(true);
    expect(isPlayableVideo("https://youtu.be/dQw4w9WgXcQ")).toBe(true);
    expect(isPlayableVideo("/videos/story.mp4")).toBe(true);
    expect(videoFileUrl("https://abc123.supabase.co/storage/v1/object/public/media/story.mp4")).toBeTruthy();
    for (const bad of [null, "", "https://example.com/story.mp4", "//evil.test/x.mp4", "/videos/notes.pdf", "javascript:alert(1)"]) {
      expect(isPlayableVideo(bad), String(bad)).toBe(false);
    }
  });
});

describe("media uploads", () => {
  const mp4 = Buffer.concat([Buffer.from([0, 0, 0, 0x20]), Buffer.from("ftypisom"), Buffer.alloc(52)]);
  const mov = Buffer.concat([Buffer.from([0, 0, 0, 0x14]), Buffer.from("ftypqt  "), Buffer.alloc(52)]);
  const heic = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from("ftypheic"), Buffer.alloc(52)]);
  const webm = Buffer.concat([Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), Buffer.from("....B\u0082\u0084webm"), Buffer.alloc(40)]);

  it("recognises files by their contents, not their names", () => {
    expect(sniff(Buffer.from("%PDF-1.7 ..."))).toEqual({ kind: "file", ext: "pdf", mime: "application/pdf" });
    expect(sniff(mp4)).toEqual({ kind: "video", ext: "mp4", mime: "video/mp4" });
    expect(sniff(webm)).toEqual({ kind: "video", ext: "webm", mime: "video/webm" });
    expect(sniff(heic)).toEqual({ kind: "image" });
    expect(sniff(mov)).toMatchObject({ error: expect.stringContaining("QuickTime") });
    expect(sniff(Buffer.from("<script>alert(1)</script>"))).toEqual({ kind: "image" });
  });

  it("knows what each upload claims to be and its limit", () => {
    expect(uploadKindFor({ name: "a.JPG" })).toBe("image");
    expect(uploadKindFor({ name: "story.mp4", type: "video/mp4" })).toBe("video");
    expect(uploadKindFor({ name: "brochure.pdf", type: "" })).toBe("file");
    expect(uploadKindFor({ name: "notes.docx" })).toBeNull();
    expect(UPLOAD_LIMITS.video).toBeGreaterThan(UPLOAD_LIMITS.file);
    expect(formatBytes(1536)).toBe("2 KB");
    expect(formatBytes(11_278_041)).toBe("10.8 MB");
  });

  it("refuses unsupported or oversized files before sending them", () => {
    const file = (name: string, type: string, size = 10) => new File([new Uint8Array(size)], name, { type });
    expect(preflight(file("photo.jpg", "image/jpeg"))).toBeNull();
    expect(preflight(file("talk.mp4", "video/mp4"))).toBeNull();
    expect(preflight(file("IMG_1.heic", "image/heic"))).toMatch(/HEIC/);
    expect(preflight(file("clip.mov", "video/quicktime"))).toMatch(/QuickTime/);
    expect(preflight(file("logo.svg", "image/svg+xml"))).toMatch(/not supported/);
    expect(preflight(file("big.pdf", "application/pdf", UPLOAD_LIMITS.file + 1))).toMatch(/larger than 25 MB/);
  });
});
