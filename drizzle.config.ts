import { defineConfig } from "drizzle-kit";

/**
 * drizzle-kit is only used to generate SQL from src/lib/db/schema.ts
 * (`npm run db:generate`). Migrations are applied by scripts/migrate.ts or
 * pasted into the Supabase SQL editor; no database connection is needed here.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./supabase/migrations",
  migrations: { prefix: "index" },
});
