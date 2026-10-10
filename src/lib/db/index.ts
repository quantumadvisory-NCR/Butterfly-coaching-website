import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { databaseUrl } from "@/lib/env";
import * as schema from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;
/** A database handle or an open transaction: anything queries can run on. */
export type Executor = Database | Parameters<Parameters<Database["transaction"]>[0]>[0];

type Cache = { sql?: postgres.Sql; db?: Database };
const globalCache = globalThis as unknown as { __bcaDb?: Cache };
const cache: Cache = (globalCache.__bcaDb ??= {});

/**
 * Lazily creates one connection pool per server process. `prepare: false`
 * keeps queries compatible with Supabase's transaction-mode pooler.
 */
export function db(): Database {
  if (cache.db) return cache.db;
  const url = databaseUrl();
  if (!url) {
    throw new Error(
      "Database is not configured. Set DATABASE_URL (Supabase) or BCA_LOCAL_MODE=1 (local development). See .env.example.",
    );
  }
  cache.sql = postgres(url, {
    max: process.env.VERCEL ? 3 : 10,
    prepare: false,
    idle_timeout: 20,
    connect_timeout: 10,
    onnotice: () => {},
  });
  cache.db = drizzle(cache.sql, { schema });
  return cache.db;
}

/** Closes the pool. Used by scripts and tests so the process can exit. */
export async function closeDb() {
  await cache.sql?.end({ timeout: 5 });
  cache.sql = undefined;
  cache.db = undefined;
}

export { schema };
