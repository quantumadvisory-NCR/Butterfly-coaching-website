import { asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EnquiryControls } from "@/components/admin/enquiry-controls";
import { Card, Notice, PageHeader, StatusBadge } from "@/components/admin/ui";
import { UUID_RE } from "@/lib/admin/action-helpers";
import { hasRole, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { enquiries, enquiryNotes, profiles } from "@/lib/db/schema";
import { formatDateTime } from "@/lib/utils";
import { ENQUIRY_LABELS } from "@/lib/validation/forms";

export const metadata: Metadata = { title: "Enquiry" };

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  if (!children) return null;
  return (
    <div className="grid gap-0.5 py-3 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="[overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}

export default async function EnquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();
  const [enquiry] = await db().select().from(enquiries).where(eq(enquiries.id, id)).limit(1);
  if (!enquiry) notFound();
  const notes = await db()
    .select({ id: enquiryNotes.id, body: enquiryNotes.body, createdAt: enquiryNotes.createdAt, author: profiles.fullName, email: profiles.email })
    .from(enquiryNotes)
    .leftJoin(profiles, eq(profiles.id, enquiryNotes.createdBy))
    .where(eq(enquiryNotes.enquiryId, id))
    .orderBy(asc(enquiryNotes.createdAt));

  const wa = enquiry.phone ? enquiry.phone.replace(/\D/g, "") : "";
  const utm = enquiry.utm ? Object.entries(enquiry.utm) : [];

  return (
    <>
      <PageHeader
        title={enquiry.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge status={enquiry.status} /> {ENQUIRY_LABELS[enquiry.type]}, received {formatDateTime(enquiry.createdAt)}
          </span>
        }
        back={{ href: "/admin/enquiries/", label: "All enquiries" }}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start">
        <div className="grid gap-6">
          <Card title="Details">
            <dl className="-my-3 divide-y divide-line">
              <Row label="Email">
                <a href={`mailto:${enquiry.email}`} className="font-semibold text-primary hover:underline">
                  {enquiry.email}
                </a>
              </Row>
              <Row label="Phone">
                {enquiry.phone && (
                  <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <a href={`tel:${enquiry.phone.replace(/[^\d+]/g, "")}`} className="font-semibold text-primary hover:underline">
                      {enquiry.phone}
                    </a>
                    {wa.length >= 10 && (
                      <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary hover:underline">
                        Open WhatsApp<span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    )}
                  </span>
                )}
              </Row>
              <Row label="Organisation">{enquiry.organisation}</Row>
              <Row label="Role">{enquiry.roleTitle}</Row>
              <Row label="Interested in">{enquiry.programmeInterest}</Row>
              <Row label="Team size">{enquiry.teamSize}</Row>
              <Row label="Message">{enquiry.message && <span className="whitespace-pre-wrap">{enquiry.message}</span>}</Row>
              <Row label="Newsletter">{enquiry.consentMarketing ? "Agreed to receive emails" : "Did not opt in"}</Row>
            </dl>
          </Card>

          <Card title="Where this came from">
            <dl className="-my-3 divide-y divide-line">
              <Row label="Form on page">{enquiry.sourcePath}</Row>
              <Row label="Referred by">{enquiry.referrer}</Row>
              {utm.map(([key, value]) => (
                <Row key={key} label={key.replace("utm_", "Campaign ")}>
                  {value}
                </Row>
              ))}
              <Row label="Notification email">
                {enquiry.notificationStatus === "sent" ? "Sent to the team" : enquiry.notificationStatus === "failed" ? "Failed to send" : "Not sent (email is not configured)"}
              </Row>
            </dl>
            {utm.length === 0 && !enquiry.referrer && <p className="mt-3 text-sm text-muted">No campaign information was recorded for this enquiry.</p>}
          </Card>
        </div>

        <div className="grid gap-6">
          {enquiry.notificationStatus === "failed" && <Notice tone="warning">The notification email for this enquiry failed to send. Check the email settings.</Notice>}
          <EnquiryControls
            id={enquiry.id}
            status={enquiry.status}
            notes={notes.map((note) => ({ id: note.id, body: note.body, createdAt: formatDateTime(note.createdAt), author: note.author || note.email || "Former team member" }))}
            canDelete={hasRole(user, "admin")}
          />
        </div>
      </div>
    </>
  );
}
