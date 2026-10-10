import type { Page, PageSection } from "@/lib/db/schema";

/** The shape stored in revisions.snapshot for a page. This is what the public site renders. */
export type PageSnapshotData = {
  title: string;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImageId: string | null;
  noindex: boolean;
  sections: { id: string; type: string; data: Record<string, unknown>; isHidden: boolean }[];
};

type PageFields = Pick<Page, "title" | "seoTitle" | "seoDescription" | "ogImageId" | "noindex">;
type SectionFields = Pick<PageSection, "id" | "type" | "data" | "isHidden" | "position">;

/** Freezes a page's working copy into the snapshot that gets published. */
export function buildPageSnapshot(page: PageFields, sections: SectionFields[]): PageSnapshotData {
  return {
    title: page.title,
    seoTitle: page.seoTitle,
    seoDescription: page.seoDescription,
    ogImageId: page.ogImageId,
    noindex: page.noindex,
    sections: [...sections]
      .sort((a, b) => a.position - b.position)
      .map((section) => ({
        id: section.id,
        type: section.type,
        data: (section.data ?? {}) as Record<string, unknown>,
        isHidden: section.isHidden,
      })),
  };
}
