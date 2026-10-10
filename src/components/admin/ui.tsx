import { ArrowSquareOutIcon, CheckCircleIcon, InfoIcon, WarningIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {back && (
          <Link href={back.href} className="mb-2 inline-flex min-h-9 items-center text-sm font-semibold text-primary hover:underline">
            ← {back.label}
          </Link>
        )}
        <h1 className="text-[clamp(1.5rem,1.2rem+1.2vw,2rem)] leading-tight tracking-tight [overflow-wrap:anywhere]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-[0.9375rem] text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function Card({ title, description, children, className, id }: { title?: string; description?: string; children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={cn("rounded-2xl border border-line bg-surface p-4 sm:p-6", className)}>
      {title && <h2 className="text-lg leading-snug">{title}</h2>}
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div className={cn(title && "mt-5")}>{children}</div>
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
  contacted: "bg-sky text-primary-strong",
  new: "bg-navy text-white",
  archived: "bg-mist text-muted",
  rejected: "bg-danger-soft text-danger",
  spam: "bg-danger-soft text-danger",
  unsubscribed: "bg-mist text-muted",
};

const STATUS_LABELS: Record<string, string> = {
  in_progress: "In progress",
  discovery_call: "Discovery call",
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const text = label ?? STATUS_LABELS[status] ?? status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className={cn("inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold", STATUS_STYLES[status] ?? "bg-mist text-muted")}>
      {text}
    </span>
  );
}

export function Notice({ tone = "info", children, className }: { tone?: "info" | "success" | "warning" | "danger"; children: ReactNode; className?: string }) {
  const styles = {
    info: "bg-sky text-navy",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-[#5c4300]",
    danger: "bg-danger-soft text-danger",
  }[tone];
  const Icon = tone === "success" ? CheckCircleIcon : tone === "info" ? InfoIcon : WarningIcon;
  return (
    <div className={cn("flex gap-3 rounded-xl px-4 py-3 text-[0.9375rem]", styles, className)}>
      <Icon aria-hidden weight="fill" className="mt-0.5 size-5 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-12 text-center">
      <h2 className="text-lg">{title}</h2>
      {children && <p className="mx-auto mt-2 max-w-md text-[0.9375rem] text-muted">{children}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function ViewOnSite({ href, label = "View on site" }: { href: string; label?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="btn btn-quiet btn-sm">
      <ArrowSquareOutIcon aria-hidden weight="bold" className="size-4" />
      {label}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

/**
 * Responsive record list: a table from tablet width, stacked cards on phones.
 * Each cell carries its column label so the card layout stays readable.
 */
export function RecordTable({ columns, children }: { columns: string[]; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <table className="w-full border-collapse text-left text-[0.9375rem] max-md:block">
        <thead className="bg-mist text-sm text-muted max-md:hidden">
          <tr>
            {columns.map((column) => (
              <th key={column} scope="col" className="px-4 py-3 font-semibold first:pl-5 last:pr-5">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="max-md:block">{children}</tbody>
      </table>
    </div>
  );
}

export function RecordRow({ children }: { children: ReactNode }) {
  return <tr className="border-t border-line first:border-t-0 max-md:block max-md:p-4 md:hover:bg-sky/40">{children}</tr>;
}

export function RecordCell({ label, children, className, primary }: { label: string; children: ReactNode; className?: string; primary?: boolean }) {
  return (
    <td
      className={cn(
        "px-4 py-3 align-middle first:pl-5 last:pr-5 max-md:block max-md:p-0 max-md:py-1",
        !primary && "max-md:flex max-md:items-baseline max-md:gap-2",
        className,
      )}
    >
      {!primary && <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-muted md:hidden">{label}</span>}
      <div className="min-w-0">{children}</div>
    </td>
  );
}
