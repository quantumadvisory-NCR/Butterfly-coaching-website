import { mkdirSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { PUBLIC_PAGES, VIEWPORTS, clippedText, expectNoHorizontalOverflow, loadWholePage } from "./helpers";

/**
 * Responsive release gate. Every public page is loaded at every required
 * viewport and checked for the defects listed in the brief; a full-page
 * screenshot is saved for visual review in test-results/screens.
 */
const SCREENS = "test-results/screens";

for (const viewport of VIEWPORTS) {
  test.describe(`${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });
    const mobile = viewport.width < 768;
    const desktopNav = viewport.width >= 1024;

    for (const target of PUBLIC_PAGES) {
      test(`${target.name} lays out cleanly`, async ({ page }) => {
        const response = await page.goto(target.path);
        expect(response?.status()).toBe(target.name === "not-found" ? 404 : 200);
        await loadWholePage(page);

        // 1. No sideways scrolling and nothing poking out of the viewport.
        await expectNoHorizontalOverflow(page);

        // 2. One visible h1; headings and buttons are never clipped.
        const h1 = page.locator("main h1");
        await expect(h1).toHaveCount(1);
        await expect(h1).toBeVisible();
        expect(await clippedText(page, "main h1, main h2, main h3, .btn, header nav a"), "clipped text").toEqual([]);

        // 3. Header: compact, single line; the right navigation for the screen size.
        const header = page.locator("header").first();
        const headerBox = (await header.boundingBox())!;
        expect(headerBox.height).toBeLessThanOrEqual(80);
        if (desktopNav) {
          await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
          await expect(page.getByRole("button", { name: "Open menu" })).toBeHidden();
        } else {
          await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
        }

        // 4. Buttons never wrap onto a second line.
        const wrapped = await page.evaluate(() =>
          Array.from(document.querySelectorAll<HTMLElement>(".btn"))
            .filter((el) => el.getBoundingClientRect().height > 0 && el.getBoundingClientRect().height > 64)
            .map((el) => `"${el.textContent?.trim()}" is ${Math.round(el.getBoundingClientRect().height)}px tall`),
        );
        expect(wrapped, "buttons that wrap").toEqual([]);

        // 5. Touch targets are comfortably tappable on phones.
        if (mobile) {
          const small = await page.evaluate(() =>
            Array.from(document.querySelectorAll<HTMLElement>(".btn, header a, header button, footer a, main button, .text-link, nav[aria-label=Breadcrumb] a"))
              .filter((el) => {
                const rect = el.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0 && (rect.height < 40 || rect.width < 40);
              })
              .map((el) => `${el.tagName.toLowerCase()} "${(el.textContent ?? el.getAttribute("aria-label") ?? "").trim().slice(0, 30)}" ${Math.round(el.getBoundingClientRect().width)}x${Math.round(el.getBoundingClientRect().height)}`),
          );
          expect(small, "touch targets under 40px").toEqual([]);
        }

        // 6. No broken images.
        const broken = await page.evaluate(() =>
          Array.from(document.images)
            .filter((img) => img.complete && img.naturalWidth === 0)
            .map((img) => img.currentSrc || img.src),
        );
        expect(broken, "broken images").toEqual([]);

        // 7. Text and images never overlap inside the hero.
        const overlap = await page.evaluate(() => {
          const heading = document.querySelector("main h1");
          const image = heading?.closest("section")?.querySelector("img");
          if (!heading || !image) return false;
          const a = heading.getBoundingClientRect();
          const b = image.getBoundingClientRect();
          return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
        });
        expect(overlap, "hero heading overlaps the hero image").toBe(false);

        // 8. The floating support controls (Need help and WhatsApp) never cover footer links: on desktop the footer
        //    leaves room for them; on phones and tablets they step aside (inert, hidden) at the foot of the page.
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        await page.waitForTimeout(400);
        if (viewport.width < 1024 && (await page.locator("[data-support-dock]").count()) > 0) {
          expect(await page.locator("[data-support-dock]").getAttribute("inert"), "floating controls step aside at the foot of the page").not.toBeNull();
        }
        const covered = await page.evaluate(() => {
          const fab = document.querySelector("[data-support-dock]");
          if (!fab || fab.hasAttribute("inert")) return [];
          const f = fab.getBoundingClientRect();
          return Array.from(document.querySelectorAll<HTMLElement>("footer a, footer button, footer input"))
            .filter((el) => {
              const r = el.getBoundingClientRect();
              return r.width > 0 && r.left < f.right && r.right > f.left && r.top < f.bottom && r.bottom > f.top;
            })
            .map((el) => (el.textContent ?? "").trim().slice(0, 30));
        });
        expect(covered, "footer controls hidden behind the floating support controls").toEqual([]);
        await page.evaluate(() => window.scrollTo(0, 0));

        mkdirSync(`${SCREENS}/${viewport.name}`, { recursive: true });
        // Very tall captures occasionally fail inside the browser; one retry is enough.
        const shot = { path: `${SCREENS}/${viewport.name}/${target.name}.jpg`, fullPage: true, type: "jpeg", quality: 62 } as const;
        await page.screenshot(shot).catch(() => page.screenshot(shot));
      });
    }

    test("homepage hero shows the heading and both buttons on the first screen", async ({ page }) => {
      await page.goto("/");
      const h1 = page.getByRole("heading", { level: 1, name: "Learning that stays" });
      await expect(h1).toBeVisible();
      await expect(page.getByText("ICF-accredited coach training built on practice, spaced review and founder mentoring.")).toBeVisible();
      const hero = page.locator("main section").first();
      for (const label of ["Book a discovery call", "Explore programmes"]) {
        const button = hero.getByRole("link", { name: label });
        await expect(button).toBeVisible();
        const box = (await button.boundingBox())!;
        expect(box.y + box.height, `"${label}" is below the first screen`).toBeLessThanOrEqual(viewport.height);
      }
      // The two-sentence heading wraps naturally: at most three lines from tablet width up (as in the
      // design reference), four on phones, and the buttons above still sit on the first screen.
      const lines = await h1.evaluate((el) => Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight)));
      expect(lines).toBeLessThanOrEqual(viewport.width >= 768 ? 3 : 4);
    });
  });
}
