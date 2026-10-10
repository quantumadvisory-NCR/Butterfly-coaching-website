import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PreviewFrame } from "@/components/admin/preview-frame";
import { loadPage } from "@/lib/admin/page-store";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Preview" };
export const dynamic = "force-dynamic";

/** Device preview for a draft page. Staff only. */
export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const loaded = await loadPage(id);
  if (!loaded) notFound();
  return (
    <PreviewFrame
      src={`/preview/page/${loaded.page.id}/`}
      title={loaded.page.title}
      editHref={`/admin/pages/${loaded.page.id}/`}
      published={loaded.page.status === "published" && !loaded.page.hasUnpublishedChanges}
    />
  );
}
