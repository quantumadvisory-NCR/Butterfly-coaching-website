import { ENQUIRY_LABELS } from "@/lib/validation/forms";
import { cn } from "@/lib/utils";

const dayLabel = (iso: string, style: "short" | "long" = "short") =>
  new Intl.DateTimeFormat("en-GB", style === "short" ? { day: "numeric", month: "short" } : { weekday: "long", day: "numeric", month: "long" }).format(new Date(`${iso}T12:00:00`));

/**
 * Enquiries per day as bars, the busiest day full height. Each bar shows its
 * date and count on hover or keyboard focus; a sentence sums it up for screen readers.
 */
export function EnquiryChart({ perDay }: { perDay: { day: string; n: number }[] }) {
  const max = Math.max(1, ...perDay.map((d) => d.n));
  const total = perDay.reduce((sum, d) => sum + d.n, 0);
  const half = Math.floor(perDay.length / 2);
  const recent = perDay.slice(half).reduce((sum, d) => sum + d.n, 0);
  const earlier = perDay.slice(0, half).reduce((sum, d) => sum + d.n, 0);
  const busiest = perDay.reduce((best, d) => (d.n > best.n ? d : best), perDay[0] ?? { day: "", n: 0 });
  const change = earlier === 0 ? null : Math.round(((recent - earlier) / earlier) * 100);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p>
          <span className="font-display text-4xl leading-none text-navy tabular-nums">{total.toLocaleString("en-IN")}</span>
          <span className="ml-2 text-sm text-muted">in the last {perDay.length} days</span>
        </p>
        {change !== null && (
          <p className={cn("rounded-full px-2.5 py-1 text-xs font-bold", change >= 0 ? "bg-success-soft text-success" : "bg-mist text-muted")}>
            {change >= 0 ? "▲" : "▼"} {Math.abs(change)}% on the {half} days before
          </p>
        )}
      </div>
      <p className="sr-only">
        {total === 0
          ? `No enquiries in the last ${perDay.length} days.`
          : `${total} enquiries in the last ${perDay.length} days. The busiest day was ${dayLabel(busiest.day, "long")}, with ${busiest.n}.`}
      </p>
      <div aria-hidden className="mt-5 flex h-36 items-end gap-[3px] border-b border-line">
        {perDay.map((d, i) => (
          <div key={d.day} className="group relative flex h-full flex-1 items-end">
            <div
              className={cn(
                "admin-chart-bar w-full rounded-t-[4px] transition-colors",
                d.n === 0 ? "h-[3px] bg-line" : i >= perDay.length - 7 ? "bg-accent group-hover:bg-accent-strong" : "bg-navy/80 group-hover:bg-navy",
              )}
              style={d.n ? { height: `${Math.max(6, (d.n / max) * 100)}%`, ["--i" as string]: i } : { ["--i" as string]: i }}
            />
            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-navy px-2 py-1 text-xs font-semibold text-white shadow-lg group-hover:block">
              {dayLabel(d.day)}: {d.n}
            </span>
          </div>
        ))}
      </div>
      <div aria-hidden className="mt-2 flex justify-between text-[0.6875rem] text-muted">
        <span>{perDay[0] && dayLabel(perDay[0].day)}</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-accent" /> Last 7 days
        </span>
        <span>Today</span>
      </div>
    </div>
  );
}

/** How the period's enquiries split by type, as labelled bars. */
export function EnquiryMix({ byType }: { byType: { type: string; n: number }[] }) {
  const total = byType.reduce((sum, t) => sum + t.n, 0);
  if (total === 0) return <p className="text-sm text-muted">The mix of enquiry types appears here once enquiries arrive.</p>;
  return (
    <ul className="grid gap-2.5">
      {byType.slice(0, 5).map((t) => (
        <li key={t.type}>
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="truncate font-semibold text-navy">{ENQUIRY_LABELS[t.type as keyof typeof ENQUIRY_LABELS] ?? t.type}</span>
            <span className="text-muted tabular-nums">{t.n}</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-mist">
            <div className="h-full rounded-full bg-navy" style={{ width: `${(t.n / total) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** A ring that fills to a share (0 to 1), with the percentage in the middle. */
export function Ring({ value, label, size = 112 }: { value: number; label: string; size?: number }) {
  const r = 44;
  const circumference = 2 * Math.PI * r;
  const share = Math.min(1, Math.max(0, value));
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-mist)" strokeWidth="9" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={share >= 0.9 ? "var(--color-success)" : "var(--color-accent)"}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${circumference * share} ${circumference}`}
        />
      </svg>
      <span className="text-center">
        <span className="block font-display text-2xl leading-none text-navy tabular-nums">{Math.round(share * 100)}%</span>
        <span className="mt-1 block text-[0.6875rem] font-semibold text-muted">{label}</span>
      </span>
    </div>
  );
}
