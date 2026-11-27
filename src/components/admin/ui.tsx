import { CheckCircleIcon, InfoIcon, WarningIcon } from "@phosphor-icons/react/dist/ssr";
import { AdminLink as Link } from "@/components/admin/admin-link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  eyebrow,
  description,
  actions,
  back,
}: {
  title: string;
  /** The menu section above the title, e.g. "Content". */
  eyebrow?: string;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <header className="admin-rise mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {back ? (
          <Link href={back.href} className="mb-2 inline-flex min-h-9 items-center gap-1 rounded-full text-sm font-semibold text-muted transition-colors hover:text-navy">
            <span aria-hidden>←</span> {back.label}
          </Link>
        ) : (
          eyebrow && (
            <p className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-label">
              <span aria-hidden className="h-px w-5 bg-accent" />
              {eyebrow}
            </p>
          )
        )}
        <h1 className="text-[clamp(1.625rem,1.25rem+1.4vw,2.375rem)] leading-[1.1] tracking-tight [overflow-wrap:anywhere]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function Card({
  title,
  description,
  children,
  className,
  id,
  action,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  id?: string;
  /** A link or button shown at the right of the title. */
  action?: ReactNode;
}) {
  return (
    <section id={id} className={cn("admin-card rounded-3xl border border-line bg-surface p-4 sm:p-6", className)}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <h2 className="text-lg leading-snug">{title}</h2>}
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={cn((title || action) && "mt-5")}>{children}</div>
    </section>
  );
}

const STATUS_STYLES: Record<string, string> = {
  published: "bg-success-soft text-success",
  approved: "bg-success-soft text-success",
  subscribed: "bg-success-soft text-success",
  closed: "bg-mist text-muted",
  qualified: "bg-success-soft text-success",
  draft: "bg-warning-soft text-[#6b4e00]",
  pending: "bg-warning-soft text-[#6b4e00]",
  in_progress: "bg-warning-soft text-[#6b4e00]",
  contacted: "bg-tint text-primary-strong",
  new: "bg-navy text-white",
  archived: "bg-mist text-muted",
  rejected: "bg-danger-soft text-danger",
  spam: "bg-danger-soft text-danger",
  unsubscribed: "bg-mist text-muted",
};

const STATUS_DOTS: Record<string, string> = {
  published: "bg-success",
  approved: "bg-success",
  subscribed: "bg-success",
  qualified: "bg-success",
  draft: "bg-accent-strong",
  pending: "bg-accent-strong",
  in_progress: "bg-accent-strong",
  new: "bg-accent",
  rejected: "bg-danger",
  spam: "bg-danger",
};

const STATUS_LABELS: Record<string, string> = {
  in_progress: "In progress",
  discovery_call: "Discovery call",
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const text = label ?? STATUS_LABELS[status] ?? status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold", STATUS_STYLES[status] ?? "bg-mist text-muted")}>
      <span aria-hidden className={cn("size-1.5 rounded-full", STATUS_DOTS[status] ?? "bg-current opacity-50")} />
      {text}
    </span>
  );
}

export function Notice({ tone = "info", children, className }: { tone?: "info" | "success" | "warning" | "danger"; children: ReactNode; className?: string }) {
  const styles = {
    info: "bg-tint text-navy",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-[#5c4300]",
    danger: "bg-danger-soft text-danger",
  }[tone];
  const Icon = tone === "success" ? CheckCircleIcon : tone === "info" ? InfoIcon : WarningIcon;
  return (
    <div className={cn("flex gap-3 rounded-2xl px-4 py-3 text-[0.9375rem]", styles, className)}>
      <Icon aria-hidden weight="fill" className="mt-0.5 size-5 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-line bg-surface px-6 py-14 text-center">
      <h2 className="text-lg">{title}</h2>
      {children && <p className="mx-auto mt-2 max-w-md text-[0.9375rem] text-muted">{children}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

/**
 * Responsive record list: a table from tablet width, stacked cards on phones.
 * Each cell carries its column label so the card layout stays readable. Give it
 * an id and put a <ListFilter> above it to filter the rows as you type.
 */
export function RecordTable({ columns, children, id }: { columns: string[]; children: ReactNode; id?: string }) {
  return (
    <div id={id} className="admin-card overflow-hidden rounded-3xl border border-line bg-surface">
      <table className="w-full border-collapse text-left text-[0.9375rem] max-md:block">
        <thead className="border-b border-line bg-[#faf9f6] text-xs uppercase tracking-[0.08em] text-muted max-md:hidden">
          <tr>
            {columns.map((column) => (
              <th key={column} scope="col" className="px-4 py-3 font-bold first:pl-5 last:pr-5">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="max-md:block">{children}</tbody>
      </table>
      <p data-filter-empty hidden className="px-5 py-10 text-center text-muted">
        Nothing matches that search.
      </p>
    </div>
  );
}

export function RecordRow({ children }: { children: ReactNode }) {
  return <tr data-filter-row className="border-t border-line transition-colors first:border-t-0 max-md:block max-md:p-4 md:hover:bg-[#faf9f6]">{children}</tr>;
}

export function RecordCell({ label, children, className, primary }: { label: string; children: ReactNode; className?: string; primary?: boolean }) {
  return (
    <td
      className={cn(
        "px-4 py-3.5 align-middle first:pl-5 last:pr-5 max-md:block max-md:p-0 max-md:py-1",
        !primary && "max-md:flex max-md:items-baseline max-md:gap-2",
        className,
      )}
    >
      {!primary && <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-muted md:hidden">{label}</span>}
      <div className="min-w-0">{children}</div>
    </td>
  );
}
