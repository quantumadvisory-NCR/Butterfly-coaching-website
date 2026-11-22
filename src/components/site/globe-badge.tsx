"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { startGlobe } from "./globe-render";
import { LivePill } from "./live-pill";

/**
 * The owner's "Live online" globe badge (1 November 2026): a turning globe
 * with India marked, floating above a small pill with a pulsing live dot.
 * Visitors can drag the globe to spin it. Since 22 November 2026 it shows on
 * phones and tablets only (below 64rem; desktops have the world map), and the
 * land map is fetched only there, after the badge is on the page, so it never
 * weighs on the first load.
 */
export function GlobeBadge({ label, className }: { label: string; className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let stop = () => {};
    let cancelled = false;
    let started = false;
    const query = window.matchMedia("(width < 64rem)");
    const start = () => {
      if (started || !query.matches) return;
      started = true;
      import("./globe-mask")
        .then(({ GLOBE_MASK }) => {
          // Drawn at the size the stylesheet gives the ball (smaller on phones).
          if (!cancelled && canvas.current) stop = startGlobe(canvas.current, GLOBE_MASK);
        })
        .catch(() => {
          // Without the map the badge simply shows its label.
        });
    };
    start();
    query.addEventListener("change", start);
    return () => {
      cancelled = true;
      query.removeEventListener("change", start);
      stop();
    };
  }, []);

  return (
    <div className={cn("bca-globe bca-globe--float", className)}>
      <div className="bca-globe__ball">
        <span className="bca-globe__shadow" aria-hidden />
        <canvas ref={canvas} width={140} height={140} className="bca-globe__canvas" role="img" aria-label="A turning globe with India marked" />
      </div>
      {/* On phones the label breaks at its " · " into two centred lines. */}
      {label && <LivePill text={label} breakOn="phone" />}
    </div>
  );
}
