"use server";

import { refresh } from "next/cache";
import { mapRichText, objectSchema } from "@/lib/blocks/fields";
import { type ActionResult, UUID_RE, guarded } from "@/lib/admin/action-helpers";
import { ENTITIES, type EntityData, type EntityKey } from "@/lib/admin/entities";
import { entityTitle, removeEntity, saveEntity } from "@/lib/admin/entity-store";
import {
  type PageInput,
  deletePage,
  duplicatePage,
  publishPage,
  restoreRevision,
  savePageDraft,
  setPageStatus,
} from "@/lib/admin/page-store";
import { logAudit, revalidateContent } from "@/lib/audit";
import { hasRole } from "@/lib/auth";
import { sanitiseRichText } from "@/lib/sanitise";

/* ---- generic content types ------------------------------------------------ */

export async function saveEntityAction(key: EntityKey, id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  const config = ENTITIES[key];
  if (!config) return { ok: false, message: "Unknown content type." };
  if (id !== null && !UUID_RE.test(id)) return { ok: false, message: "Invalid record." };

  return guarded(config.minRole, async (user) => {
    const parsed = objectSchema(config.fields).safeParse(input ?? {});
    if (!parsed.success) {
      return {
        ok: false,
        message: "Please fix the highlighted fields.",
        errors: Object.fromEntries(parsed.error.issues.map((issue) => [issue.path.join("."), issue.message])),
      };
    }
    const data = mapRichText(config.fields, parsed.data, sanitiseRichText) as EntityData[EntityKey];
    const result = await saveEntity(key, id, data);
    if (!result.ok) return { ok: false, message: "Please fix the highlighted fields.", errors: result.errors };

    const title = await entityTitle(key, result.id);
    await logAudit({ user, action: id ? `${config.singular}.update` : `${config.singular}.create`, entityType: key, entityId: result.id, summary: `${id ? "Updated" : "Created"} ${config.singular} "${title}"` });
    revalidateContent();
    return { ok: true, id: result.id, message: "Saved." };
  });
}

export async function deleteEntityAction(key: EntityKey, id: string): Promise<ActionResult> {
  const config = ENTITIES[key];
  if (!config || !UUID_RE.test(id)) return { ok: false, message: "Invalid record." };
  return guarded(config.deleteRole, async (user) => {
    const title = await entityTitle(key, id);
    await removeEntity(key, id);
    await logAudit({ user, action: `${config.singular}.delete`, entityType: key, entityId: id, summary: `Deleted ${config.singular} "${title}"` });
    revalidateContent();
    return { ok: true, message: "Deleted." };
  });
}

/* ---- pages ---------------------------------------------------------------- */

type PageResult = ActionResult<{ id: string }> & { sectionErrors?: Record<number, Record<string, string>> };

export async function savePageAction(id: string | null, input: PageInput, publish: boolean): Promise<PageResult> {
  if (id !== null && !UUID_RE.test(id)) return { ok: false, message: "Invalid page." };
  let sectionErrors: Record<number, Record<string, string>> | undefined;
  const result = await guarded<{ id: string }>("editor", async (user) => {
    const saved = await savePageDraft(id, input, user.id);
    if (!saved.ok) {
      sectionErrors = saved.sectionErrors;
      return { ok: false, message: saved.message, errors: saved.errors };
    }
    if (publish) {
      const published = await publishPage(saved.id, user.id);
      if (!published.ok) return { ok: false, message: published.message ?? "The page could not be published." };
      await logAudit({ user, action: "page.publish", entityType: "page", entityId: saved.id, summary: `Published page "${input.title}"` });
      revalidateContent();
      return { ok: true, id: saved.id, message: "Published. The live site has been updated." };
    }
    await logAudit({ user, action: id ? "page.save" : "page.create", entityType: "page", entityId: saved.id, summary: `Saved draft of page "${input.title}"` });
    // A draft changes nothing public, so nothing is revalidated; refresh only the editor's own status.
    refresh();
    return { ok: true, id: saved.id, message: "Draft saved. Visitors still see the last published version." };
  });
  return sectionErrors ? { ...result, sectionErrors } : result;
}

export async function setPageStatusAction(id: string, status: "draft" | "archived"): Promise<ActionResult> {
  if (!UUID_RE.test(id)) return { ok: false, message: "Invalid page." };
  return guarded("editor", async (user) => {
    await setPageStatus(id, status, user.id);
    await logAudit({ user, action: status === "draft" ? "page.unpublish" : "page.archive", entityType: "page", entityId: id, summary: status === "draft" ? "Unpublished a page" : "Archived a page" });
    revalidateContent();
    return { ok: true, message: status === "draft" ? "Unpublished. The page is no longer visible to visitors." : "Archived." };
  });
}

export async function duplicatePageAction(id: string): Promise<ActionResult<{ id: string }>> {
  if (!UUID_RE.test(id)) return { ok: false, message: "Invalid page." };
  return guarded("editor", async (user) => {
    const copyId = await duplicatePage(id, user.id);
    if (!copyId) return { ok: false, message: "Page not found." };
    await logAudit({ user, action: "page.duplicate", entityType: "page", entityId: copyId, summary: "Duplicated a page" });
    return { ok: true, id: copyId, message: "Copy created as a draft." };
  });
}

export async function deletePageAction(id: string): Promise<ActionResult> {
  if (!UUID_RE.test(id)) return { ok: false, message: "Invalid page." };
  return guarded("admin", async (user) => {
    const result = await deletePage(id);
    if (!result.ok) return { ok: false, message: result.message ?? "The page could not be deleted." };
    await logAudit({ user, action: "page.delete", entityType: "page", entityId: id, summary: "Deleted a page" });
    revalidateContent();
    return { ok: true, message: "Deleted." };
  });
}

export async function restoreRevisionAction(pageId: string, revisionId: string): Promise<ActionResult> {
  if (!UUID_RE.test(pageId) || !UUID_RE.test(revisionId)) return { ok: false, message: "Invalid revision." };
  return guarded("editor", async (user) => {
    if (!hasRole(user, "editor")) return { ok: false, message: "Not allowed." };
    const ok = await restoreRevision(pageId, revisionId, user.id);
    if (!ok) return { ok: false, message: "That version could not be found." };
    await logAudit({ user, action: "page.restore", entityType: "page", entityId: pageId, summary: "Restored an earlier version into the draft" });
    return { ok: true, message: "Earlier version restored as a draft. Review it, then publish." };
  });
}
