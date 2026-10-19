import { type Page, expect } from "@playwright/test";
import postgres from "postgres";

/** The eleven viewports the brief requires, smallest first. */
export const VIEWPORTS = [
  { name: "320x700", width: 320, height: 700 },
  { name: "360x800", width: 360, height: 800 },
  { name: "375x812", width: 375, height: 812 },
  { name: "390x844", width: 390, height: 844 },
  { name: "430x932", width: 430, height: 932 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1024x768", width: 1024, height: 768 },
  { name: "1280x800", width: 1280, height: 800 },
  { name: "1366x768", width: 1366, height: 768 },
  { name: "1440x900", width: 1440, height: 900 },
  { name: "1920x1080", width: 1920, height: 1080 },
] as const;

export const PUBLIC_PAGES = [
  { name: "home", path: "/" },
  { name: "programmes", path: "/coaching-certifications/" },
  { name: "level-1-acc", path: "/level-1-acc-coach-program/" },
  { name: "level-2-pcc", path: "/level-2-pcc-coach-program/" },
  { name: "level-3-mcc", path: "/level-3-mcc-program/" },
  { name: "mentoring", path: "/services/mentor-coaching-supervision/" },
  { name: "coaching", path: "/services/coaching-services/" },
  { name: "corporate", path: "/services/corporate-programs/" },
  { name: "about", path: "/about-us/" },
  { name: "stories", path: "/testimonial/" },
  { name: "blog", path: "/blog/" },
  { name: "article", path: "/the-power-of-habits-cultivating-your-path-to-success/" },
  { name: "contact", path: "/contact-us/" },
  { name: "gallery", path: "/image-gallery/" },
  { name: "privacy", path: "/privacy-policy/" },
  { name: "terms", path: "/terms-of-use/" },
  { name: "thank-you", path: "/thank-you/" },
  { name: "not-found", path: "/this-page-does-not-exist/" },
] as const;

export function database() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Run the tests with `npm run test:e2e`.");
  return postgres(url, { max: 2, prepare: false, onnotice: () => {} });
}

/** Elements that stick out past the right or left edge of the viewport. */
export async function overflowingElements(page: Page) {
  return page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const offenders: string[] = [];
    for (const el of Array.from(document.querySelectorAll<HTMLElement>("body *"))) {
      const style = getComputedStyle(el);
      if (style.position === "fixed" || style.display === "none" || style.visibility === "hidden") continue;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      // Ignore content clipped on purpose by an ancestor (image crops, the off-screen honeypot, scrollers).
      let clipped = false;
      for (let parent = el.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
        const overflow = getComputedStyle(parent).overflowX;
        if (overflow === "hidden" || overflow === "clip" || overflow === "auto" || overflow === "scroll") {
          clipped = true;
          break;
        }
      }
      if (clipped) continue;
      if (rect.right > width + 1 || rect.left < -1) {
        offenders.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)} [${Math.round(rect.left)}..${Math.round(rect.right)} of ${width}]`);
      }
    }
    return offenders.slice(0, 8);
  });
}

/** The page must never scroll sideways. */
export async function expectNoHorizontalOverflow(page: Page) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  const offenders = await overflowingElements(page);
  expect(offenders, `elements overflow the viewport: ${offenders.join(" | ")}`).toEqual([]);
  expect(metrics.scrollWidth, "page scrolls horizontally").toBeLessThanOrEqual(metrics.clientWidth + 1);
}

/** Scrolls through the page so lazy images load, then returns to the top. */
export async function loadWholePage(page: Page) {
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 70));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState("networkidle").catch(() => {});
}

/** Text that is cut off inside its own box (clipped headings, squeezed buttons). */
export async function clippedText(page: Page, selector: string) {
  return page.evaluate((sel) => {
    const out: string[] = [];
    for (const el of Array.from(document.querySelectorAll<HTMLElement>(sel))) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      // Visually hidden (screen-reader-only) text is clipped on purpose.
      if (getComputedStyle(el).clipPath !== "none") continue;
      if (el.scrollWidth > el.clientWidth + 2) out.push(`${el.tagName.toLowerCase()} "${(el.textContent ?? "").trim().slice(0, 50)}" (${el.scrollWidth}px in ${el.clientWidth}px)`);
    }
    return out.slice(0, 8);
  }, selector);
}
