import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { FAQS, NAVIGATION, PAGES, POST_IMAGES, PROGRAMMES, REDIRECTS, TESTIMONIALS } from "@seed/content";
import { MEDIA } from "@seed/media";
import { hrefSchema, objectSchema } from "@/lib/blocks/fields";
import { BLOCKS, defaultBlockData, getBlock, mediaIdsInSections, validateBlockData } from "@/lib/blocks/registry";
import { sanitiseRichText } from "@/lib/sanitise";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Emphasis, plainText } from "@/components/ui/emphasis";

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
  it("has the homepage hero copy from the November 2026 design, word for word", () => {
    const hero = PAGES.find((p) => p.path === "/")!.sections[0]!;
    expect(hero.type).toBe("hero");
    expect(hero.data.heading).toBe("Learning that stays.");
    expect(hero.data.headingAccent).toBe("Coaching that transforms.");
    expect(plainText(String(hero.data.subheading))).toBe("Rooted in India. Recognised worldwide. ICF coach training built on practice, review and founder mentoring.");
    // The owner's brief of 25 November 2026: the main button finds your level in the fees table, and no handwritten note.
    expect(hero.data.primaryCta).toEqual({ label: "Find your ICF level", href: "#programmes" });
    expect(hero.data).not.toHaveProperty("ctaNote");
    expect(hero.data.eyebrow).toBe("ICF-accredited at all 3 levels");
    // The guide button beside the main one (27 November 2026), leading to the guide form under the buttons.
    expect(hero.data.secondaryCta).toEqual({ label: "Get a programme guide", href: "#programme-guide" });
    expect(hero.data.guideForm).toBe(true);
  });

  it("ends the homepage with the choices, whose guide button leads to the hero's guide form", () => {
    const home = PAGES.find((p) => p.path === "/")!;
    const choices = home.sections.at(-1)!;
    expect(choices.data.layout).toBe("choices");
    expect(plainText(String(choices.data.heading))).toBe("Where are you today?");
    const items = choices.data.items as { title: string; tag: string; link: { label: string; href: string } }[];
    expect(items.find((item) => item.title === "I'm curious")!.link).toEqual({ label: "Get the programme guide", href: "#programme-guide" });
    expect(items.every((item) => !item.tag)).toBe(true);
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

describe("homepage redesign content (November 2026 design)", () => {
  const home = PAGES.find((p) => p.path === "/")!;
  const block = (type: string) => home.sections.find((s) => s.type === type)!;

  it("follows the design's section order", () => {
    expect(home.sections.map((s) => s.type)).toEqual([
      "hero",
      "trust_strip",
      "profiles",
      "path_cards",
      "feature_list",
      "comparison_table",
      "community",
      "testimonials",
      "faq",
      "trust_strip",
      "path_cards",
    ]);
    expect(block("trust_strip").data.layout).toBe("spotlight");
    expect(block("path_cards").data.layout).toBe("numbered");
    expect(block("feature_list").data.layout).toBe("bento");
    expect(block("comparison_table").data.source).toBe("fees");
    expect(block("testimonials").data).toMatchObject({ source: "all", layout: "carousel" });
  });

  it("carries the owner's 27 November 2026 changes", () => {
    // The ICF badges beside "A rare distinction".
    expect((block("trust_strip").data.logos as unknown[]).length).toBe(3);
    // The founder with figures and the video, straight after it.
    const founder = home.sections[2]!;
    expect(founder).toMatchObject({ type: "profiles", data: { source: "founder", layout: "compact", videoUrl: "/videos/anup-mittal-who-we-are.mp4" } });
    expect(existsSync(`public${String(founder.data.videoUrl)}`) && existsSync(`public${String(founder.data.videoPoster)}`)).toBe(true);
    // "Choose your path" as the owner gave it: one button per card.
    const paths = block("path_cards").data.items as { title: string; link: { label: string; href: string }; secondaryLink: { label: string } }[];
    expect(paths.map((p) => [p.title, p.link.label])).toEqual([
      ["Become a coach", "Compare the levels"],
      ["Grow as a leader", "See master classes"],
      ["Develop your organisation", "Send an enquiry"],
    ]);
    expect(paths.every((p) => !p.secondaryLink.label)).toBe(true);
    // The partners card under the FAQ.
    const partners = home.sections.at(-2)!;
    expect(partners).toMatchObject({ type: "trust_strip", data: { layout: "card" } });
    expect((partners.data.logos as { name: string }[]).map((l) => l.name)).toEqual(["Axis Bank", "upGrad", "Vi (Vodafone Idea)", "Amazon"]);
    // The ICF Foundation certificate on the About page, shown whole.
    const about = PAGES.find((p) => p.path === "/about-us/")!;
    expect(about.sections.find((x) => x.data.anchor === "icf-foundation")).toMatchObject({ type: "image_text", data: { imageFit: "whole", image: "@media:recognition.icf-foundation-2026" } });
  });

  it("carries the owner's 22 November 2026 changes", () => {
    // Three photographs slide in the hero's arched frame: the main one and two more authentic BCA photographs.
    expect(block("hero").data.image).toBe("@media:gallery.anup-with-table-group");
    expect(block("hero").data.slides).toEqual([{ image: "@media:gallery.anup-engaging-audience" }, { image: "@media:gallery.bca-community-outdoors" }]);
    // Programmes and fees: 100% online, and "Enroll" buttons (the owner's wording, 27 November 2026).
    expect(block("comparison_table").data).toMatchObject({ format: "100% online · English", buttonLabel: "Enroll" });
    // The tentative durations shown under the fee.
    const duration = (slug: string) => PROGRAMMES.find((p) => p.slug === slug) as { duration?: string } | undefined;
    expect(duration("level-1-acc")?.duration).toBe("22 to 26 weeks");
    expect(duration("level-2-pcc")?.duration).toBe("42 to 46 weeks");
    expect(duration("level-3-mcc")?.duration).toBe("40 to 44 weeks");
  });

  it("publishes none of the design file's placeholders", () => {
    const text = JSON.stringify(home.sections);
    // The design marked unknown facts as [DD Month], [X], [____] and so on: none may reach the page.
    expect(text).not.toMatch(/\[(DATE|X|DD Month|_+|Name|Role|Country|Hero photo[^\]]*|e\.g\.[^\]]*|time IST)\]/i);
    expect(text).not.toContain("[Second story");
  });

  it("links every in-page button to a section that exists", () => {
    const anchors = new Set(home.sections.map((s) => s.data.anchor).filter(Boolean));
    // The hero's programme guide form is #programme-guide (components/blocks/hero.tsx).
    if (home.sections.some((s) => s.type === "hero" && s.data.guideForm)) anchors.add("programme-guide");
    const hrefs = JSON.stringify(home.sections).match(/"href":"#[^"]+"/g) ?? [];
    for (const href of hrefs) expect(anchors).toContain(href.slice(9, -1));
  });

  it("states only the mentor coaching hours every programme really includes", () => {
    const figure = (block("feature_list").data.items as { visual: string; figure: string }[]).find((item) => item.visual === "figure")!;
    for (const programme of PROGRAMMES.filter((p) => p.kind === "certification")) expect(programme.mentoringHours).toBe(figure.figure);
  });
});

describe("emphasis markup", () => {
  it("reduces marked-up text to its words", () => {
    expect(plainText("Why learners choose ==BCA==")).toBe("Why learners choose BCA");
    expect(plainText("A ((global)) learning ++community++, **bold** and __drawn__ [[tag]]")).toBe("A global learning community, bold and drawn tag");
    expect(plainText("No markup at all")).toBe("No markup at all");
  });
  it("shows headings in one colour, without highlights, tags or drawings (owner's brief, 25 November 2026)", () => {
    expect(Emphasis({ text: "Why learners choose ==BCA==" })).toBe("Why learners choose BCA");
    expect(Emphasis({ text: "One of [[only 4 in India.]]", tone: "dark" })).toBe("One of only 4 in India.");
  });
  it("sets marked body text in bold, highlighting only ==yellow== words", () => {
    const html = renderToStaticMarkup(Emphasis({ text: "==Rooted in India.== Learn, ++practise++ and ((revisit)).", strong: true }) as ReactElement);
    expect(html.match(/fx-mark/g)).toHaveLength(1);
    expect(html).toContain(">Rooted in India.</strong>");
    expect(html).toContain(">practise</strong>");
    expect(html).toContain(">revisit</strong>");
    expect(html).not.toMatch(/lav|circle|scribble|fx-tag/);
  });
});
