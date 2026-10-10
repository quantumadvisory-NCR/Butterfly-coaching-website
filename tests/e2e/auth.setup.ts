import { randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { expect, test as setup } from "@playwright/test";

const AUTH_FILE = ".local/e2e-auth.json";
const CREDENTIALS_FILE = ".local/e2e-credentials.json";

/**
 * Exercises the real first-run flow: with no accounts, /admin leads to setup;
 * setup refuses a wrong token; the right token creates the owner and signs in.
 * The generated test credentials are written to .local (git-ignored) so the
 * other tests can sign in again.
 */
setup("first-run setup creates the owner account", async ({ page }) => {
  const token = process.env.ADMIN_SETUP_TOKEN;
  expect(token, "ADMIN_SETUP_TOKEN must be set in .env.local").toBeTruthy();

  const email = "owner@e2e.test";
  const password = `E2e-${randomBytes(12).toString("base64url")}-9a`;
  mkdirSync(".local", { recursive: true });
  writeFileSync(CREDENTIALS_FILE, JSON.stringify({ email, password }));

  await page.goto("/admin/");
  await expect(page).toHaveURL(/\/admin\/setup\/$/);
  await expect(page.getByRole("heading", { name: "Create the owner account" })).toBeVisible();

  // A wrong token is rejected and creates nothing.
  await page.getByLabel("Setup token").fill("not-the-right-token-000000");
  await page.getByLabel("Your name").fill("Test Owner");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Choose a password").fill(password);
  await page.getByRole("button", { name: "Create owner account" }).click();
  await expect(page.getByText("That setup token is not correct.")).toBeVisible();

  // A weak password is rejected even with the right token.
  await page.getByLabel("Setup token").fill(token!);
  await page.getByLabel("Choose a password").fill("short");
  await page.getByRole("button", { name: "Create owner account" }).click();
  await expect(page.getByText("Use at least 12 characters.")).toBeVisible();

  await page.getByLabel("Setup token").fill(token!);
  await page.getByLabel("Choose a password").fill(password);
  await page.getByRole("button", { name: "Create owner account" }).click();
  await expect(page).toHaveURL(/\/admin\/$/);
  await expect(page.getByRole("heading", { name: /Welcome, Test/ })).toBeVisible();

  await page.context().storageState({ path: AUTH_FILE });

  // Setup is now closed for good.
  await page.context().clearCookies();
  await page.goto("/admin/setup/");
  await expect(page).toHaveURL(/\/admin\/login\/$/);
});
