import { NextResponse } from "next/server";
import { z } from "zod";
import { createUploadTicket } from "@/lib/admin/media-store";
import { fail, replaceId, uploadGuard } from "../guard";

export const runtime = "nodejs";

const body = z.object({
  name: z.string().trim().min(1).max(300),
  size: z.number().int().positive(),
  type: z.string().max(100).default(""),
  replace: z.string().optional(),
});

/**
 * Step one of an upload: checks the file's declared type and size, then gives
 * the browser a one-time address in storage to send it to (production), or
 * tells it to send the file through the server (local development).
 */
export async function POST(request: Request) {
  const guard = await uploadGuard(request, { counted: true });
  if ("response" in guard) return guard.response;
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("The upload request was not understood.");
  const replace = replaceId(parsed.data.replace);
  if (typeof replace === "object") return fail(replace.error);
  try {
    const ticket = await createUploadTicket(parsed.data, guard.user.id, replace);
    if ("error" in ticket) return fail(ticket.error);
    return NextResponse.json({ ok: true, ...ticket });
  } catch (error) {
    console.error("[media] could not prepare an upload", error);
    return fail("The upload could not be started. Please try again.", 500);
  }
}
