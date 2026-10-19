/**
 * Refreshes the end-to-end test database (bca_e2e) with the current seed
 * content before the tests run, so the tests always see the content the code
 * expects. Without this, a database seeded by an older version keeps its old
 * pages, because scripts/with-db.ts only seeds an empty database.
 *
 * Refuses to run against anything but the local bca_e2e database: a seed
 * refresh overwrites pages, programmes and settings.
 */
import { closeDb } from "../src/lib/db";
import { loadEnv } from "./env";
import { seed } from "./seed";

loadEnv();
if (process.env.BCA_LOCAL_MODE !== "1" || !/\/bca_e2e$/.test(process.env.DATABASE_URL ?? "")) {
  console.error("Refusing to refresh: the end-to-end seed only runs against the local bca_e2e database. Use `npm run test:e2e` with .env.local in local mode.");
  process.exit(1);
}

seed({ quiet: true })
  .then(() => console.log("[e2e] test database refreshed with the current seed content"))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
