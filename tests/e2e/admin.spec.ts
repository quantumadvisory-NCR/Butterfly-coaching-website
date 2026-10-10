import { mkdirSync, readFileSync } from "node:fs";
import { type Locator, type Page, expect, test } from "@playwright/test";
import sharp from "sharp";
import { database, expectNoHorizontalOverflow } from "./helpers";

const sql = database();
test.afterAll(() => sql.end());
test.beforeEach(() => sql`delete from rate_limits`);
test.describe.configure({ mode: "serial" });

// Contexts made with browser.newContext() inherit the project's signed-in state, so anonymous ones must clear it.
const SIGNED_OUT = { storageState: { cookies: [], origins: [] } };
const credentials = () => JSON.parse(readFileSync(".local/e2e-credentials.json", "utf8")) as { email: string; password: string };
const run = Date.now().toString(36);
const SCREENS = "test-results/screens/admin";

/**
 * Submits the sign-in form and waits for the server to answer. Without the wait, the next
 * step could type into the form just before React resets it at the end of the action.
 */
async function submitSignIn(page: Page) {
  await Promise.all([
    page.waitForResponse((response) => response.request().method() === "POST" && response.url().includes("/admin/login")),
    page.getByRole("button", { name: "Sign in" }).click(),
  ]);
  await expect(page.getByRole("button", { name: "Sign in" })).toBeEnabled().catch(() => {});
}

/**
 * Clicks a save button and waits for the server action to answer. A status message can already be
 * on screen from an earlier save, so waiting for the text alone could let the test move on too early.
 */
async function save(page: Page, button: Locator) {
  await Promise.all([
    page.waitForResponse((response) => response.request().method() === "POST" && "next-action" in response.request().headers()),
    button.click(),
  ]);
}

async function publicStatus(page: Page, path: string) {
  const response = await page.request.get(path, { maxRedirects: 0 });
  return response.status();
}

test.describe("sign-in", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("wrong passwords are refused with a neutral message; the right one signs in", async ({ page }) => {
    const { email, password } = credentials();
    await page.goto("/admin/pages/");
    await expect(page).toHaveURL(/\/admin\/login\/$/);

    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password").fill("definitely-not-the-password-1");
    await submitSignIn(page);
    await expect(page.locator("form").getByRole("alert")).toContainText("do not match an active account");

    // Same message for an account that does not exist, so the form never reveals who has one.
    await page.getByLabel("Email", { exact: true }).fill("nobody@e2e.test");
    await page.getByLabel("Password").fill("definitely-not-the-password-1");
    await submitSignIn(page);
    await expect(page.locator("form").getByRole("alert")).toContainText("do not match an active account");

    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password").fill(password);
    await submitSignIn(page);
    await expect(page).toHaveURL(/\/admin\/$/);

    // The session cookie cannot be read by scripts.
    const cookie = (await page.context().cookies()).find((c) => c.name === "bca_session");
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe("Lax");

    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/admin\/login\/$/);
    await page.goto("/admin/");
    await expect(page).toHaveURL(/\/admin\/login\/$/);
  });

  test("repeated failed sign-ins are rate limited", async ({ page }) => {
    await page.goto("/admin/login/");
    for (let i = 0; i < 9; i += 1) {
      await page.getByLabel("Email", { exact: true }).fill("locked@e2e.test");
      await page.getByLabel("Password").fill(`wrong-password-${i}`);
      await submitSignIn(page);
      await expect(page.locator("form").getByRole("alert")).toBeVisible();
    }
    await expect(page.locator("form").getByRole("alert")).toContainText("Too many sign-in attempts");
  });
});

test.describe("page builder", () => {
  const path = `/e2e-${run}/`;
  const title = `E2E page ${run}`;
  let editUrl = "";

  test("a draft is private, a published page is public, and edits stay private until republished", async ({ page, browser }) => {
    // ---- create a draft with two sections ----
    await page.goto("/admin/pages/new/");
    await page.locator("#page-title").fill(title);
    await page.locator("#page-path").fill(path);
    await page.getByRole("button", { name: "Add section" }).first().click();
    await page.getByRole("dialog").getByRole("button", { name: /^Call to action/ }).click();
    await page.getByLabel("Heading").fill("First draft heading");
    await page.getByRole("button", { name: "Add section" }).first().click();
    await page.getByRole("dialog").getByRole("button", { name: /^Rich text/ }).click();
    await page.getByRole("button", { name: "Save draft" }).click();
    // Rich text is required, so the save is refused and the section is flagged.
    await expect(page.getByRole("status")).toContainText("Please fix the highlighted fields");
    await expect(page.getByText("Needs attention").first()).toBeVisible();
    await page.locator(".tiptap").click();
    await page.keyboard.type("Body text for the test page.");
    await page.getByRole("button", { name: "Save draft" }).click();
    // A new page moves to its own address, and the confirmation is still shown there.
    await expect(page).toHaveURL(/\/admin\/pages\/[0-9a-f-]{36}\/\?saved=1$/);
    await expect(page.getByRole("status")).toContainText("Draft saved");
    editUrl = page.url().split("?")[0]!;
    const id = editUrl.split("/").filter(Boolean).pop()!;

    // ---- drafts are not public ----
    expect(await publicStatus(page, path)).toBe(404);
    const anonymous = await browser.newContext(SIGNED_OUT);
    const visitor = await anonymous.newPage();
    await visitor.goto(`/preview/page/${id}/`);
    await expect(visitor).toHaveURL(/\/admin\/login\/$/);

    // ---- staff can preview the draft at phone and desktop sizes ----
    await page.goto(`/admin/preview/${id}/`);
    const frame = page.frameLocator("iframe");
    await expect(frame.getByRole("heading", { name: "First draft heading" })).toBeVisible();
    const phoneWidth = await page.locator("iframe").evaluate((el) => (el as HTMLIFrameElement).contentWindow!.innerWidth);
    expect(phoneWidth).toBe(390);
    await page.getByRole("button", { name: "Desktop" }).click();
    await expect(page.frameLocator("iframe").getByRole("heading", { name: "First draft heading" })).toBeVisible();
    expect(await page.locator("iframe").evaluate((el) => (el as HTMLIFrameElement).contentWindow!.innerWidth)).toBeGreaterThan(900);

    // ---- publish ----
    await page.goto(editUrl);
    await page.getByRole("button", { name: "Publish", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Published");
    await visitor.goto(path);
    await expect(visitor.getByRole("heading", { name: "First draft heading" })).toBeVisible();
    await expect(visitor.getByText("Body text for the test page.")).toBeVisible();
    await expect(visitor).toHaveTitle(new RegExp(title));

    // ---- edit and save as draft: the live page does not change ----
    await page.getByRole("button", { name: /Call to action/ }).click();
    await page.getByLabel("Heading").fill("Second heading, not yet live");
    await page.getByRole("button", { name: "Save draft" }).click();
    await expect(page.getByRole("status")).toContainText("Draft saved");
    await expect(page.getByText("Unpublished changes").first()).toBeVisible();
    await visitor.goto(path);
    await expect(visitor.getByRole("heading", { name: "First draft heading" })).toBeVisible();
    await expect(visitor.getByText("Second heading, not yet live")).toHaveCount(0);

    // ---- publish the changes ----
    await page.getByRole("button", { name: "Publish changes" }).click();
    await expect(page.getByRole("status")).toContainText("Published");
    await visitor.goto(path);
    await expect(visitor.getByRole("heading", { name: "Second heading, not yet live" })).toBeVisible();

    // ---- restore the first published version into the draft, then unpublish ----
    await page.reload();
    await page.getByRole("button", { name: "Restore" }).last().click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Restore into draft" }).click();
    await expect(page.getByText("First draft heading").first()).toBeVisible();

    await page.getByRole("button", { name: "Unpublish" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Unpublish" }).click();
    await expect(page.getByText("This page is not visible to visitors.")).toBeVisible();
    expect(await publicStatus(page, path)).toBe(404);
    await anonymous.close();
  });

  test("addresses are validated and core pages cannot be deleted", async ({ page }) => {
    await page.goto("/admin/pages/new/");
    await page.locator("#page-title").fill("Clash");
    await page.locator("#page-path").fill("/about-us/");
    await page.getByRole("button", { name: "Save draft" }).click();
    await expect(page.getByText("This address is already used by a page.")).toBeVisible();
    await page.locator("#page-path").fill("/admin/secret/");
    await page.getByRole("button", { name: "Save draft" }).click();
    await expect(page.getByText("reserved by the website")).toBeVisible();

    // The homepage has no Delete button.
    await page.goto("/admin/pages/");
    await page.getByRole("link", { name: "Home", exact: true }).click();
    await expect(page.getByRole("button", { name: "Save draft" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Delete", exact: true })).toHaveCount(0);
  });
});

test.describe("content flows to the public site", () => {
  test("editing a programme updates its page and its cards", async ({ page }) => {
    const tagline = `Foundation tagline ${run}`;
    await page.goto("/admin/programmes/");
    await page.getByRole("link", { name: "Level 1: ACC Coach Programme", exact: true }).click();
    await page.getByLabel("Tagline").fill(tagline);
    await save(page, page.getByRole("button", { name: "Save changes" }));
    await expect(page.getByRole("status")).toContainText("Saved");

    await page.goto("/level-1-acc-coach-program/");
    await expect(page.getByText(tagline)).toBeVisible();
    await expect(page.locator('img[alt*="Level 1 accredited"]').first()).toBeVisible();

    // The ICF badge follows the accreditation status: mark a programme as not verified and its badge goes.
    const levelThreeBadge = page.locator('img[alt*="Level 3 accredited"]');
    const setLevelThree = async (status: string) => {
      await page.goto("/admin/programmes/");
      await page.getByRole("link", { name: "Level 3: MCC Programme", exact: true }).click();
      await page.getByLabel("ICF accreditation status").selectOption(status);
      await save(page, page.getByRole("button", { name: "Save changes" }));
      await expect(page.getByRole("status")).toContainText("Saved");
      await page.goto("/level-3-mcc-program/");
    };
    await page.goto("/level-3-mcc-program/");
    await expect(levelThreeBadge.first()).toBeVisible();
    await setLevelThree("unverified");
    await expect(levelThreeBadge).toHaveCount(0);
    await setLevelThree("accredited");
    await expect(levelThreeBadge.first()).toBeVisible();
  });

  test("testimonials only appear once approved, and extracts cannot be reworded", async ({ page }) => {
    const name = `Test Learner ${run}`;
    await page.goto("/admin/testimonials/new/");
    await page.getByLabel("Name").fill(name);
    await page.getByLabel("Testimonial, in the person's own words").fill("The practice labs changed how I listen to my team.");
    await page.getByLabel("Short extract").fill("The practice labs transformed my listening.");
    await page.getByRole("button", { name: "Create testimonial" }).click();
    await expect(page.getByText("The extract must be copied exactly from the testimonial")).toBeVisible();
    await page.getByLabel("Short extract").fill("The practice labs changed how I listen");
    await page.getByRole("button", { name: "Create testimonial" }).click();
    await expect(page).toHaveURL(/\/admin\/testimonials\/[0-9a-f-]{36}\/\?saved=1$/);

    // Pending: not public.
    await page.goto("/testimonial/");
    await expect(page.getByText(name)).toHaveCount(0);

    await page.goBack();
    await page.getByLabel("Approval").selectOption("approved");
    await save(page, page.getByRole("button", { name: "Save changes" }));
    await expect(page.getByRole("status")).toContainText("Saved");
    await page.goto("/testimonial/");
    await expect(page.getByText(name)).toBeVisible();

    // Clean up.
    await sql`delete from testimonials where name = ${name}`;
  });

  test("site settings change the header straight away", async ({ page }) => {
    const text = `Next cohort announcement ${run}`;
    await page.goto("/admin/settings/");
    await page.getByRole("tab", { name: "Header" }).click();
    await page.getByLabel("Show the announcement bar").check();
    await page.getByLabel("Announcement text").fill(text);
    await save(page, page.getByRole("tabpanel").getByRole("button", { name: "Save" }));
    await expect(page.getByRole("tabpanel").getByRole("status")).toContainText("Settings saved");
    await page.goto("/");
    await expect(page.getByText(text)).toBeVisible();

    await page.goto("/admin/settings/");
    await page.getByRole("tab", { name: "Header" }).click();
    await page.getByLabel("Show the announcement bar").uncheck();
    await save(page, page.getByRole("tabpanel").getByRole("button", { name: "Save" }));
    await expect(page.getByRole("tabpanel").getByRole("status")).toContainText("Settings saved");
    await page.goto("/");
    await expect(page.getByText(text)).toHaveCount(0);
  });

  test("theme colours are validated before they reach the page", async ({ page }) => {
    await page.goto("/admin/settings/");
    await page.getByRole("tab", { name: "Colours and typography" }).click();
    const panel = page.getByRole("tabpanel");
    await panel.getByLabel("Primary blue", { exact: true }).fill("red;}body{display:none");
    await save(page, panel.getByRole("button", { name: "Save" }));
    await expect(panel.getByText("Use a 6-digit hex colour")).toBeVisible();
    await expect(panel.getByText("Readability check")).toBeVisible();
    await page.goto("/");
    const primary = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--bca-primary").trim());
    expect(primary).toBe("#0068bf");
  });
});

test.describe("media library", () => {
  test("uploads are checked, optimised, editable and safely deletable", async ({ page }) => {
    const png = await sharp({ create: { width: 900, height: 600, channels: 3, background: "#0068bf" } }).png().toBuffer();
    const name = `e2e-upload-${run}.png`;
    await page.goto("/admin/media/");

    // A text file pretending to be an image is refused.
    await page.locator("#media-upload").setInputFiles({ name: "fake.png", mimeType: "image/png", buffer: Buffer.from("<script>alert(1)</script>") });
    await expect(page.getByText(/fake\.png: This file could not be read as an image/)).toBeVisible();

    await page.locator("#media-upload").setInputFiles({ name, mimeType: "image/png", buffer: png });
    await expect(page.getByText(`${name} uploaded.`)).toBeVisible();
    const [row] = await sql`select * from media where source = 'upload' order by created_at desc limit 1`;
    expect(row).toMatchObject({ kind: "image", width: 900, height: 600, mime_type: "image/png", storage: "local" });
    // The stored file is served, with a long cache lifetime and a locked content type.
    const served = await page.request.get(row!.url);
    expect(served.status()).toBe(200);
    expect(served.headers()["content-type"]).toBe("image/png");
    expect(served.headers()["x-content-type-options"]).toBe("nosniff");

    // New images are flagged until they have alt text.
    await page.getByRole("button", { name: "Missing alt text" }).click();
    await page.getByRole("button", { name: new RegExp(`e2e-upload-${run}`) }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Alt text").fill("A plain blue test image");
    await dialog.getByRole("button", { name: "Set the focal point by clicking the image" }).click({ position: { x: 20, y: 20 } });
    await dialog.getByRole("button", { name: "Save details" }).click();
    await expect(dialog.getByText("Saved.")).toBeVisible();
    const [saved] = await sql`select alt, focal_x from media where id = ${row!.id}`;
    expect(saved!.alt).toBe("A plain blue test image");
    expect(Number(saved!.focal_x)).toBeLessThan(0.3);

    await dialog.getByRole("button", { name: "Where is this used?" }).click();
    await expect(dialog.getByText("Not used anywhere yet.")).toBeVisible();
    await dialog.getByRole("button", { name: "Delete" }).click();
    await expect(dialog).toBeHidden();
    expect((await sql`select 1 from media where id = ${row!.id}`).length).toBe(0);
    expect((await page.request.get(row!.url)).status()).toBe(404);
  });

  test("an image used on the live site cannot be deleted", async ({ page }) => {
    await page.goto("/admin/media/");
    await page.getByLabel("Search media").fill("hero-coaching-conversation.jpg");
    await page.getByRole("button", { name: /A coach listens closely/ }).first().click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Delete" }).click();
    await expect(dialog.getByText("This item is used on the live site.")).toBeVisible();
    await expect(dialog.getByText(/Page: Home \(published version\)/)).toBeVisible();
    expect((await sql`select 1 from media where url = '/images/photography/hero-coaching-conversation.jpg'`).length).toBe(1);
  });
});

test.describe("roles", () => {
  test("an editor cannot reach settings, users or exports, even by typing the address", async ({ page, browser }) => {
    const email = `editor.${run}@e2e.test`;
    const password = `Editor-pass-${run}-77`;
    await page.goto("/admin/users/");
    await page.getByLabel("Name").fill("Edith Editor");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.locator("#new-role").selectOption("editor");
    await page.getByLabel("Temporary password").fill(password);
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Account created.")).toBeVisible();
    await expect(page.getByText("Edith Editor", { exact: true })).toBeVisible();

    const context = await browser.newContext(SIGNED_OUT);
    const editor = await context.newPage();
    await editor.goto("/admin/login/");
    await editor.getByLabel("Email", { exact: true }).fill(email);
    await editor.getByLabel("Password").fill(password);
    await editor.getByRole("button", { name: "Sign in" }).click();
    await expect(editor).toHaveURL(/\/admin\/$/);
    await expect(editor.getByRole("navigation", { name: "Admin" }).getByRole("link", { name: "Pages" })).toBeVisible();
    await expect(editor.getByRole("navigation", { name: "Admin" }).getByRole("link", { name: "Settings" })).toHaveCount(0);
    await expect(editor.getByRole("navigation", { name: "Admin" }).getByRole("link", { name: "Users" })).toHaveCount(0);

    for (const path of ["/admin/settings/", "/admin/users/", "/admin/audit/", "/admin/redirects/", "/admin/navigation/"]) {
      await editor.goto(path);
      await expect(editor, path).toHaveURL(/\/admin\/\?denied=1$/);
    }
    await expect(editor.getByText("does not have access to that area")).toBeVisible();
    expect((await editor.request.get("/admin/enquiries/export/")).status()).toBe(403);
    await context.close();

    // Owners can export, and the export is recorded in the audit log.
    const csv = await page.request.get("/admin/enquiries/export/");
    expect(csv.status()).toBe(200);
    expect(csv.headers()["content-type"]).toContain("text/csv");
    await page.goto("/admin/audit/");
    await expect(page.getByText(/Exported \d+ enquiries to CSV/).first()).toBeVisible();
    await expect(page.getByText(`Created editor account for ${email}`)).toBeVisible();
  });
});

test.describe("admin on a phone and on a desktop", () => {
  for (const viewport of [
    { name: "390x844", width: 390, height: 844 },
    { name: "768x1024", width: 768, height: 1024 },
    { name: "1366x768", width: 1366, height: 768 },
  ]) {
    test(`admin screens fit at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      mkdirSync(SCREENS, { recursive: true });
      const home = (await sql`select id from pages where path = '/'`)[0]!.id as string;
      const acc = (await sql`select id from programmes where slug = 'level-1-acc'`)[0]!.id as string;
      const screens = [
        ["dashboard", "/admin/"],
        ["pages", "/admin/pages/"],
        ["page-editor", `/admin/pages/${home}/`],
        ["programme-editor", `/admin/programmes/${acc}/`],
        ["media", "/admin/media/"],
        ["enquiries", "/admin/enquiries/"],
        ["settings", "/admin/settings/"],
        ["navigation", "/admin/navigation/"],
        ["users", "/admin/users/"],
      ] as const;
      for (const [name, path] of screens) {
        await page.goto(path);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await expectNoHorizontalOverflow(page);
        await page.screenshot({ path: `${SCREENS}/${viewport.name}-${name}.jpg`, fullPage: true, type: "jpeg", quality: 62 });
      }

      if (viewport.width < 1024) {
        // The sidebar becomes a drawer that fits the screen.
        await page.goto("/admin/");
        await page.getByRole("button", { name: "Open admin menu" }).click();
        const drawer = page.getByRole("dialog");
        await expect(drawer.getByRole("link", { name: "Enquiries" })).toBeVisible();
        const box = (await drawer.boundingBox())!;
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
        await drawer.getByRole("link", { name: "Media library" }).click();
        await expect(page).toHaveURL(/\/admin\/media\/$/);

        // Editing a section on a phone: open it, change text, and the save bar is reachable.
        await page.goto(`/admin/pages/${home}/`);
        await page.getByRole("button", { name: /^Hero/ }).first().click();
        await expect(page.locator('input[id$="-heading"]').first()).toHaveValue("Learning that stays");
        const save = page.getByRole("button", { name: "Save draft" });
        await expect(save).toBeInViewport();
        const dialogCheck = page.getByRole("button", { name: "Add section" }).first();
        await dialogCheck.click();
        const catalogue = (await page.getByRole("dialog").boundingBox())!;
        expect(catalogue.x).toBeGreaterThanOrEqual(0);
        expect(catalogue.x + catalogue.width).toBeLessThanOrEqual(viewport.width);
        expect(catalogue.y + catalogue.height).toBeLessThanOrEqual(viewport.height + 1);
      }
    });
  }
});
