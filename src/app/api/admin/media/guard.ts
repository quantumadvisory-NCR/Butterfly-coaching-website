import "server-only";
import { NextResponse } from "next/server";
import { UUID_RE } from "@/lib/admin/action-helpers";
import { type SessionUser, ForbiddenError, assertUser } from "@/lib/auth";
import { rateLimit } from "@/lib/security";

export const fail = (message: string, status = 400) => NextResponse.json({ ok: false, message }, { status });

/**
 * The checks every media upload request passes: a signed-in editor, a request
 * from this site (server actions get this for free; route handlers do not) and,
 * for new uploads, a sensible pace.
 */
export async function uploadGuard(request: Request, { counted }: { counted: boolean }): Promise<{ user: SessionUser } | { response: NextResponse }> {
  let user: SessionUser;
  try {
    user = await assertUser("editor");
  } catch (error) {
    return { response: fail(error instanceof ForbiddenError ? error.message : "Not allowed.", 403) };
  }
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) return { response: fail("Cross-site request blocked.", 403) };
  if (counted && !(await rateLimit("upload", 60, 10 * 60, user.id))) {
    return { response: fail("Too many uploads in a short time. Please wait a few minutes.", 429) };
  }
  return { user };
}

/** The optional "replace" id: undefined, a valid id, or an error. */
export function replaceId(value: unknown): string | undefined | { error: string } {
  if (value === undefined || value === null || value === "") return undefined;
  return typeof value === "string" && UUID_RE.test(value) ? value : { error: "Invalid media item." };
}
