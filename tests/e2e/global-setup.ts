import { database } from "./helpers";

/**
 * Resets the parts of the test database that tests write to, so every run
 * starts from the seeded launch content with no staff accounts. The first
 * test then exercises the real first-run setup flow.
 */
export default async function globalSetup() {
  if (process.env.BCA_LOCAL_MODE !== "1" || !/\/bca_e2e$/.test(process.env.DATABASE_URL ?? "")) {
    throw new Error("Refusing to run: end-to-end tests reset data and must use the local bca_e2e database. Use `npm run test:e2e`.");
  }
  const sql = database();
  try {
    // Plain deletes, never TRUNCATE ... CASCADE: cascading from profiles would also empty pages and media.
    for (const table of ["rate_limits", "audit_logs", "enquiry_notes", "enquiries", "newsletter_subscribers", "local_credentials", "profiles"]) {
      await sql.unsafe(`delete from ${table}`);
    }
    await sql`delete from revisions where entity_id in (select id from pages where path like '/e2e-%')`;
    await sql`delete from pages where path like '/e2e-%'`;
    await sql`delete from media where source = 'upload'`;
    await sql`update site_settings set value = jsonb_set(value, '{announcementEnabled}', 'false') where key = 'header'`;
    await sql`update programmes set tagline = 'A strong professional foundation and the beginning of your identity as a coach.' where slug = 'level-1-acc'`;
  } finally {
    await sql.end();
  }
}
