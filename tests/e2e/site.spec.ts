import { expect, test } from "@playwright/test";
import { PUBLIC_PAGES } from "./helpers";

test.describe("search engines", () => {
  test("every page has a unique title, a description and a canonical URL", async ({ request }) => {
    const titles = new Map<string, string>();
    for (const target of PUBLIC_PAGES.filter((p) => p.name !== "not-found")) {
      const html = await (await request.get(target.path)).text();
      const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
      const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "";
      const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1] ?? "";
      expect(title.length, `${target.path} title`).toBeGreaterThan(10);
      expect(description.length, `${target.path} description`).toBeGreaterThan(40);
      expect(description.length, `${target.path} description length`).toBeLessThanOrEqual(165);
      expect(canonical, `${target.path} canonical`).toContain(target.path);
      expect(html, `${target.path} og:title`).toContain('property="og:title"');
      expect(titles.has(title), `duplicate title "${title}" on ${target.path} and ${titles.get(title)}`).toBe(false);
      titles.set(title, target.path);
    }
  });

  test("sitemap lists public pages and leaves out private ones", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
    const xml = await response.text();
    for (const path of ["/coaching-certifications/", "/level-1-acc-coach-program/", "/about-us/", "/blog/", "/the-power-of-habits-cultivating-your-path-to-success/"]) {
      expect(xml, path).toContain(`${path}</loc>`);
    }
    expect(xml).not.toContain("/thank-you/");
    expect(xml).not.toContain("/admin");
  });

  test("robots.txt points to the sitemap and keeps the admin out", async ({ request }) => {
    const text = await (await request.get("/robots.txt")).text();
    expect(text).toContain("Sitemap:");
    expect(text).toContain("Disallow: /admin/");
  });

  test("structured data is present and limited to verified facts", async ({ page }) => {
    await page.goto("/");
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const types = blocks.map((b) => JSON.parse(b)["@type"]);
    expect(types).toContain("EducationalOrganization");
    expect(types).toContain("FAQPage");
    // No invented ratings or reviews anywhere.
    expect(blocks.join("")).not.toMatch(/aggregateRating|ratingValue|"Review"/);

    await page.goto("/level-1-acc-coach-program/");
    const programme = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((b) => JSON.parse(b)["@type"]);
    expect(programme).toEqual(expect.arrayContaining(["Course", "BreadcrumbList"]));
  });

  test("unknown pages return a real 404 with a helpful page", async ({ page }) => {
    const response = await page.goto("/no-such-page/");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("flown away");
    await expect(page.getByRole("link", { name: "Back to the homepage" })).toBeVisible();
  });

  test("legacy WordPress addresses redirect to their new homes", async ({ request }) => {
    for (const [from, to] of [
      ["/our-team/", "/about-us/"],
      ["/our-team/coach-anup/", "/about-us/"],
      ["/services/", "/coaching-certifications/"],
      ["/home-2/", "/"],
      ["/blog/page/2/", "/blog/"],
      ["/tag/growth/", "/blog/tag/growth/"],
      ["/tag/growth/page/2/", "/blog/tag/growth/?page=2"],
      ["/category/general/", "/blog/category/general/"],
      ["/category/general/page/3/", "/blog/category/general/?page=3"],
      ["/author/admin/", "/blog/"],
      ["/author/admin/page/2/", "/blog/"],
    ] as const) {
      const response = await request.get(from, { maxRedirects: 0 });
      expect([301, 302, 307, 308], `${from} status ${response.status()}`).toContain(response.status());
      expect(response.headers().location, from).toContain(to);
    }
    // Addresses without a trailing slash are normalised, and old blog posts still resolve.
    expect((await request.get("/about-us", { maxRedirects: 0 })).status()).toBe(308);
    expect((await request.get("/unleash-the-power-of-the-butterfly-effect-in-coaching/")).status()).toBe(200);
  });

  test("blog pages that are not whole numbers point search engines at the first page", async ({ request }) => {
    for (const path of ["/blog/?page=1.5", "/blog/?page=abc", "/blog/tag/growth/?page=2.5"]) {
      const html = await (await request.get(path)).text();
      const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1] ?? "";
      expect(canonical, path).not.toContain("page=");
      expect(html, path).not.toContain("(page ");
    }
    const second = await (await request.get("/blog/?page=2")).text();
    expect(second).toMatch(/<link rel="canonical" href="[^"]*\/blog\/\?page=2"/);
    // Search words given twice (a hand-edited link) still show results, from the first.
    const twice = await request.get("/blog/?q=coaching&q=leadership");
    expect(twice.status()).toBe(200);
    expect(await twice.text()).toContain("Search results for &quot;coaching&quot;");
  });
});

test.describe("security", () => {
  test("responses carry security headers", async ({ request }) => {
    const headers = (await request.get("/")).headers();
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'self'");
    expect(headers["content-security-policy"]).toContain("object-src 'none'");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["strict-transport-security"]).toContain("max-age=");
    expect(headers["x-powered-by"]).toBeUndefined();
  });

  test("the admin, previews, uploads and exports are closed to anonymous visitors", async ({ page, request }) => {
    for (const path of ["/admin/", "/admin/pages/", "/admin/settings/", "/admin/users/", "/admin/media/"]) {
      await page.goto(path);
      await expect(page, path).toHaveURL(/\/admin\/login\/$/);
    }
    await page.goto("/preview/page/00000000-0000-4000-8000-000000000000/");
    await expect(page).toHaveURL(/\/admin\/login\/$/);

    expect((await request.get("/admin/enquiries/export/")).status()).toBe(403);
    expect((await request.get("/admin/subscribers/export/")).status()).toBe(403);
    const upload = await request.post("/api/admin/media/", { multipart: { file: { name: "x.png", mimeType: "image/png", buffer: Buffer.from("x") } } });
    expect(upload.status()).toBe(403);
  });

  test("admin pages are never indexable", async ({ request }) => {
    const response = await request.get("/admin/login/");
    expect(response.headers()["x-robots-tag"]).toContain("noindex");
    expect(await response.text()).toContain('name="robots" content="noindex, nofollow"');
  });
});

test.describe("navigation", () => {
  test("desktop dropdowns work with the keyboard", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    const trigger = page.getByRole("button", { name: "Programmes", exact: true });
    await trigger.focus();
    await page.keyboard.press("Enter");
    const menu = page.getByRole("navigation", { name: "Main" });
    const item = menu.getByRole("link", { name: /Level 1: ACC/ });
    await expect(item).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(item).toBeHidden();
    // With a mouse the menu opens on hover.
    await trigger.hover();
    await menu.getByRole("link", { name: /Level 2: PCC/ }).click();
    await expect(page).toHaveURL(/\/level-2-pcc-coach-program\/$/);
  });

  test("the skip link is the first stop and moves focus to the content", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/about-us/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#content$/);
  });

  test("the mobile drawer opens, traps focus, navigates and closes", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole("link", { name: "Book a discovery call" })).toBeVisible();
    const box = (await drawer.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(375);

    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();

    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("dialog").getByRole("link", { name: "Corporate Programmes" }).click();
    await expect(page).toHaveURL(/\/services\/corporate-programs\/$/);
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("FAQ accordions open and close", async ({ page }) => {
    await page.goto("/");
    const question = page.getByRole("button", { name: "Which programme is right for me?" });
    await question.scrollIntoViewIfNeeded();
    await expect(question).toHaveAttribute("aria-expanded", "false");
    await question.click();
    await expect(question).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByText("Level 1 leads toward ACC")).toBeVisible();
    await question.press("Enter");
    await expect(question).toHaveAttribute("aria-expanded", "false");
  });

  test("the comparison table becomes cards on phones", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/coaching-certifications/#compare");
    await expect(page.locator("#compare table")).toBeHidden();
    await expect(page.locator("#compare").getByRole("heading", { name: "Level 1: ACC" })).toBeVisible();
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.locator("#compare table")).toBeVisible();
    await expect(page.locator("#compare").getByRole("columnheader", { name: "Level 3: MCC" })).toBeVisible();
  });
});

test.describe("homepage design (November 2026)", () => {
  test("shows the design's sections, with the effects read as plain words", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");
    // Headings read as plain words, in one colour.
    await expect(page.getByRole("heading", { name: "Why learners choose BCA" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Choose your path" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "A global learning community" })).toBeVisible();
    // "A rare distinction": one statement, without the staircase of badges (they show in the hero and the fees table).
    const spotlight = page.locator("#accreditation");
    await expect(spotlight.getByRole("heading", { level: 2 })).toHaveText("One of about 46 academies worldwide accredited by ICF at all three levels, and one of only 4 in India.");
    // The three ICF badges beside it, in one row (back on 27 November 2026).
    await expect(spotlight.locator("img")).toHaveCount(3);
    // As a ladder: each level with its credential spelled out (27 November 2026).
    for (const name of ["Associate Certified Coach", "Professional Certified Coach", "Master Certified Coach"]) await expect(spotlight.getByText(name)).toBeVisible();
    await expect(spotlight.getByText("Accredited at every level")).toBeVisible();
    await expect(page.getByRole("list", { name: "Countries our learners join from" }).getByRole("listitem")).toHaveCount(7);
  });

  test("is calm, as the owner's brief of 25 November 2026 asks: two typefaces, only the butterflies looping, no purple", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");
    await page.waitForTimeout(1500);
    const report = await page.evaluate(() => {
      const families = new Set<string>();
      const purple: string[] = [];
      const toHsl = (css: string) => {
        const m = css.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/);
        if (!m || (m[4] !== undefined && Number(m[4]) < 0.05)) return null;
        const [r, g, b] = [m[1], m[2], m[3]].map((v) => Number(v) / 255) as [number, number, number];
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const l = (max + min) / 2;
        const d = max - min;
        if (d === 0) return { h: 0, s: 0, l };
        const s = d / (1 - Math.abs(2 * l - 1));
        const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
        return { h: (h * 60 + 360) % 360, s, l };
      };
      for (const el of document.querySelectorAll<HTMLElement>("body *")) {
        const style = getComputedStyle(el);
        // Elements with no text of their own (a video's <source>) report no font at all.
        if (style.fontFamily) families.add(style.fontFamily.split(",")[0]!.replace(/["']/g, "").trim());
        for (const prop of ["color", "backgroundColor", "borderTopColor"] as const) {
          const hsl = toHsl(style[prop]);
          // Violet and lavender hues with real saturation (the ink #16131D is near-black, so it is let through).
          if (hsl && hsl.h >= 235 && hsl.h <= 300 && hsl.s > 0.3 && hsl.l > 0.12) purple.push(`${el.tagName.toLowerCase()}.${el.className}`.slice(0, 80) + ` ${prop} ${style[prop]}`);
        }
      }
      const looping = document
        .getAnimations()
        .filter((a) => a.effect?.getTiming().iterations === Infinity)
        .map((a) => ((a.effect as KeyframeEffect).target as Element | null)?.className ?? "")
        // The live dots, and the flying butterflies the owner asked to keep (27 November 2026).
        .filter((cls) => !/fx-live|bca-globe__live|fx-flyer|fx-wing-img/.test(String(cls)));
      return { families: [...families], purple: purple.slice(0, 10), looping };
    });
    expect(report.families.filter((f) => !/Playfair|Jakarta|Georgia|ui-sans-serif|system-ui/.test(f)), "only two typefaces").toEqual([]);
    expect(report.families.some((f) => /Playfair/.test(f))).toBe(true);
    expect(report.families.some((f) => /Jakarta/.test(f))).toBe(true);
    expect(report.purple, "no purple or lavender left").toEqual([]);
    expect(report.looping, "nothing loops except the live dots and the butterflies").toEqual([]);
    // No sparkles or handwritten notes; the three flying butterflies are back (hero, the loop, the community).
    await expect(page.locator(".fx-twinkle, .fx-note")).toHaveCount(0);
    await expect(page.locator(".fx-flyer")).toHaveCount(3);
  });

  test("has the founder with a video, the partners under the FAQ, and the paths as the owner gave them (27 November 2026)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");
    const founder = page.locator("#founder");
    await expect(founder.getByRole("heading", { level: 2, name: "Anup Mittal" })).toBeVisible();
    for (const fact of ["4,100+", "24+", "2022"]) await expect(founder.getByText(fact, { exact: true })).toBeVisible();
    const video = founder.locator("video");
    await expect(video).toHaveAttribute("poster", "/videos/anup-mittal-who-we-are.jpg");
    const src = await video.locator("source").getAttribute("src");
    const response = await page.request.get(src!);
    expect(response.headers()["content-type"]).toContain("video/mp4");
    await expect(founder.getByRole("link", { name: /Meet the faculty/ })).toHaveAttribute("href", "/about-us/#team");
    // "Choose your path": one button each.
    for (const [label, href] of [["Compare the levels", "#programmes"], ["See master classes", "/enquire/"], ["Send an enquiry", "/contact-us/?intent=corporate#enquire"]] as const) {
      await expect(page.getByRole("link", { name: label, exact: true })).toHaveAttribute("href", href);
    }
    // The partners, under the FAQ.
    const partners = page.locator("#partners");
    await expect(partners.getByRole("heading", { name: "Organisations our founder has worked with" })).toBeVisible();
    for (const name of ["Axis Bank", "upGrad", "Vi (Vodafone Idea)", "Amazon"]) await expect(partners.getByRole("img", { name })).toBeVisible();
    // The hero's two buttons.
    const hero = page.locator("main section").first();
    await expect(hero.getByRole("link", { name: "Get a programme guide" })).toHaveAttribute("href", "#programme-guide");
  });

  test("the About page shows the ICF Foundation certificate whole", async ({ page }) => {
    await page.goto("/about-us/");
    const section = page.locator("#icf-foundation");
    await expect(section.getByRole("heading", { name: "Recognised by the ICF Foundation" })).toBeVisible();
    const img = section.getByRole("img", { name: /ICF Foundation Certificate of Participation/ });
    await expect(img).toBeVisible();
    // Shown at its own shape (about 1.54 to 1), never cropped to a frame.
    const box = (await img.boundingBox())!;
    expect(box.width / box.height).toBeGreaterThan(1.45);
  });

  test("the programmes and fees table comes from the programme records", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");
    await page.locator("main section").first().getByRole("link", { name: "Find your ICF level" }).click();
    await expect(page).toHaveURL(/#programmes$/);
    const table = page.locator("#programmes table");
    for (const credential of ["ACC", "PCC", "MCC"]) await expect(table.getByRole("columnheader", { name: new RegExp(credential) })).toBeVisible();
    await expect(table.getByRole("row", { name: /Coach education/ })).toContainText("77 hrs");
    // No fee is published yet, so the table says so plainly.
    await expect(table.getByRole("row", { name: /Fee/ })).toContainText("Ask us for the current fee");
    await expect(table.getByRole("row", { name: /Format/ })).toContainText("100% online · English");
    await expect(table.getByRole("row", { name: /Tentative duration/ })).toContainText("42 to 46 weeks");
    await expect(page.locator("#programmes")).not.toContainText("instalments");
    // Every level has its brochure link under the button (the guide form until a PDF is uploaded).
    await expect(table.getByRole("link", { name: /brochure/i })).toHaveCount(3);
    await table.getByRole("link", { name: "Enroll: Level 2: PCC Coach Programme" }).click();
    await expect(page).toHaveURL(/\/level-2-pcc-coach-program\/#enquire$/);
  });

  test("the hero photographs slide, and visitors can pause or pick one", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");
    const show = page.getByRole("region", { name: "Photographs from our programmes" });
    const slides = show.locator('[aria-roledescription="slide"]');
    await expect(slides).toHaveCount(3);
    await expect(slides.first()).not.toHaveAttribute("aria-hidden", "true");
    // These tests run with reduced motion, so the slideshow waits for the visitor to press play.
    const toggle = show.getByRole("button", { name: "Play the slideshow" });
    await expect(toggle).toBeVisible();
    await show.getByRole("button", { name: "Show photograph 2 of 3" }).click();
    await expect(show.getByRole("button", { name: "Show photograph 2 of 3" })).toHaveAttribute("aria-current", "true");
    await expect(slides.nth(1)).not.toHaveAttribute("aria-hidden", "true");
    await expect(slides.first()).toHaveAttribute("aria-hidden", "true");
    await toggle.click();
    await expect(show.getByRole("button", { name: "Pause the slideshow" })).toBeVisible();
    // The world map in the corner is decoration, kept out of the accessibility tree.
    await expect(page.locator(".bca-worldmap")).toHaveAttribute("aria-hidden", "true");
  });

  test("desktop has the world map; phones and tablets keep the turning globe badge", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.locator(".bca-worldmap")).toBeHidden();
    await expect(page.locator(".bca-globe")).toBeVisible();
    await expect(page.locator(".bca-globe")).toContainText("join from anywhere");
    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(page.locator(".bca-worldmap")).toBeVisible();
    await expect(page.locator(".bca-globe")).toBeHidden();
    await expect(page.locator(".bca-live-pill")).toBeVisible();
  });

  test("the three badges under the hero photograph are the same size, still, in one row", async ({ page }) => {
    for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      await page.goto("/");
      const row = page.locator("section").first().locator("[data-badges]");
      const badges = row.locator(":scope > .fx-pop > span");
      await expect(badges).toHaveCount(3);
      // Nothing in the row bobs (the owner asked for them static, 27 November 2026).
      await expect(row.locator(".fx-bob")).toHaveCount(0);
      const boxes = await badges.evaluateAll((els) => els.map((el) => el.getBoundingClientRect()).map((r) => ({ left: r.left, right: r.right, top: Math.round(r.top), width: Math.round(r.width) })));
      expect(new Set(boxes.map((b) => b.width)).size, `${viewport.width}: same size`).toBe(1);
      expect(new Set(boxes.map((b) => b.top)).size, `${viewport.width}: one row`).toBe(1);
      for (let i = 1; i < boxes.length; i++) expect(boxes[i]!.left, `${viewport.width}: badge ${i + 1} does not overlap`).toBeGreaterThanOrEqual(boxes[i - 1]!.right);
    }
  });

  test("student stories move along as a carousel with arrows and a pause button", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");
    const stories = page.getByRole("region", { name: "Student stories" });
    await stories.scrollIntoViewIfNeeded();
    const track = stories.getByRole("list", { name: "Student stories" });
    // Each story once for assistive technology (the looping copy is hidden from it).
    expect(await track.getByRole("listitem").count()).toBeGreaterThan(2);
    // With reduced motion (as in these tests) the stories wait for the visitor to press play.
    await stories.getByRole("button", { name: "Play the stories" }).click();
    await expect(stories.getByRole("button", { name: "Pause the stories" })).toBeVisible();
    await stories.getByRole("button", { name: "Pause the stories" }).click();
    // An arrow moves the row along by one card.
    const shift = () => track.evaluate((el) => -new DOMMatrixReadOnly(getComputedStyle(el).transform).m41);
    const before = await shift();
    await stories.getByRole("button", { name: "Next story" }).click();
    await expect.poll(async () => (await shift()) - before).toBeGreaterThan(100);
    // A sideways trackpad swipe moves the row too, and the stories can still be pinch-zoomed on touch screens.
    const view = await page.locator(".bca-story-viewport").boundingBox();
    await page.mouse.move(view!.x + view!.width / 2, view!.y + view!.height / 2);
    const beforeSwipe = await shift();
    await page.mouse.wheel(120, 0);
    await expect.poll(async () => Math.abs((await shift()) - beforeSwipe)).toBeGreaterThan(60);
    expect(await track.evaluate((el) => getComputedStyle(el).touchAction)).toBe("pan-y pinch-zoom");
  });

  test("on phones the fees table becomes one card per level", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.locator("#programmes table")).toBeHidden();
    await expect(page.locator("#programmes").getByRole("heading", { name: /PCC/ })).toBeVisible();
  });
});

test.describe("learning journeys", () => {

  test("the PCC and MCC pages show their journeys and where the hours go", async ({ page }) => {
    await page.goto("/level-2-pcc-coach-program/");
    const pcc = page.locator("#journey");
    await expect(pcc.getByRole("heading", { name: "From practising to proficient" })).toBeVisible();
    for (const phase of ["Deepen", "Practise", "Certify"]) await expect(pcc.getByRole("heading", { name: phase, exact: true })).toBeVisible();
    await expect(pcc.getByText("650 hrs")).toBeVisible();

    await page.goto("/level-3-mcc-program/");
    const mcc = page.locator("#journey");
    await expect(mcc.getByRole("heading", { name: "From proficient to masterful" })).toBeVisible();
    for (const phase of ["Refine", "Embody", "Certify"]) await expect(mcc.getByRole("heading", { name: phase, exact: true })).toBeVisible();
    await expect(mcc.getByText("Mentor coaching 10h")).toBeVisible();
    await expect(mcc.getByText("2,605 hrs")).toBeVisible();
  });
});

test.describe("content rules", () => {
  test("every call to action leads somewhere real", async ({ page, request }) => {
    const seen = new Set<string>();
    for (const path of ["/", "/coaching-certifications/", "/services/corporate-programs/", "/about-us/", "/contact-us/"]) {
      await page.goto(path);
      const hrefs = await page.locator("a[href]").evaluateAll((links) => links.map((a) => a.getAttribute("href") ?? ""));
      for (const href of hrefs) {
        expect(href, `empty or placeholder link on ${path}`).not.toMatch(/^(#|javascript:|)$/);
        if (href.startsWith("/") && !seen.has(href)) {
          seen.add(href);
          const status = (await request.get(href.split("#")[0]!)).status();
          expect(status, `${href} linked from ${path}`).toBeLessThan(400);
        }
      }
    }
    expect(seen.size).toBeGreaterThan(12);
  });

  test("contact details use the verified phone, WhatsApp and email", async ({ page }) => {
    await page.goto("/contact-us/");
    await expect(page.locator('main a[href="tel:+919610093337"]')).toBeVisible();
    await expect(page.locator('main a[href^="https://wa.me/919610093337"]')).toBeVisible();
    await expect(page.locator('main a[href="mailto:contact@butterflycoachingacademy.com"]')).toBeVisible();
    await expect(page.getByText("Rangoli Gardens").first()).toBeVisible();
  });

  test("blog search, categories and tags work", async ({ page }) => {
    await page.goto("/blog/");
    await page.getByLabel("Search articles").fill("habits");
    await page.getByRole("button", { name: "Search" }).click();
    await expect(page).toHaveURL(/\/blog\/\?q=habits$/);
    await expect(page.getByRole("link", { name: /The Power of Habits/ })).toBeVisible();
    await expect(page.getByRole("status")).toContainText("habits");

    await page.goto("/blog/?q=zzzzqqq");
    await expect(page.getByRole("status")).toContainText("No articles match");

    await page.goto("/blog/tag/mindset/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/mindset/i);
    expect((await page.goto("/blog/category/general/"))?.status()).toBe(200);
    expect((await page.goto("/blog/tag/does-not-exist/"))?.status()).toBe(404);
  });

  test("nothing loads from analytics until it is configured and accepted", async ({ page }) => {
    const external: string[] = [];
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (!["localhost", "127.0.0.1"].includes(url.hostname)) external.push(url.hostname);
    });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    expect(external, "third-party requests on first load").toEqual([]);
    await expect(page.getByRole("region", { name: "Cookie consent" })).toHaveCount(0);
  });
});
