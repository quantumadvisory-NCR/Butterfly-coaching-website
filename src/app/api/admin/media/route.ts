import { NextResponse } from "next/server";
import { uploadMedia } from "@/lib/admin/media-store";
import { logAudit, revalidateContent } from "@/lib/audit";
import { fail, replaceId, uploadGuard } from "./guard";

export const runtime = "nodejs";

/**
 * Upload through the server (local development; production uploads go straight
 * to storage, see ./ticket and ./complete). Staff only. Send multipart/form-data
 * with a "file" field and, to swap the file behind an existing item, a
 * "replace" field with its id.
 */
export async function POST(request: Request) {
  const guard = await uploadGuard(request, { counted: true });
  if ("response" in guard) return guard.response;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("The upload could not be read. The file may be too large.");
  }
  const file = form.get("file");
  const replace = replaceId(form.get("replace"));
  if (!(file instanceof File)) return fail("Choose a file to upload.");
  if (typeof replace === "object") return fail(replace.error);

  try {
    const result = await uploadMedia(file, guard.user.id, replace);
    if ("error" in result) return fail(result.error);
    await logAudit({
      user: guard.user,
      action: replace ? "media.replace" : "media.upload",
      entityType: "media",
      entityId: result.media.id,
      summary: `${replace ? "Replaced the file for" : "Uploaded"} "${result.media.filename}"`,
    });
    // Refresh the cached media library so the new file is usable (and previewable) straight away.
    revalidateContent();
    return NextResponse.json({ ok: true, id: result.media.id });
  } catch (error) {
    console.error("[media] upload failed", error);
    return fail("The upload failed. Please try again.", 500);
  }
}
