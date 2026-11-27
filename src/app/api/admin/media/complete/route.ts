import { NextResponse } from "next/server";
import { z } from "zod";
import { finishDirectUpload } from "@/lib/admin/media-store";
import { logAudit, revalidateContent } from "@/lib/audit";
import { fail, replaceId, uploadGuard } from "../guard";

export const runtime = "nodejs";
// Re-encoding a large photo can take a few seconds.
export const maxDuration = 60;

const body = z.object({
  path: z.string().regex(/^(uploads|incoming)\/\d{4}\/\d{2}\/[a-z0-9-]+\.(upload|pdf|mp4|webm)$/),
  ticket: z.string().min(10).max(200),
  name: z.string().trim().min(1).max(300),
  replace: z.string().optional(),
});

/** Step two of a direct upload: the file is in storage; check it and add it to the library. */
export async function POST(request: Request) {
  const guard = await uploadGuard(request, { counted: false });
  if ("response" in guard) return guard.response;
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("The upload request was not understood.");
  const replace = replaceId(parsed.data.replace);
  if (typeof replace === "object") return fail(replace.error);
  try {
    const result = await finishDirectUpload(parsed.data, guard.user.id, replace);
    if ("error" in result) return fail(result.error);
    await logAudit({
      user: guard.user,
      action: replace ? "media.replace" : "media.upload",
      entityType: "media",
      entityId: result.media.id,
      summary: `${replace ? "Replaced the file for" : "Uploaded"} "${result.media.filename}"`,
    });
    revalidateContent();
    return NextResponse.json({ ok: true, id: result.media.id });
  } catch (error) {
    console.error("[media] could not finish an upload", error);
    return fail("The upload failed. Please try again.", 500);
  }
}
