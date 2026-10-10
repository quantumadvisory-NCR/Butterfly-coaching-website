import { asc } from "drizzle-orm";
import type { Metadata } from "next";
import { NavigationEditor } from "@/components/admin/settings-forms";
import { Notice, PageHeader } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { type NavigationItem, navigationItems } from "@/lib/db/schema";

export const metadata: Metadata = { title: "Navigation" };

const toItem = (row: NavigationItem) => ({
  label: row.label,
  href: row.href,
  description: row.description ?? "",
  isVisible: row.isVisible,
  openInNewTab: row.openInNewTab,
});

export default async function NavigationPage() {
  await requireUser("admin");
  const rows = await db().select().from(navigationItems).orderBy(asc(navigationItems.position));
  const menus: Record<string, Record<string, unknown>[]> = {};
  for (const row of rows) {
    if (row.parentId) continue;
    (menus[row.menu] ??= []).push({ ...toItem(row), children: rows.filter((child) => child.parentId === row.id).map(toItem) });
  }
  return (
    <>
      <PageHeader title="Navigation" description="The header menu, its dropdowns and the footer link columns." />
      <Notice className="mb-5">
        Keep the header to five or six short items so it fits on one line on laptops. On phones the same menu opens as a drawer.
      </Notice>
      <NavigationEditor menus={menus} />
    </>
  );
}
