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
    ] as const) {
      const response = await request.get(from, { maxRedirects: 0 });
      expect([301, 302, 307, 308], `${from} status ${response.status()}`).toContain(response.status());
      expect(response.headers().location, from).toContain(to);
    }
    // Addresses without a trailing slash are normalised, and old blog posts still resolve.
    expect((await request.get("/about-us", { maxRedirects: 0 })).status()).toBe(308);
    expect((await request.get("/unleash-the-power-of-the-butterfly-effect-in-coaching/")).status()).toBe(200);
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

test.describe("learning journeys", () => {
  test("the homepage loop works with clicks, Next step and the keyboard", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");
    const section = page.locator("section", { has: page.getByRole("heading", { name: "How you'll grow, one loop at a time" }) });
    await section.scrollIntoViewIfNeeded();
    const panel = section.locator("[aria-live=polite]");
    await expect(panel.getByText("Step 1 of 4")).toBeVisible();

    await section.getByRole("button", { name: "Step 2, Practise" }).click();
    await expect(panel.getByRole("heading", { name: "Practise" })).toBeVisible();
    await expect(panel.getByText("Coach a peer in your first week.")).toBeVisible();

    await section.getByRole("button", { name: "Next step" }).click();
    await expect(panel.getByRole("heading", { name: "Receive feedback" })).toBeVisible();

    await section.getByRole("button", { name: "Step 4, Reflect and revisit" }).press("Enter");
    await expect(panel.getByText("Round 1 complete. Each loop goes deeper.")).toBeVisible();
    await section.getByRole("button", { name: "Next step" }).click();
    await expect(panel.getByText("Step 1 of 4")).toBeVisible();
    await expect(section.getByRole("link", { name: "Book a discovery call" })).toBeVisible();
  });

  test("on phones the loop is a vertical timeline with every step readable", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const section = page.locator("section", { has: page.getByRole("heading", { name: "How you'll grow, one loop at a time" }) });
    for (const title of ["Learn", "Practise", "Receive feedback", "Reflect and revisit"]) {
      await expect(section.getByRole("heading", { name: title, exact: true })).toBeVisible();
    }
    await expect(section.getByText("Build capability").filter({ visible: true })).toBeVisible();
    await expect(section.getByRole("button", { name: "Step 1, Learn" })).toBeHidden();
  });

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
