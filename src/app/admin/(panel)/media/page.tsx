import type { Metadata } from "next";
import { MediaLibrary } from "@/components/admin/media-library";
import { PageHeader } from "@/components/admin/ui";
import { mediaViews } from "@/lib/admin/editor-data";
import { hasRole, requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Media library" };

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const user = await requireUser();
  const [items, { q }] = await Promise.all([mediaViews(), searchParams]);
  return (
    <>
      <PageHeader
        eyebrow="Content"
        title="Media library"
        description="Every image, video and PDF used on the website. Select an item to edit its alt text, set its focal point, replace the file or see where it is used."
      />
      <MediaLibrary initial={items} canDelete={hasRole(user, "admin")} initialQuery={typeof q === "string" ? q.slice(0, 120) : ""} />
    </>
  );
}
