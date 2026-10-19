/**
 * Seeds the database with BCA's launch content (seed/content.ts, seed/media.ts
 * and the imported blog in seed/data/posts.json).
 *
 *   npm run db:seed     insert or refresh the seed content (safe to re-run)
 *   npm run db:reset    wipe all CONTENT tables first, then seed
 *
 * Users, enquiries, subscribers and the audit log are never touched.
 * Ids are derived from stable keys, so re-running updates rows in place.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { count, sql } from "drizzle-orm";
import { DRAFT_POSTS, FACULTY, FAQS, NAVIGATION, PAGES, POST_IMAGES, PROGRAMMES, REDIRECTS, TESTIMONIALS } from "../seed/content";
import { MEDIA } from "../seed/media";
import { validateBlockData } from "../src/lib/blocks/registry";
import { buildPageSnapshot } from "../src/lib/content/snapshot";
import { closeDb, db } from "../src/lib/db";
import * as s from "../src/lib/db/schema";
import { sanitiseRichText } from "../src/lib/sanitise";
import { DEFAULT_SETTINGS } from "../src/lib/settings";
import { loadEnv } from "./env";

/** Deterministic UUID from a key, so seeded rows keep their ids across runs. */
export function seedId(key: string): string {
  const hex = createHash("sha1").update(`bca-seed:${key}`).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

const mediaId = (key: string | null | undefined) => (key ? seedId(`media:${key}`) : null);

/** Replaces "@media:<key>" references anywhere in a block's data with real ids. */
function resolveMedia(value: unknown): unknown {
  if (typeof value === "string" && value.startsWith("@media:")) {
    const key = value.slice(7);
    if (!MEDIA.some((item) => item.key === key)) throw new Error(`Seed references unknown media "${key}"`);
    return mediaId(key);
  }
  if (Array.isArray(value)) return value.map(resolveMedia);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolveMedia(v)]));
  }
  return value;
}

const MIME: Record<string, string> = {
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

type PostSeed = {
  slug: string;
  title: string;
  publishedAt: string;
  excerpt: string;
  contentHtml: string;
  categories: { name: string; slug: string }[];
  tags: { name: string; slug: string }[];
};

const CONTENT_TABLES = [
  "post_tags",
  "post_categories",
  "posts",
  "tags",
  "categories",
  "navigation_items",
  "redirects",
  "page_sections",
  "pages",
  "revisions",
  "testimonials",
  "faqs",
  "programme_faculty",
  "programme_modules",
  "cohorts",
  "programmes",
  "faculty",
  "resources",
  "site_settings",
  "media",
];

export async function seed(options: { reset?: boolean; quiet?: boolean } = {}) {
  loadEnv();
  const log = (message: string) => !options.quiet && console.log(`[seed] ${message}`);
  const database = db();

  if (options.reset) {
    // A reset wipes every content table. Outside local mode the database is a
    // live site, so it takes a deliberate override rather than a slip of the hand.
    if (process.env.BCA_LOCAL_MODE !== "1" && process.env.ALLOW_LIVE_RESET !== "1") {
      throw new Error(
        "Refusing to reset: this folder is connected to a live database, and a reset wipes all of its content. " +
          "To work locally, restore .env.dev.local over .env.local. To wipe the live database on purpose, set ALLOW_LIVE_RESET=1 for this one command.",
      );
    }
    await database.execute(sql.raw(`truncate table ${CONTENT_TABLES.map((t) => `public.${t}`).join(", ")} cascade`));
    log("content tables cleared");
  }

  const dimensionsFile = path.resolve("seed/data/image-dimensions.json");
  const dimensions: Record<string, { width: number; height: number; bytes: number }> = existsSync(dimensionsFile)
    ? JSON.parse(readFileSync(dimensionsFile, "utf8"))
    : {};

  await database.transaction(async (tx) => {
    /* ---- media ---- */
    for (const item of MEDIA) {
      const dims = dimensions[item.url];
      const row = {
        id: mediaId(item.key)!,
        kind: "image" as const,
        source: item.source,
        storage: "static" as const,
        url: item.url,
        filename: item.url.split("/").pop()!,
        mimeType: MIME[item.url.split(".").pop()!] ?? "image/jpeg",
        sizeBytes: dims?.bytes ?? null,
        width: dims?.width ?? null,
        height: dims?.height ?? null,
        alt: item.alt,
        caption: item.caption ?? null,
        credit: item.credit ?? null,
        licence: item.licence,
        sourceUrl: item.sourceUrl ?? null,
        focalX: item.focal?.[0] ?? 0.5,
        focalY: item.focal?.[1] ?? 0.5,
      };
      const { id: _id, ...update } = row;
      await tx.insert(s.media).values(row).onConflictDoUpdate({ target: s.media.id, set: update });
    }
    log(`${MEDIA.length} media items`);

    /* ---- settings (only fills gaps: never overwrites what the owner has changed) ---- */
    const settings = structuredClone(DEFAULT_SETTINGS);
    settings.brand.logoLight = mediaId("brand.logo-light");
    settings.brand.logoDark = mediaId("brand.logo-dark");
    settings.brand.defaultOgImage = mediaId("photo.hero-coaching-conversation");
    for (const [key, value] of Object.entries(settings)) {
      await tx.insert(s.siteSettings).values({ key, value }).onConflictDoNothing();
    }
    log("site settings");

    /* ---- faculty ---- */
    for (const [position, person] of FACULTY.entries()) {
      const row = {
        id: seedId(`faculty:${person.slug}`),
        name: person.name,
        slug: person.slug,
        roleTitle: person.roleTitle,
        credential: person.credential,
        shortBio: person.shortBio,
        bioHtml: sanitiseRichText(person.bioHtml),
        photoId: mediaId(person.photo),
        linkedinUrl: person.linkedinUrl,
        isFounder: person.isFounder,
        position,
        status: "published" as const,
      };
      const { id: _id, ...update } = row;
      await tx.insert(s.faculty).values(row).onConflictDoUpdate({ target: s.faculty.id, set: update });
    }
    log(`${FACULTY.length} faculty profiles`);

    /* ---- programmes ---- */
    for (const [position, p] of PROGRAMMES.entries()) {
      const id = seedId(`programme:${p.slug}`);
      const row = {
        id,
        slug: p.slug,
        path: p.path,
        kind: p.kind,
        name: p.name,
        levelLabel: p.levelLabel,
        credential: p.credential,
        tagline: p.tagline,
        summary: p.summary,
        descriptionHtml: sanitiseRichText(p.descriptionHtml),
        audience: p.audience,
        eligibility: p.eligibility,
        outcomes: p.outcomes,
        highlights: p.highlights,
        educationHours: p.educationHours,
        mentoringHours: p.mentoringHours,
        experienceHours: p.experienceHours,
        languages: p.languages,
        accreditationStatus: p.accreditationStatus,
        badgeId: mediaId(p.badge),
        heroImageId: mediaId(p.heroImage),
        cardImageId: mediaId(p.cardImage),
        seoTitle: p.seoTitle,
        seoDescription: p.seoDescription,
        status: "published" as const,
        isFeatured: p.isFeatured,
        position,
      };
      const { id: _id, ...update } = row;
      await tx.insert(s.programmes).values(row).onConflictDoUpdate({ target: s.programmes.id, set: update });

      await tx.delete(s.programmeModules).where(sql`${s.programmeModules.programmeId} = ${id}`);
      if (p.modules.length) {
        await tx.insert(s.programmeModules).values(
          p.modules.map((module, i) => ({ id: seedId(`module:${p.slug}:${i}`), programmeId: id, position: i, ...module })),
        );
      }
      await tx.delete(s.programmeFaculty).where(sql`${s.programmeFaculty.programmeId} = ${id}`);
      if (p.faculty.length) {
        await tx.insert(s.programmeFaculty).values(
          p.faculty.map((slug, i) => ({ programmeId: id, facultyId: seedId(`faculty:${slug}`), position: i })),
        );
      }
      for (const [i, faq] of p.faqs.entries()) {
        const faqRow = {
          id: seedId(`faq:${p.slug}:${i}`),
          question: faq.question,
          answerHtml: sanitiseRichText(faq.answerHtml),
          groupKey: "programme",
          programmeId: id,
          position: i,
          status: "published" as const,
        };
        const { id: _faqId, ...faqUpdate } = faqRow;
        await tx.insert(s.faqs).values(faqRow).onConflictDoUpdate({ target: s.faqs.id, set: faqUpdate });
      }
    }
    log(`${PROGRAMMES.length} programmes`);

    /* ---- testimonials ---- */
    for (const [position, t] of TESTIMONIALS.entries()) {
      const row = {
        id: seedId(`testimonial:${t.name}`),
        name: t.name,
        roleTitle: t.roleTitle,
        quote: t.quote,
        excerpt: t.excerpt,
        photoId: mediaId(t.photo),
        programmeId: t.programme ? seedId(`programme:${t.programme}`) : null,
        status: "approved" as const,
        isFeatured: t.isFeatured,
        position,
        sourceNote: t.sourceNote,
      };
      const { id: _id, ...update } = row;
      await tx.insert(s.testimonials).values(row).onConflictDoUpdate({ target: s.testimonials.id, set: update });
    }
    log(`${TESTIMONIALS.length} testimonials`);

    /* ---- FAQs ---- */
    for (const [position, faq] of FAQS.entries()) {
      const row = {
        id: seedId(`faq:${faq.group}:${faq.question}`),
        question: faq.question,
        answerHtml: sanitiseRichText(faq.answerHtml),
        groupKey: faq.group,
        position,
        status: "published" as const,
      };
      const { id: _id, ...update } = row;
      await tx.insert(s.faqs).values(row).onConflictDoUpdate({ target: s.faqs.id, set: update });
    }
    log(`${FAQS.length} FAQs`);

    /* ---- pages: working copy + a published revision ---- */
    for (const page of PAGES) {
      const pageId = seedId(`page:${page.path}`);
      const pageFields = {
        title: page.title,
        seoTitle: page.seoTitle ?? null,
        seoDescription: page.seoDescription,
        ogImageId: null,
        noindex: page.noindex ?? false,
      };
      const sections = page.sections.map((section, position) => {
        const result = validateBlockData(section.type, resolveMedia(section.data), sanitiseRichText);
        if (!result.ok) {
          throw new Error(`Invalid seed block "${section.type}" on ${page.path}: ${JSON.stringify(result.errors)}`);
        }
        return {
          id: seedId(`section:${page.path}:${position}`),
          pageId,
          type: section.type,
          position,
          data: result.data,
          isHidden: false,
        };
      });
      const revisionId = seedId(`revision:${page.path}`);
      const pageRow = {
        id: pageId,
        path: page.path,
        status: "published" as const,
        ...pageFields,
        publishedRevisionId: revisionId,
        publishedAt: new Date(),
        hasUnpublishedChanges: false,
        isSystem: true,
      };
      const { id: _id, ...pageUpdate } = pageRow;
      await tx.insert(s.pages).values(pageRow).onConflictDoUpdate({ target: s.pages.id, set: pageUpdate });
      await tx.delete(s.pageSections).where(sql`${s.pageSections.pageId} = ${pageId}`);
      if (sections.length) await tx.insert(s.pageSections).values(sections);
      const snapshot = buildPageSnapshot(pageFields, sections);
      await tx
        .insert(s.revisions)
        .values({ id: revisionId, entityType: "page", entityId: pageId, snapshot, label: "Launch content" })
        .onConflictDoUpdate({ target: s.revisions.id, set: { snapshot, createdAt: new Date() } });
    }
    log(`${PAGES.length} pages`);

    /* ---- navigation ---- */
    await tx.delete(s.navigationItems);
    for (const [menu, items] of Object.entries(NAVIGATION) as [(typeof s.MENUS)[number], (typeof NAVIGATION)["header"]][]) {
      for (const [position, item] of items.entries()) {
        const id = seedId(`nav:${menu}:${position}`);
        await tx.insert(s.navigationItems).values({ id, menu, label: item.label, href: item.href, description: item.description ?? null, position });
        for (const [childPosition, child] of (item.children ?? []).entries()) {
          await tx.insert(s.navigationItems).values({
            id: seedId(`nav:${menu}:${position}:${childPosition}`),
            menu,
            parentId: id,
            label: child.label,
            href: child.href,
            description: child.description ?? null,
            position: childPosition,
          });
        }
      }
    }
    log("navigation menus");

    /* ---- redirects ---- */
    for (const redirect of REDIRECTS) {
      const row = {
        id: seedId(`redirect:${redirect.source}`),
        sourcePath: redirect.source,
        destination: redirect.destination,
        statusCode: redirect.statusCode ?? 301,
        note: redirect.note,
      };
      const { id: _id, ...update } = row;
      await tx.insert(s.redirects).values(row).onConflictDoUpdate({ target: s.redirects.id, set: update });
    }
    log(`${REDIRECTS.length} redirects`);

    /* ---- blog ---- */
    const postsFile = path.resolve("seed/data/posts.json");
    const posts: PostSeed[] = existsSync(postsFile) ? JSON.parse(readFileSync(postsFile, "utf8")) : [];
    for (const post of posts) {
      const postId = seedId(`post:${post.slug}`);
      const row = {
        id: postId,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        contentHtml: sanitiseRichText(post.contentHtml),
        featuredImageId: mediaId(POST_IMAGES[post.slug]),
        status: DRAFT_POSTS.has(post.slug) ? ("draft" as const) : ("published" as const),
        publishedAt: new Date(post.publishedAt),
      };
      const { id: _id, ...update } = row;
      await tx.insert(s.posts).values(row).onConflictDoUpdate({ target: s.posts.id, set: update });
      for (const category of post.categories) {
        const categoryId = seedId(`category:${category.slug}`);
        await tx.insert(s.categories).values({ id: categoryId, name: category.name, slug: category.slug }).onConflictDoNothing();
        await tx.insert(s.postCategories).values({ postId, categoryId }).onConflictDoNothing();
      }
      for (const tag of post.tags) {
        const tagId = seedId(`tag:${tag.slug}`);
        await tx.insert(s.tags).values({ id: tagId, name: tag.name, slug: tag.slug }).onConflictDoNothing();
        await tx.insert(s.postTags).values({ postId, tagId }).onConflictDoNothing();
      }
    }
    log(`${posts.length} blog posts`);
  });
}

/** Seeds only a brand-new database. Used automatically by local development mode. */
export async function seedIfEmpty() {
  loadEnv();
  const [row] = await db().select({ n: count() }).from(s.pages);
  if ((row?.n ?? 0) > 0) {
    await closeDb();
    return false;
  }
  console.log("[seed] empty database detected, loading launch content");
  await seed();
  await closeDb();
  return true;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  seed({ reset: process.argv.includes("--reset") })
    .then(() => closeDb())
    .then(() => console.log("[seed] done"))
    .catch(async (error) => {
      console.error(error);
      await closeDb().catch(() => {});
      process.exit(1);
    });
}
