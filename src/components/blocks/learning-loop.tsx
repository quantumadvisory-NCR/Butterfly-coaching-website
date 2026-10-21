"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ButtonLink } from "@/components/ui/button-link";
import { cn } from "@/lib/utils";

export type LoopStep = { title: string; body: string; quote: string; quoteBy: string };

type Props = {
  anchor?: string;
  eyebrow: string;
  heading: string;
  intro: string;
  steps: LoopStep[];
  /** The outcome at the centre of the loop, e.g. "Build capability". */
  outcome: string;
  ctaLead: string;
  cta: { label: string; href: string } | null;
};

/** Loop geometry, in percent of the square drawing. */
const RADIUS = 30;
/** Radians kept clear around each node, so the arcs start and end outside the circles. */
const NODE_GAP = 0.34;
/** Seconds each arc takes to draw in. */
const ARC_SECONDS = 0.4;
const AUTOPLAY_MS = 1800;

const angleOf = (i: number, count: number) => -Math.PI / 2 + (i * 2 * Math.PI) / count;
const pointAt = (angle: number) => ({ x: 50 + RADIUS * Math.cos(angle), y: 50 + RADIUS * Math.sin(angle) });
const fixed = (n: number) => n.toFixed(2);

/** The arc from one node to the next (clockwise), and an arrowhead at its end. */
function arc(i: number, count: number) {
  const start = pointAt(angleOf(i, count) + NODE_GAP);
  const endAngle = angleOf(i + 1, count) - NODE_GAP;
  const end = pointAt(endAngle);
  const tangent = { x: -Math.sin(endAngle), y: Math.cos(endAngle) };
  const normal = { x: Math.cos(endAngle), y: Math.sin(endAngle) };
  const base = { x: end.x - tangent.x * 2.6, y: end.y - tangent.y * 2.6 };
  return {
    path: `M ${fixed(start.x)} ${fixed(start.y)} A ${RADIUS} ${RADIUS} 0 0 1 ${fixed(end.x)} ${fixed(end.y)}`,
    head: `M ${fixed(end.x)} ${fixed(end.y)} L ${fixed(base.x + normal.x * 1.6)} ${fixed(base.y + normal.y * 1.6)} L ${fixed(base.x - normal.x * 1.6)} ${fixed(base.y - normal.y * 1.6)} Z`,
  };
}

/** The BCA butterfly from the side: its wings open a little more with each step and turn yellow at the last. */
function LoopButterfly({ open, complete, className }: { open: number; complete: boolean; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 120 100" className={className}>
      <g
        className={cn("transition-[scale,color] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none", complete ? "text-accent" : "text-ink/45")}
        style={{ scale: `${open} 1`, transformBox: "view-box", transformOrigin: "60px 50px" }}
        fill="currentColor"
      >
        <path d="M58 48 C50 20 24 6 11 16 C0 25 6 46 26 51 C38 54 50 52 58 50 Z" />
        <path d="M62 48 C70 20 96 6 109 16 C120 25 114 46 94 51 C82 54 70 52 62 50 Z" />
        <path d="M58 52 C48 56 34 66 32 78 C30 90 44 92 50 84 C56 76 58 64 58 52 Z" />
        <path d="M62 52 C72 56 86 66 88 78 C90 90 76 92 70 84 C64 76 62 64 62 52 Z" />
      </g>
      <rect x="57" y="30" width="6" height="52" rx="3" fill="var(--color-navy)" />
      <path d="M59 32 C56 22 52 15 48 10 M61 32 C64 22 68 15 72 10" stroke="var(--color-navy)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/**
 * "How you'll grow, one loop at a time" (BCA learning journey brief, October
 * 2026). From tablet width up, the steps sit on a loop around the outcome:
 * click, tap or press Enter on a step to read it in the panel, step through
 * with "Next step", or play the loop. The arcs draw in once when the loop
 * scrolls into view. On phones the loop becomes a vertical timeline with
 * every step readable, and a dashed bracket carries the loop back to the top.
 */
export function LearningLoop({ anchor, eyebrow, heading, intro, steps, outcome, ctaLead, cta }: Props) {
  const count = steps.length;
  const headingId = useId();
  const loopRef = useRef<HTMLDivElement>(null);
  const playRef = useRef<HTMLButtonElement>(null);
  const timelineRef = useRef<HTMLOListElement>(null);
  // The active step and how many times round the loop the visitor has gone, changed together.
  const [{ active, round }, setPosition] = useState({ active: 0, round: 1 });
  const [drawn, setDrawn] = useState(false);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [reached, setReached] = useState(0);

  const next = useCallback(() => {
    setPosition((p) => (p.active === count - 1 ? { active: 0, round: p.round + 1 } : { active: p.active + 1, round: p.round }));
  }, [count]);

  // Draw the arcs once the loop scrolls into view, then light up the first step.
  useEffect(() => {
    const node = loopRef.current;
    if (!node) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let timer = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        setDrawn(true);
        timer = window.setTimeout(() => setReady(true), reduced ? 0 : count * ARC_SECONDS * 1000);
      },
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [count]);

  // Autoplay, only after the visitor presses "Play the loop"; any other click stops it.
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(next, AUTOPLAY_MS);
    const stop = (event: PointerEvent) => {
      if (!playRef.current?.contains(event.target as Node)) setPlaying(false);
    };
    document.addEventListener("pointerdown", stop);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("pointerdown", stop);
    };
  }, [playing, next]);

  // Phones: each step's dot fills as the step reaches the middle of the screen.
  useEffect(() => {
    const items = timelineRef.current?.querySelectorAll<HTMLElement>("[data-step]");
    if (!items?.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setReached((r) => Math.max(r, Number((entry.target as HTMLElement).dataset.step)));
        }
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  const step = steps[active]!;
  const lit = ready ? active : -1;

  return (
    <section id={anchor || undefined} aria-labelledby={headingId} className="section-space bg-page">
      <div className="container-site">
        <div className="rounded-[var(--radius-panel)] border border-line bg-surface px-5 py-8 shadow-card sm:px-8 md:px-10 md:py-10 lg:px-12">
          {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
          <h2 id={headingId} className="text-h2">
            {heading}
          </h2>
          {intro && <p className="mt-3 max-w-2xl text-lead text-ink">{intro}</p>}

          {/* Tablets and desktop: the loop and the step panel. */}
          <div className="mt-8 grid items-center gap-8 max-md:hidden lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-12">
            <div>
              <div ref={loopRef} className="relative mx-auto aspect-square w-full max-w-[24rem]">
                <svg aria-hidden viewBox="0 0 100 100" className="absolute inset-0 size-full overflow-visible">
                  {steps.map((_, i) => {
                    const { path, head } = arc(i, count);
                    const closing = i === count - 1;
                    const delay = `${i * ARC_SECONDS}s`;
                    return (
                      <g key={i} className="text-accent">
                        <path
                          d={path}
                          pathLength={1}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="0.9"
                          strokeLinecap="round"
                          // The last arc, back to the start, is dashed: it fades in rather than drawing.
                          strokeDasharray={closing ? "2 2" : "1"}
                          strokeDashoffset={closing || drawn ? 0 : 1}
                          className={cn("transition-[stroke-dashoffset,opacity] ease-linear motion-reduce:transition-none", closing && !drawn && "opacity-0")}
                          style={{ transitionDuration: `${ARC_SECONDS}s`, transitionDelay: delay }}
                        />
                        <path
                          d={head}
                          fill="currentColor"
                          className={cn("transition-opacity motion-reduce:transition-none", !drawn && "opacity-0")}
                          style={{ transitionDuration: "0.15s", transitionDelay: `${(i + 1) * ARC_SECONDS}s` }}
                        />
                      </g>
                    );
                  })}
                </svg>
                {/* The outcome at the centre. */}
                <div className="absolute left-1/2 top-1/2 grid size-[34%] -translate-x-1/2 -translate-y-1/2 place-items-center content-center rounded-full border border-line bg-surface text-center">
                  <LoopButterfly open={lit < 0 ? 0.25 : (lit + 1) / count} complete={lit === count - 1} className="w-[46%]" />
                  <p className="mt-1 px-2 text-[0.8125rem] font-bold leading-tight text-navy">{outcome}</p>
                </div>
                {steps.map((s, i) => {
                  const point = pointAt(angleOf(i, count));
                  const isActive = i === lit;
                  const done = lit >= 0 && i < lit;
                  return (
                    <button
                      key={`${s.title}-${i}`}
                      type="button"
                      aria-label={`Step ${i + 1}, ${s.title}`}
                      aria-current={i === active ? "step" : undefined}
                      onClick={() => {
                        setPlaying(false);
                        setReady(true);
                        setPosition((p) => ({ ...p, active: i }));
                      }}
                      className="group absolute flex -translate-x-1/2 -translate-y-[1.625rem] flex-col items-center"
                      style={{ left: `${point.x}%`, top: `${point.y}%` }}
                    >
                      <span
                        className={cn(
                          "grid size-[3.25rem] place-items-center rounded-full border font-display text-lg font-bold text-navy transition-[scale,background-color,border-color] duration-300 group-hover:border-accent motion-reduce:transition-none",
                          isActive ? "scale-[1.15] border-accent bg-accent shadow-[0_8px_20px_-8px_rgb(245_186_0/0.8)]" : done ? "border-accent/50 bg-accent-soft" : "border-line bg-surface",
                        )}
                      >
                        {i + 1}
                      </span>
                      {/* A white backing keeps the label clear of the arc it sits on. */}
                      <span className={cn("mt-1.5 max-w-28 rounded-md bg-surface px-1.5 py-0.5 text-center text-sm leading-tight", isActive ? "font-bold text-navy" : "text-ink")}>
                        {s.title}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-6 flex justify-center gap-3">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setPlaying(false);
                    setReady(true);
                    next();
                  }}
                >
                  Next step
                </button>
                <button ref={playRef} type="button" aria-pressed={playing} className="btn btn-quiet btn-sm" onClick={() => {
                    setReady(true);
                    setPlaying((p) => !p);
                  }}
                >
                  {playing ? "Pause" : "Play the loop"}
                </button>
              </div>
            </div>

            <div aria-live="polite" className="min-h-[15rem] lg:min-h-[17rem]">
              <p className="inline-flex rounded-full bg-accent-soft px-3 py-1 text-sm font-bold text-label">
                Step {active + 1} of {count}
              </p>
              <h3 className="mt-4 text-h3">{step.title}</h3>
              {step.body && <p className="mt-2 max-w-xl text-lead text-ink">{step.body}</p>}
              {step.quote && (
                <blockquote className="mt-5 max-w-xl border-l-[3px] border-accent pl-4">
                  <p className="italic leading-relaxed text-navy">“{step.quote}”</p>
                  {step.quoteBy && <footer className="mt-1.5 text-sm">{step.quoteBy}, from their student story</footer>}
                </blockquote>
              )}
              {active === count - 1 && <p className="mt-5 text-sm font-bold text-label">Round {round} complete. Each loop goes deeper.</p>}
            </div>
          </div>

          {/* Phones: a vertical timeline, every step readable without tapping. */}
          <div className="mt-7 md:hidden">
            <ol ref={timelineRef} className="relative grid gap-6 pr-8">
              <span aria-hidden className="absolute bottom-3 left-[1.1875rem] top-3 w-0.5 bg-accent" />
              {/* The loop, folded: a dashed bracket from the last step back up to the first. */}
              <span aria-hidden className="absolute bottom-3 right-0 top-3 w-4 rounded-r-xl border-y-2 border-r-2 border-dashed border-accent" />
              {steps.map((s, i) => (
                <li key={`${s.title}-${i}`} data-step={i} className="relative flex gap-4">
                  <span
                    aria-hidden
                    className={cn(
                      "z-[1] grid size-10 shrink-0 place-items-center rounded-full border-2 font-display font-bold text-navy transition-colors duration-300",
                      i <= reached ? "border-accent bg-accent" : "border-accent bg-surface",
                    )}
                  >
                    {i + 1}
                  </span>
                  <div className="pt-1.5">
                    <h3 className="font-display text-[1.0625rem] font-bold leading-snug text-navy">{s.title}</h3>
                    {s.body && <p className="mt-1 text-[0.9375rem] leading-relaxed">{s.body}</p>}
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-6 flex items-center gap-3 rounded-2xl bg-accent-soft px-4 py-3">
              <LoopButterfly open={1} complete className="w-10 shrink-0" />
              <p className="font-display font-bold text-navy">{outcome}</p>
            </div>
          </div>

          {(ctaLead || cta) && (
            <div className="mt-8 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
              {ctaLead && <p className="text-lead text-ink">{ctaLead}</p>}
              {cta && <ButtonLink href={cta.href}>{cta.label}</ButtonLink>}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
