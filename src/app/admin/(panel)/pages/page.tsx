import { PlusIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, RecordCell, RecordRow, RecordTable, StatusBadge } from "@/components/admin/ui";
import { listPages } from "@/lib/admin/page-store";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Pages" };

export default async function PagesListPage() {
  await requireUser();
  const pages = await listPages();
  return (
    <>
      <PageHeader
        title="Pages"
        description="Build and edit pages from sections. Save drafts and preview them on phone and desktop sizes before you publish."
        actions={
          <Link href="/admin/pages/new/" className="btn btn-primary btn-sm">
            <PlusIcon weight="bold" className="size-4" />
            New page
          </Link>
        }
      />
      <RecordTable columns={["Page", "Address", "Status", "Last changed", ""]}>
        {pages.map((page) => (
          <RecordRow key={page.id}>
            <RecordCell label="Page" primary>
              <Link href={`/admin/pages/${page.id}/`} className="font-semibold text-navy hover:text-primary hover:underline">
                {page.title}
              </Link>
            </RecordCell>
            <RecordCell label="Address">
              <span className="font-mono text-sm text-muted [overflow-wrap:anywhere]">{page.path}</span>
            </RecordCell>
            <RecordCell label="Status">
              <span className="flex flex-wrap gap-1.5">
                <StatusBadge status={page.status} />
                {page.status === "published" && page.hasUnpublishedChanges && <StatusBadge status="draft" label="Unpublished changes" />}
              </span>
            </RecordCell>
            <RecordCell label="Last changed">
              <span className="text-sm text-muted">{formatDate(page.updatedAt, "short")}</span>
            </RecordCell>
            <RecordCell label="" primary className="md:text-right">
              <span className="flex gap-3 max-md:mt-2 md:justify-end">
                <Link href={`/admin/pages/${page.id}/`} className="text-sm font-semibold text-primary hover:underline">
                  Edit<span className="sr-only"> {page.title}</span>
                </Link>
                {page.status === "published" && (
                  <a href={page.path} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary hover:underline">
                    View<span className="sr-only"> {page.title} (opens in a new tab)</span>
                  </a>
                )}
              </span>
            </RecordCell>
          </RecordRow>
        ))}
      </RecordTable>
    </>
  );
}
