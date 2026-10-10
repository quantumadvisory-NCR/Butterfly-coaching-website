import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { loadWholePage } from "./helpers";

const PAGES = ["/", "/coaching-certifications/", "/level-1-acc-coach-program/", "/services/corporate-programs/", "/about-us/", "/testimonial/", "/blog/", "/contact-us/", "/admin/login/"];

for (const viewport of [
  { name: "phone", width: 390, height: 844 },
  { name: "desktop", width: 1366, height: 768 },
]) {
  test.describe(`accessibility on ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const path of PAGES) {
      test(`${path} has no WCAG A or AA violations`, async ({ page }) => {
        await page.goto(path);
        await loadWholePage(page);
        const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
        const summary = results.violations.map((v) => `${v.id} (${v.impact}): ${v.help} -> ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" ; ")}`);
        expect(summary, summary.join("\n")).toEqual([]);
      });
    }
  });
}

test("keyboard users can see where focus is", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await page.keyboard.press("Tab"); // skip link
  await page.keyboard.press("Tab"); // logo
  const outline = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    const style = getComputedStyle(el);
    return { width: parseFloat(style.outlineWidth), style: style.outlineStyle };
  });
  expect(outline.style).not.toBe("none");
  expect(outline.width).toBeGreaterThanOrEqual(2);
});

test("pages still read correctly at 200% zoom", async ({ page }) => {
  // A 1280px window at 200% zoom has the layout width of a 640px viewport.
  await page.setViewportSize({ width: 640, height: 400 });
  await page.goto("/level-1-acc-coach-program/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("with motion on, sections are fully visible once they are on screen", async ({ browser }) => {
  // Every other test runs with reduced motion, so this is the one place the scroll fade-in is exercised.
  const context = await browser.newContext({ reducedMotion: "no-preference", viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  for (const path of ["/", "/level-1-acc-coach-program/"]) {
    await page.goto(path);
    const result = await page.evaluate(async () => {
      if (!CSS.supports("animation-timeline: view()")) return { animated: 0, faint: [] as string[] };
      const sections = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
      const faint: string[] = [];
      // The fade ends 72px into the screen; anything further in than this strip must be fully opaque.
      const strip = 80;
      for (let y = 0; y < document.documentElement.scrollHeight; y += Math.round(innerHeight * 0.6)) {
        window.scrollTo({ top: y, behavior: "instant" });
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        for (const el of sections) {
          const rect = el.getBoundingClientRect();
          const opacity = Number(getComputedStyle(el).opacity);
          if (rect.top < innerHeight - strip && rect.bottom > 0 && opacity < 0.99) {
            faint.push(`${el.tagName.toLowerCase()} ${Math.round(rect.top)}px from the top has opacity ${opacity}`);
          }
        }
      }
      return { animated: sections.filter((el) => getComputedStyle(el).animationName !== "none").length, faint };
    });
    expect(result.faint, `${path}: sections still faint well inside the screen`).toEqual([]);
    // The animation really is running here, so the check above means something.
    expect(result.animated, `${path}: sections with the fade-in`).toBeGreaterThan(0);
  }
  await context.close();
});

test("motion is switched off for people who ask for less", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  const animated = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>(".reveal, .hero-enter > *")).filter((el) => {
      const style = getComputedStyle(el);
      return style.animationName !== "none" && parseFloat(style.animationDuration) > 0.05;
    }).length,
  );
  expect(animated).toBe(0);
  // And content is fully visible without scrolling into it.
  const hidden = await page.evaluate(() => Array.from(document.querySelectorAll<HTMLElement>(".reveal")).filter((el) => getComputedStyle(el).opacity !== "1").length);
  expect(hidden).toBe(0);
  await context.close();
});
