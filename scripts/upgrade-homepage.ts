/**
 * Brings an existing homepage up to the redesigned layout (October 2026):
 * the two-line hero with proof points and the arched founder photograph, the
 * overlapping "Choose your path" panel, the statistics strip, and the FAQ help
 * card. Everything else on the page, including any edits made in the admin, is
 * kept as it is.
 *
 *   npm run content:upgrade-home              show what would change (writes nothing)
 *   npm run content:upgrade-home -- --apply   save the result as a DRAFT of the homepage
 *
 * It never publishes. Review the draft in Admin > Pages > Home (Preview), then
 * press Publish there; publishing from the admin also refreshes the site cache.
 * It acts on whichever database .env.local points at, and says which first.
 */
import { asc, eq } from "drizzle-orm";
import { HOME_FAQ, HOME_HERO, HOME_PATHS, HOME_STATS } from "../seed/content";
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
  const resolve = <T>(data: T) => mediaRef(data, mediaIds) as Record<string, unknown>;

  const changes: string[] = [];
  const take = (type: string) => {
    const index = current.findIndex((section) => section.type === type);
    return index >= 0 ? current.splice(index, 1)[0]! : null;
  };

  // Hero: new copy and composition, keeping the buttons and supporting text the owner already has.
  const oldHero = take("hero");
  const heroDefaults = resolve(HOME_HERO);
  const hero: Section = {
    id: oldHero?.id,
    type: "hero",
    isHidden: false,
    data: {
      ...(oldHero?.data ?? {}),
      ...heroDefaults,
      subheading: (oldHero?.data.subheading as string) || heroDefaults.subheading,
      primaryCta: (oldHero?.data.primaryCta as object) ?? heroDefaults.primaryCta,
      secondaryCta: (oldHero?.data.secondaryCta as object) ?? heroDefaults.secondaryCta,
      // Keep the current photograph if the authentic group photo is not in this media library.
      image: heroDefaults.image ?? oldHero?.data.image ?? null,
    },
  };
  changes.push(`hero: "${oldHero?.data.heading ?? "(none)"}" -> "${HOME_HERO.heading} ${HOME_HERO.headingAccent}", proof points, trust line, arched photograph`);

  // Pathways: the navy overlapping panel with the brief's copy, keeping each card's image for the image layout.
  const oldPaths = take("path_cards");
  const paths: Section = { id: oldPaths?.id, type: "path_cards", isHidden: false, data: { ...(oldPaths?.data ?? {}), ...resolve(HOME_PATHS) } };
  changes.push("path_cards: navy overlapping panel, three icon cards with the new copy");

  // Statistics strip: verified figures only.
  const oldStats = take("stats");
  const stats: Section = { id: oldStats?.id, type: "stats", isHidden: false, data: oldStats?.data ?? resolve(HOME_STATS) };
  changes.push(oldStats ? "stats: kept as it is" : "stats: added (4,100+, 3, 24+, 2022; coaches trained and organisations left empty, so hidden)");

  // Trust strip: keeps its ICF badges; its figures now live in the statistics strip.
  const oldTrust = take("trust_strip");
  const trust: Section | null = oldTrust ? { ...oldTrust, data: { ...oldTrust.data, facts: [] } } : null;
  if (trust) changes.push("trust_strip: figures removed (now in the statistics strip), badges kept");

  // Everything else keeps its order; two sections get small updates.
  const rest = current.map((section) => {
    if (section.type === "faq" && (section.data.group ?? "home") === "home") {
      changes.push("faq: heading, introduction and the 'Still unsure? Talk to us.' help card");
      return { ...section, data: { ...section.data, ...resolve(HOME_FAQ) } };
    }
    if (section.type === "testimonials" && section.data.source === "featured") {
      changes.push("testimonials: up to 4 featured stories in the new showcase");
      return { ...section, data: { ...section.data, limit: 4 } };
    }
    return section;
  });

  const next = [hero, paths, stats, ...(trust ? [trust] : []), ...rest];
  const rows = next.map((section, position) => {
    const result = validateBlockData(section.type, section.data, sanitiseRichText);
    if (!result.ok) throw new Error(`Section ${position} (${section.type}) is invalid: ${JSON.stringify(result.errors)}`);
    return { id: section.id, pageId: page.id, type: section.type, position, data: result.data, isHidden: section.isHidden };
  });

  console.log("\nPlanned changes:");
  for (const change of changes) console.log(`  - ${change}`);
  console.log(`\nNew section order: ${rows.map((r) => r.type).join(", ")}`);
  if (!heroDefaults.image) console.log("  Note: the authentic group photograph is not in this media library, so the hero keeps its current image.");

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
      summary: "Homepage redesign saved as a draft by scripts/upgrade-homepage.ts",
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
