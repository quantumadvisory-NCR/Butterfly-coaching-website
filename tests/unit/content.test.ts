import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { FAQS, NAVIGATION, PAGES, POST_IMAGES, PROGRAMMES, REDIRECTS, TESTIMONIALS } from "@seed/content";
import { MEDIA } from "@seed/media";
import { hrefSchema, objectSchema } from "@/lib/blocks/fields";
import { BLOCKS, defaultBlockData, getBlock, mediaIdsInSections, validateBlockData } from "@/lib/blocks/registry";
import { sanitiseRichText } from "@/lib/sanitise";

const mediaKeys = new Set(MEDIA.map((m) => m.key));

/** Finds every "@media:<key>" reference inside seed block data. */
function mediaRefs(value: unknown, found: string[] = []): string[] {
  if (typeof value === "string" && value.startsWith("@media:")) found.push(value.slice(7));
  else if (Array.isArray(value)) value.forEach((v) => mediaRefs(v, found));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => mediaRefs(v, found));
  return found;
}

/** Swaps media references for a syntactically valid id so validation can run without a database. */
function withFakeIds(value: unknown): unknown {
  if (typeof value === "string" && value.startsWith("@media:")) return "00000000-0000-4000-8000-000000000000";
  if (Array.isArray(value)) return value.map(withFakeIds);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, withFakeIds(v)]));
  return value;
}

describe("block registry", () => {
  it("has a unique type for every block", () => {
    expect(new Set(BLOCKS.map((b) => b.type)).size).toBe(BLOCKS.length);
  });

  it("covers every block type the brief asks for", () => {
    const required = ["hero", "rich_text", "image_text", "programme_cards", "comparison_table", "testimonials", "profiles", "faq", "timeline", "gallery", "video", "cta", "contact_form", "newsletter", "resource_downloads"];
    for (const type of required) expect(getBlock(type), type).toBeDefined();
  });

  it("rejects unknown block types", () => {
    expect(validateBlockData("not_a_block", {}).ok).toBe(false);
  });

  it("requires required fields", () => {
    const result = validateBlockData("cta", { ...defaultBlockData("cta"), heading: "" });
    expect(result.ok).toBe(false);
  });

  it("strips unknown keys and sanitises rich text", () => {
    const result = validateBlockData(
      "rich_text",
      { heading: "Hello", body: '<p onclick="x()">Hi<script>alert(1)</script></p>', injected: "nope" },
      sanitiseRichText,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).not.toHaveProperty("injected");
      expect(result.data.body).toBe("<p>Hi</p>");
    }
  });

  it("collects media ids from nested list fields", () => {
    const id = "11111111-1111-4111-8111-111111111111";
    const ids = mediaIdsInSections([{ type: "gallery", data: { images: [{ image: id, caption: "" }] } }]);
    expect([...ids]).toEqual([id]);
  });
});

describe("link validation", () => {
  it.each(["/contact-us/", "#enquire", "https://example.com", "mailto:a@b.co", "tel:+919610093337", "booking", "whatsapp", ""])("accepts %s", (href) => {
    expect(hrefSchema.safeParse(href).success).toBe(true);
  });
  it.each(["javascript:alert(1)", "data:text/html,<script>", "//evil.example", "vbscript:x", "ftp://example.com"])("rejects %s", (href) => {
    expect(hrefSchema.safeParse(href).success).toBe(false);
  });
});

describe("seed content", () => {
  it("has the mandatory hero copy on the homepage, word for word", () => {
    const hero = PAGES.find((p) => p.path === "/")!.sections[0]!;
    expect(hero.type).toBe("hero");
    expect(hero.data.heading).toBe("Learning that stays");
    expect(hero.data.subheading).toBe("ICF-accredited coach training built on practice, spaced review and founder mentoring.");
    expect(hero.data.primaryCta).toEqual({ label: "Book a discovery call", href: "booking" });
    expect(hero.data.secondaryCta).toEqual({ label: "Explore programmes", href: "/coaching-certifications/" });
  });

  it("ends the homepage with the required call to action", () => {
    const cta = PAGES.find((p) => p.path === "/")!.sections.at(-1)!;
    expect(cta.data.heading).toBe("Ready to find your next step?");
    expect(cta.data.secondaryCta).toEqual({ label: "WhatsApp us", href: "whatsapp" });
  });

  it("includes every required public route", () => {
    const paths = new Set([...PAGES.map((p) => p.path), ...PROGRAMMES.map((p) => p.path)]);
    for (const required of [
      "/",
      "/coaching-certifications/",
      "/level-1-acc-coach-program/",
      "/level-2-pcc-coach-program/",
      "/level-3-mcc-program/",
      "/services/mentor-coaching-supervision/",
      "/services/coaching-services/",
      "/services/corporate-programs/",
      "/about-us/",
      "/testimonial/",
      "/contact-us/",
      "/privacy-policy/",
      "/terms-of-use/",
      "/thank-you/",
    ]) {
      expect(paths.has(required), required).toBe(true);
    }
  });

  it("validates every section of every seeded page", () => {
    for (const page of PAGES) {
      for (const section of page.sections) {
        const result = validateBlockData(section.type, withFakeIds(section.data), sanitiseRichText);
        expect(result.ok, `${page.path} ${section.type}: ${JSON.stringify(!result.ok && result.errors)}`).toBe(true);
      }
    }
  });

  it("only references media that exists in the manifest", () => {
    const refs = [
      ...mediaRefs(PAGES),
      ...PROGRAMMES.flatMap((p) => [p.badge, p.heroImage, p.cardImage]),
      ...TESTIMONIALS.map((t) => t.photo),
      ...Object.values(POST_IMAGES),
    ].filter((key): key is string => Boolean(key));
    for (const key of refs) expect(mediaKeys.has(key), key).toBe(true);
  });

  it("ships a real file, alt text and licence note for every media item", () => {
    for (const item of MEDIA) {
      expect(existsSync(path.join("public", item.url)), item.url).toBe(true);
      expect(item.alt.length, `${item.key} alt`).toBeGreaterThan(3);
      expect(item.licence.length, `${item.key} licence`).toBeGreaterThan(10);
    }
  });

  it("never presents an AI image as a real person", () => {
    for (const item of MEDIA.filter((m) => m.key.startsWith("person."))) expect(item.source, item.key).toBe("bca");
    for (const item of MEDIA.filter((m) => m.source === "ai")) expect(item.alt, item.key).not.toMatch(/anup|kanika|vijay|sucheta|misk/i);
  });

  it("keeps testimonial extracts word for word", () => {
    const collapse = (text: string) => text.replace(/\s+/g, " ").trim();
    for (const t of TESTIMONIALS) {
      if (t.excerpt) expect(collapse(t.quote), t.name).toContain(collapse(t.excerpt));
    }
  });

  it("only calls a programme accredited when its status says so, and gives each one its badge", () => {
    for (const p of PROGRAMMES) {
      const claimsIt = /accredited/i.test(JSON.stringify([p.highlights, p.seoTitle, p.seoDescription]));
      if (claimsIt) expect(p.accreditationStatus, p.slug).toBe("accredited");
      if (p.accreditationStatus === "accredited") expect(p.badge, p.slug).toBeTruthy();
    }
    // Level 3 accreditation was confirmed by the owner on 10 October 2026.
    for (const slug of ["level-1-acc", "level-2-pcc", "level-3-mcc"]) {
      expect(PROGRAMMES.find((p) => p.slug === slug)!.accreditationStatus, slug).toBe("accredited");
    }
  });

  it("uses safe links everywhere in navigation and redirects", () => {
    const links = Object.values(NAVIGATION).flatMap((items) => items.flatMap((item) => [item.href, ...(item.children ?? []).map((c) => c.href)]));
    for (const href of [...links, ...REDIRECTS.map((r) => r.destination)]) expect(hrefSchema.safeParse(href).success, href).toBe(true);
    for (const redirect of REDIRECTS) expect(redirect.source).toMatch(/^\/([a-z0-9-]+\/)+$/);
  });

  it("contains no em dashes or en dashes in site copy written for the rebuild", () => {
    const copy = JSON.stringify({ PAGES, PROGRAMMES, FAQS, NAVIGATION });
    expect(copy).not.toMatch(/[–—]/);
  });

  it("validates FAQ answers as sanitised rich text", () => {
    const schema = objectSchema([{ type: "richtext", name: "answerHtml", label: "Answer", required: true }]);
    for (const faq of FAQS) {
      expect(schema.safeParse({ answerHtml: faq.answerHtml }).success).toBe(true);
      expect(sanitiseRichText(faq.answerHtml)).toBe(faq.answerHtml);
    }
  });
});
