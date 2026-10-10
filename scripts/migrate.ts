/**
 * Applies SQL migrations from supabase/migrations in filename order.
 * Works against any PostgreSQL database: Supabase or the local dev server.
 *
 *   npm run db:migrate
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { databaseUrl } from "../src/lib/env";
import { loadEnv } from "./env";

const MIGRATIONS_DIR = path.resolve("supabase/migrations");

export async function migrate(options: { quiet?: boolean } = {}) {
  loadEnv();
  const url = databaseUrl();
  if (!url) throw new Error("DATABASE_URL is not set.");

  const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
  try {
    await sql`
      create table if not exists public._migrations (
        name text primary key,
        applied_at timestamptz not null default now()
      )`;
    const applied = new Set((await sql<{ name: string }[]>`select name from public._migrations`).map((r) => r.name));
    const files = readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    let count = 0;
    for (const file of files) {
      if (applied.has(file)) continue;
      const body = readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
      await sql.begin(async (tx) => {
        await tx.unsafe(body);
        await tx`insert into public._migrations (name) values (${file})`;
      });
      count += 1;
      if (!options.quiet) console.log(`[migrate] applied ${file}`);
    }
    // Keep the bookkeeping table closed to the Data API as well.
    await sql`alter table public._migrations enable row level security`;
    if (!options.quiet && count === 0) console.log("[migrate] database is up to date");
    return count;
  } finally {
    await sql.end();
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  migrate().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
