import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlockRenderer } from "@/components/blocks";
import { loadPage } from "@/lib/admin/page-store";
import { requireUser } from "@/lib/auth";
import { getSiteChrome } from "@/lib/content/chrome";

export const metadata: Metadata = { title: "Draft preview", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * Renders a page's working copy (draft) with the real site header and footer.
 * Requires a signed-in staff member: drafts are never reachable by the public.
 */
export default async function DraftPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const loaded = await loadPage(id);
  if (!loaded) notFound();
  const chrome = await getSiteChrome();
  const breadcrumbs = loaded.page.path === "/" ? [] : [{ label: loaded.page.title, href: loaded.page.path }];
  return (
    <BlockRenderer
      sections={loaded.sections.map((section) => ({
        id: section.id,
        type: section.type,
        data: (section.data ?? {}) as Record<string, unknown>,
        isHidden: section.isHidden,
      }))}
      ctx={{ media: chrome.media, settings: chrome.settings, breadcrumbs, preview: true }}
    />
  );
}
