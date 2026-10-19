import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { databaseUrl } from "@/lib/env";
import * as schema from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;
/** A database handle or an open transaction: anything queries can run on. */
export type Executor = Database | Parameters<Parameters<Database["transaction"]>[0]>[0];

type Cache = { sql?: postgres.Sql; txSql?: postgres.Sql; db?: Database };
const globalCache = globalThis as unknown as { __bcaDb?: Cache };
const cache: Cache = (globalCache.__bcaDb ??= {});

/**
 * Lazily creates the connection pools, once per server process. They are set
 * up for Supabase's transaction-mode pooler (Supavisor, port 6543):
 *
 * - `prepare: false`: the pooler hands each transaction to any server
 *   connection, so named prepared statements cannot be relied on.
 * - `max_pipeline: 0` on the main pool: never send a query down a connection
 *   that is still busy. postgres.js normally pipelines queries without
 *   parameters, and Supavisor in transaction mode drops the pipelined ones, so
 *   the page waited until Vercel killed it after 300 seconds. That is why every
 *   admin editor (around a dozen queries at once) hung on the live site while
 *   list screens (two or three) worked. Reproduced and verified against the
 *   live pooler on 19 October 2026: see docs/PERFORMANCE_AND_ADMIN_FIXES.md.
 * - Transactions use a second, small pool with normal settings. postgres.js
 *   reserves a transaction's connection through its pipelining step, so with
 *   `max_pipeline: 0` every transaction would fail (UNSAFE_TRANSACTION). Inside
 *   a transaction the pooler keeps one server connection pinned, so the
 *   pipelining that does happen there is safe.
 */
export function db(): Database {
  if (cache.db) return cache.db;
  const url = databaseUrl();
  if (!url) {
    throw new Error(
      "Database is not configured. Set DATABASE_URL (Supabase) or BCA_LOCAL_MODE=1 (local development). See .env.example.",
    );
  }
  const shared = { prepare: false, idle_timeout: 20, connect_timeout: 10, onnotice: () => {} } as const;
  cache.sql = postgres(url, {
    ...shared,
    // Connections to the transaction pooler are cheap; six lets an editor's queries run with little queueing.
    max: process.env.VERCEL ? 6 : 10,
    // Supported by postgres.js at runtime (see its option parsing) but missing from its type definitions.
    ...({ max_pipeline: 0 } as object),
  });
  cache.txSql = postgres(url, { ...shared, max: process.env.VERCEL ? 2 : 4 });

  const main = drizzle(cache.sql, { schema });
  const transactional = drizzle(cache.txSql, { schema });
  main.transaction = transactional.transaction.bind(transactional);
  cache.db = main;
  return cache.db;
}

/** Closes the pools. Used by scripts and tests so the process can exit. */
export async function closeDb() {
  await Promise.all([cache.sql?.end({ timeout: 5 }), cache.txSql?.end({ timeout: 5 })]);
  cache.sql = undefined;
  cache.txSql = undefined;
  cache.db = undefined;
}

export { schema };
