import {
  ArrowRightIcon,
  ArrowSquareOutIcon,
  CheckCircleIcon,
  ClockCounterClockwiseIcon,
  EnvelopeSimpleIcon,
  FilePlusIcon,
  FilesIcon,
  GearSixIcon,
  GraduationCapIcon,
  ImagesIcon,
  MegaphoneIcon,
  NewspaperIcon,
  PencilSimpleLineIcon,
  PlusCircleIcon,
  QuotesIcon,
  TrayIcon,
  UploadSimpleIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { desc } from "drizzle-orm";
import type { ComponentType, ReactNode } from "react";
import { AdminLink as Link } from "@/components/admin/admin-link";
import { AutoRefresh } from "@/components/admin/auto-refresh";
import { EnquiryChart, EnquiryMix, Ring } from "@/components/admin/dashboard-charts";
import { Card, Notice, StatusBadge } from "@/components/admin/ui";
import { Flyer } from "@/components/ui/effects";
import { ENTITIES, type EntityKey } from "@/lib/admin/entities";
import { contentCounts, enquiryTrend, recentActivity } from "@/lib/admin/entity-store";
import { announcementState } from "@/lib/announcement";
import { type SessionUser, hasRole, requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/content/public";
import { db } from "@/lib/db";
import { enquiries } from "@/lib/db/schema";
import { integrationStatus } from "@/lib/env";
import { cn, formatDateTime } from "@/lib/utils";
import { ENQUIRY_LABELS } from "@/lib/validation/forms";

type IconType = ComponentType<{ className?: string; weight?: "regular" | "bold" | "fill" }>;

/** The greeting and today's date, in India. */
function today(now = new Date()) {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Kolkata" }).format(now));
  return {
    greeting: hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening",
    date: new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" }).format(now),
  };
}

/** "5 minutes ago", "yesterday"; older than a week becomes the date itself. */
function ago(date: Date, now = Date.now()) {
  const seconds = Math.round((date.getTime() - now) / 1000);
  if (Math.abs(seconds) >= 7 * 86400) return formatDateTime(date);
  const format = new Intl.RelativeTimeFormat("en-GB", { numeric: "auto" });
  for (const [unit, size] of [["day", 86400], ["hour", 3600], ["minute", 60]] as const) {
    if (Math.abs(seconds) >= size) return format.format(Math.round(seconds / size), unit);
  }
  return "just now";
}

const plural = (n: number, one: string, many: string) => `${n.toLocaleString("en-IN")} ${n === 1 ? one : many}`;
const number = (n: number) => n.toLocaleString("en-IN");

function Metric({ icon: Icon, value, label, detail, href, attention }: { icon: IconType; value: number; label: string; detail?: string; href: string; attention?: boolean }) {
  return (
    <li>
      <Link
        href={href}
        className={cn(
          "admin-card group relative flex h-full flex-col overflow-hidden rounded-3xl border bg-surface p-4 transition-[border-color,box-shadow,translate] duration-200 hover:-translate-y-0.5 hover:border-navy/25 hover:shadow-card sm:p-5",
          attention ? "border-accent" : "border-line",
        )}
      >
        {attention && <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-accent" />}
        <span className="flex items-center justify-between gap-2">
          <span aria-hidden className={cn("grid size-10 place-items-center rounded-2xl text-navy transition-colors", attention ? "bg-accent" : "bg-accent-soft group-hover:bg-accent")}>
            <Icon weight="bold" className="size-5" />
          </span>
          <ArrowRightIcon aria-hidden weight="bold" className="size-4 text-navy/25 transition-[translate,color] group-hover:translate-x-0.5 group-hover:text-navy" />
        </span>
        <span className="mt-4 font-display text-[2rem] leading-none tracking-tight text-navy tabular-nums">{number(value)}</span>
        <span className="mt-1.5 font-semibold leading-snug text-navy">{label}</span>
        {detail && <span className="mt-1 text-sm leading-snug text-muted">{detail}</span>}
      </Link>
    </li>
  );
}

function Action({ href, icon: Icon, label, hint }: { href: string; icon: IconType; label: string; hint: string }) {
  return (
    <li>
      <Link
        href={href}
        className="group flex h-full min-h-16 items-center gap-3 rounded-2xl border border-line bg-surface px-3 py-2.5 transition-[border-color,background-color,translate] duration-200 hover:-translate-y-0.5 hover:border-navy/25 max-sm:flex-col max-sm:items-start max-sm:gap-2 max-sm:py-3"
      >
        <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-xl bg-navy text-white transition-colors group-hover:bg-accent group-hover:text-navy">
          <Icon weight="bold" className="size-[1.125rem]" />
        </span>
        <span className="min-w-0">
          <span className="block text-[0.9375rem] font-semibold leading-snug text-navy">{label}</span>
          <span className="block text-xs leading-snug text-muted max-sm:hidden">{hint}</span>
        </span>
      </Link>
    </li>
  );
}

function Todo({ href, tone, children }: { href?: string; tone: "action" | "setup"; children: ReactNode }) {
  const body = (
    <>
      <WarningCircleIcon aria-hidden weight="fill" className={cn("mt-0.5 size-5 shrink-0", tone === "action" ? "text-accent-strong" : "text-muted")} />
      <span className="min-w-0 flex-1">{children}</span>
      {href && <ArrowRightIcon aria-hidden weight="bold" className="mt-1 size-4 shrink-0 text-navy/40 group-hover:text-navy" />}
    </>
  );
  return (
    <li>
      {href ? (
        <Link href={href} className="group -mx-2 flex items-start gap-3 rounded-xl px-2 py-2.5 text-[0.9375rem] text-navy hover:bg-mist">
          {body}
        </Link>
      ) : (
        <span className="flex items-start gap-3 py-2.5 text-[0.9375rem] text-ink">{body}</span>
      )}
    </li>
  );
}

/** Where an activity entry leads, if the item still exists and this person may open it. */
function activityHref(entry: { action: string; entityType: string | null; entityId: string | null }, user: SessionUser) {
  if (entry.action.endsWith(".delete")) return null;
  if (entry.entityType === "page" && entry.entityId) return `/admin/pages/${entry.entityId}/`;
  const entity = entry.entityType ? ENTITIES[entry.entityType as EntityKey] : undefined;
  if (entity && entry.entityId) return `/admin/${entity.route}/${entry.entityId}/`;
  if (entry.entityType === "enquiry" && entry.entityId) return `/admin/enquiries/${entry.entityId}/`;
  if (entry.action.startsWith("media.")) return "/admin/media/";
  if (!hasRole(user, "admin")) return null;
  if (entry.action.startsWith("settings.")) return "/admin/settings/";
  if (entry.action.startsWith("navigation.")) return "/admin/navigation/";
  return null;
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const user = await requireUser();
  const [{ denied }, counts, recent, settings, activity, trend] = await Promise.all([
    searchParams,
    contentCounts(),
    db().select().from(enquiries).orderBy(desc(enquiries.createdAt)).limit(5),
    getSettings(),
    recentActivity(8),
    enquiryTrend(30),
  ]);
  const integrations = integrationStatus();
  const analytics = Boolean(settings.integrations.ga4Id || settings.integrations.gtmId);
  const announcement = announcementState(settings.header);
  const isAdmin = hasRole(user, "admin");
  const { greeting, date } = today();
  const firstName = user.fullName ? user.fullName.split(" ")[0] : "";
  const altCoverage = counts.media_images ? (counts.media_images - counts.media_missing_alt) / counts.media_images : 1;

  // One sentence on what is waiting, built only from real counts.
  const waiting = [
    counts.new_enquiries > 0 && plural(counts.new_enquiries, "new enquiry", "new enquiries"),
    counts.pending_testimonials > 0 && plural(counts.pending_testimonials, "testimonial awaiting approval", "testimonials awaiting approval"),
    counts.unpublished_changes > 0 && plural(counts.unpublished_changes, "page with unpublished changes", "pages with unpublished changes"),
  ].filter(Boolean) as string[];
  const summary = waiting.length
    ? `You have ${waiting.length > 1 ? `${waiting.slice(0, -1).join(", ")} and ${waiting.at(-1)}` : waiting[0]}.`
    : "Everything is up to date: nothing is waiting for you.";

  const todos: { href?: string; tone: "action" | "setup"; text: string }[] = [
    counts.new_enquiries > 0 && { href: "/admin/enquiries/?status=new", tone: "action" as const, text: `Reply to ${plural(counts.new_enquiries, "new enquiry", "new enquiries")}.` },
    counts.pending_testimonials > 0 && { href: "/admin/testimonials/", tone: "action" as const, text: `Approve or reject ${plural(counts.pending_testimonials, "testimonial", "testimonials")}.` },
    counts.unpublished_changes > 0 && { href: "/admin/pages/", tone: "action" as const, text: `Publish or discard changes on ${plural(counts.unpublished_changes, "page", "pages")}.` },
    counts.media_missing_alt > 0 && { href: "/admin/media/", tone: "action" as const, text: `Add alt text to ${plural(counts.media_missing_alt, "image", "images")} in the Media library.` },
    isAdmin && !announcement.text && { href: "/admin/settings/?tab=header", tone: "setup" as const, text: `The announcement bar is hidden. ${announcement.hidden}` },
    isAdmin && !settings.integrations.bookingUrl && { href: "/admin/settings/", tone: "setup" as const, text: 'No booking link yet: "Book a discovery call" opens the enquiry form until you add one.' },
    !integrations.email && { tone: "setup" as const, text: "Enquiry emails are off. Enquiries are still saved here; add RESEND_API_KEY and EMAIL_FROM to switch them on." },
    integrations.backend !== "supabase" && { tone: "setup" as const, text: "Running in local development mode. Connect Supabase before going live." },
    isAdmin && !analytics && { href: "/admin/settings/", tone: "setup" as const, text: "Analytics is not configured. Add an ID in Settings when you are ready." },
  ].filter(Boolean) as { href?: string; tone: "action" | "setup"; text: string }[];

  return (
    <>
      {denied && (
        <Notice tone="warning" className="mb-6">
          Your account does not have access to that area. Ask a site owner if you need it.
        </Notice>
      )}

      {/* Welcome: what is waiting, the live figures, and a butterfly passing through. */}
      <section
        aria-labelledby="dashboard-title"
        className="admin-rise on-dark relative isolate overflow-hidden rounded-[1.75rem] bg-[radial-gradient(40rem_20rem_at_110%_-20%,rgb(245_186_0/0.22),transparent_60%),linear-gradient(135deg,#262626,#161616)] px-5 py-6 text-white sm:px-8 sm:py-8"
      >
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <Flyer path="hero" className="opacity-90" />
        </div>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white/65">
              {greeting} · {date}
            </p>
            <h1 id="dashboard-title" className="mt-1 text-[clamp(1.75rem,1.3rem+1.6vw,2.5rem)] leading-tight tracking-tight !text-white">
              Welcome{firstName ? `, ${firstName}` : ""}
            </h1>
            <p className="mt-2 max-w-xl text-[0.9375rem] text-white/80">{summary}</p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <a href="/" target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
                <ArrowSquareOutIcon aria-hidden weight="bold" className="size-4" />
                View the website<span className="sr-only"> (opens in a new tab)</span>
              </a>
              {counts.new_enquiries > 0 ? (
                <Link href="/admin/enquiries/?status=new" className="btn btn-secondary btn-sm">
                  Review new enquiries
                </Link>
              ) : (
                <Link href="/admin/pages/" className="btn btn-secondary btn-sm">
                  Edit pages
                </Link>
              )}
            </div>
          </div>
          <div className="shrink-0">
            <AutoRefresh className="mb-2 text-white/70 lg:justify-end" />
            <dl className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: "New enquiries", value: counts.new_enquiries },
                { label: "This week", value: counts.enquiries_week },
                { label: "Subscribers", value: counts.subscribers },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-3 backdrop-blur-sm sm:px-4">
                  <dt className="text-[0.6875rem] font-semibold text-white/60">{stat.label}</dt>
                  <dd className="mt-1 font-display text-2xl leading-none text-white tabular-nums">{number(stat.value)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Enquiries over time, the mix, and the library's health. */}
      <div className="admin-stagger mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card
          title="Enquiries"
          description="Every form submitted on the website, per day."
          action={
            <Link href="/admin/enquiries/" className="text-link shrink-0 text-sm">
              Inbox
            </Link>
          }
        >
          <EnquiryChart perDay={trend.perDay} />
        </Card>
        <div className="grid content-start gap-6">
          <Card title="What people ask about" description="The last 30 days.">
            <EnquiryMix byType={trend.byType} />
          </Card>
          <Card title="Media library">
            <div className="flex items-center gap-5">
              <Ring value={altCoverage} label="alt text" size={104} />
              <ul className="grid gap-1.5 text-sm">
                <li>
                  <span className="font-semibold text-navy tabular-nums">{number(counts.media_images)}</span> <span className="text-muted">images</span>
                </li>
                <li>
                  <span className="font-semibold text-navy tabular-nums">{number(counts.media_videos)}</span> <span className="text-muted">videos</span>
                </li>
                <li>
                  <span className="font-semibold text-navy tabular-nums">{number(counts.media_files)}</span> <span className="text-muted">PDFs</span>
                </li>
                <li>
                  <Link href="/admin/media/" className="text-link text-sm">
                    <UploadSimpleIcon aria-hidden weight="bold" className="size-4" />
                    Upload
                  </Link>
                </li>
              </ul>
            </div>
          </Card>
        </div>
      </div>

      <h2 className="sr-only">At a glance</h2>
      <ul className="admin-stagger mt-6 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3">
        <Metric
          icon={TrayIcon}
          value={counts.new_enquiries}
          label="New enquiries"
          detail={`${number(counts.open_enquiries)} open · ${number(counts.enquiries_week)} this week`}
          href="/admin/enquiries/?status=new"
          attention={counts.new_enquiries > 0}
        />
        <Metric
          icon={FilesIcon}
          value={counts.published_pages}
          label="Published pages"
          detail={counts.unpublished_changes > 0 ? `${counts.unpublished_changes} with unpublished changes` : `${counts.draft_pages} draft${counts.draft_pages === 1 ? "" : "s"}`}
          href="/admin/pages/"
          attention={counts.unpublished_changes > 0}
        />
        <Metric
          icon={GraduationCapIcon}
          value={counts.published_programmes}
          label="Published programmes"
          detail={`${counts.draft_programmes} draft${counts.draft_programmes === 1 ? "" : "s"}`}
          href="/admin/programmes/"
        />
        <Metric
          icon={NewspaperIcon}
          value={counts.published_posts}
          label="Published articles"
          detail={`${counts.draft_posts} draft${counts.draft_posts === 1 ? "" : "s"}`}
          href="/admin/blog/"
        />
        <Metric
          icon={QuotesIcon}
          value={counts.approved_testimonials}
          label="Approved testimonials"
          detail={counts.pending_testimonials > 0 ? `${counts.pending_testimonials} awaiting approval` : "None waiting"}
          href="/admin/testimonials/"
          attention={counts.pending_testimonials > 0}
        />
        <Metric
          icon={EnvelopeSimpleIcon}
          value={counts.subscribers}
          label="Newsletter subscribers"
          detail={`${number(counts.subscribers_month)} in the last 30 days`}
          href="/admin/subscribers/"
        />
      </ul>

      <section aria-labelledby="quick-actions" className="mt-8">
        <h2 id="quick-actions" className="mb-3 text-lg leading-snug">
          Quick actions
        </h2>
        <ul className="grid grid-cols-2 gap-2.5 lg:grid-cols-3 2xl:grid-cols-4">
          <Action href="/admin/pages/" icon={PencilSimpleLineIcon} label="Edit pages" hint="The homepage and every other page" />
          <Action href="/admin/pages/new/" icon={FilePlusIcon} label="Create a page" hint="Built from sections" />
          <Action href="/admin/programmes/new/" icon={PlusCircleIcon} label="Add a new course" hint="Gets its own page once published" />
          <Action href="/admin/blog/new/" icon={NewspaperIcon} label="Write an article" hint="For the Resources blog" />
          <Action href="/admin/enquiries/" icon={TrayIcon} label="Review enquiries" hint="Reply to and track each lead" />
          <Action href="/admin/testimonials/" icon={QuotesIcon} label="Manage testimonials" hint="Approve stories, add videos" />
          <Action href="/admin/media/" icon={ImagesIcon} label="Media library" hint="Photos, videos and PDFs" />
          {isAdmin && (
            <>
              <Action href="/admin/settings/?tab=header" icon={MegaphoneIcon} label="Announcement bar" hint={announcement.text ? "Showing on every page" : "Hidden at the moment"} />
              <Action href="/admin/settings/" icon={GearSixIcon} label="Website settings" hint="Contact details, colours and links" />
            </>
          )}
        </ul>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <div className="grid content-start gap-6">
          <Card
            title="Latest enquiries"
            action={
              <Link href="/admin/enquiries/" className="text-link shrink-0 text-sm">
                Open the enquiry inbox
              </Link>
            }
          >
            {recent.length === 0 ? (
              <p className="text-[0.9375rem] text-muted">No enquiries yet. When someone submits a form on the website it appears here.</p>
            ) : (
              <ul className="-my-2 divide-y divide-line">
                {recent.map((enquiry) => (
                  <li key={enquiry.id}>
                    <Link href={`/admin/enquiries/${enquiry.id}/`} className="group flex items-center gap-3 rounded-lg py-3 hover:text-primary">
                      <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-soft font-sans font-bold text-navy transition-colors group-hover:bg-accent">
                        {enquiry.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-navy">{enquiry.name}</span>
                        <span className="block truncate text-sm text-muted">
                          {ENQUIRY_LABELS[enquiry.type]}, {ago(enquiry.createdAt)}
                        </span>
                      </span>
                      <StatusBadge status={enquiry.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Recent activity" description="Changes made in this admin, newest first.">
            {activity.length === 0 ? (
              <p className="text-[0.9375rem] text-muted">Nothing yet. Edits, saves and publishing appear here as they happen.</p>
            ) : (
              <ol className="relative grid gap-1 before:absolute before:bottom-3 before:left-[0.4375rem] before:top-3 before:w-px before:bg-line">
                {activity.map((entry) => {
                  const href = activityHref(entry, user);
                  const who = entry.actorName || entry.actorEmail || "Someone";
                  const text = (
                    <>
                      <span className="block text-[0.9375rem] leading-snug text-navy">{entry.summary || entry.action}</span>
                      <span className="block text-sm text-muted">
                        {who} · <time dateTime={entry.createdAt.toISOString()} title={formatDateTime(entry.createdAt)}>{ago(entry.createdAt)}</time>
                      </span>
                    </>
                  );
                  return (
                    <li key={entry.id} className="relative flex gap-3">
                      <span aria-hidden className="relative z-10 mt-2.5 size-[0.9375rem] shrink-0 rounded-full border-[3px] border-surface bg-accent" />
                      {href ? (
                        <Link href={href} className="-mx-2 min-w-0 flex-1 rounded-xl px-2 py-1.5 hover:bg-mist">
                          {text}
                        </Link>
                      ) : (
                        <span className="min-w-0 flex-1 py-1.5">{text}</span>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
            {user.role === "owner" && (
              <Link href="/admin/audit/" className="text-link mt-3">
                <ClockCounterClockwiseIcon aria-hidden weight="bold" className="size-4" />
                Full audit log
              </Link>
            )}
          </Card>
        </div>

        <div className="grid content-start gap-6">
          <Card title="Needs your attention">
            {todos.length === 0 ? (
              <p className="flex items-center gap-2.5 text-[0.9375rem] font-semibold text-success">
                <CheckCircleIcon aria-hidden weight="fill" className="size-5" />
                All clear. Nothing needs you right now.
              </p>
            ) : (
              <ul className="-my-1 divide-y divide-line">
                {todos.map((todo) => (
                  <Todo key={todo.text} href={todo.href} tone={todo.tone}>
                    {todo.text}
                  </Todo>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
