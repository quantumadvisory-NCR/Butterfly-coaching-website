import "server-only";
import { revalidatePath, revalidateTag } from "next/cache";
import type { SessionUser } from "@/lib/auth";
import { CONTENT_TAG } from "@/lib/content/public";
import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";

type Entry = {
  user: Pick<SessionUser, "id" | "email"> | null;
  action: string;
  entityType?: string;
  entityId?: string;
  summary: string;
  meta?: Record<string, unknown>;
};

/** Records who changed what. Failures never block the change itself. */
export async function logAudit(entry: Entry) {
  try {
    await db().insert(auditLogs).values({
      actorId: entry.user?.id ?? null,
      actorEmail: entry.user?.email ?? null,
      action: entry.action,
      entityType: entry.entityType ?? null,
      entityId: entry.entityId ?? null,
      summary: entry.summary,
      meta: entry.meta ?? null,
    });
  } catch (error) {
    console.error("[audit] could not write audit log", error);
  }
}

/**
 * Refreshes everything the public site has cached. The site is small, so one
 * broad invalidation is simpler and safer than tracking individual pages.
 */
export function revalidateContent() {
  revalidateTag(CONTENT_TAG, { expire: 0 });
  revalidatePath("/", "layout");
}
