import { expect, test } from "@playwright/test";
import { database } from "./helpers";

const sql = database();
test.afterAll(() => sql.end());
// The enquiry endpoint is rate limited per visitor; start each test with a clean slate.
test.beforeEach(() => sql`delete from rate_limits`);

/** Fills a form the way a person does: interact first (which issues the anti-spam token), then wait a moment. */
async function waitForToken(page: import("@playwright/test").Page, form: import("@playwright/test").Locator) {
  await expect(form.locator('input[name="token"]')).not.toHaveValue("");
  await page.waitForTimeout(2300);
}

test.describe("enquiry forms", () => {
  test("contact form validates, stores the enquiry and shows it in the admin inbox", async ({ page }) => {
    const email = `asha.${Date.now()}@e2e.test`;
    await page.goto("/contact-us/?utm_source=newsletter&utm_campaign=spring");
    const form = page.locator("form").filter({ has: page.getByLabel("Full name") });

    // Submitting empty shows clear, field-level errors and moves focus to the first problem.
    await form.getByLabel("Full name").click();
    await waitForToken(page, form);
    await form.getByRole("button", { name: "Send enquiry" }).click();
    await expect(form.getByRole("alert").first()).toContainText("Please check the highlighted fields");
    await expect(form.getByText("Please tell us your name.")).toBeVisible();
    await expect(form.getByText("Enter a valid email address")).toBeVisible();
    await expect(form.getByLabel("Full name")).toHaveAttribute("aria-invalid", "true");
    await expect(form.getByLabel("Full name")).toBeFocused();

    // What was typed survives a failed submission.
    await form.getByLabel("Full name").fill("Asha Rao");
    await form.getByLabel("Email", { exact: true }).fill("not-an-email");
    await form.getByLabel("Your message").fill("I would like to know more about Level 1.");
    await form.getByRole("button", { name: "Send enquiry" }).click();
    await expect(form.getByText("Enter a valid email address")).toBeVisible();
    await expect(form.getByLabel("Full name")).toHaveValue("Asha Rao");
    await expect(form.getByLabel("Your message")).toHaveValue("I would like to know more about Level 1.");

    await form.getByLabel("Email", { exact: true }).fill(email);
    await form.getByLabel("Phone or WhatsApp").fill("+91 98765 43210");
    await form.getByRole("button", { name: "Send enquiry" }).click();
    await expect(page).toHaveURL(/\/thank-you\/\?type=general$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Thank you");

    // Stored in the database with its source page; no email was sent because none is configured.
    const [row] = await sql`select * from enquiries where email = ${email}`;
    expect(row).toBeTruthy();
    expect(row!.name).toBe("Asha Rao");
    expect(row!.source_path).toBe("/contact-us/");
    expect(row!.status).toBe("new");
    expect(row!.notification_status).toBe("skipped");

    // Visible to staff, who can update the status and add a note.
    await page.goto("/admin/enquiries/");
    await page.getByRole("link", { name: "Asha Rao" }).first().click();
    await expect(page.getByRole("heading", { level: 1, name: "Asha Rao" })).toBeVisible();
    await expect(page.getByText("I would like to know more about Level 1.")).toBeVisible();
    await page.getByLabel("Status").selectOption("contacted");
    await expect(page.getByText("Status updated.")).toBeVisible();
    await page.getByLabel("Add a note").fill("Called back, sending brochure.");
    await page.getByRole("button", { name: "Add note" }).click();
    await expect(page.getByText("Called back, sending brochure.")).toBeVisible();
    const [updated] = await sql`select status from enquiries where email = ${email}`;
    expect(updated!.status).toBe("contacted");
  });

  test("programme pages pre-select their programme, and corporate enquiries need an organisation", async ({ page }) => {
    await page.goto("/level-2-pcc-coach-program/#enquire");
    const select = page.getByLabel("I am interested in");
    await expect(select.locator("option:checked")).toHaveText("Level 2: PCC Coach Programme");

    await page.goto("/services/corporate-programs/#enquire");
    const form = page.locator("form").filter({ has: page.getByLabel("Organisation") });
    await form.getByLabel("Full name").fill("Rohan Mehta");
    await form.getByLabel("Email", { exact: true }).fill(`rohan.${Date.now()}@e2e.test`);
    await waitForToken(page, form);
    await form.getByRole("button", { name: "Send enquiry" }).click();
    await expect(form.getByText("Please tell us which organisation you are with.")).toBeVisible();
    await form.getByLabel("Organisation").fill("Mehta Industries");
    await form.getByLabel("How many people would take part?").selectOption("11 to 50 people");
    await form.getByRole("button", { name: "Send enquiry" }).click();
    await expect(page).toHaveURL(/\/thank-you\/\?type=corporate$/);
    const [row] = await sql`select type, organisation, team_size from enquiries where organisation = 'Mehta Industries'`;
    expect(row).toMatchObject({ type: "corporate", team_size: "11 to 50 people" });
  });

  test('"Book a discovery call" opens the enquiry form as a discovery call request', async ({ page }) => {
    await page.goto("/");
    await page.locator("main section").first().getByRole("link", { name: "Book a discovery call" }).click();
    await expect(page).toHaveURL(/\/contact-us\/\?intent=discovery_call#enquire$/);
    await expect(page.getByText("Discovery call request").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Request my call" })).toBeVisible();
  });

  test("spam protection: bots, replays and floods are stopped", async ({ page }) => {
    await page.goto("/contact-us/");
    const form = page.locator("form").filter({ has: page.getByLabel("Full name") });
    const before = Number((await sql`select count(*)::int as n from enquiries`)[0]!.n);

    // 1. Honeypot filled: the form pretends to succeed but stores nothing.
    await form.getByLabel("Full name").fill("Spam Bot");
    await form.getByLabel("Email", { exact: true }).fill("bot@e2e.test");
    await form.getByLabel("Your message").fill("Buy cheap things at my site today");
    await form.locator('input[name="website"]').evaluate((el: HTMLInputElement) => (el.value = "http://spam.example"));
    await waitForToken(page, form);
    await form.getByRole("button", { name: "Send enquiry" }).click();
    await expect(page).toHaveURL(/\/thank-you\/$/);
    expect(Number((await sql`select count(*)::int as n from enquiries`)[0]!.n)).toBe(before);

    // 2. A forged token is rejected.
    await page.goto("/contact-us/");
    await form.getByLabel("Full name").fill("Forged Token");
    await form.getByLabel("Email", { exact: true }).fill("forged@e2e.test");
    await form.getByLabel("Your message").fill("This submission has a made-up token.");
    await expect(form.locator('input[name="token"]')).not.toHaveValue("");
    await form.locator('input[name="token"]').evaluate((el: HTMLInputElement) => (el.value = "abc123.forged-signature"));
    await form.getByRole("button", { name: "Send enquiry" }).click();
    await expect(form.getByRole("alert")).toContainText("could not verify");
    expect(Number((await sql`select count(*)::int as n from enquiries`)[0]!.n)).toBe(before);

    // 3. More than five enquiries in fifteen minutes from one visitor are refused.
    const send = async (name: string) => {
      await page.goto("/contact-us/");
      await form.getByLabel("Full name").fill(name);
      await form.getByLabel("Email", { exact: true }).fill("eager@e2e.test");
      await form.getByLabel("Your message").fill("Another message in quick succession.");
      await waitForToken(page, form);
      await form.getByRole("button", { name: "Send enquiry" }).click();
    };
    await send("Eager Sender");
    await expect(page).toHaveURL(/\/thank-you\/\?type=general$/);
    // Fast-forward this visitor's counter to the limit instead of submitting four more times.
    await sql`update rate_limits set count = 5 where key like 'enquiry:%'`;
    await send("Eager Sender Again");
    await expect(form.getByRole("alert")).toContainText("several messages");
    expect(Number((await sql`select count(*)::int as n from enquiries where name = 'Eager Sender Again'`)[0]!.n)).toBe(0);
  });

  test("newsletter signup stores the subscriber once", async ({ page }) => {
    const email = `reader.${Date.now()}@e2e.test`;
    await page.goto("/");
    const form = page.locator("footer form");
    await form.getByLabel("Email address").fill("nope");
    await page.waitForTimeout(1300);
    await form.getByRole("button", { name: "Subscribe" }).click();
    await expect(form.getByRole("alert")).toContainText("valid email");

    await form.getByLabel("Email address").fill(email);
    await form.getByRole("button", { name: "Subscribe" }).click();
    await expect(page.locator("footer").getByRole("status")).toContainText("You are on the list");

    // Signing up again does not create a duplicate.
    await page.reload();
    await page.locator("footer form").getByLabel("Email address").fill(email.toUpperCase());
    await page.waitForTimeout(1300);
    await page.locator("footer form").getByRole("button", { name: "Subscribe" }).click();
    await expect(page.locator("footer").getByRole("status")).toContainText("You are on the list");
    expect(Number((await sql`select count(*)::int as n from newsletter_subscribers where lower(email) = ${email}`)[0]!.n)).toBe(1);

    await page.goto("/admin/subscribers/");
    await expect(page.getByText(email)).toBeVisible();
  });
});
