/**
 * Database checks. Read-only, so they are safe to run against any database.
 * `npm test` runs them against a throwaway local database (bca_test).
 */
import { getTableName, is, sql } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import { afterAll, describe, expect, it } from "vitest";
import { closeDb, db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

const hasDatabase = Boolean(process.env.DATABASE_URL);
const tables = (Object.values(schema) as unknown[]).filter((value): value is PgTable => is(value, PgTable));

describe.skipIf(!hasDatabase)("database", () => {
  afterAll(() => closeDb());

  it("has row level security enabled on every table in the public schema", async () => {
    const rows = await db().execute<{ tablename: string; rowsecurity: boolean }>(
      sql`select tablename, rowsecurity from pg_tables where schemaname = 'public'`,
    );
    expect(rows.length).toBeGreaterThan(20);
    const unprotected = [...rows].filter((row) => !row.rowsecurity).map((row) => row.tablename);
    expect(unprotected).toEqual([]);
  });

  it("never pipelines queries, which Supabase's transaction pooler cannot handle", async () => {
    db();
    const pool = (globalThis as unknown as { __bcaDb?: { sql?: { options: Record<string, unknown> } } }).__bcaDb?.sql;
    expect(pool?.options.max_pipeline).toBe(0);
    expect(pool?.options.prepare).toBe(false);
    // Many concurrent parameterless queries (the pattern that hung the live admin editors) all complete.
    const results = await Promise.all(Array.from({ length: 24 }, (_, i) => db().execute(sql.raw(`select ${i} as n`))));
    expect(results.map((rows) => Number([...rows][0]!.n))).toEqual(Array.from({ length: 24 }, (_, i) => i));
  });

  it("still runs transactions, on their own pool, alongside concurrent queries", async () => {
    // With pipelining switched off on the main pool, postgres.js refuses transactions there (UNSAFE_TRANSACTION),
    // so they must go to the separate transaction pool. Read-only: nothing is written.
    const [inTransaction, ...outside] = await Promise.all([
      db().transaction(async (tx) => {
        const [a] = await tx.execute<{ n: number }>(sql`select 1::int as n`);
        const [b] = await tx.execute<{ inside: boolean }>(sql`select now() = statement_timestamp() as inside`);
        return { n: a!.n, inside: b!.inside };
      }),
      ...Array.from({ length: 8 }, (_, i) => db().execute(sql.raw(`select ${i} as n`))),
    ]);
    // Inside a transaction now() is fixed at its start, so it differs from the statement time.
    expect(inTransaction).toEqual({ n: 1, inside: false });
    expect(outside).toHaveLength(8);
  });

  it("grants no policies to anonymous visitors (deny by default)", async () => {
    const rows = await db().execute<{ n: number }>(sql`select count(*)::int as n from pg_policies where schemaname = 'public'`);
    expect(rows[0]!.n).toBe(0);
  });

  it("matches the schema the application expects (every table and column is selectable)", async () => {
    for (const table of tables) {
      // Throws if a table or column in schema.ts is missing from the migrations.
      await expect(db().select().from(table).limit(0), getTableName(table)).resolves.toEqual([]);
    }
  });

  it("has the seeded launch content", async () => {
    const [counts] = await db().execute<{ pages: number; programmes: number; posts: number; media: number }>(sql`
      select (select count(*)::int from pages where status = 'published') as pages,
             (select count(*)::int from programmes where status = 'published') as programmes,
             (select count(*)::int from posts where status = 'published') as posts,
             (select count(*)::int from media) as media`);
    expect(counts!.pages).toBeGreaterThanOrEqual(12);
    expect(counts!.programmes).toBeGreaterThanOrEqual(6);
    expect(counts!.posts).toBeGreaterThanOrEqual(12);
    expect(counts!.media).toBeGreaterThanOrEqual(50);
  });

  it("stores every seeded page section as valid block data", async () => {
    const { validateBlockData } = await import("@/lib/blocks/registry");
    const sections = await db().select().from(schema.pageSections);
    expect(sections.length).toBeGreaterThan(40);
    for (const section of sections) {
      const result = validateBlockData(section.type, section.data);
      expect(result.ok, `${section.type} ${section.id}`).toBe(true);
    }
  });

  it("rejects invalid page paths and statuses at the database level", async () => {
    await expect(db().insert(schema.pages).values({ title: "Bad", path: "no-slashes" })).rejects.toThrow();
    await expect(db().execute(sql`insert into pages (title, path, status) values ('Bad', '/x-test-bad/', 'live')`)).rejects.toThrow();
  });
});
