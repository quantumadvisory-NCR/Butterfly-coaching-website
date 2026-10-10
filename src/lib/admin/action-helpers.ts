import "server-only";
import { ForbiddenError, type SessionUser, assertUser } from "@/lib/auth";
import type { Role } from "@/lib/db/schema";

export type ActionResult<T = object> =
  | ({ ok: true; message?: string } & T)
  | { ok: false; message: string; errors?: Record<string, string> };

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Wraps every admin server action: checks the session and role on the server,
 * then turns permission failures and unexpected errors into a safe message.
 */
// NoInfer: the result shape comes from the action's declared return type, not from each return statement.
export async function guarded<T = object>(
  minimum: Role,
  run: (user: SessionUser) => Promise<ActionResult<NoInfer<T>>>,
): Promise<ActionResult<T>> {
  try {
    const user = await assertUser(minimum);
    return await run(user);
  } catch (error) {
    if (error instanceof ForbiddenError) return { ok: false, message: error.message };
    // Let Next.js handle its own control-flow errors (redirect, notFound).
    if (typeof (error as { digest?: unknown })?.digest === "string" && String((error as { digest: string }).digest).startsWith("NEXT_")) throw error;
    console.error("[admin] action failed", error);
    return { ok: false, message: "Something went wrong and your change was not saved. Please try again." };
  }
}
