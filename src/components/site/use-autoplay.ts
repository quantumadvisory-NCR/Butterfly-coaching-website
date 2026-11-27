"use client";

import { type FocusEvent, type PointerEvent, useCallback, useEffect, useRef, useState } from "react";

/**
 * The play/pause rules shared by the homepage's moving pieces (the hero
 * slideshow and the student stories carousel):
 *
 * - visitors who prefer reduced motion start paused (they can still press play);
 * - it waits while a mouse points at it, while it is off screen and while the tab is hidden;
 * - following the WAI-ARIA carousel pattern, keyboard focus moving into it stops it
 *   for good until the visitor presses play.
 *
 * Spread `rootProps` on the carousel's outer element. `active` is false while it
 * should wait; each component adds its own conditions to decide when to move.
 */
export function useAutoplay<T extends HTMLElement>({ initiallyOnScreen }: { initiallyOnScreen: boolean }) {
  const root = useRef<T>(null);
  // null until the visitor presses pause or play: then it plays unless they prefer reduced motion.
  const [choice, setChoice] = useState<boolean | null>(null);
  const [reduced, setReduced] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [onScreen, setOnScreen] = useState(initiallyOnScreen);

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
    let intersecting = initiallyOnScreen;
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
  }, [initiallyOnScreen]);

  const playing = choice ?? !reduced;
  const pause = useCallback(() => setChoice(false), []);

  return {
    reduced,
    playing,
    /** Not pointed at, on screen and the tab visible. */
    active: !hovered && onScreen,
    togglePlaying: () => setChoice(!playing),
    /** Stops it until the visitor presses play again (e.g. when a video inside it starts). */
    pause,
    rootProps: {
      ref: root,
      onPointerEnter: (e: PointerEvent) => e.pointerType === "mouse" && setHovered(true),
      onPointerLeave: (e: PointerEvent) => e.pointerType === "mouse" && setHovered(false),
      onFocus: (e: FocusEvent) => {
        // Keyboard focus stops it until the visitor presses play.
        if ((e.target as HTMLElement).matches(":focus-visible") && choice === null) setChoice(false);
      },
    },
  };
}
