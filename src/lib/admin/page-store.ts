/**
 * Page builder persistence. The working copy lives in pages + page_sections;
 * publishing freezes it into a revision, which is what the public site renders.
 */
import "server-only";
import { randomUUID } from "node:crypto";
import { and, asc, desc, eq } from "drizzle-orm";
import { isBlockType, validateBlockData } from "@/lib/blocks/registry";
import { type PageSnapshotData, buildPageSnapshot } from "@/lib/content/snapshot";
import { db } from "@/lib/db";
import * as s from "@/lib/db/schema";
import { sanitiseRichText } from "@/lib/sanitise";
import { isReservedPath, normalisePath } from "@/lib/utils";
import { pathTakenBy } from "./entity-store";

export type SectionInput = { id?: string; type: string; data: unknown; isHidden?: boolean };

export type PageInput = {
  title: string;
  path: string;
  seoTitle: string;
  seoDescription: string;
  ogImageId: string | null;
  noindex: boolean;
  sections: SectionInput[];
};

export type PageSaveResult =
  | { ok: true; id: string }
  | { ok: false; message: string; errors?: Record<string, string>; sectionErrors?: Record<number, Record<string, string>> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function listPages() {
  return db()
    .select({
      id: s.pages.id,
      title: s.pages.title,
      path: s.pages.path,
      status: s.pages.status,
      hasUnpublishedChanges: s.pages.hasUnpublishedChanges,
      isSystem: s.pages.isSystem,
      updatedAt: s.pages.updatedAt,
      publishedAt: s.pages.publishedAt,
    })
    .from(s.pages)
    .orderBy(asc(s.pages.path));
}

export async function loadPage(id: string) {
  if (!UUID.test(id)) return null;
  // Both queries in one round trip: the sections do not depend on the page row.
  const [[page], sections] = await Promise.all([
    db().select().from(s.pages).where(eq(s.pages.id, id)).limit(1),
    db().select().from(s.pageSections).where(eq(s.pageSections.pageId, id)).orderBy(asc(s.pageSections.position)),
  ]);
  if (!page) return null;
  return { page, sections };
}

/** Saves the working copy. Nothing changes on the public site until publishPage(). */
export async function savePageDraft(id: string | null, input: PageInput, userId: string): Promise<PageSaveResult> {
  const errors: Record<string, string> = {};
  const title = input.title.trim();
  if (!title) errors.title = "Give the page a title.";
  if (title.length > 160) errors.title = "Keep the title under 160 characters.";

  const path = normalisePath(input.path || "/");
  if (!/^\/([a-z0-9-]+\/)*$/.test(path)) errors.path = "Use lower-case letters, numbers and hyphens, e.g. /about-us/.";
  else if (isReservedPath(path)) errors.path = "This address is reserved by the website. Please choose another.";
  else {
    const taken = await pathTakenBy(path, { table: "pages", id });
    // A page may share a path with a programme: it then replaces the built-in programme template.
    if (taken === "a page" || taken === "an article") errors.path = `This address is already used by ${taken}.`;
  }

  const sectionErrors: Record<number, Record<string, string>> = {};
  const sections = input.sections.map((section, position) => {
    if (!isBlockType(section.type)) {
      sectionErrors[position] = { type: "Unknown block type." };
      return null;
    }
    const result = validateBlockData(section.type, section.data, sanitiseRichText);
    if (!result.ok) {
      sectionErrors[position] = Object.fromEntries(result.errors.map((e) => [e.path, e.message]));
      return null;
    }
    return {
      id: section.id && UUID.test(section.id) ? section.id : randomUUID(),
      type: section.type,
      position,
      data: result.data,
      isHidden: Boolean(section.isHidden),
    };
  });

  if (Object.keys(errors).length || Object.keys(sectionErrors).length) {
    return { ok: false, message: "Please fix the highlighted fields.", errors, sectionErrors };
  }

  const fields = {
    title,
    path,
    seoTitle: input.seoTitle.trim() || null,
    seoDescription: input.seoDescription.trim() || null,
    ogImageId: input.ogImageId && UUID.test(input.ogImageId) ? input.ogImageId : null,
    noindex: Boolean(input.noindex),
    hasUnpublishedChanges: true,
    updatedBy: userId,
    updatedAt: new Date(),
  };

  const pageId = await db().transaction(async (tx) => {
    let savedId = id;
    if (savedId) {
      await tx.update(s.pages).set(fields).where(eq(s.pages.id, savedId));
    } else {
      savedId = (await tx.insert(s.pages).values({ ...fields, status: "draft", createdBy: userId }).returning({ id: s.pages.id }))[0]!.id;
    }
    await tx.delete(s.pageSections).where(eq(s.pageSections.pageId, savedId));
    const rows = sections.filter((x) => x !== null).map((section) => ({ ...section, pageId: savedId! }));
    if (rows.length) await tx.insert(s.pageSections).values(rows);
    return savedId;
  });
  return { ok: true, id: pageId };
}

/** Publishes the current working copy: snapshot, then point the page at it. */
export async function publishPage(id: string, userId: string): Promise<{ ok: boolean; message?: string }> {
  const loaded = await loadPage(id);
  if (!loaded) return { ok: false, message: "Page not found." };
  if (loaded.sections.filter((section) => !section.isHidden).length === 0) {
    return { ok: false, message: "Add at least one visible section before publishing." };
  }
  const snapshot = buildPageSnapshot(loaded.page, loaded.sections);
  await db().transaction(async (tx) => {
    const [revision] = await tx
      .insert(s.revisions)
      .values({ entityType: "page", entityId: id, snapshot, label: "Published", createdBy: userId })
      .returning({ id: s.revisions.id });
    await tx
      .update(s.pages)
      .set({ status: "published", publishedRevisionId: revision!.id, publishedAt: new Date(), hasUnpublishedChanges: false, updatedBy: userId, updatedAt: new Date() })
      .where(eq(s.pages.id, id));
  });
  return { ok: true };
}

export async function setPageStatus(id: string, status: "draft" | "archived", userId: string) {
  await db().update(s.pages).set({ status, updatedBy: userId, updatedAt: new Date() }).where(eq(s.pages.id, id));
}

export async function duplicatePage(id: string, userId: string): Promise<string | null> {
  const loaded = await loadPage(id);
  if (!loaded) return null;
  const base = loaded.page.path === "/" ? "/home" : loaded.page.path.replace(/\/$/, "");
  let path = `${base}-copy/`;
  for (let n = 2; await pathTakenBy(path, { table: "pages", id: null }); n += 1) path = `${base}-copy-${n}/`;
  return db().transaction(async (tx) => {
    const [copy] = await tx
      .insert(s.pages)
      .values({
        title: `${loaded.page.title} (copy)`,
        path,
        status: "draft",
        seoTitle: loaded.page.seoTitle,
        seoDescription: loaded.page.seoDescription,
        ogImageId: loaded.page.ogImageId,
        noindex: loaded.page.noindex,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning({ id: s.pages.id });
    if (loaded.sections.length) {
      await tx.insert(s.pageSections).values(
        loaded.sections.map((section) => ({ pageId: copy!.id, type: section.type, position: section.position, data: section.data, isHidden: section.isHidden })),
      );
    }
    return copy!.id;
  });
}

export async function deletePage(id: string): Promise<{ ok: boolean; message?: string }> {
  const [page] = await db().select({ isSystem: s.pages.isSystem }).from(s.pages).where(eq(s.pages.id, id)).limit(1);
  if (!page) return { ok: false, message: "Page not found." };
  if (page.isSystem) return { ok: false, message: "This is a core page and cannot be deleted. You can unpublish or archive it instead." };
  await db().transaction(async (tx) => {
    await tx.delete(s.revisions).where(and(eq(s.revisions.entityType, "page"), eq(s.revisions.entityId, id)));
    await tx.delete(s.pages).where(eq(s.pages.id, id));
  });
  return { ok: true };
}

export async function listRevisions(pageId: string) {
  return db()
    .select({ id: s.revisions.id, label: s.revisions.label, createdAt: s.revisions.createdAt, email: s.profiles.email })
    .from(s.revisions)
    .leftJoin(s.profiles, eq(s.profiles.id, s.revisions.createdBy))
    .where(and(eq(s.revisions.entityType, "page"), eq(s.revisions.entityId, pageId)))
    .orderBy(desc(s.revisions.createdAt))
    .limit(30);
}

/** Copies an earlier published version back into the working copy. It still needs publishing. */
export async function restoreRevision(pageId: string, revisionId: string, userId: string): Promise<boolean> {
  const [revision] = await db()
    .select()
    .from(s.revisions)
    .where(and(eq(s.revisions.id, revisionId), eq(s.revisions.entityType, "page"), eq(s.revisions.entityId, pageId)))
    .limit(1);
  if (!revision) return false;
  const snapshot = revision.snapshot as PageSnapshotData;
  await db().transaction(async (tx) => {
    await tx
      .update(s.pages)
      .set({
        title: snapshot.title,
        seoTitle: snapshot.seoTitle,
        seoDescription: snapshot.seoDescription,
        ogImageId: snapshot.ogImageId,
        noindex: snapshot.noindex,
        hasUnpublishedChanges: true,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(s.pages.id, pageId));
    await tx.delete(s.pageSections).where(eq(s.pageSections.pageId, pageId));
    const rows = (snapshot.sections ?? [])
      .filter((section) => isBlockType(section.type))
      .map((section, position) => ({ pageId, type: section.type, position, data: section.data, isHidden: section.isHidden }));
    if (rows.length) await tx.insert(s.pageSections).values(rows);
  });
  return true;
}
