/**
 * Moves an existing homepage to the November 2026 design ("Butterfly Home
 * Redesign"): the new hero with the programme guide form, the accreditation
 * spotlight, numbered pathway cards, "Why learners choose BCA" as picture
 * cards, programmes and fees, the global community and student stories, the
 * FAQ, "Where are you today?" and the programme guide.
 *
 * Sections the design leaves out (the figures, programme cards, the learning
 * loop, the founder, the closing call to action, anything added in the admin)
 * are kept but hidden, so any can be switched back on in Admin > Pages > Home.
 * The hero keeps the photograph already chosen in the admin.
 *
 *   npm run content:upgrade-home              show what would change (writes nothing)
 *   npm run content:upgrade-home -- --apply   save the result as a DRAFT of the homepage
 *
 * It never publishes. Review the draft in Admin > Pages > Home (Preview), then
 * press Publish there; publishing from the admin also refreshes the site cache.
 * It acts on whichever database .env.local points at, and says which first.
 */
import { asc, eq } from "drizzle-orm";
import { HOME_SECTIONS } from "../seed/content";
import { MEDIA } from "../seed/media";
import { validateBlockData } from "../src/lib/blocks/registry";
import { closeDb, db } from "../src/lib/db";
import * as s from "../src/lib/db/schema";
import { sanitiseRichText } from "../src/lib/sanitise";
import { loadEnv } from "./env";
import { seedId } from "./seed";

type Section = { id?: string; type: string; data: Record<string, unknown>; isHidden: boolean };

const apply = process.argv.includes("--apply");

/** Seed data refers to images as "@media:<key>"; the live database uses the same deterministic ids. */
function mediaRef(value: unknown, existing: Set<string>): unknown {
  if (typeof value === "string" && value.startsWith("@media:")) {
    const key = value.slice(7);
    if (!MEDIA.some((item) => item.key === key)) throw new Error(`Unknown media key "${key}"`);
    const id = seedId(`media:${key}`);
    return existing.has(id) ? id : null;
  }
  if (Array.isArray(value)) return value.map((v) => mediaRef(v, existing));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, mediaRef(v, existing)]));
  return value;
}

/** Which current section, if any, each new section takes the place of (so its id and history carry over). */
const REPLACES: Record<string, (section: Section) => boolean> = {
  hero: (section) => section.type === "hero",
  trust_strip: (section) => section.type === "trust_strip",
  "path_cards:numbered": (section) => section.type === "path_cards",
  feature_list: (section) => section.type === "feature_list",
  testimonials: (section) => section.type === "testimonials" && (section.data.source ?? "featured") === "featured",
  faq: (section) => section.type === "faq" && (section.data.group ?? "home") === "home",
};

async function main() {
  loadEnv();
  const target = process.env.BCA_LOCAL_MODE === "1" ? "the LOCAL development database" : "the database in DATABASE_URL (live site)";
  console.log(`Target: ${target}`);
  console.log(apply ? "Mode: apply (saves a draft, does not publish)" : "Mode: dry run (nothing is written). Add --apply to save the draft.");

  const [page] = await db().select().from(s.pages).where(eq(s.pages.path, "/")).limit(1);
  if (!page) throw new Error("No homepage (path /) found.");
  const current: Section[] = (
    await db().select().from(s.pageSections).where(eq(s.pageSections.pageId, page.id)).orderBy(asc(s.pageSections.position))
  ).map((row) => ({ id: row.id, type: row.type, data: (row.data ?? {}) as Record<string, unknown>, isHidden: row.isHidden }));
  const mediaIds = new Set((await db().select({ id: s.media.id }).from(s.media)).map((m) => m.id));

  const changes: string[] = [];
  const take = (key: string) => {
    const matches = REPLACES[key];
    if (!matches) return null;
    const index = current.findIndex(matches);
    return index >= 0 ? current.splice(index, 1)[0]! : null;
  };

  const designed: Section[] = HOME_SECTIONS.map((seed) => {
    const data = mediaRef(seed.data, mediaIds) as Record<string, unknown>;
    const key = seed.type === "path_cards" ? `path_cards:${String(data.layout)}` : seed.type;
    const old = take(key);
    if (seed.type === "hero" && old) {
      // Keep the photograph chosen in the admin.
      for (const field of ["image", "imageTall", "imageFocus"]) {
        if (old.data[field]) data[field] = old.data[field];
      }
    }
    if (seed.type === "faq" && old?.data.group) data.group = old.data.group;
    const label = [seed.type, data.layout || data.source || data.variant].filter(Boolean).join(" / ");
    changes.push(`${old ? "update" : "add   "} ${label}: "${String(data.heading)}"`);
    return { id: old?.id, type: seed.type, data, isHidden: false };
  });

  // Everything the design does not include stays on the page, hidden.
  const hidden = current.map((section) => {
    changes.push(`hide   ${section.type}: "${String(section.data.heading ?? "")}"${section.isHidden ? " (already hidden)" : ""}`);
    return { ...section, isHidden: true };
  });

  const next = [...designed, ...hidden];
  const rows = next.map((section, position) => {
    const result = validateBlockData(section.type, section.data, sanitiseRichText);
    if (!result.ok) throw new Error(`Section ${position} (${section.type}) is invalid: ${JSON.stringify(result.errors)}`);
    return { id: section.id, pageId: page.id, type: section.type, position, data: result.data, isHidden: section.isHidden };
  });

  console.log("\nPlanned changes:");
  for (const change of changes) console.log(`  - ${change}`);
  console.log(`\nNew section order: ${rows.map((r) => `${r.type}${r.isHidden ? " (hidden)" : ""}`).join(", ")}`);
  const hero = designed[0]!;
  if (!hero.data.image) console.log("  Note: the hero has no photograph in this media library, so it shows the design's butterfly illustration.");

  if (!apply) {
    console.log("\nDry run complete. Nothing was written.");
    return;
  }
  await db().transaction(async (tx) => {
    await tx.update(s.pages).set({ hasUnpublishedChanges: true, updatedAt: new Date() }).where(eq(s.pages.id, page.id));
    await tx.delete(s.pageSections).where(eq(s.pageSections.pageId, page.id));
    await tx.insert(s.pageSections).values(rows.map(({ id, ...row }) => (id ? { id, ...row } : row)));
    await tx.insert(s.auditLogs).values({
      action: "page.save",
      entityType: "page",
      entityId: page.id,
      summary: "Homepage November 2026 design saved as a draft by scripts/upgrade-homepage.ts",
    });
  });
  const saved = await db()
    .select({ type: s.pageSections.type })
    .from(s.pageSections)
    .where(eq(s.pageSections.pageId, page.id))
    .orderBy(asc(s.pageSections.position));
  const ok = saved.map((r) => r.type).join() === rows.map((r) => r.type).join();
  console.log(ok ? "\nDraft saved and read back. Open Admin > Pages > Home, preview it, then Publish." : "\nThe saved sections do not match the plan. Check the homepage in the admin before publishing.");
  if (!ok) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
