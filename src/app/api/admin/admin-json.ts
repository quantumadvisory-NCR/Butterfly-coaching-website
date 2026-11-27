import "server-only";
import { NextResponse } from "next/server";
import { type SessionUser, ForbiddenError, assertUser } from "@/lib/auth";

/**
 * Runs a read-only admin handler (GET, or POST carrying a search) for a signed-in editor, answering with
 * JSON that is never cached. Signed out (or not allowed): 403 JSON, no redirect,
 * because these are fetched by the admin's own scripts.
 */
export async function adminJson(run: (user: SessionUser) => Promise<unknown>): Promise<NextResponse> {
  const headers = { "Cache-Control": "private, no-store" };
  let user: SessionUser;
  try {
    user = await assertUser("editor");
  } catch (error) {
    const message = error instanceof ForbiddenError ? error.message : "Not allowed.";
    return NextResponse.json({ ok: false, message }, { status: 403, headers });
  }
  try {
    return NextResponse.json({ ok: true, ...(await run(user) as object) }, { headers });
  } catch (error) {
    console.error("[admin] read failed", error);
    return NextResponse.json({ ok: false, message: "Something went wrong. Please try again." }, { status: 500, headers });
  }
}
