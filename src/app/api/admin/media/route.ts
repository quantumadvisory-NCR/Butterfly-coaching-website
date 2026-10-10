import { NextResponse } from "next/server";
import { UUID_RE } from "@/lib/admin/action-helpers";
import { replaceMedia, uploadMedia } from "@/lib/admin/media-store";
import { logAudit, revalidateContent } from "@/lib/audit";
import { ForbiddenError, assertUser } from "@/lib/auth";
import { rateLimit } from "@/lib/security";

export const runtime = "nodejs";

/**
 * Media upload. Staff only. Send multipart/form-data with a "file" field and,
 * to swap the file behind an existing item, a "replace" field with its id.
 */
export async function POST(request: Request) {
  let user;
  try {
    user = await assertUser("editor");
  } catch (error) {
    const message = error instanceof ForbiddenError ? error.message : "Not allowed.";
    return NextResponse.json({ ok: false, message }, { status: 403 });
  }

  // Server actions get this check for free; a route handler has to do it itself.
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) {
    return NextResponse.json({ ok: false, message: "Cross-site request blocked." }, { status: 403 });
  }

  if (!(await rateLimit("upload", 60, 10 * 60, user.id))) {
    return NextResponse.json({ ok: false, message: "Too many uploads in a short time. Please wait a few minutes." }, { status: 429 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, message: "The upload could not be read. The file may be too large." }, { status: 400 });
  }
  const file = form.get("file");
  const replace = form.get("replace");
  if (!(file instanceof File)) return NextResponse.json({ ok: false, message: "Choose a file to upload." }, { status: 400 });

  try {
    const result =
      typeof replace === "string" && replace
        ? UUID_RE.test(replace)
          ? await replaceMedia(replace, file)
          : { error: "Invalid media item." }
        : await uploadMedia(file, user.id);
    if ("error" in result) return NextResponse.json({ ok: false, message: result.error }, { status: 400 });

    await logAudit({
      user,
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
    return NextResponse.json({ ok: false, message: "The upload failed. Please try again." }, { status: 500 });
  }
}
