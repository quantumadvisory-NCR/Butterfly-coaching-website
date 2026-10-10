import { desc, eq } from "drizzle-orm";
import { csvResponse, toCsv } from "@/lib/admin/csv";
import { logAudit } from "@/lib/audit";
import { ForbiddenError, assertUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ENQUIRY_STATUS, enquiries } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

/** CSV export of enquiries. Administrators and owners only; every export is audited. */
export async function GET(request: Request) {
  let user;
  try {
    user = await assertUser("admin");
  } catch (error) {
    return new Response(error instanceof ForbiddenError ? error.message : "Not allowed.", { status: 403 });
  }
  const status = new URL(request.url).searchParams.get("status");
  const filter = (ENQUIRY_STATUS as readonly string[]).includes(status ?? "") ? eq(enquiries.status, status as (typeof ENQUIRY_STATUS)[number]) : undefined;
  const rows = await db().select().from(enquiries).where(filter).orderBy(desc(enquiries.createdAt)).limit(5000);

  await logAudit({ user, action: "enquiry.export", entityType: "enquiry", summary: `Exported ${rows.length} enquiries to CSV` });

  const csv = toCsv(
    ["Received (UTC)", "Status", "Type", "Name", "Email", "Phone", "Organisation", "Role", "Interested in", "Team size", "Message", "Newsletter opt-in", "Source page", "Referrer", "UTM source", "UTM medium", "UTM campaign"],
    rows.map((r) => [
      r.createdAt.toISOString(),
      r.status,
      r.type,
      r.name,
      r.email,
      r.phone,
      r.organisation,
      r.roleTitle,
      r.programmeInterest,
      r.teamSize,
      r.message,
      r.consentMarketing ? "yes" : "no",
      r.sourcePath,
      r.referrer,
      r.utm?.utm_source,
      r.utm?.utm_medium,
      r.utm?.utm_campaign,
    ]),
  );
  return csvResponse(`bca-enquiries-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
