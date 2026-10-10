import { count, desc } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, PageHeader, RecordCell, RecordRow, RecordTable } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Audit log" };

const PER_PAGE = 50;

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireUser("owner");
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const [rows, [total]] = await Promise.all([
    db().select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(PER_PAGE).offset((page - 1) * PER_PAGE),
    db().select({ n: count() }).from(auditLogs),
  ]);
  const pageCount = Math.max(1, Math.ceil((total?.n ?? 0) / PER_PAGE));
  return (
    <>
      <PageHeader title="Audit log" description="A record of sign-ins and every change made in this admin: who did what, and when." />
      {rows.length === 0 ? (
        <EmptyState title="Nothing recorded yet" />
      ) : (
        <RecordTable columns={["When", "Who", "What"]}>
          {rows.map((row) => (
            <RecordRow key={row.id}>
              <RecordCell label="When">
                <span className="whitespace-nowrap text-sm text-muted">{formatDateTime(row.createdAt)}</span>
              </RecordCell>
              <RecordCell label="Who">
                <span className="text-sm [overflow-wrap:anywhere]">{row.actorEmail ?? "Not signed in"}</span>
              </RecordCell>
              <RecordCell label="What" primary>
                <span className="text-[0.9375rem]">{row.summary}</span>
                <span className="block font-mono text-xs text-muted">{row.action}</span>
              </RecordCell>
            </RecordRow>
          ))}
        </RecordTable>
      )}
      {pageCount > 1 && (
        <nav aria-label="Pagination" className="mt-5 flex items-center justify-between gap-3">
          {page > 1 ? (
            <Link href={`/admin/audit/?page=${page - 1}`} className="btn btn-quiet btn-sm">
              Newer
            </Link>
          ) : (
            <span />
          )}
          <p className="text-sm text-muted">
            Page {page} of {pageCount}
          </p>
          {page < pageCount ? (
            <Link href={`/admin/audit/?page=${page + 1}`} className="btn btn-quiet btn-sm">
              Older
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </>
  );
}
