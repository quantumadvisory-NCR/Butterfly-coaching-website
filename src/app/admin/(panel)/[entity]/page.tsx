import { PlusIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState, PageHeader, RecordCell, RecordRow, RecordTable, StatusBadge } from "@/components/admin/ui";
import { entityByRoute } from "@/lib/admin/entities";
import { listEntities } from "@/lib/admin/entity-store";
import { requireUser } from "@/lib/auth";

type Props = { params: Promise<{ entity: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { entity } = await params;
  return { title: entityByRoute(entity)?.label ?? "Not found" };
}

/** List screen shared by every content type in lib/admin/entities.ts. */
export default async function EntityListPage({ params }: Props) {
  const { entity } = await params;
  const config = entityByRoute(entity);
  if (!config) notFound();
  await requireUser(config.minRole);
  const rows = await listEntities(config.key);
  const hasStatus = rows.some((row) => row.status);
  const newHref = `/admin/${config.route}/new/`;

  return (
    <>
      <PageHeader
        title={config.label}
        description={config.description}
        actions={
          <>
            {config.key === "posts" && (
              <>
                <Link href="/admin/blog-categories/" className="btn btn-quiet btn-sm">
                  Categories
                </Link>
                <Link href="/admin/blog-tags/" className="btn btn-quiet btn-sm">
                  Tags
                </Link>
              </>
            )}
            <Link href={newHref} className="btn btn-primary btn-sm">
              <PlusIcon weight="bold" className="size-4" />
              New {config.singular}
            </Link>
          </>
        }
        back={config.key === "categories" || config.key === "tags" ? { href: "/admin/blog/", label: "Blog" } : undefined}
      />

      {rows.length === 0 ? (
        <EmptyState
          title={`No ${config.label.toLowerCase()} yet`}
          action={
            <Link href={newHref} className="btn btn-primary btn-sm">
              Add the first {config.singular}
            </Link>
          }
        >
          {config.description}
        </EmptyState>
      ) : (
        <RecordTable columns={[config.singular.charAt(0).toUpperCase() + config.singular.slice(1), ...(hasStatus ? ["Status"] : []), ""]}>
          {rows.map((row) => (
            <RecordRow key={row.id}>
              <RecordCell label={config.singular} primary>
                <Link href={`/admin/${config.route}/${row.id}/`} className="font-semibold text-navy hover:text-primary hover:underline">
                  {row.title}
                </Link>
                {row.subtitle && <p className="mt-0.5 text-sm text-muted [overflow-wrap:anywhere]">{row.subtitle}</p>}
              </RecordCell>
              {hasStatus && (
                <RecordCell label="Status">
                  <span className="flex flex-wrap gap-1.5">
                    {row.status && <StatusBadge status={row.status} label={config.key === "redirects" ? (row.status === "published" ? "Active" : "Off") : undefined} />}
                    {row.flags?.map((flag) => (
                      <span key={flag} className="inline-flex items-center whitespace-nowrap rounded-full bg-sky px-2.5 py-0.5 text-xs font-bold text-primary-strong">
                        {flag}
                      </span>
                    ))}
                  </span>
                </RecordCell>
              )}
              <RecordCell label="" primary className="md:text-right">
                <span className="flex gap-3 max-md:mt-2 md:justify-end">
                  <Link href={`/admin/${config.route}/${row.id}/`} className="text-sm font-semibold text-primary hover:underline">
                    Edit<span className="sr-only"> {row.title}</span>
                  </Link>
                  {row.href && (
                    <a href={row.href} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary hover:underline">
                      View<span className="sr-only"> {row.title} (opens in a new tab)</span>
                    </a>
                  )}
                </span>
              </RecordCell>
            </RecordRow>
          ))}
        </RecordTable>
      )}
    </>
  );
}
