"use client";

import { CaretLeftIcon, CaretRightIcon, PauseIcon, PlayIcon } from "@phosphor-icons/react";
import { Children, type ReactNode, useCallback, useEffect, useRef, useState } from "react";

/** How long each step of the carousel waits before moving on. */
const INTERVAL_MS = 5000;
/** After a visitor swipes, scrolls or clicks, the carousel waits this long before moving again. */
const QUIET_MS = 8000;

/**
 * The homepage's student stories as a moving carousel (22 November 2026): a
 * row of story cards that moves along by one card every few seconds and
 * returns to the start after the last. Visitors can swipe or scroll it, use the
 * arrows, or pause it; it also waits while a mouse points at it, while it is off
 * screen, and just after being used. Following the WAI-ARIA carousel pattern it
 * stops for good once keyboard focus moves into it, until play is pressed. With
 * reduced motion it never moves on its own and steps without sliding.
 *
 * `children` are the story cards (rendered on the server); `heading` and `footer`
 * sit above and below, with the controls beside the heading.
 */
export function StoryCarousel({ children, heading, footer, label }: { children: ReactNode; heading: ReactNode; footer?: ReactNode; label: string }) {
  const cards = Children.toArray(children);
  const track = useRef<HTMLUListElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const [choice, setChoice] = useState<boolean | null>(null);
  const [reduced, setReduced] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  // Until when the carousel waits after a visitor used it (a ref, so scrolling does not re-render).
  const quietUntil = useRef(0);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let intersecting = false;
    const update = () => setOnScreen(intersecting && document.visibilityState === "visible");
    const observer = new IntersectionObserver(([entry]) => {
      intersecting = Boolean(entry?.isIntersecting);
      update();
    });
    observer.observe(el);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  /** Moves one card along (or back); after the last card it returns to the first. */
  const step = useCallback(
    (direction: 1 | -1) => {
      const el = track.current;
      const first = el?.querySelector("li");
      if (!el || !first) return;
      const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
      const width = first.getBoundingClientRect().width + gap;
      const behavior: ScrollBehavior = reduced ? "auto" : "smooth";
      const max = el.scrollWidth - el.clientWidth;
      if (direction > 0 && el.scrollLeft >= max - 4) el.scrollTo({ left: 0, behavior });
      else if (direction < 0 && el.scrollLeft <= 4) el.scrollTo({ left: max, behavior });
      else el.scrollBy({ left: direction * width, behavior });
    },
    [reduced],
  );

  const playing = choice ?? !reduced;
  const running = cards.length > 1 && playing && !hovered && onScreen;

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      if (Date.now() < quietUntil.current) return;
      step(1);
    }, INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [running, step]);

  const quiet = () => {
    quietUntil.current = Date.now() + QUIET_MS;
  };

  const control = "flex size-11 items-center justify-center rounded-full border border-lilac-line bg-white text-ink-deep transition-colors hover:border-lav hover:bg-lav-50";

  return (
    <div
      ref={root}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      className="flex flex-col gap-[1.125rem]"
      onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setHovered(false)}
      onFocus={(e) => {
        // Keyboard focus stops the carousel until the visitor presses play.
        if (e.target.matches(":focus-visible") && choice === null) setChoice(false);
      }}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        {heading}
        {cards.length > 1 && (
          <div className="flex items-center gap-2">
            <button type="button" aria-label={playing ? "Pause the stories" : "Play the stories"} className={control} onClick={() => setChoice(!playing)}>
              {playing ? <PauseIcon aria-hidden weight="fill" className="size-4" /> : <PlayIcon aria-hidden weight="fill" className="size-4" />}
            </button>
            <button
              type="button"
              aria-label="Previous story"
              className={control}
              onClick={() => {
                quiet();
                step(-1);
              }}
            >
              <CaretLeftIcon aria-hidden weight="bold" className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Next story"
              className={control}
              onClick={() => {
                quiet();
                step(1);
              }}
            >
              <CaretRightIcon aria-hidden weight="bold" className="size-4" />
            </button>
          </div>
        )}
      </div>
      {/* The focus ring sits on this wrapper: the row's edge fade would clip a ring drawn on the row itself. */}
      <div className="rounded-[1.75rem] has-[>ul:focus-visible]:outline-2 has-[>ul:focus-visible]:outline-offset-4 has-[>ul:focus-visible]:outline-lav-deep">
        <ul
          ref={track}
          tabIndex={0}
          aria-label={label}
          data-end={atEnd ? "" : undefined}
          onPointerDown={quiet}
          onWheel={(e) => Math.abs(e.deltaX) > Math.abs(e.deltaY) && quiet()}
          onTouchStart={quiet}
          onScroll={(e) => {
            const el = e.currentTarget;
            setAtEnd(el.scrollLeft >= el.scrollWidth - el.clientWidth - 4);
          }}
          className="bca-story-track m-0 flex snap-x snap-mandatory list-none gap-[1.125rem] overflow-x-auto overscroll-x-contain rounded-[1.75rem] p-0 pb-1 outline-none"
        >
          {cards.map((card, i) => (
            <li key={i} className="flex w-[min(28rem,84vw)] shrink-0 snap-start">
              {card}
            </li>
          ))}
        </ul>
      </div>
      {footer}
    </div>
  );
}
