"use server";

import { count, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { type ActionResult, UUID_RE, guarded } from "@/lib/admin/action-helpers";
import { type MediaRow, type MediaUsage, deleteMedia, findMediaUsage, listMedia } from "@/lib/admin/media-store";
import { logAudit, revalidateContent } from "@/lib/audit";
import { createStaffUser, deleteStaffUser, passwordProblem, setStaffPassword } from "@/lib/auth";
import { type Field, hrefSchema, mapRichText, objectSchema } from "@/lib/blocks/fields";
import { db } from "@/lib/db";
import * as s from "@/lib/db/schema";
import { sanitisePlainText, sanitiseRichText } from "@/lib/sanitise";
import { SETTINGS_GROUPS, type SettingsKey } from "@/lib/settings";

/* ---- media ---------------------------------------------------------------- */

/** Client-safe view of a media item for the library and picker. */
export type MediaView = Pick<
  MediaRow,
  "id" | "kind" | "source" | "storage" | "url" | "filename" | "mimeType" | "sizeBytes" | "width" | "height" | "alt" | "caption" | "credit" | "licence" | "sourceUrl" | "focalX" | "focalY"
> & { createdAt: string };

function toView(m: MediaRow): MediaView {
  return {
    id: m.id,
    kind: m.kind,
    source: m.source,
    storage: m.storage,
    url: m.url,
    filename: m.filename,
    mimeType: m.mimeType,
    sizeBytes: m.sizeBytes,
    width: m.width,
    height: m.height,
    alt: m.alt,
    caption: m.caption,
    credit: m.credit,
    licence: m.licence,
    sourceUrl: m.sourceUrl,
    focalX: m.focalX,
    focalY: m.focalY,
    createdAt: m.createdAt.toISOString(),
  };
}

export async function listMediaAction(): Promise<ActionResult<{ items: MediaView[] }>> {
  return guarded("editor", async () => ({ ok: true, items: (await listMedia()).map(toView) }));
}

const mediaMeta = z.object({
  alt: z.string().trim().max(300),
  caption: z.string().trim().max(300),
  credit: z.string().trim().max(200),
  licence: z.string().trim().max(500),
  sourceUrl: hrefSchema,
  source: z.enum(s.MEDIA_SOURCES),
  focalX: z.number().min(0).max(1),
  focalY: z.number().min(0).max(1),
});

export async function updateMediaAction(id: string, input: unknown): Promise<ActionResult<{ item: MediaView }>> {
  if (!UUID_RE.test(id)) return { ok: false, message: "Invalid media item." };
  return guarded("editor", async (user) => {
    const parsed = mediaMeta.safeParse(input);
    if (!parsed.success) {
      return { ok: false, message: "Please check the fields.", errors: Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])) };
    }
    const d = parsed.data;
    const [row] = await db()
      .update(s.media)
      .set({
        alt: sanitisePlainText(d.alt),
        caption: d.caption ? sanitisePlainText(d.caption) : null,
        credit: d.credit ? sanitisePlainText(d.credit) : null,
        licence: d.licence ? sanitisePlainText(d.licence) : null,
        sourceUrl: d.sourceUrl || null,
        source: d.source,
        focalX: d.focalX,
        focalY: d.focalY,
        updatedAt: new Date(),
      })
      .where(eq(s.media.id, id))
      .returning();
    if (!row) return { ok: false, message: "That media item no longer exists." };
    await logAudit({ user, action: "media.update", entityType: "media", entityId: id, summary: `Updated media "${row.filename}"` });
    revalidateContent();
    return { ok: true, item: toView(row), message: "Saved." };
  });
}

export async function mediaUsageAction(id: string): Promise<ActionResult<{ usage: MediaUsage[] }>> {
  if (!UUID_RE.test(id)) return { ok: false, message: "Invalid media item." };
  return guarded("editor", async () => ({ ok: true, usage: await findMediaUsage(id) }));
}

export async function deleteMediaAction(id: string, force: boolean): Promise<ActionResult<{ usage?: MediaUsage[] }>> {
  if (!UUID_RE.test(id)) return { ok: false, message: "Invalid media item." };
  return guarded("admin", async (user) => {
    const result = await deleteMedia(id, force);
    if (!result.ok) return { ok: true, usage: result.usage, message: result.message };
    await logAudit({ user, action: "media.delete", entityType: "media", entityId: id, summary: "Deleted a media item" });
    revalidateContent();
    return { ok: true, message: "Deleted." };
  });
}

/* ---- enquiries ------------------------------------------------------------ */

export async function updateEnquiryStatusAction(id: string, status: string): Promise<ActionResult> {
  if (!UUID_RE.test(id)) return { ok: false, message: "Invalid enquiry." };
  const parsed = z.enum(s.ENQUIRY_STATUS).safeParse(status);
  if (!parsed.success) return { ok: false, message: "Unknown status." };
  return guarded("editor", async (user) => {
    await db().update(s.enquiries).set({ status: parsed.data, updatedAt: new Date() }).where(eq(s.enquiries.id, id));
    await logAudit({ user, action: "enquiry.status", entityType: "enquiry", entityId: id, summary: `Marked an enquiry as ${parsed.data.replace("_", " ")}` });
    return { ok: true, message: "Status updated." };
  });
}

export async function addEnquiryNoteAction(id: string, body: string): Promise<ActionResult> {
  if (!UUID_RE.test(id)) return { ok: false, message: "Invalid enquiry." };
  const text = sanitisePlainText(body ?? "").slice(0, 4000);
  if (!text) return { ok: false, message: "Write a note first." };
  return guarded("editor", async (user) => {
    await db().insert(s.enquiryNotes).values({ enquiryId: id, body: text, createdBy: user.id });
    await db().update(s.enquiries).set({ updatedAt: new Date() }).where(eq(s.enquiries.id, id));
    return { ok: true, message: "Note added." };
  });
}

export async function deleteEnquiryAction(id: string): Promise<ActionResult> {
  if (!UUID_RE.test(id)) return { ok: false, message: "Invalid enquiry." };
  return guarded("admin", async (user) => {
    await db().delete(s.enquiries).where(eq(s.enquiries.id, id));
    await logAudit({ user, action: "enquiry.delete", entityType: "enquiry", entityId: id, summary: "Deleted an enquiry" });
    return { ok: true, message: "Deleted." };
  });
}

export async function deleteSubscriberAction(id: string): Promise<ActionResult> {
  if (!UUID_RE.test(id)) return { ok: false, message: "Invalid subscriber." };
  return guarded("admin", async (user) => {
    await db().delete(s.newsletterSubscribers).where(eq(s.newsletterSubscribers.id, id));
    await logAudit({ user, action: "subscriber.delete", entityType: "subscriber", entityId: id, summary: "Removed a newsletter subscriber" });
    return { ok: true, message: "Removed." };
  });
}

/* ---- settings ------------------------------------------------------------- */

export async function saveSettingsAction(key: SettingsKey, input: unknown): Promise<ActionResult> {
  const group = SETTINGS_GROUPS[key];
  if (!group) return { ok: false, message: "Unknown settings group." };
  return guarded("admin", async (user) => {
    const parsed = objectSchema(group.fields).safeParse(input ?? {});
    if (!parsed.success) {
      return { ok: false, message: "Please fix the highlighted fields.", errors: Object.fromEntries(parsed.error.issues.map((i) => [i.path.join("."), i.message])) };
    }
    const value = mapRichText(group.fields, parsed.data, sanitiseRichText) as Record<string, unknown>;
    await db()
      .insert(s.siteSettings)
      .values({ key, value, updatedBy: user.id })
      .onConflictDoUpdate({ target: s.siteSettings.key, set: { value, updatedBy: user.id, updatedAt: new Date() } });
    await logAudit({ user, action: "settings.update", entityType: "settings", entityId: key, summary: `Updated settings: ${group.label}` });
    revalidateContent();
    return { ok: true, message: "Settings saved. The site has been updated." };
  });
}

/* ---- navigation ----------------------------------------------------------- */

const navChild = [
  { type: "text", name: "label", label: "Label", required: true, maxLength: 60 },
  { type: "url", name: "href", label: "Link", required: true },
  { type: "text", name: "description", label: "Short description", maxLength: 120 },
  { type: "boolean", name: "isVisible", label: "Visible" },
  { type: "boolean", name: "openInNewTab", label: "Open in a new tab" },
] as const satisfies readonly Field[];

const navSchema = objectSchema([
  {
    type: "list",
    name: "items",
    label: "Items",
    itemLabel: "Item",
    fields: [...navChild, { type: "list", name: "children", label: "Dropdown items", itemLabel: "Item", fields: navChild }],
  },
]);

type NavInput = { label: string; href: string; description: string; isVisible: boolean; openInNewTab: boolean; children?: NavInput[] };

export async function saveNavigationAction(menu: string, input: unknown): Promise<ActionResult> {
  const menuKey = z.enum(s.MENUS).safeParse(menu);
  if (!menuKey.success) return { ok: false, message: "Unknown menu." };
  return guarded("admin", async (user) => {
    const parsed = navSchema.safeParse(input ?? {});
    if (!parsed.success) {
      return { ok: false, message: "Every item needs a label and a link.", errors: Object.fromEntries(parsed.error.issues.map((i) => [i.path.join("."), i.message])) };
    }
    const items = (parsed.data as { items: NavInput[] }).items;
    await db().transaction(async (tx) => {
      await tx.delete(s.navigationItems).where(eq(s.navigationItems.menu, menuKey.data));
      for (const [position, item] of items.entries()) {
        const [row] = await tx
          .insert(s.navigationItems)
          .values({ menu: menuKey.data, label: item.label, href: item.href, description: item.description || null, position, isVisible: item.isVisible, openInNewTab: item.openInNewTab })
          .returning({ id: s.navigationItems.id });
        const children = menuKey.data === "header" ? (item.children ?? []) : [];
        if (children.length) {
          await tx.insert(s.navigationItems).values(
            children.map((child, childPosition) => ({
              menu: menuKey.data,
              parentId: row!.id,
              label: child.label,
              href: child.href,
              description: child.description || null,
              position: childPosition,
              isVisible: child.isVisible,
              openInNewTab: child.openInNewTab,
            })),
          );
        }
      }
    });
    await logAudit({ user, action: "navigation.update", entityType: "navigation", entityId: menuKey.data, summary: `Updated the ${menuKey.data.replace("_", " ")} menu` });
    revalidateContent();
    return { ok: true, message: "Menu saved." };
  });
}

/* ---- users (owner only) --------------------------------------------------- */

const newUser = z.object({
  fullName: z.string().trim().min(2, "Enter a name.").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  role: z.enum(s.ROLES),
  password: z.string(),
});

async function ownerCount(exceptId?: string) {
  const [row] = await db()
    .select({ n: count() })
    .from(s.profiles)
    .where(sql`${s.profiles.role} = 'owner' and ${s.profiles.isActive} ${exceptId ? sql`and ${s.profiles.id} <> ${exceptId}` : sql``}`);
  return row?.n ?? 0;
}

export async function createUserAction(input: unknown): Promise<ActionResult> {
  return guarded("owner", async (user) => {
    const parsed = newUser.safeParse(input);
    if (!parsed.success) {
      return { ok: false, message: "Please fix the highlighted fields.", errors: Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])) };
    }
    const problem = passwordProblem(parsed.data.password);
    if (problem) return { ok: false, message: "Please fix the highlighted fields.", errors: { password: problem } };
    const [existing] = await db().select({ id: s.profiles.id }).from(s.profiles).where(sql`lower(${s.profiles.email}) = ${parsed.data.email}`).limit(1);
    if (existing) return { ok: false, message: "Please fix the highlighted fields.", errors: { email: "Someone already has an account with this email." } };
    try {
      const id = await createStaffUser(parsed.data);
      await logAudit({ user, action: "user.create", entityType: "user", entityId: id, summary: `Created ${parsed.data.role} account for ${parsed.data.email}` });
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : "The account could not be created." };
    }
    return { ok: true, message: "Account created. Share the password with them securely and ask them to change it." };
  });
}

export async function updateUserAction(id: string, input: { role: string; isActive: boolean }): Promise<ActionResult> {
  if (!UUID_RE.test(id)) return { ok: false, message: "Invalid user." };
  const role = z.enum(s.ROLES).safeParse(input.role);
  if (!role.success) return { ok: false, message: "Unknown role." };
  return guarded("owner", async (user) => {
    if (id === user.id) return { ok: false, message: "You cannot change your own role or deactivate yourself. Ask another owner." };
    const losesOwner = role.data !== "owner" || !input.isActive;
    if (losesOwner && (await ownerCount(id)) === 0) return { ok: false, message: "There must always be at least one active owner." };
    await db().update(s.profiles).set({ role: role.data, isActive: Boolean(input.isActive), updatedAt: new Date() }).where(eq(s.profiles.id, id));
    await logAudit({ user, action: "user.update", entityType: "user", entityId: id, summary: `Set a user to ${role.data}${input.isActive ? "" : " (deactivated)"}` });
    return { ok: true, message: "User updated." };
  });
}

export async function resetUserPasswordAction(id: string, password: string): Promise<ActionResult> {
  if (!UUID_RE.test(id)) return { ok: false, message: "Invalid user." };
  return guarded("owner", async (user) => {
    const problem = passwordProblem(password);
    if (problem) return { ok: false, message: problem };
    await setStaffPassword(id, password);
    await logAudit({ user, action: "user.password_reset", entityType: "user", entityId: id, summary: "Reset a user's password" });
    return { ok: true, message: "Password reset. Share it with them securely." };
  });
}

export async function deleteUserAction(id: string): Promise<ActionResult> {
  if (!UUID_RE.test(id)) return { ok: false, message: "Invalid user." };
  return guarded("owner", async (user) => {
    if (id === user.id) return { ok: false, message: "You cannot delete your own account." };
    const [others] = await db().select({ n: count() }).from(s.profiles).where(ne(s.profiles.id, id));
    if ((others?.n ?? 0) === 0 || (await ownerCount(id)) === 0) return { ok: false, message: "There must always be at least one active owner." };
    await deleteStaffUser(id);
    await logAudit({ user, action: "user.delete", entityType: "user", entityId: id, summary: "Deleted a user account" });
    return { ok: true, message: "Account deleted." };
  });
}
