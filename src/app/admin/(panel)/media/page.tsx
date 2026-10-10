import type { Metadata } from "next";
import { MediaLibrary } from "@/components/admin/media-library";
import { PageHeader } from "@/components/admin/ui";
import { mediaViews } from "@/lib/admin/editor-data";
import { hasRole, requireUser } from "@/lib/auth";
import { maxUploadBytes } from "@/lib/env";

export const metadata: Metadata = { title: "Media library" };

export default async function MediaPage() {
  const user = await requireUser();
  const items = await mediaViews();
  return (
    <>
      <PageHeader
        title="Media library"
        description={`Every image and file used on the website. Upload JPG, PNG, WebP, AVIF, GIF or PDF up to ${Math.round(maxUploadBytes() / 1024 / 1024)} MB. Select an item to edit its alt text, set its focal point, replace the file or see where it is used.`}
      />
      <MediaLibrary initial={items} canDelete={hasRole(user, "admin")} />
    </>
  );
}
