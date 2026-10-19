"use client";

import { Children, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * A row of cards that swipes sideways on phones and tablets and becomes an
 * ordinary grid on wide screens; the caller's classes decide where. CSS scroll
 * snapping does the swiping, so it works before (and without) JavaScript. The
 * dots underneath show which card is in view and jump to a card when tapped.
 */
export function SwipeRail({
  children,
  label,
  listClassName,
  dotsClassName = "lg:hidden",
  tone = "light",
}: {
  children: ReactNode;
  /** What the row holds, for the dots' accessible names: "Programme", "Path". */
  label: string;
  listClassName: string;
  /** Where the dots disappear: match the breakpoint at which the row becomes a grid. */
  dotsClassName?: string;
  tone?: "light" | "dark";
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const count = Children.count(children);
  const [active, setActive] = useState(0);

  const items = useCallback(() => [...(listRef.current?.children ?? [])] as HTMLElement[], []);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const pad = parseFloat(getComputedStyle(list).scrollPaddingLeft) || 0;
      // At the far end the last card may never reach the start edge, so count it as current.
      if (list.scrollLeft >= list.scrollWidth - list.clientWidth - 2) {
        setActive(count - 1);
        return;
      }
      let best = 0;
      let distance = Infinity;
      items().forEach((item, i) => {
        const d = Math.abs(item.offsetLeft - pad - list.scrollLeft);
        if (d < distance) {
          distance = d;
          best = i;
        }
      });
      setActive(best);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    list.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      list.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [count, items]);

  const goTo = (index: number) => {
    const list = listRef.current;
    const item = items()[index];
    if (!list || !item) return;
    const pad = parseFloat(getComputedStyle(list).scrollPaddingLeft) || 0;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    list.scrollTo({ left: item.offsetLeft - pad, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <>
      <ul
        ref={listRef}
        className={cn(
          "swipe-rail relative flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          listClassName,
        )}
      >
        {children}
      </ul>
      {count > 1 && (
        <div role="group" aria-label={`${label} cards`} className={cn("mt-3 flex justify-center gap-1", dotsClassName)}>
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`${label} ${i + 1} of ${count}`}
              aria-current={i === active ? "true" : undefined}
              onClick={() => goTo(i)}
              className="group grid size-10 place-items-center rounded-full"
            >
              <span
                aria-hidden
                className={cn(
                  "block h-2 rounded-full transition-[width,background-color] duration-300",
                  i === active ? "w-6" : "w-2",
                  tone === "dark"
                    ? i === active
                      ? "bg-accent"
                      : "bg-white/40 group-hover:bg-white/70"
                    : i === active
                      ? "bg-navy"
                      : "bg-navy/25 group-hover:bg-navy/50",
                )}
              />
            </button>
          ))}
        </div>
      )}
    </>
  );
}
