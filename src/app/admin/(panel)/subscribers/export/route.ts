import { desc } from "drizzle-orm";
import { csvResponse, toCsv } from "@/lib/admin/csv";
import { logAudit } from "@/lib/audit";
import { ForbiddenError, assertUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { newsletterSubscribers } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

/** CSV export of newsletter subscribers. Administrators and owners only; audited. */
export async function GET() {
  let user;
  try {
    user = await assertUser("admin");
  } catch (error) {
    return new Response(error instanceof ForbiddenError ? error.message : "Not allowed.", { status: 403 });
  }
  const rows = await db().select().from(newsletterSubscribers).orderBy(desc(newsletterSubscribers.createdAt)).limit(20000);
  await logAudit({ user, action: "subscriber.export", entityType: "subscriber", summary: `Exported ${rows.length} subscribers to CSV` });
  const csv = toCsv(
    ["Email", "Name", "Status", "Consent given (UTC)", "Source page"],
    rows.map((r) => [r.email, r.name, r.status, r.consentAt.toISOString(), r.sourcePath]),
  );
  return csvResponse(`bca-subscribers-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
