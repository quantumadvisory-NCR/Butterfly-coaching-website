"use client";

import { useEffect, useRef, useState } from "react";

const format = (n: number, grouped: boolean) => (grouped ? Math.round(n).toLocaleString("en-IN") : String(Math.round(n)));
const DURATION = 1400;

/**
 * A number that counts up once, the first time it scrolls into view.
 *
 * The server renders the final value, so it is correct without JavaScript and
 * for screen readers (which read the hidden final text, never the animation).
 * An invisible copy of the final value reserves the width, so the layout never
 * shifts while the digits change. Anyone who prefers reduced motion sees the
 * final value straight away.
 */
export function CountUp({ value, grouped = true, prefix = "", suffix = "" }: { value: number; grouped?: boolean; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || value <= 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;

    let frame = 0;
    let started = false;
    const run = () => {
      started = true;
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / DURATION);
        const eased = 1 - (1 - t) ** 3;
        setShown(t >= 1 ? null : value * eased);
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    // Out of sight on load: reset to zero now, while nobody can see the change.
    if (el.getBoundingClientRect().top > window.innerHeight) setShown(0);

    const observer = new IntersectionObserver(
      (entries) => {
        if (started || !entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        run();
      },
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);

  const final = `${prefix}${format(value, grouped)}${suffix}`;
  return (
    <span ref={ref} className="relative inline-grid tabular-nums">
      <span className="sr-only">{final}</span>
      {/* Reserves the final width so nothing moves while counting. */}
      <span aria-hidden className="invisible col-start-1 row-start-1">
        {final}
      </span>
      <span aria-hidden className="col-start-1 row-start-1">
        {shown === null ? final : `${prefix}${format(shown, grouped)}${suffix}`}
      </span>
    </span>
  );
}
