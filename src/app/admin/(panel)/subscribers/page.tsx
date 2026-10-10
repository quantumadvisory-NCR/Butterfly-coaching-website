import { DownloadSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import { desc } from "drizzle-orm";
import type { Metadata } from "next";
import { RowAction } from "@/components/admin/row-action";
import { EmptyState, PageHeader, RecordCell, RecordRow, RecordTable, StatusBadge } from "@/components/admin/ui";
import { hasRole, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { newsletterSubscribers } from "@/lib/db/schema";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Subscribers" };

export default async function SubscribersPage() {
  const user = await requireUser();
  const admin = hasRole(user, "admin");
  const rows = await db().select().from(newsletterSubscribers).orderBy(desc(newsletterSubscribers.createdAt)).limit(1000);
  return (
    <>
      <PageHeader
        title="Newsletter subscribers"
        description="People who signed up through the website. Export the list to import it into your email tool."
        actions={
          admin ? (
            // eslint-disable-next-line @next/next/no-html-link-for-pages -- a file download, not a page
            <a href="/admin/subscribers/export/" className="btn btn-quiet btn-sm">
              <DownloadSimpleIcon weight="bold" className="size-4" />
              Export CSV
            </a>
          ) : undefined
        }
      />
      {rows.length === 0 ? (
        <EmptyState title="No subscribers yet">Sign-ups from the footer and enquiry forms will appear here.</EmptyState>
      ) : (
        <RecordTable columns={["Email", "Signed up", "From page", "Status", ""]}>
          {rows.map((row) => (
            <RecordRow key={row.id}>
              <RecordCell label="Email" primary>
                <span className="font-semibold text-navy [overflow-wrap:anywhere]">{row.email}</span>
                {row.name && <span className="block text-sm text-muted">{row.name}</span>}
              </RecordCell>
              <RecordCell label="Signed up">
                <span className="text-sm text-muted">{formatDate(row.consentAt, "short")}</span>
              </RecordCell>
              <RecordCell label="From page">
                <span className="text-sm text-muted [overflow-wrap:anywhere]">{row.sourcePath ?? ""}</span>
              </RecordCell>
              <RecordCell label="Status">
                <StatusBadge status={row.status} />
              </RecordCell>
              <RecordCell label="" primary className="md:text-right">
                {admin && <RowAction kind="subscriber" id={row.id} label={`Remove ${row.email}`} />}
              </RecordCell>
            </RecordRow>
          ))}
        </RecordTable>
      )}
    </>
  );
}
