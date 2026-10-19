import { desc } from "drizzle-orm";
import { AdminLink as Link } from "@/components/admin/admin-link";
import { Card, Notice, PageHeader, StatusBadge } from "@/components/admin/ui";
import { contentCounts } from "@/lib/admin/entity-store";
import { announcementState } from "@/lib/announcement";
import { hasRole, requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/content/public";
import { db } from "@/lib/db";
import { enquiries } from "@/lib/db/schema";
import { integrationStatus } from "@/lib/env";
import { formatDateTime } from "@/lib/utils";
import { ENQUIRY_LABELS } from "@/lib/validation/forms";

function Stat({ value, label, href, attention }: { value: number; label: string; href: string; attention?: boolean }) {
  return (
    <Link href={href} className="group rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-primary">
      <p className={`font-display text-4xl font-bold tracking-tight ${attention && value > 0 ? "text-primary" : "text-navy"}`}>{value}</p>
      <p className="mt-1 text-[0.9375rem] text-muted group-hover:text-navy">{label}</p>
    </Link>
  );
}

function Check({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 py-2.5">
      <span aria-hidden className={`mt-1.5 size-2.5 shrink-0 rounded-full ${ok ? "bg-success" : "bg-accent"}`} />
      <span className="text-[0.9375rem]">
        <span className="sr-only">{ok ? "Ready: " : "Needs setting up: "}</span>
        {children}
      </span>
    </li>
  );
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const user = await requireUser();
  const [{ denied }, counts, recent, settings] = await Promise.all([
    searchParams,
    contentCounts(),
    db().select().from(enquiries).orderBy(desc(enquiries.createdAt)).limit(6),
    getSettings(),
  ]);
  const integrations = integrationStatus();
  const analytics = Boolean(settings.integrations.ga4Id || settings.integrations.gtmId);
  const announcement = announcementState(settings.header);

  return (
    <>
      <PageHeader title={`Welcome${user.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}`} description="An overview of the website and anything that needs your attention." />
      {denied && (
        <Notice tone="warning" className="mb-6">
          Your account does not have access to that area. Ask a site owner if you need it.
        </Notice>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <Stat value={counts.new_enquiries} label="New enquiries" href="/admin/enquiries/?status=new" attention />
        <Stat value={counts.unpublished_changes} label="Pages with unpublished changes" href="/admin/pages/" attention />
        <Stat value={counts.pending_testimonials} label="Testimonials awaiting approval" href="/admin/testimonials/" attention />
        <Stat value={counts.subscribers} label="Newsletter subscribers" href="/admin/subscribers/" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card title="Latest enquiries">
          {recent.length === 0 ? (
            <p className="text-[0.9375rem] text-muted">No enquiries yet. When someone submits a form on the website it appears here.</p>
          ) : (
            <ul className="-my-2 divide-y divide-line">
              {recent.map((enquiry) => (
                <li key={enquiry.id}>
                  <Link href={`/admin/enquiries/${enquiry.id}/`} className="flex items-center justify-between gap-3 rounded-lg py-3 hover:text-primary">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-navy">{enquiry.name}</span>
                      <span className="block truncate text-sm text-muted">
                        {ENQUIRY_LABELS[enquiry.type]}, {formatDateTime(enquiry.createdAt)}
                      </span>
                    </span>
                    <StatusBadge status={enquiry.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/enquiries/" className="text-link mt-3">
            Open the enquiry inbox
          </Link>
        </Card>

        <div className="grid content-start gap-6">
          <Card title="Setup status" description="What is connected, and what still needs attention before launch.">
            <ul className="-my-2 divide-y divide-line">
              <Check ok={integrations.backend === "supabase"}>
                {integrations.backend === "supabase" ? "Supabase database, sign-in and storage are connected." : "Running in local development mode. Connect Supabase before going live."}
              </Check>
              <Check ok={integrations.email}>
                {integrations.email ? "Enquiry notification emails are switched on." : "Email notifications are off. Enquiries are still saved here. Add RESEND_API_KEY and EMAIL_FROM to switch them on."}
              </Check>
              <Check ok={Boolean(settings.integrations.bookingUrl)}>
                {settings.integrations.bookingUrl ? "Booking link is set." : 'No booking link yet. "Book a discovery call" opens the enquiry form until you add one in Settings.'}
              </Check>
              <Check ok={analytics}>{analytics ? "Analytics is configured." : "Analytics is not configured. Add an ID in Settings when you are ready."}</Check>
              <Check ok={counts.media_missing_alt === 0}>
                {counts.media_missing_alt === 0 ? "Every image has alt text." : `${counts.media_missing_alt} image${counts.media_missing_alt === 1 ? "" : "s"} still need alt text in the Media library.`}
              </Check>
            </ul>
          </Card>

          <Card title="Quick links">
            <ul className="grid gap-1 text-[0.9375rem]">
              <li>
                <Link href="/admin/pages/" className="text-link">
                  Edit the homepage and other pages
                </Link>
              </li>
              <li>
                <Link href="/admin/pages/new/" className="text-link">
                  Create a new page
                </Link>
              </li>
              <li>
                <Link href="/admin/programmes/new/" className="text-link">
                  Add a new course
                </Link>
              </li>
              <li>
                <Link href="/admin/programmes/" className="text-link">
                  Update programme details, dates and fees
                </Link>
              </li>
              <li>
                <Link href="/admin/blog/new/" className="text-link">
                  Write a new article
                </Link>
              </li>
              {hasRole(user, "admin") && (
                <>
                  <li>
                    <Link href="/admin/settings/?tab=header" className="text-link">
                      Edit the announcement bar
                    </Link>
                    <span className="block text-sm text-muted">{announcement.text ? `Showing: “${announcement.text}”` : `Hidden. ${announcement.hidden}`}</span>
                  </li>
                  <li>
                    <Link href="/admin/settings/" className="text-link">
                      Change contact details, colours and links
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
