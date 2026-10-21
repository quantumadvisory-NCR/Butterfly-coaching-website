import { CaretRightIcon, CheckCircleIcon, CompassIcon, EarIcon, HandshakeIcon, LightbulbIcon, QuestionIcon, SealCheckIcon } from "@phosphor-icons/react/dist/ssr";
import type { ComponentType } from "react";
import type { ProgrammeView } from "@/lib/content/public";
import { cn } from "@/lib/utils";

/*
 * The redesigned sections of the ICF credential pages (design refresh,
 * October 2026). Each credential's journey is told in three phases ending in
 * a yellow "Certify" card, with the hours behind it; the ACC page also shows
 * its six outcomes as the two wings of a butterfly. Step titles, descriptions,
 * hours and outcomes come from the programme record; only the arrangement,
 * the headings and the one-line outcome descriptions are set here.
 */

type Module = ProgrammeView["modules"][number];
type IconType = ComponentType<{ className?: string; weight?: "regular" | "bold" | "fill" | "duotone" }>;

/** Each journey has seven steps, grouped into three phases. A different count falls back to the plain list. */
export const JOURNEY_STEP_COUNT = 7;
/** Three core skills and three foundations. A different count falls back to the checklist. */
export const ACC_OUTCOME_COUNT = 6;

/** "2,500 hours" becomes 2500; steps without hours count as 0. */
function hoursOf(label: string | null) {
  const value = Number.parseFloat((label ?? "").replace(/,/g, ""));
  return Number.isFinite(value) ? value : 0;
}

const formatHours = (hours: number) => hours.toLocaleString("en-IN");

function EggIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 40 40" className={className}>
      <ellipse cx="20" cy="22" rx="11" ry="14" fill="var(--color-accent)" />
      <ellipse cx="16" cy="16" rx="3" ry="4.5" fill="#fff" opacity="0.55" />
    </svg>
  );
}

function CaterpillarIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 40 40" className={className}>
      <path d="M31 13 L33 7 M33 14 L37 10" stroke="var(--color-navy)" strokeWidth="2" strokeLinecap="round" fill="none" />
      {[6, 13, 20, 27].map((x, i) => (
        <circle key={x} cx={x} cy={i % 2 ? 25 : 27} r="5" fill={i % 2 ? "var(--color-ink)" : "var(--color-navy)"} />
      ))}
      <circle cx="32" cy="20" r="6" fill="var(--color-accent)" />
    </svg>
  );
}

function SproutIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 40 40" className={className}>
      <path d="M20 35 V19" stroke="var(--color-navy)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M20 21 C20 13 14 8 6 8 C6 16 12 21 20 21 Z" fill="var(--color-accent)" />
      <path d="M20 18 C20 11 25 7 33 7 C33 14 28 18 20 18 Z" fill="var(--color-navy)" />
    </svg>
  );
}

function TargetIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 40 40" className={className}>
      <circle cx="20" cy="20" r="13" fill="none" stroke="var(--color-navy)" strokeWidth="2.5" />
      <circle cx="20" cy="20" r="6.5" fill="var(--color-accent)" />
    </svg>
  );
}

function WaveIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 40 40" className={className}>
      <path d="M4 23 C8 12 13 12 17 20 C21 28 26 28 30 18" fill="none" stroke="var(--color-navy)" strokeWidth="2.75" strokeLinecap="round" />
      <circle cx="33.5" cy="14.5" r="3.5" fill="var(--color-accent)" />
    </svg>
  );
}

/** The life-cycle butterfly: charcoal upper wings with yellow spots, yellow lower wings. */
function ButterflyIcon({ className, flap = false }: { className?: string; flap?: boolean }) {
  return (
    <svg aria-hidden viewBox="0 0 120 100" className={className}>
      <g className={cn(flap && "wing-flap")}>
        <path d="M58 48 C50 20 24 6 11 16 C0 25 6 46 26 51 C38 54 50 52 58 50 Z" fill="var(--color-navy)" />
        <path d="M62 48 C70 20 96 6 109 16 C120 25 114 46 94 51 C82 54 70 52 62 50 Z" fill="var(--color-navy)" />
        <circle cx="30" cy="27" r="7" fill="var(--color-accent)" />
        <circle cx="90" cy="27" r="7" fill="var(--color-accent)" />
        <path d="M58 52 C48 56 34 66 32 78 C30 90 44 92 50 84 C56 76 58 64 58 52 Z" fill="var(--color-accent)" />
        <path d="M62 52 C72 56 86 66 88 78 C90 90 76 92 70 84 C64 76 62 64 62 52 Z" fill="var(--color-accent)" />
      </g>
      <rect x="57" y="30" width="6" height="52" rx="3" fill="var(--color-navy)" />
      <path d="M59 32 C56 22 52 15 48 10 M61 32 C64 22 68 15 72 10" stroke="var(--color-navy)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

type Phase = { name: string; subtitle: string; Icon: ComponentType<{ className?: string }>; steps: readonly number[]; finish?: boolean };

const ORDER = "Education, practice, mentoring and evaluation, in the order you will experience them";

const JOURNEYS: Record<string, { heading: string; intro: string; phases: readonly Phase[] }> = {
  ACC: {
    heading: "From curious to credentialed",
    intro: `${ORDER}.`,
    phases: [
      { name: "Learn", subtitle: "Foundations", Icon: EggIcon, steps: [0, 1] },
      { name: "Practise", subtitle: "Real conversations", Icon: CaterpillarIcon, steps: [2, 3, 4] },
      { name: "Certify", subtitle: "Earn your ACC", Icon: ButterflyIcon, steps: [5, 6], finish: true },
    ],
  },
  PCC: {
    heading: "From practising to proficient",
    intro: `${ORDER}, building on your ACC foundation.`,
    phases: [
      { name: "Deepen", subtitle: "Advanced education", Icon: SproutIcon, steps: [0, 1] },
      { name: "Practise", subtitle: "Real conversations", Icon: CaterpillarIcon, steps: [2, 3, 4] },
      { name: "Certify", subtitle: "Earn your PCC", Icon: ButterflyIcon, steps: [5, 6], finish: true },
    ],
  },
  MCC: {
    heading: "From proficient to masterful",
    intro: `${ORDER}, building on your PCC foundation.`,
    phases: [
      { name: "Refine", subtitle: "Mastery education", Icon: TargetIcon, steps: [0, 1] },
      { name: "Embody", subtitle: "Practice at depth", Icon: WaveIcon, steps: [2, 3, 4] },
      { name: "Certify", subtitle: "Earn your MCC", Icon: ButterflyIcon, steps: [5, 6], finish: true },
    ],
  },
};

/** What the hours of steps 2, 4 and 5 are, for the "at a glance" bar. */
const HOUR_KINDS: Record<number, { label: string; colour: string }> = {
  1: { label: "Coach education", colour: "bg-navy" },
  3: { label: "Mentor coaching", colour: "bg-ink/45" },
  4: { label: "Coaching experience", colour: "bg-accent" },
};

/** True when a credential has a redesigned journey (ACC, PCC and MCC). */
export function hasJourney(credential: string | null): credential is string {
  return Boolean(credential && credential in JOURNEYS);
}

/**
 * "Your transformation": headline figures; the three phases with their steps,
 * joined by arrows on wide screens; and where the hours go.
 */
export function CredentialJourney({ credential, modules }: { credential: string; modules: Module[] }) {
  const journey = JOURNEYS[credential]!;
  const hours = modules.map((step) => hoursOf(step.hoursLabel));
  const total = hours.reduce((sum, value) => sum + value, 0);
  const figures = [
    total > 0 && { value: formatHours(total), label: "hours of learning & practice" },
    { value: String(modules.length), label: "guided milestones" },
    { value: "1", label: `ICF ${credential} credential` },
  ].filter(Boolean) as { value: string; label: string }[];
  const segments = hours
    .map((value, i) => ({ value, kind: HOUR_KINDS[i] ?? { label: modules[i]!.title, colour: "bg-ink/45" } }))
    .filter((segment) => segment.value > 0);

  return (
    <section id="journey" aria-labelledby="journey-heading" className="section-space bg-page">
      <div className="container-site">
        <div className="relative isolate overflow-hidden rounded-[var(--radius-panel)] bg-tint px-5 py-8 sm:px-8 md:px-10 md:py-10 lg:px-12 lg:py-12">
          <div aria-hidden className="pointer-events-none absolute -right-24 -top-28 -z-10 size-80 rounded-full bg-accent/30 blur-3xl" />
          <p className="eyebrow mb-2">Your transformation</p>
          <h2 id="journey-heading" className="text-h2">
            {journey.heading}
          </h2>
          <p className="mt-3 max-w-xl text-lead text-ink">{journey.intro}</p>
          <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-4 max-sm:grid max-sm:grid-cols-3 max-sm:gap-x-4 md:mt-7">
            {figures.map((figure) => (
              <div key={figure.label} className="flex flex-col-reverse">
                <dt className="mt-1 text-sm">{figure.label}</dt>
                <dd>
                  {/* A yellow highlighter stripe behind the lower half of each figure. */}
                  <span className="bg-[linear-gradient(transparent_55%,var(--color-accent)_55%,var(--color-accent)_90%,transparent_90%)] px-0.5 font-display text-4xl font-extrabold leading-none tracking-tight text-navy md:text-[2.75rem]">
                    {figure.value}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
          <ul className="mt-8 grid gap-4 md:mt-9 lg:grid-cols-3 lg:gap-6">
            {journey.phases.map((phase, p) => {
              const phaseHours = phase.steps.reduce<number>((sum, i) => sum + hours[i]!, 0);
              return (
                <li
                  key={phase.name}
                  className={cn(
                    "reveal relative flex flex-col rounded-card p-5 shadow-card transition-[translate,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-lift sm:p-6",
                    phase.finish ? "bg-accent" : "bg-surface",
                  )}
                >
                  {p < journey.phases.length - 1 && (
                    <CaretRightIcon aria-hidden weight="bold" className="absolute -right-[1.0625rem] top-1/2 hidden size-3.5 -translate-y-1/2 text-accent lg:block" />
                  )}
                  <phase.Icon className="size-10" />
                  <h3 className="mt-3 text-h3">{phase.name}</h3>
                  <p className={cn("mt-0.5 text-sm font-bold", phase.finish ? "text-navy" : "text-label")}>
                    {phase.subtitle}
                    {phaseHours > 0 && ` · ${formatHours(phaseHours)} hrs`}
                  </p>
                  <ol className={cn("mt-4 grid divide-y border-t", phase.finish ? "divide-navy/15 border-navy/15" : "divide-line border-line")}>
                    {phase.steps.map((i) => {
                      const step = modules[i]!;
                      return (
                        <li key={step.id} className="py-3.5 last:pb-0">
                          <p className="font-bold leading-snug text-navy">
                            {i + 1}. {step.title}
                            {hours[i]! > 0 && (
                              <span className="ml-2 inline-block rounded-full bg-tint px-2 py-0.5 align-[0.125em] text-xs font-bold">{formatHours(hours[i]!)}h</span>
                            )}
                          </p>
                          {step.description && <p className={cn("mt-1 text-[0.9375rem] leading-relaxed", phase.finish && "text-navy")}>{step.description}</p>}
                        </li>
                      );
                    })}
                  </ol>
                </li>
              );
            })}
          </ul>
          {segments.length > 1 && (
            <div className="mt-8 md:mt-9">
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-4">
                <p className="shrink-0 text-sm">
                  <span className="font-bold text-navy">{formatHours(total)} hrs</span> at a glance
                </p>
                <div aria-hidden className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full">
                  {segments.map((segment) => (
                    <span key={segment.kind.label} className={cn("min-w-1 rounded-full", segment.kind.colour)} style={{ flexGrow: segment.value }} />
                  ))}
                </div>
              </div>
              <ul className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-[0.8125rem]">
                {segments.map((segment) => (
                  <li key={segment.kind.label} className="flex items-center gap-1.5">
                    <span aria-hidden className={cn("size-2.5 rounded-sm", segment.kind.colour)} />
                    {segment.kind.label} {formatHours(segment.value)}h
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * Display copy for the six ACC outcomes, keyed by the outcome as stored in the
 * admin. An outcome edited to something else still shows, with its own words
 * and a plain icon.
 */
const WING_COPY: Record<string, { title: string; line: string; Icon: IconType }> = {
  "deep listening": { title: "Deep listening", line: "Hear what is said, and what is not.", Icon: EarIcon },
  "powerful questioning": { title: "Powerful questioning", line: "Ask the question that opens a new door.", Icon: QuestionIcon },
  "creating awareness": { title: "Creating awareness", line: "Help clients see their own patterns.", Icon: LightbulbIcon },
  "ethical, effective coaching partnerships": { title: "Ethical, effective coaching partnerships", line: "Build trust that lasts beyond the session.", Icon: HandshakeIcon },
  "a working grounding in the icf core competencies and ethical practice": {
    title: "ICF Core Competencies & ethics",
    line: "A working grounding that guides every call.",
    Icon: CompassIcon,
  },
  "readiness for acc performance evaluation and the icf credentialing exam": {
    title: "ACC readiness",
    line: "Prepared for the performance evaluation and ICF exam.",
    Icon: SealCheckIcon,
  },
};

function WingCard({ number, title, line, Icon, side }: { number: number; title: string; line: string; Icon: IconType; side: "left" | "right" }) {
  return (
    <li
      className={cn(
        "reveal group flex items-start gap-3.5 rounded-2xl border border-line bg-surface p-4 shadow-card transition-colors duration-300 hover:border-accent hover:bg-accent sm:p-5",
        side === "left" && "lg:flex-row-reverse lg:text-right",
      )}
    >
      <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-xl bg-tint text-navy transition-colors group-hover:bg-surface">
        <Icon weight="bold" className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-extrabold tracking-[0.12em] text-label group-hover:text-navy">{String(number).padStart(2, "0")}</span>
        <span className="mt-0.5 block font-bold leading-snug text-navy">{title}</span>
        {line && <span className="mt-1 block text-[0.9375rem] leading-snug group-hover:text-navy">{line}</span>}
      </span>
    </li>
  );
}

/** "Your coaching wings": three core skills on the left wing, three foundations on the right, the learner at the centre. */
export function AccWings({ outcomes }: { outcomes: string[] }) {
  const items = outcomes.map((text, i) => ({
    number: i + 1,
    ...(WING_COPY[text.trim().toLowerCase()] ?? { title: text, line: "", Icon: CheckCircleIcon }),
  }));
  return (
    <section aria-labelledby="wings-heading" className="section-space bg-page">
      <div className="container-site">
        <div className="rounded-[var(--radius-panel)] bg-tint px-5 py-9 sm:px-8 md:px-10 lg:px-12 lg:py-12">
          <div className="mx-auto max-w-xl text-center">
            <p className="eyebrow mb-2">Your coaching wings</p>
            <h2 id="wings-heading" className="text-h2">
              What you will build
            </h2>
            <p className="mt-3 text-[1.0625rem] leading-relaxed">Three core skills on one wing, three foundations on the other. Together, they help you take flight as a coach.</p>
          </div>
          <div className="mt-8 grid items-center gap-4 md:mt-10 md:grid-cols-2 md:max-lg:items-stretch lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-8">
            {/* The learner at the centre: above the wings on phones and tablets (the wings side by side on tablets), between them on desktop. */}
            <div aria-hidden className="relative mx-auto mb-2 grid size-52 place-items-center md:col-span-2 lg:order-2 lg:col-span-1 lg:mb-0 lg:size-64">
              <div className="orbit-spin absolute inset-0 rounded-full border-2 border-dashed border-navy/20" />
              <div className="absolute inset-[16%] rounded-full bg-accent/25 blur-2xl" />
              <div className="absolute inset-[13%] rounded-full bg-surface shadow-card" />
              <ButterflyIcon flap className="relative w-[46%]" />
              <span className="absolute bottom-[9%] rounded-full bg-navy px-3 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-white">You, the coach</span>
            </div>
            <ul className="grid gap-4 md:max-lg:auto-rows-fr lg:order-1">
              {items.slice(0, 3).map((item) => (
                <WingCard key={item.number} {...item} side="left" />
              ))}
            </ul>
            <ul className="grid gap-4 md:max-lg:auto-rows-fr lg:order-3">
              {items.slice(3).map((item) => (
                <WingCard key={item.number} {...item} side="right" />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
