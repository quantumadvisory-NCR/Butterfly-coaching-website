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
 *     (on the live site: -- --apply --code-deployed, once this code is live)
 *
 * It never publishes. Review the draft in Admin > Pages > Home (Preview), then
 * press Publish there; publishing from the admin also refreshes the site cache.
 * It acts on whichever database .env.local points at, and says which first.
 *
 * Two related facts are saved straight away, not as a draft, and only where the
 * owner has not set them (22 November 2026): each ICF level's tentative
 * duration (Admin > Programmes > Duration, shown in the fees table and in the
 * Key facts on the three level pages) when it is empty, and the announcement
 * bar's "Know about our next cohort · Limited seats" (link "Reserve yours") when
 * the bar still has the launch wording.
 *
 * DEPLOY THE CODE FIRST. The draft and the announcement rely on the 22 November
 * 2026 code (the slideshow field, the carousel layout, an announcement link
 * without a label). On the live database --apply therefore also needs
 * --code-deployed, to confirm that code is live (pushed to main and Ready).
 */
import { asc, eq } from "drizzle-orm";
import { HOME_SECTIONS, PROGRAMMES } from "../seed/content";
import { MEDIA } from "../seed/media";
import { validateBlockData } from "../src/lib/blocks/registry";
import { closeDb, db } from "../src/lib/db";
import * as s from "../src/lib/db/schema";
import { DEFAULT_SETTINGS } from "../src/lib/settings";
import { sanitiseRichText } from "../src/lib/sanitise";
import { loadEnv } from "./env";
import { seedId } from "./seed";

type Section = { id?: string; type: string; data: Record<string, unknown>; isHidden: boolean };

const apply = process.argv.includes("--apply");
const codeDeployed = process.argv.includes("--code-deployed");

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

/**
 * Which current section, if any, each new section takes the place of (so its id and history carry over).
 * The design's own sections match too, so running the script again updates them instead of adding copies.
 */
const REPLACES: Record<string, (section: Section) => boolean> = {
  hero: (section) => section.type === "hero",
  trust_strip: (section) => section.type === "trust_strip",
  // Taken before the choices, so it gets the first pathway section: the old charcoal panel, or the numbered cards on a re-run.
  "path_cards:numbered": (section) => section.type === "path_cards" && section.data.layout !== "choices",
  feature_list: (section) => section.type === "feature_list",
  comparison_table: (section) => section.type === "comparison_table" && section.data.source === "fees",
  community: (section) => section.type === "community",
  testimonials: (section) =>
    section.type === "testimonials" && ((section.data.source ?? "featured") === "featured" || section.data.layout === "carousel"),
  faq: (section) => section.type === "faq" && (section.data.group ?? "home") === "home",
  "path_cards:choices": (section) => section.type === "path_cards" && section.data.layout === "choices",
  newsletter: (section) => section.type === "newsletter" && section.data.layout === "guide",
};

/** The fields whose saved value differs, e.g. " (changes: format, note)". */
function differences(before: Record<string, unknown>, after: Record<string, unknown>): string {
  const canon = (v: unknown): string =>
    JSON.stringify(v ?? null, (_key, value: unknown) =>
      value && typeof value === "object" && !Array.isArray(value)
        ? Object.fromEntries(Object.keys(value as object).sort().map((k) => [k, (value as Record<string, unknown>)[k]]))
        : value,
    );
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter((k) => canon(before[k]) !== canon(after[k]));
  return keys.length ? ` (changes: ${keys.join(", ")})` : " (no change)";
}

/** The announcement bar's launch wording, replaced only while the owner has not changed it. */
const LAUNCH_ANNOUNCEMENT = { text: "Next ACC cohort enrolling now · Limited seats", label: "Reserve yours" };

type Fact = { kind: "programme" | "announcement"; id?: string; slug?: string; value?: Record<string, unknown>; duration?: string; note: string };

/** Tentative durations for the ICF levels, and the announcement bar: saved straight away, only where the owner has not set them. */
async function programmeFactsAndAnnouncement(): Promise<Fact[]> {
  const facts: Fact[] = [];
  const programmes = await db().select({ id: s.programmes.id, slug: s.programmes.slug, duration: s.programmes.duration }).from(s.programmes);
  for (const seeded of PROGRAMMES) {
    if (!("duration" in seeded) || !seeded.duration) continue;
    const row = programmes.find((p) => p.slug === seeded.slug);
    if (!row) continue;
    facts.push(
      row.duration?.trim()
        ? { kind: "programme", note: `keep  ${row.slug} duration "${row.duration}" (already set)` }
        : { kind: "programme", id: row.id, slug: row.slug, duration: seeded.duration, note: `set   ${row.slug} duration "${seeded.duration}"` },
    );
  }
  const [header] = await db().select().from(s.siteSettings).where(eq(s.siteSettings.key, "header")).limit(1);
  const value = (header?.value ?? {}) as Record<string, unknown>;
  const link = (value.announcementLink ?? {}) as { label?: string; href?: string };
  if (header && value.announcementText === LAUNCH_ANNOUNCEMENT.text && (link.label ?? "") === LAUNCH_ANNOUNCEMENT.label) {
    const href = link.href || DEFAULT_SETTINGS.header.announcementLink.href;
    facts.push({
      kind: "announcement",
      value: {
        ...value,
        announcementText: DEFAULT_SETTINGS.header.announcementText,
        announcementLink: { label: DEFAULT_SETTINGS.header.announcementLink.label, href },
      },
      note: `set   announcement bar "${DEFAULT_SETTINGS.header.announcementText} · ${DEFAULT_SETTINGS.header.announcementLink.label} →", the link going to ${href}`,
    });
  } else {
    facts.push({ kind: "announcement", note: `keep  announcement bar "${String(value.announcementText ?? "")}" (changed in the admin, or already updated)` });
  }
  return facts;
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
      for (const field of ["image", "imageTall", "imageFocus", "slides"]) {
        // An empty slides list is only the field's default, not a choice: the seeded photographs apply then.
        const chosen = field === "slides" ? Array.isArray(old.data.slides) && old.data.slides.length > 0 : Boolean(old.data[field]);
        if (chosen) data[field] = old.data[field];
      }
    }
    if (seed.type === "faq" && old?.data.group) data.group = old.data.group;
    const label = [seed.type, data.layout || data.source || data.variant].filter(Boolean).join(" / ");
    // Compared after validation, which fills in defaults, so only real changes are listed.
    const checked = validateBlockData(seed.type, data, sanitiseRichText);
    const after = checked.ok ? (checked.data as Record<string, unknown>) : data;
    changes.push(`${old ? "update" : "add   "} ${label}: "${String(data.heading)}"${old ? differences(old.data, after) : ""}`);
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
  const facts = await programmeFactsAndAnnouncement();
  console.log("\nSaved straight away, not as part of the draft:");
  for (const fact of facts) console.log(`  - ${fact.note}`);
  if (facts.some((fact) => fact.kind === "programme" && fact.duration)) {
    console.log("  (Each duration also shows in the Key facts on that level's own page.)");
  }

  if (!apply) {
    console.log("\nDry run complete. Nothing was written.");
    return;
  }
  if (process.env.BCA_LOCAL_MODE !== "1" && !codeDeployed) {
    console.log(
      "\nNot applied. On the live site, deploy the 22 November 2026 code first (push to main and wait for Ready):" +
        " the draft and the announcement need it. Then run again with --apply --code-deployed.",
    );
    process.exitCode = 1;
    return;
  }
  await db().transaction(async (tx) => {
    for (const fact of facts) {
      if (fact.kind === "programme" && fact.slug && fact.duration) {
        await tx.update(s.programmes).set({ duration: fact.duration, updatedAt: new Date() }).where(eq(s.programmes.slug, fact.slug));
      } else if (fact.kind === "announcement" && fact.value) {
        await tx.update(s.siteSettings).set({ value: fact.value, updatedAt: new Date() }).where(eq(s.siteSettings.key, "header"));
      } else {
        continue;
      }
      await tx.insert(s.auditLogs).values({
        action: fact.kind === "programme" ? "programme.update" : "settings.update",
        // The same entity names the admin uses, so the dashboard links each entry.
        entityType: fact.kind === "programme" ? "programmes" : "settings",
        entityId: fact.kind === "programme" ? fact.id! : "header",
        summary: `${fact.note.replace(/^set\s+/, "Set ")}, by scripts/upgrade-homepage.ts`,
      });
    }
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
