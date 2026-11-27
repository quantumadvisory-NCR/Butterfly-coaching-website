"use client";

import { CaretLeftIcon, CaretRightIcon, PauseIcon, PlayIcon } from "@phosphor-icons/react";
import { Children, type ReactNode, useEffect, useRef, useState } from "react";
import { STORY_PLAY_EVENT } from "@/lib/video";
import { useAutoplay } from "./use-autoplay";

/** How fast the row glides, in pixels a second. */
const SPEED = 34;
/** How long an arrow press takes to glide one card. */
const STEP_MS = 520;
/** After a visitor drags, swipes or presses an arrow, the row waits this long before gliding again. */
const QUIET_MS = 6000;
/** How far a pointer must move before a press becomes a drag. */
const DRAG_START_PX = 6;

/** Wraps an offset into one loop length. */
const wrap = (value: number, set: number) => ((value % set) + set) % set;

/**
 * The homepage's student stories as a moving carousel (22 November 2026): a row
 * of story cards that glides continuously from right to left and loops without
 * a seam (the cards are drawn twice; the second set is hidden from assistive
 * technology). It waits while a mouse points at it, while it is off screen,
 * and for a few seconds after a visitor drags it, swipes it sideways on a
 * trackpad or presses an arrow. Following the WAI-ARIA carousel pattern it
 * stops for good once keyboard focus moves into it, until play is pressed.
 * With reduced motion it never moves on its own, and the arrows step without
 * gliding. When the cards all fit on screen (one story, or two on a wide
 * screen) there is nothing to scroll to, so the row simply stands still.
 *
 * `children` are the story cards (rendered on the server); `heading` and `footer`
 * sit above and below, with the controls beside the heading.
 */
export function StoryCarousel({ children, heading, footer, label }: { children: ReactNode; heading: ReactNode; footer?: ReactNode; label: string }) {
  const cards = Children.toArray(children);
  const track = useRef<HTMLUListElement>(null);
  const { reduced, playing, active, togglePlaying, pause, rootProps } = useAutoplay<HTMLDivElement>({ initiallyOnScreen: false });
  // Whether the cards are wider than the space for them, so the row has somewhere to go. Measured once on screen;
  // the server assumes it for two or more cards (true on every phone, and on desktops from three cards).
  const [loops, setLoops] = useState(cards.length > 1);
  // Where the row is, in pixels, and the bits of state the animation loop reads without re-rendering.
  const offset = useRef(0);
  const quietUntil = useRef(0);
  const tween = useRef<{ from: number; to: number; start: number; ms: number } | null>(null);
  const drag = useRef<{ x: number; offset: number; id: number; moving: boolean } | null>(null);
  /** Restarts the animation loop after it has stopped for lack of anything to move. */
  const wake = useRef(() => {});

  /** The width of one card with its gap, of one full set of cards (the loop length), and the gap itself. */
  const measure = () => {
    const el = track.current;
    const first = el?.querySelector("li");
    if (!el || !first) return { set: 0, card: 0, gap: 0 };
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    const card = first.getBoundingClientRect().width + gap;
    return { set: card * cards.length, card, gap };
  };
  /**
   * Draws the row at the current offset. The offset itself is settled into one loop length only when nothing is
   * mid-move, so a glide or drag in progress keeps counting from where it started.
   */
  const paint = () => {
    const { set } = measure();
    if (set <= 0 || !track.current) return;
    if (!tween.current && !drag.current) offset.current = wrap(offset.current, set);
    track.current.style.transform = `translate3d(${-wrap(offset.current, set)}px, 0, 0)`;
  };

  // Decide whether the row can move, again whenever the space for it changes size.
  useEffect(() => {
    const view = track.current?.parentElement;
    // One card (or none) starts and stays still.
    if (!view || cards.length < 2) return;
    // A ResizeObserver reports once straight away, then on every change of size.
    const observer = new ResizeObserver(() => {
      const { set, gap } = measure();
      if (set > 0) setLoops(set - gap > view.clientWidth + 1);
    });
    observer.observe(view);
    return () => observer.disconnect();
    // measure reads refs only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards.length]);

  // A row that stands still sits at its start.
  useEffect(() => {
    if (loops) return;
    offset.current = 0;
    tween.current = null;
    drag.current = null;
    if (track.current) track.current.style.transform = "";
  }, [loops]);

  const running = loops && playing && active;

  // The animation loop: glides while running and plays arrow glides at any time. It stops when there is nothing
  // to move (paused, hovered, off screen, or a still row) and `wake` starts it again for an arrow glide.
  useEffect(() => {
    let frame = 0;
    let last = 0;
    const loop = (now: number) => {
      const dt = Math.min(now - last, 64);
      last = now;
      const t = tween.current;
      if (t) {
        const k = Math.min(1, (now - t.start) / t.ms);
        offset.current = t.from + (t.to - t.from) * (1 - Math.pow(1 - k, 3));
        if (k >= 1) tween.current = null;
        paint();
      } else if (running && !drag.current && now >= quietUntil.current) {
        offset.current += (SPEED * dt) / 1000;
        paint();
      }
      frame = tween.current || running ? requestAnimationFrame(loop) : 0;
    };
    const start = () => {
      if (frame) return;
      last = performance.now();
      frame = requestAnimationFrame(loop);
    };
    wake.current = start;
    start();
    return () => {
      cancelAnimationFrame(frame);
      frame = 0;
      wake.current = () => {};
    };
    // paint and measure only read refs, so the loop needs restarting only when `running` changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  // The looping copies of the cards stay out of the keyboard order, including a video player that appears in one
  // once it is pressed. (They are not inert: a visitor may press play on whichever copy is on screen.)
  useEffect(() => {
    const el = track.current;
    if (!el || !loops) return;
    const unfocusable = () =>
      el.querySelectorAll(":scope > li[data-copy] :is(a, button, video, iframe, input, select, textarea, [tabindex])").forEach((node) => node.setAttribute("tabindex", "-1"));
    unfocusable();
    const observer = new MutationObserver(unfocusable);
    observer.observe(el, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [loops]);

  // A video story starting inside the row stops the glide, so the video stays where the visitor is watching it.
  useEffect(() => {
    const view = track.current?.parentElement;
    if (!view) return;
    view.addEventListener(STORY_PLAY_EVENT, pause);
    return () => view.removeEventListener(STORY_PLAY_EVENT, pause);
  }, [pause]);

  // Sideways trackpad swipes (and shift + wheel) move the row too. Taking them here also stops the browser
  // reading the swipe as "go back a page". Up-and-down scrolling passes through to the page untouched.
  useEffect(() => {
    const view = track.current?.parentElement;
    if (!view || !loops) return;
    const onWheel = (e: WheelEvent) => {
      const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
      if (!dx) return;
      e.preventDefault();
      const unit = e.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : e.deltaMode === WheelEvent.DOM_DELTA_PAGE ? view.clientWidth : 1;
      tween.current = null;
      offset.current += dx * unit;
      quietUntil.current = performance.now() + QUIET_MS;
      paint();
    };
    view.addEventListener("wheel", onWheel, { passive: false });
    return () => view.removeEventListener("wheel", onWheel);
    // paint reads refs only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loops]);

  /** Moves one card along (or back), landing on a card's edge: glides, or jumps with reduced motion. */
  const step = (direction: 1 | -1) => {
    const { card } = measure();
    if (!card) return;
    quietUntil.current = performance.now() + QUIET_MS;
    const from = offset.current;
    // A second press mid-glide carries on from where that glide was heading, so quick presses each count.
    const base = tween.current?.to ?? from;
    const to = (direction > 0 ? Math.floor(base / card + 0.01) + 1 : Math.ceil(base / card - 0.01) - 1) * card;
    if (reduced) {
      tween.current = null;
      offset.current = to;
      paint();
    } else {
      tween.current = { from, to, start: performance.now(), ms: STEP_MS };
      wake.current();
    }
  };

  /** Ends a press or drag by this pointer; after a real drag the row waits a few seconds before gliding on. */
  const endDrag = (pointerId: number) => {
    const d = drag.current;
    if (d?.id !== pointerId) return;
    drag.current = null;
    quietUntil.current = performance.now() + QUIET_MS;
    if (d.moving) paint();
  };

  const control =
    "flex size-11 items-center justify-center rounded-full border border-lilac-line bg-white text-ink-deep transition-colors hover:border-lav hover:bg-lav-50";

  return (
    <div {...rootProps} role="region" aria-roledescription="carousel" aria-label={label} className="flex flex-col gap-[1.125rem]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        {heading}
        {loops && (
          <div className="flex items-center gap-2">
            <button type="button" aria-label={playing ? "Pause the stories" : "Play the stories"} className={control} onClick={togglePlaying}>
              {playing ? <PauseIcon aria-hidden weight="fill" className="size-4" /> : <PlayIcon aria-hidden weight="fill" className="size-4" />}
            </button>
            <button type="button" aria-label="Previous story" className={control} onClick={() => step(-1)}>
              <CaretLeftIcon aria-hidden weight="bold" className="size-4" />
            </button>
            <button type="button" aria-label="Next story" className={control} onClick={() => step(1)}>
              <CaretRightIcon aria-hidden weight="bold" className="size-4" />
            </button>
          </div>
        )}
      </div>
      <div className="bca-story-viewport">
        <ul
          ref={track}
          aria-label={label}
          aria-live={running ? "off" : "polite"}
          data-loop={loops || undefined}
          className="bca-story-track m-0 flex w-max list-none gap-[1.125rem] p-0"
          // Drag to move the row by hand (mouse or touch); on touch screens vertical scrolling and pinch-zoom still work.
          // A press only becomes a drag once it has moved a few pixels, so a plain click or tap stays a click.
          onPointerDown={(e) => {
            // Only the main button (Ctrl + click opens the context menu on a Mac), and never a second finger mid-drag.
            if (!loops || (e.pointerType === "mouse" && (e.button !== 0 || e.ctrlKey)) || drag.current?.moving) return;
            drag.current = { x: e.clientX, offset: offset.current, id: e.pointerId, moving: false };
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (!d || d.id !== e.pointerId) return;
            // The button was let go somewhere we did not hear about: there is no drag.
            if (e.pointerType === "mouse" && e.buttons === 0) {
              endDrag(e.pointerId);
              return;
            }
            const dx = e.clientX - d.x;
            if (!d.moving) {
              if (Math.abs(dx) < DRAG_START_PX) return;
              d.moving = true;
              // Take over from any arrow glide, carrying on from wherever it had got to; the row then follows the
              // pointer from where it was first pressed.
              tween.current = null;
              d.offset = offset.current;
              e.currentTarget.setPointerCapture(e.pointerId);
            }
            offset.current = d.offset - dx;
            paint();
          }}
          onPointerUp={(e) => endDrag(e.pointerId)}
          // The browser took the gesture over (a pinch-zoom, a system swipe): the row still waits before gliding on.
          onPointerCancel={(e) => endDrag(e.pointerId)}
          onLostPointerCapture={(e) => endDrag(e.pointerId)}
          // A press that leaves the row before it became a drag (say, moving down the page) is not a drag.
          onPointerLeave={(e) => {
            if (drag.current?.id === e.pointerId && !drag.current.moving) drag.current = null;
          }}
          // A drag that starts on a photograph moves the row, not a ghost copy of the image.
          onDragStart={(e) => e.preventDefault()}
        >
          {cards.map((card, i) => (
            <li key={i} className="flex w-[min(28rem,84vw)] shrink-0">
              {card}
            </li>
          ))}
          {/* The same cards again, so the loop has no seam: hidden from assistive technology and out of the keyboard
              order (see the effect above), but a mouse or finger can still press a video's play button on them. */}
          {loops &&
            cards.map((card, i) => (
              <li key={`again-${i}`} aria-hidden data-copy className="flex w-[min(28rem,84vw)] shrink-0">
                {card}
              </li>
            ))}
        </ul>
      </div>
      {footer}
    </div>
  );
}
