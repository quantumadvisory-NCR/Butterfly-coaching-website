/**
 * Database mapping for the admin-managed content types in entities.ts.
 * Callers must have authorised the user first (see app/admin/actions).
 */
import "server-only";
import { asc, desc, eq, isNull, sql } from "drizzle-orm";
import type { Option, ReferenceTarget } from "@/lib/blocks/fields";
import { db } from "@/lib/db";
import * as s from "@/lib/db/schema";
import { isReservedPath, normalisePath, slugify } from "@/lib/utils";
import type { EntityData, EntityKey } from "./entities";

export type ListRow = {
  id: string;
  title: string;
  subtitle?: string | null;
  status?: string | null;
  flags?: string[];
  /** Link to the item on the public site, when it has one. */
  href?: string | null;
};

export type SaveResult = { ok: true; id: string } | { ok: false; errors: Record<string, string> };

const fail = (errors: Record<string, string>): SaveResult => ({ ok: false, errors });
const nullable = (value: string | null | undefined) => (value && value.trim() ? value.trim() : null);
const hours = (value: number | null) => (value === null ? null : String(value));
const toDateInput = (value: Date | null) => (value ? value.toISOString().slice(0, 10) : "");

/** Turns a unique-constraint violation into a message on the right field. */
function uniqueError(error: unknown, map: Record<string, [field: string, message: string]>): SaveResult | null {
  const pg = (error as { cause?: { code?: string; constraint_name?: string } })?.cause ?? (error as { code?: string; constraint_name?: string });
  if (pg?.code !== "23505") return null;
  const hit = map[pg.constraint_name ?? ""] ?? Object.values(map)[0];
  return hit ? fail({ [hit[0]]: hit[1] }) : fail({ form: "That value is already in use." });
}

/* ---- options for reference fields ---------------------------------------- */

export async function referenceOptions(): Promise<Record<ReferenceTarget, Option[]>> {
  const [programmeRows, facultyRows, categoryRows, tagRows, groupRows] = await Promise.all([
    db().select({ id: s.programmes.id, name: s.programmes.name }).from(s.programmes).orderBy(asc(s.programmes.position)),
    db().select({ id: s.faculty.id, name: s.faculty.name }).from(s.faculty).orderBy(asc(s.faculty.position)),
    db().select({ id: s.categories.id, name: s.categories.name }).from(s.categories).orderBy(asc(s.categories.name)),
    db().select({ id: s.tags.id, name: s.tags.name }).from(s.tags).orderBy(asc(s.tags.name)),
    db().selectDistinct({ group: s.faqs.groupKey }).from(s.faqs).where(isNull(s.faqs.programmeId)).orderBy(asc(s.faqs.groupKey)),
  ]);
  const options = (rows: { id: string; name: string }[]) => rows.map((r) => ({ value: r.id, label: r.name }));
  return {
    programme: options(programmeRows),
    faculty: options(facultyRows),
    category: options(categoryRows),
    tag: options(tagRows),
    faqGroup: groupRows.map((r) => ({ value: r.group, label: r.group })),
  };
}

/* ---- list ---------------------------------------------------------------- */

export async function listEntities(key: EntityKey): Promise<ListRow[]> {
  switch (key) {
    case "programmes": {
      const rows = await db().select().from(s.programmes).orderBy(asc(s.programmes.position));
      return rows.map((r) => ({
        id: r.id,
        title: r.name,
        subtitle: r.path,
        status: r.status,
        flags: [r.isFeatured ? "On homepage" : "", r.kind === "certification" && r.accreditationStatus !== "accredited" ? "Accreditation not verified" : ""].filter(Boolean),
        href: r.status === "published" ? r.path : null,
      }));
    }
    case "faculty": {
      const rows = await db().select().from(s.faculty).orderBy(asc(s.faculty.position));
      return rows.map((r) => ({ id: r.id, title: r.name, subtitle: [r.credential, r.roleTitle].filter(Boolean).join(", "), status: r.status, flags: r.isFounder ? ["Founder"] : [] }));
    }
    case "testimonials": {
      const rows = await db().select().from(s.testimonials).orderBy(asc(s.testimonials.position));
      return rows.map((r) => ({
        id: r.id,
        title: r.name,
        subtitle: r.quote.length > 110 ? `${r.quote.slice(0, 110)}...` : r.quote,
        status: r.status,
        flags: r.isFeatured ? ["Featured"] : [],
      }));
    }
    case "faqs": {
      const rows = await db().select().from(s.faqs).where(isNull(s.faqs.programmeId)).orderBy(asc(s.faqs.groupKey), asc(s.faqs.position));
      return rows.map((r) => ({ id: r.id, title: r.question, subtitle: `Group: ${r.groupKey}`, status: r.status }));
    }
    case "posts": {
      const rows = await db().select().from(s.posts).orderBy(desc(s.posts.publishedAt), desc(s.posts.createdAt));
      return rows.map((r) => ({
        id: r.id,
        title: r.title,
        subtitle: r.publishedAt ? `Published ${r.publishedAt.toISOString().slice(0, 10)}` : "Not published yet",
        status: r.status,
        href: r.status === "published" ? `/${r.slug}/` : null,
      }));
    }
    case "categories": {
      const rows = await db().select().from(s.categories).orderBy(asc(s.categories.name));
      return rows.map((r) => ({ id: r.id, title: r.name, subtitle: `/blog/category/${r.slug}/`, href: `/blog/category/${r.slug}/` }));
    }
    case "tags": {
      const rows = await db().select().from(s.tags).orderBy(asc(s.tags.name));
      return rows.map((r) => ({ id: r.id, title: r.name, subtitle: `/blog/tag/${r.slug}/`, href: `/blog/tag/${r.slug}/` }));
    }
    case "resources": {
      const rows = await db().select().from(s.resources).orderBy(asc(s.resources.position));
      return rows.map((r) => ({ id: r.id, title: r.title, subtitle: r.description, status: r.status, flags: r.fileId ? [] : ["No file attached"] }));
    }
    case "redirects": {
      const rows = await db().select().from(s.redirects).orderBy(asc(s.redirects.sourcePath));
      return rows.map((r) => ({
        id: r.id,
        title: r.sourcePath,
        subtitle: `to ${r.destination} (${r.statusCode})`,
        status: r.isActive ? "published" : "draft",
      }));
    }
  }
}

/* ---- load ---------------------------------------------------------------- */

export async function loadEntity<K extends EntityKey>(key: K, id: string): Promise<EntityData[K] | null> {
  const result = await loadAny(key, id);
  return result as EntityData[K] | null;
}

async function loadAny(key: EntityKey, id: string): Promise<EntityData[EntityKey] | null> {
  switch (key) {
    case "programmes": {
      const [r] = await db().select().from(s.programmes).where(eq(s.programmes.id, id)).limit(1);
      if (!r) return null;
      const [modules, cohortRows, links, faqRows] = await Promise.all([
        db().select().from(s.programmeModules).where(eq(s.programmeModules.programmeId, id)).orderBy(asc(s.programmeModules.position)),
        db().select().from(s.cohorts).where(eq(s.cohorts.programmeId, id)).orderBy(asc(s.cohorts.startDate)),
        db().select().from(s.programmeFaculty).where(eq(s.programmeFaculty.programmeId, id)).orderBy(asc(s.programmeFaculty.position)),
        db().select().from(s.faqs).where(eq(s.faqs.programmeId, id)).orderBy(asc(s.faqs.position)),
      ]);
      return {
        name: r.name,
        slug: r.slug,
        path: r.path,
        kind: r.kind,
        status: r.status,
        isFeatured: r.isFeatured,
        position: r.position,
        levelLabel: r.levelLabel ?? "",
        credential: r.credential ?? "",
        tagline: r.tagline,
        summary: r.summary,
        descriptionHtml: r.descriptionHtml,
        audience: r.audience,
        eligibility: r.eligibility,
        outcomes: r.outcomes,
        highlights: r.highlights,
        educationHours: r.educationHours === null ? null : Number(r.educationHours),
        mentoringHours: r.mentoringHours === null ? null : Number(r.mentoringHours),
        experienceHours: r.experienceHours,
        duration: r.duration ?? "",
        format: r.format ?? "",
        languages: r.languages ?? "",
        feeText: r.feeText ?? "",
        feeNote: r.feeNote ?? "",
        cohorts: cohortRows.map((c) => ({
          label: c.label,
          startDate: c.startDate,
          endDate: c.endDate ?? "",
          schedule: c.schedule ?? "",
          note: c.note ?? "",
          isOpen: c.isOpen,
        })),
        accreditationStatus: r.accreditationStatus,
        accreditationNote: r.accreditationNote ?? "",
        badgeId: r.badgeId,
        heroImageId: r.heroImageId,
        cardImageId: r.cardImageId,
        brochureId: r.brochureId,
        modules: modules.map((m) => ({ title: m.title, description: m.description, hoursLabel: m.hoursLabel ?? "" })),
        facultyIds: links.map((l) => l.facultyId),
        faqs: faqRows.map((f) => ({ question: f.question, answerHtml: f.answerHtml })),
        seoTitle: r.seoTitle ?? "",
        seoDescription: r.seoDescription ?? "",
      } satisfies EntityData["programmes"];
    }
    case "faculty": {
      const [r] = await db().select().from(s.faculty).where(eq(s.faculty.id, id)).limit(1);
      if (!r) return null;
      return {
        name: r.name,
        slug: r.slug,
        credential: r.credential ?? "",
        roleTitle: r.roleTitle,
        shortBio: r.shortBio,
        bioHtml: r.bioHtml,
        photoId: r.photoId,
        linkedinUrl: r.linkedinUrl ?? "",
        isFounder: r.isFounder,
        position: r.position,
        status: r.status,
      } satisfies EntityData["faculty"];
    }
    case "testimonials": {
      const [r] = await db().select().from(s.testimonials).where(eq(s.testimonials.id, id)).limit(1);
      if (!r) return null;
      return {
        name: r.name,
        roleTitle: r.roleTitle ?? "",
        organisation: r.organisation ?? "",
        quote: r.quote,
        excerpt: r.excerpt ?? "",
        photoId: r.photoId,
        videoUrl: r.videoUrl ?? "",
        programmeId: r.programmeId ?? "",
        status: r.status,
        isFeatured: r.isFeatured,
        position: r.position,
        sourceNote: r.sourceNote ?? "",
      } satisfies EntityData["testimonials"];
    }
    case "faqs": {
      const [r] = await db().select().from(s.faqs).where(eq(s.faqs.id, id)).limit(1);
      if (!r) return null;
      return { question: r.question, answerHtml: r.answerHtml, groupKey: r.groupKey, position: r.position, status: r.status } satisfies EntityData["faqs"];
    }
    case "posts": {
      const [r] = await db().select().from(s.posts).where(eq(s.posts.id, id)).limit(1);
      if (!r) return null;
      const [cats, tagRows] = await Promise.all([
        db().select().from(s.postCategories).where(eq(s.postCategories.postId, id)),
        db().select().from(s.postTags).where(eq(s.postTags.postId, id)),
      ]);
      return {
        title: r.title,
        slug: r.slug,
        excerpt: r.excerpt,
        contentHtml: r.contentHtml,
        featuredImageId: r.featuredImageId,
        authorName: r.authorName,
        status: r.status,
        publishedAt: toDateInput(r.publishedAt),
        categoryIds: cats.map((c) => c.categoryId),
        tagIds: tagRows.map((t) => t.tagId),
        seoTitle: r.seoTitle ?? "",
        seoDescription: r.seoDescription ?? "",
      } satisfies EntityData["posts"];
    }
    case "categories": {
      const [r] = await db().select().from(s.categories).where(eq(s.categories.id, id)).limit(1);
      return r ? ({ name: r.name, slug: r.slug, description: r.description ?? "" } satisfies EntityData["categories"]) : null;
    }
    case "tags": {
      const [r] = await db().select().from(s.tags).where(eq(s.tags.id, id)).limit(1);
      return r ? ({ name: r.name, slug: r.slug } satisfies EntityData["tags"]) : null;
    }
    case "resources": {
      const [r] = await db().select().from(s.resources).where(eq(s.resources.id, id)).limit(1);
      return r
        ? ({ title: r.title, description: r.description, fileId: r.fileId, coverId: r.coverId, status: r.status, position: r.position } satisfies EntityData["resources"])
        : null;
    }
    case "redirects": {
      const [r] = await db().select().from(s.redirects).where(eq(s.redirects.id, id)).limit(1);
      return r
        ? ({ sourcePath: r.sourcePath, destination: r.destination, statusCode: String(r.statusCode), isActive: r.isActive, note: r.note ?? "" } satisfies EntityData["redirects"])
        : null;
    }
  }
}

/* ---- save ---------------------------------------------------------------- */

type ContentStatus = (typeof s.CONTENT_STATUS)[number];

/** True when another page, programme or post already answers at this path. */
async function pathTakenBy(path: string, except: { table: "pages" | "programmes" | "posts"; id: string | null }): Promise<string | null> {
  const [page] = await db().select({ id: s.pages.id }).from(s.pages).where(eq(s.pages.path, path)).limit(1);
  if (page && !(except.table === "pages" && except.id === page.id)) return "a page";
  const [programme] = await db().select({ id: s.programmes.id, kind: s.programmes.kind }).from(s.programmes).where(eq(s.programmes.path, path)).limit(1);
  if (programme && !(except.table === "programmes" && except.id === programme.id)) return "a programme";
  const segments = path.split("/").filter(Boolean);
  if (segments.length === 1) {
    const [post] = await db().select({ id: s.posts.id }).from(s.posts).where(eq(s.posts.slug, segments[0]!)).limit(1);
    if (post && !(except.table === "posts" && except.id === post.id)) return "an article";
  }
  return null;
}

export { pathTakenBy };

export async function saveEntity<K extends EntityKey>(key: K, id: string | null, input: EntityData[K]): Promise<SaveResult> {
  try {
    return await saveAny(key, id, input);
  } catch (error) {
    const unique = uniqueError(error, {
      programmes_slug_key: ["slug", "Another programme already uses this identifier."],
      programmes_path_key: ["path", "Another programme already uses this address."],
      faculty_slug_key: ["slug", "Another profile already uses this identifier."],
      posts_slug_key: ["slug", "Another article already uses this address."],
      categories_slug_key: ["slug", "Another category already uses this address."],
      tags_slug_key: ["slug", "Another tag already uses this address."],
      redirects_source_key: ["sourcePath", "There is already a redirect from this address."],
    });
    if (unique) return unique;
    throw error;
  }
}

async function saveAny(key: EntityKey, id: string | null, input: EntityData[EntityKey]): Promise<SaveResult> {
  const now = new Date();
  switch (key) {
    case "programmes": {
      const d = input as EntityData["programmes"];
      const path = normalisePath(d.path);
      if (isReservedPath(path) || path === "/") return fail({ path: "This address is reserved. Please choose another." });
      // A certification programme renders its own page, so it must not clash with an article.
      // (A page at the same path is allowed: it deliberately replaces the built-in template.)
      const taken = await pathTakenBy(path, { table: "programmes", id });
      if (taken === "a programme" || taken === "an article") return fail({ path: `This address is already used by ${taken}.` });
      const slug = slugify(d.slug);
      if (!slug) return fail({ slug: "Use letters, numbers and hyphens." });
      const values = {
        name: d.name,
        slug,
        path,
        kind: d.kind as (typeof s.PROGRAMME_KINDS)[number],
        status: d.status as ContentStatus,
        isFeatured: d.isFeatured,
        position: d.position ?? 0,
        levelLabel: nullable(d.levelLabel),
        credential: nullable(d.credential),
        tagline: d.tagline,
        summary: d.summary,
        descriptionHtml: d.descriptionHtml,
        audience: d.audience,
        eligibility: d.eligibility,
        outcomes: d.outcomes,
        highlights: d.highlights,
        educationHours: hours(d.educationHours),
        mentoringHours: hours(d.mentoringHours),
        experienceHours: d.experienceHours === null ? null : Math.round(d.experienceHours),
        duration: nullable(d.duration),
        format: nullable(d.format),
        languages: nullable(d.languages),
        feeText: nullable(d.feeText),
        feeNote: nullable(d.feeNote),
        accreditationStatus: d.accreditationStatus as (typeof s.ACCREDITATION_STATUS)[number],
        accreditationNote: nullable(d.accreditationNote),
        badgeId: d.badgeId,
        heroImageId: d.heroImageId,
        cardImageId: d.cardImageId,
        brochureId: d.brochureId,
        seoTitle: nullable(d.seoTitle),
        seoDescription: nullable(d.seoDescription),
        updatedAt: now,
      };
      const savedId = await db().transaction(async (tx) => {
        let programmeId = id;
        if (programmeId) await tx.update(s.programmes).set(values).where(eq(s.programmes.id, programmeId));
        else programmeId = (await tx.insert(s.programmes).values(values).returning({ id: s.programmes.id }))[0]!.id;

        await tx.delete(s.programmeModules).where(eq(s.programmeModules.programmeId, programmeId));
        if (d.modules.length) {
          await tx.insert(s.programmeModules).values(
            d.modules.map((m, position) => ({ programmeId: programmeId!, position, title: m.title, description: m.description, hoursLabel: nullable(m.hoursLabel) })),
          );
        }
        await tx.delete(s.cohorts).where(eq(s.cohorts.programmeId, programmeId));
        const cohorts = d.cohorts.filter((c) => c.startDate);
        if (cohorts.length) {
          await tx.insert(s.cohorts).values(
            cohorts.map((c) => ({
              programmeId: programmeId!,
              label: c.label,
              startDate: c.startDate,
              endDate: nullable(c.endDate),
              schedule: nullable(c.schedule),
              note: nullable(c.note),
              isOpen: c.isOpen,
            })),
          );
        }
        await tx.delete(s.programmeFaculty).where(eq(s.programmeFaculty.programmeId, programmeId));
        if (d.facultyIds.length) {
          await tx.insert(s.programmeFaculty).values([...new Set(d.facultyIds)].map((facultyId, position) => ({ programmeId: programmeId!, facultyId, position })));
        }
        await tx.delete(s.faqs).where(eq(s.faqs.programmeId, programmeId));
        if (d.faqs.length) {
          await tx.insert(s.faqs).values(
            d.faqs.map((f, position) => ({ question: f.question, answerHtml: f.answerHtml, groupKey: "programme", programmeId: programmeId!, position, status: "published" as const })),
          );
        }
        return programmeId;
      });
      return { ok: true, id: savedId };
    }

    case "faculty": {
      const d = input as EntityData["faculty"];
      const slug = slugify(d.slug);
      if (!slug) return fail({ slug: "Use letters, numbers and hyphens." });
      const values = {
        name: d.name,
        slug,
        credential: nullable(d.credential),
        roleTitle: d.roleTitle,
        shortBio: d.shortBio,
        bioHtml: d.bioHtml,
        photoId: d.photoId,
        linkedinUrl: nullable(d.linkedinUrl),
        isFounder: d.isFounder,
        position: d.position ?? 0,
        status: d.status as ContentStatus,
        updatedAt: now,
      };
      if (id) {
        await db().update(s.faculty).set(values).where(eq(s.faculty.id, id));
        return { ok: true, id };
      }
      const [row] = await db().insert(s.faculty).values(values).returning({ id: s.faculty.id });
      return { ok: true, id: row!.id };
    }

    case "testimonials": {
      const d = input as EntityData["testimonials"];
      // Integrity rule: an extract may shorten a testimonial but never reword it.
      const collapse = (text: string) => text.replace(/\s+/g, " ").trim();
      if (d.excerpt && !collapse(d.quote).includes(collapse(d.excerpt))) {
        return fail({ excerpt: "The extract must be copied exactly from the testimonial. It cannot be reworded." });
      }
      const values = {
        name: d.name,
        roleTitle: nullable(d.roleTitle),
        organisation: nullable(d.organisation),
        quote: d.quote,
        excerpt: nullable(d.excerpt),
        photoId: d.photoId,
        videoUrl: nullable(d.videoUrl),
        programmeId: nullable(d.programmeId),
        status: d.status as (typeof s.TESTIMONIAL_STATUS)[number],
        isFeatured: d.isFeatured,
        position: d.position ?? 0,
        sourceNote: nullable(d.sourceNote),
        updatedAt: now,
      };
      if (id) {
        await db().update(s.testimonials).set(values).where(eq(s.testimonials.id, id));
        return { ok: true, id };
      }
      const [row] = await db().insert(s.testimonials).values(values).returning({ id: s.testimonials.id });
      return { ok: true, id: row!.id };
    }

    case "faqs": {
      const d = input as EntityData["faqs"];
      const groupKey = slugify(d.groupKey);
      if (!groupKey) return fail({ groupKey: "Give the group a short name, such as home or corporate." });
      const values = { question: d.question, answerHtml: d.answerHtml, groupKey, position: d.position ?? 0, status: d.status as ContentStatus, updatedAt: now };
      if (id) {
        await db().update(s.faqs).set(values).where(eq(s.faqs.id, id));
        return { ok: true, id };
      }
      const [row] = await db().insert(s.faqs).values(values).returning({ id: s.faqs.id });
      return { ok: true, id: row!.id };
    }

    case "posts": {
      const d = input as EntityData["posts"];
      const slug = slugify(d.slug);
      if (!slug) return fail({ slug: "Use letters, numbers and hyphens." });
      const path = `/${slug}/`;
      if (isReservedPath(path)) return fail({ slug: "This address is reserved. Please choose another." });
      const taken = await pathTakenBy(path, { table: "posts", id });
      if (taken) return fail({ slug: `This address is already used by ${taken}.` });
      const status = d.status as ContentStatus;
      const publishedAt = d.publishedAt ? new Date(`${d.publishedAt}T06:30:00Z`) : status === "published" ? now : null;
      const values = {
        title: d.title,
        slug,
        excerpt: d.excerpt,
        contentHtml: d.contentHtml,
        featuredImageId: d.featuredImageId,
        authorName: d.authorName || "Butterfly Coaching Academy",
        status,
        publishedAt,
        seoTitle: nullable(d.seoTitle),
        seoDescription: nullable(d.seoDescription),
        updatedAt: now,
      };
      const savedId = await db().transaction(async (tx) => {
        let postId = id;
        if (postId) await tx.update(s.posts).set(values).where(eq(s.posts.id, postId));
        else postId = (await tx.insert(s.posts).values(values).returning({ id: s.posts.id }))[0]!.id;
        await tx.delete(s.postCategories).where(eq(s.postCategories.postId, postId));
        if (d.categoryIds.length) await tx.insert(s.postCategories).values([...new Set(d.categoryIds)].map((categoryId) => ({ postId: postId!, categoryId })));
        await tx.delete(s.postTags).where(eq(s.postTags.postId, postId));
        if (d.tagIds.length) await tx.insert(s.postTags).values([...new Set(d.tagIds)].map((tagId) => ({ postId: postId!, tagId })));
        return postId;
      });
      return { ok: true, id: savedId };
    }

    case "categories":
    case "tags": {
      const d = input as EntityData["categories"];
      const slug = slugify(d.slug || d.name);
      if (!slug) return fail({ slug: "Use letters, numbers and hyphens." });
      if (key === "categories") {
        const values = { name: d.name, slug, description: nullable(d.description) };
        if (id) {
          await db().update(s.categories).set(values).where(eq(s.categories.id, id));
          return { ok: true, id };
        }
        const [row] = await db().insert(s.categories).values(values).returning({ id: s.categories.id });
        return { ok: true, id: row!.id };
      }
      const values = { name: d.name, slug };
      if (id) {
        await db().update(s.tags).set(values).where(eq(s.tags.id, id));
        return { ok: true, id };
      }
      const [row] = await db().insert(s.tags).values(values).returning({ id: s.tags.id });
      return { ok: true, id: row!.id };
    }

    case "resources": {
      const d = input as EntityData["resources"];
      if (d.status === "published" && !d.fileId) return fail({ fileId: "Attach the file before publishing this resource." });
      const values = { title: d.title, description: d.description, fileId: d.fileId, coverId: d.coverId, status: d.status as ContentStatus, position: d.position ?? 0, updatedAt: now };
      if (id) {
        await db().update(s.resources).set(values).where(eq(s.resources.id, id));
        return { ok: true, id };
      }
      const [row] = await db().insert(s.resources).values(values).returning({ id: s.resources.id });
      return { ok: true, id: row!.id };
    }

    case "redirects": {
      const d = input as EntityData["redirects"];
      const sourcePath = normalisePath(d.sourcePath);
      if (sourcePath === "/" || isReservedPath(sourcePath)) return fail({ sourcePath: "This address cannot be redirected." });
      if (normalisePath(d.destination) === sourcePath && !/^https?:/i.test(d.destination)) {
        return fail({ destination: "The new address must be different from the old one." });
      }
      const values = { sourcePath, destination: d.destination, statusCode: d.statusCode === "302" ? 302 : 301, isActive: d.isActive, note: nullable(d.note), updatedAt: now };
      if (id) {
        await db().update(s.redirects).set(values).where(eq(s.redirects.id, id));
        return { ok: true, id };
      }
      const [row] = await db().insert(s.redirects).values(values).returning({ id: s.redirects.id });
      return { ok: true, id: row!.id };
    }
  }
}

/* ---- delete -------------------------------------------------------------- */

const TABLES = {
  programmes: s.programmes,
  faculty: s.faculty,
  testimonials: s.testimonials,
  faqs: s.faqs,
  posts: s.posts,
  categories: s.categories,
  tags: s.tags,
  resources: s.resources,
  redirects: s.redirects,
} as const;

export async function removeEntity(key: EntityKey, id: string): Promise<void> {
  const table = TABLES[key];
  await db().delete(table).where(eq(table.id, id));
}

export async function entityTitle(key: EntityKey, id: string): Promise<string> {
  const rows = await listEntities(key);
  return rows.find((row) => row.id === id)?.title ?? id;
}

/** Counts used on the admin dashboard. */
export async function contentCounts() {
  const [row] = await db().execute<{
    new_enquiries: number;
    open_enquiries: number;
    pending_testimonials: number;
    draft_pages: number;
    unpublished_changes: number;
    subscribers: number;
    media_missing_alt: number;
  }>(sql`
    select
      (select count(*)::int from enquiries where status = 'new') as new_enquiries,
      (select count(*)::int from enquiries where status in ('new','in_progress','contacted')) as open_enquiries,
      (select count(*)::int from testimonials where status = 'pending') as pending_testimonials,
      (select count(*)::int from pages where status = 'draft') as draft_pages,
      (select count(*)::int from pages where status = 'published' and has_unpublished_changes) as unpublished_changes,
      (select count(*)::int from newsletter_subscribers where status = 'subscribed') as subscribers,
      (select count(*)::int from media where kind = 'image' and alt = '') as media_missing_alt
  `);
  return row!;
}

