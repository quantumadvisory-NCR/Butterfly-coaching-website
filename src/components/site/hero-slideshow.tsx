"use client";

import { PauseIcon, PlayIcon } from "@phosphor-icons/react";
import { Children, type ReactNode, useEffect, useReducer, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { useAutoplay } from "./use-autoplay";

/** How long each photograph stays before the next slides in. */
const INTERVAL_MS = 5500;

const noSubscription = () => () => {};

type State = {
  index: number;
  /** The photograph sliding out to the left. */
  leaving: number | null;
  /** The photograph about to come in: held just off to the right, without a transition, for one frame. */
  entering: number | null;
};
type Action = { type: "prepare"; to: number } | { type: "commit" };

function reducer(state: State, action: Action): State {
  if (action.type === "prepare") {
    if (action.to === state.index || state.entering !== null) return state;
    return { ...state, entering: action.to };
  }
  if (state.entering === null) return state;
  return { index: state.entering, leaving: state.index, entering: null };
}

/**
 * The homepage hero's photographs as a slideshow inside the arched frame
 * (22 November 2026). Each photograph slides in from the right every few
 * seconds, always in the same direction. A JavaScript timer (not the progress
 * dot's animation, which reduced-motion settings shorten) moves it on, and
 * keeps the time left across pauses.
 *
 * It pauses while a mouse points at it, while it is off screen or the tab is
 * hidden, and when the visitor presses pause. Following the WAI-ARIA carousel
 * pattern, it also stops for good once keyboard focus moves into it, until they
 * press play. Visitors who prefer reduced motion get no automatic changes (they
 * can still press play) and no sliding.
 *
 * Children are the slides, rendered on the server. Only the first is in the
 * page at first; the others are added once the page has loaded, so they never
 * compete with the first photograph.
 */
export function HeroSlideshow({ children, label = "Photographs" }: { children: ReactNode; label?: string }) {
  const slides = Children.toArray(children);
  const count = slides.length;
  const [{ index, leaving, entering }, dispatch] = useReducer(reducer, { index: 0, leaving: null, entering: null });
  const { playing, active, togglePlaying, rootProps } = useAutoplay<HTMLDivElement>({ initiallyOnScreen: true });
  // False on the server and until hydration, so the progress dot never runs ahead of the timer.
  const ready = useSyncExternalStore(noSubscription, () => true, () => false);
  const [loadRest, setLoadRest] = useState(false);
  const remaining = useRef(INTERVAL_MS);

  // The other photographs load after the page has, well before the first change.
  useEffect(() => {
    let timer = 0;
    const onLoad = () => (timer = window.setTimeout(() => setLoadRest(true), 600));
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });
    return () => {
      window.removeEventListener("load", onLoad);
      window.clearTimeout(timer);
    };
  }, []);

  // The incoming photograph sits just off to the right for one frame, then slides in.
  useEffect(() => {
    if (entering === null) return;
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => dispatch({ type: "commit" }));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [entering]);

  const go = (to: number) => {
    setLoadRest(true);
    remaining.current = INTERVAL_MS;
    dispatch({ type: "prepare", to });
  };

  const running = ready && count > 1 && playing && active;

  // A new photograph gets the full time.
  useEffect(() => {
    remaining.current = INTERVAL_MS;
  }, [index]);

  // The timer: runs for the time left, and remembers what is left when it pauses.
  useEffect(() => {
    if (!running) return;
    const started = performance.now();
    const timer = window.setTimeout(() => {
      remaining.current = INTERVAL_MS;
      setLoadRest(true);
      dispatch({ type: "prepare", to: (index + 1) % count });
    }, remaining.current);
    return () => {
      window.clearTimeout(timer);
      remaining.current = Math.max(0, remaining.current - (performance.now() - started));
    };
  }, [running, index, count]);

  if (count === 0) return null;

  return (
    <div {...rootProps} role="region" aria-roledescription="carousel" aria-label={label} className="absolute inset-0">
      <div aria-live={running ? "off" : "polite"} className="absolute inset-0">
        {slides.map((slide, i) => {
          const state = i === entering ? "entering" : i === index ? "current" : i === leaving ? "leaving" : "waiting";
          return (
            <div
              key={i}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={state !== "current"}
              inert={state !== "current"}
              className={cn(
                "absolute inset-0",
                state === "current" && "z-[2] translate-x-0",
                state === "leaving" && "z-[1] -translate-x-full",
                (state === "waiting" || state === "entering") && "translate-x-full",
                (state === "current" || state === "leaving") &&
                  "transition-[translate] duration-[900ms] ease-[cubic-bezier(0.65,0,0.35,1)] motion-reduce:transition-none",
              )}
            >
              {i === 0 || loadRest ? slide : null}
            </div>
          );
        })}
      </div>

      {count > 1 && (
        // Just above the badges that overlap the frame's foot. Pause comes first, as the carousel pattern asks.
        <div className="on-dark absolute bottom-[4.5rem] left-1/2 z-[3] flex -translate-x-1/2 items-center rounded-full bg-[rgb(22_19_29/0.62)] px-0.5 backdrop-blur-[6px]">
          <button
            type="button"
            aria-label={playing ? "Pause the slideshow" : "Play the slideshow"}
            onClick={togglePlaying}
            className="flex size-10 items-center justify-center rounded-full text-white hover:bg-white/15"
          >
            {playing ? <PauseIcon aria-hidden weight="fill" className="size-3.5" /> : <PlayIcon aria-hidden weight="fill" className="size-3.5" />}
          </button>
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show photograph ${i + 1} of ${count}`}
              aria-current={i === index ? "true" : undefined}
              onClick={() => go(i)}
              className="group flex h-10 min-w-10 items-center justify-center rounded-full px-1"
            >
              <span
                className={cn(
                  "relative block h-1.5 overflow-hidden rounded-full bg-white/75 transition-[width] duration-300",
                  i === index ? "w-6" : "w-1.5 group-hover:bg-white",
                )}
              >
                {i === index && (
                  // Shows how long is left. Decoration only: the timer above moves the slideshow on.
                  <span
                    key={index}
                    aria-hidden
                    className="bca-slide-progress absolute inset-0 origin-left rounded-full bg-accent"
                    style={{ animationDuration: `${INTERVAL_MS}ms`, animationPlayState: running ? "running" : "paused" }}
                  />
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
