import { defineConfig } from "@playwright/test";
import { config as loadEnv } from "dotenv";

loadEnv({ path: [".env.local", ".env"], quiet: true });

/**
 * End-to-end tests run against a real production build (`next build` +
 * `next start`) and a dedicated local database (bca_e2e), started by
 * `npm run test:e2e`. They never touch the development or production data.
 */
const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = `http://localhost:${PORT}`;
export const AUTH_FILE = ".local/e2e-auth.json";

export default defineConfig({
  testDir: "tests/e2e",
  outputDir: "test-results/artifacts",
  globalSetup: "./tests/e2e/global-setup.ts",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: 0,
  workers: 4,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL,
    // Scroll-reveal animations are disabled so full-page screenshots show every section.
    reducedMotion: "reduce",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    { name: "public", testMatch: /(responsive|site|a11y)\.spec\.ts/ },
    {
      name: "admin",
      testMatch: /(admin|forms)\.spec\.ts/,
      dependencies: ["setup"],
      fullyParallel: false,
      use: { storageState: AUTH_FILE },
    },
  ],
  webServer: {
    // The data cache is cleared first so the server never serves content cached from an earlier test database state.
    command: `node -e "require('fs').rmSync('.next/cache/fetch-cache',{recursive:true,force:true})" && next build && next start -p ${PORT}`,
    url: baseURL,
    timeout: 420_000,
    // Always a fresh build: reusing a server risks testing stale code.
    reuseExistingServer: false,
    env: { NEXT_PUBLIC_SITE_URL: baseURL },
    stdout: "ignore",
    stderr: "pipe",
  },
});
