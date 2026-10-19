import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageEditor } from "@/components/admin/page-editor";
import { PageHeader } from "@/components/admin/ui";
import { UUID_RE } from "@/lib/admin/action-helpers";
import { mediaViews } from "@/lib/admin/editor-data";
import { referenceOptions } from "@/lib/admin/entity-store";
import { listRevisions, loadPage } from "@/lib/admin/page-store";
import { hasRole, requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Edit page" };

export default async function EditPagePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const user = await requireUser();
  const [{ id }, { saved }] = await Promise.all([params, searchParams]);
  const isNew = id === "new";
  if (!isNew && !UUID_RE.test(id)) notFound();
  // Everything the editor needs, fetched together rather than one query after another.
  const [loaded, refOptions, media, revisions] = await Promise.all([
    isNew ? null : loadPage(id),
    referenceOptions(),
    mediaViews(),
    isNew ? [] : listRevisions(id),
  ]);
  if (!isNew && !loaded) notFound();

  return (
    <>
      <PageHeader
        title={loaded ? loaded.page.title : "New page"}
        description={loaded ? undefined : "Give the page a title and an address, add sections, then save a draft or publish."}
        back={{ href: "/admin/pages/", label: "All pages" }}
      />
      <PageEditor
        // Keyed by page only, so saving (which refreshes the data) keeps the editor and its confirmation message in place.
        key={loaded ? loaded.page.id : "new"}
        id={loaded?.page.id ?? null}
        initial={{
          title: loaded?.page.title ?? "",
          path: loaded?.page.path ?? "",
          seoTitle: loaded?.page.seoTitle ?? "",
          seoDescription: loaded?.page.seoDescription ?? "",
          ogImageId: loaded?.page.ogImageId ?? null,
          noindex: loaded?.page.noindex ?? false,
          sections: (loaded?.sections ?? []).map((section) => ({
            id: section.id,
            type: section.type,
            data: (section.data ?? {}) as Record<string, unknown>,
            isHidden: section.isHidden,
          })),
        }}
        meta={
          loaded
            ? {
                status: loaded.page.status,
                hasUnpublishedChanges: loaded.page.hasUnpublishedChanges,
                isSystem: loaded.page.isSystem,
                publishedAt: loaded.page.publishedAt?.toISOString() ?? null,
              }
            : null
        }
        revisions={revisions.map((r) => ({ id: r.id, label: r.label, createdAt: r.createdAt.toISOString(), email: r.email }))}
        refOptions={refOptions}
        media={media}
        canDelete={hasRole(user, "admin")}
        justSaved={Boolean(saved) && Boolean(loaded)}
      />
    </>
  );
}
