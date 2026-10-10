import type { Metadata } from "next";
import { SettingsTabs } from "@/components/admin/settings-forms";
import { Card, PageHeader } from "@/components/admin/ui";
import { mediaViews } from "@/lib/admin/editor-data";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";
import { integrationStatus, siteUrl } from "@/lib/env";
import { SETTINGS_GROUPS, type SettingsKey, parseSettingsGroup } from "@/lib/settings";

export const metadata: Metadata = { title: "Settings" };

function Line({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <li className="flex items-start gap-3 py-2.5">
      <span aria-hidden className={`mt-1.5 size-2.5 shrink-0 rounded-full ${ok ? "bg-success" : "bg-accent"}`} />
      <span className="text-[0.9375rem]">
        <span className="font-semibold text-navy">{label}: </span>
        {detail}
      </span>
    </li>
  );
}

export default async function SettingsPage() {
  await requireUser("admin");
  // Read straight from the database (not the public cache) so the form always shows the saved values.
  const rows = await db().select().from(siteSettings);
  const stored = new Map(rows.map((row) => [row.key, row.value]));
  const values = Object.fromEntries(
    (Object.keys(SETTINGS_GROUPS) as SettingsKey[]).map((key) => [key, parseSettingsGroup(key, stored.get(key)) as Record<string, unknown>]),
  ) as Record<SettingsKey, Record<string, unknown>>;
  const media = await mediaViews();
  const status = integrationStatus();

  return (
    <>
      <PageHeader title="Settings" description="Details used across the whole website. Changes apply as soon as you save." />
      <SettingsTabs values={values} media={media} />

      <Card title="Connections" description="These are set in the hosting environment rather than here. See docs/DEPLOYMENT.md." className="mt-6">
        <ul className="-my-2 divide-y divide-line">
          <Line ok label="Website address" detail={siteUrl()} />
          <Line
            ok={status.backend === "supabase"}
            label="Database and sign-in"
            detail={status.backend === "supabase" ? "Supabase is connected." : "Local development mode. Set the Supabase variables for production."}
          />
          <Line
            ok={status.email}
            label="Notification email"
            detail={status.email ? "Resend is configured. New enquiries are emailed to the team." : "Not configured. Enquiries are saved in the inbox but no email is sent. Set RESEND_API_KEY and EMAIL_FROM."}
          />
          <Line ok={status.storage} label="File storage" detail={status.backend === "supabase" ? "Supabase Storage." : "Files are stored on this computer (.local/uploads)."} />
        </ul>
      </Card>
    </>
  );
}
