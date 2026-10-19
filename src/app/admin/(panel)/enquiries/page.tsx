import { DownloadSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import { and, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import type { Metadata } from "next";
import { AdminLink as Link } from "@/components/admin/admin-link";
import { EmptyState, PageHeader, RecordCell, RecordRow, RecordTable, StatusBadge } from "@/components/admin/ui";
import { hasRole, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ENQUIRY_STATUS, ENQUIRY_TYPES, enquiries } from "@/lib/db/schema";
import { cn, formatDateTime } from "@/lib/utils";
import { ENQUIRY_LABELS } from "@/lib/validation/forms";

export const metadata: Metadata = { title: "Enquiries" };

const PER_PAGE = 25;
const STATUS_LABELS: Record<string, string> = { new: "New", in_progress: "In progress", contacted: "Contacted", qualified: "Qualified", closed: "Closed", spam: "Spam" };

type Search = { status?: string; type?: string; q?: string; page?: string };

export default async function EnquiriesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await requireUser();
  const search = await searchParams;
  const status = (ENQUIRY_STATUS as readonly string[]).includes(search.status ?? "") ? (search.status as (typeof ENQUIRY_STATUS)[number]) : null;
  const type = (ENQUIRY_TYPES as readonly string[]).includes(search.type ?? "") ? (search.type as (typeof ENQUIRY_TYPES)[number]) : null;
  const q = (search.q ?? "").trim().slice(0, 80);
  const page = Math.max(1, Number(search.page) || 1);

  const filters: SQL[] = [];
  if (status) filters.push(eq(enquiries.status, status));
  if (type) filters.push(eq(enquiries.type, type));
  if (q) {
    const like = `%${q.replace(/[%_\\]/g, "\\$&")}%`;
    filters.push(or(ilike(enquiries.name, like), ilike(enquiries.email, like), ilike(enquiries.organisation, like), ilike(enquiries.message, like))!);
  }
  const where = filters.length ? and(...filters) : undefined;

  const [rows, [total], byStatus] = await Promise.all([
    db().select().from(enquiries).where(where).orderBy(desc(enquiries.createdAt)).limit(PER_PAGE).offset((page - 1) * PER_PAGE),
    db().select({ n: count() }).from(enquiries).where(where),
    db().select({ status: enquiries.status, n: count() }).from(enquiries).groupBy(enquiries.status),
  ]);
  const totalCount = total?.n ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / PER_PAGE));
  const countFor = (key: string) => byStatus.find((row) => row.status === key)?.n ?? 0;

  const href = (overrides: Partial<Search>) => {
    const params = new URLSearchParams();
    const next = { status: status ?? undefined, type: type ?? undefined, q: q || undefined, ...overrides };
    for (const [key, value] of Object.entries(next)) if (value) params.set(key, String(value));
    const qs = params.toString();
    return `/admin/enquiries/${qs ? `?${qs}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="Enquiries"
        description="Every form submitted on the website. Open one to update its status and add internal notes."
        actions={
          hasRole(user, "admin") ? (
            <a href={`/admin/enquiries/export/${status ? `?status=${status}` : ""}`} className="btn btn-quiet btn-sm">
              <DownloadSimpleIcon weight="bold" className="size-4" />
              Export CSV
            </a>
          ) : undefined
        }
      />

      <nav aria-label="Filter by status" className="mb-4 flex flex-wrap gap-2">
        <Link href={href({ status: undefined, page: undefined })} aria-current={!status ? "true" : undefined} className={cn("inline-flex min-h-10 items-center rounded-full px-4 text-sm font-semibold", !status ? "bg-navy text-white" : "border border-line bg-surface text-navy hover:border-navy")}>
          All
        </Link>
        {ENQUIRY_STATUS.map((key) => (
          <Link
            key={key}
            href={href({ status: key, page: undefined })}
            aria-current={status === key ? "true" : undefined}
            className={cn("inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold", status === key ? "bg-navy text-white" : "border border-line bg-surface text-navy hover:border-navy")}
          >
            {STATUS_LABELS[key]}
            <span className={cn("text-xs", status === key ? "text-white/70" : "text-muted")}>{countFor(key)}</span>
          </Link>
        ))}
      </nav>

      <form method="get" className="mb-5 grid gap-3 rounded-2xl border border-line bg-surface p-4 sm:grid-cols-[minmax(0,1fr)_14rem_auto] sm:items-end">
        {status && <input type="hidden" name="status" value={status} />}
        <div>
          <label htmlFor="enquiry-q" className="field-label">
            Search
          </label>
          <input id="enquiry-q" name="q" type="search" defaultValue={q} placeholder="Name, email, organisation or message" className="field-input" />
        </div>
        <div>
          <label htmlFor="enquiry-type" className="field-label">
            Type
          </label>
          <select id="enquiry-type" name="type" defaultValue={type ?? ""} className="field-input">
            <option value="">All types</option>
            {ENQUIRY_TYPES.map((key) => (
              <option key={key} value={key}>
                {ENQUIRY_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-blue btn-sm">
          Apply
        </button>
      </form>

      {rows.length === 0 ? (
        <EmptyState title={totalCount === 0 && !q && !status && !type ? "No enquiries yet" : "Nothing matches these filters"}>
          {totalCount === 0 && !q && !status && !type ? "When someone submits a form on the website it will appear here." : "Try a different status, type or search."}
        </EmptyState>
      ) : (
        <RecordTable columns={["From", "Type", "Received", "Status"]}>
          {rows.map((row) => (
            <RecordRow key={row.id}>
              <RecordCell label="From" primary>
                <Link href={`/admin/enquiries/${row.id}/`} className={cn("text-navy hover:text-primary hover:underline", row.status === "new" ? "font-bold" : "font-semibold")}>
                  {row.name}
                </Link>
                <p className="text-sm text-muted [overflow-wrap:anywhere]">
                  {row.email}
                  {row.organisation ? `, ${row.organisation}` : ""}
                </p>
              </RecordCell>
              <RecordCell label="Type">
                <span className="text-sm">
                  {ENQUIRY_LABELS[row.type]}
                  {row.programmeInterest && <span className="block text-muted">{row.programmeInterest}</span>}
                </span>
              </RecordCell>
              <RecordCell label="Received">
                <span className="text-sm text-muted">{formatDateTime(row.createdAt)}</span>
              </RecordCell>
              <RecordCell label="Status">
                <StatusBadge status={row.status} />
              </RecordCell>
            </RecordRow>
          ))}
        </RecordTable>
      )}

      {pageCount > 1 && (
        <nav aria-label="Pagination" className="mt-5 flex items-center justify-between gap-3">
          {page > 1 ? (
            <Link href={href({ page: String(page - 1) })} className="btn btn-quiet btn-sm">
              Newer
            </Link>
          ) : (
            <span />
          )}
          <p className="text-sm text-muted">
            Page {page} of {pageCount}, {totalCount} in total
          </p>
          {page < pageCount ? (
            <Link href={href({ page: String(page + 1) })} className="btn btn-quiet btn-sm">
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
