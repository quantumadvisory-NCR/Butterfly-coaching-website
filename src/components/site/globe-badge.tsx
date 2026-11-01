"use client";

import { Fragment, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { startGlobe } from "./globe-render";

/**
 * The owner's "Live online" globe badge (1 November 2026): a turning globe
 * with India marked, floating above a small pill with a pulsing live dot.
 * Visitors can drag the globe to spin it. The land map is fetched only once
 * the badge is on the page, so it never weighs on the first load.
 */
export function GlobeBadge({ label, className }: { label: string; className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let stop = () => {};
    let cancelled = false;
    import("./globe-mask")
      .then(({ GLOBE_MASK }) => {
        // Drawn at the size the stylesheet gives the ball (smaller on phones).
        if (!cancelled && canvas.current) stop = startGlobe(canvas.current, GLOBE_MASK);
      })
      .catch(() => {
        // Without the map the badge simply shows its label.
      });
    return () => {
      cancelled = true;
      stop();
    };
  }, []);

  return (
    <div className={cn("bca-globe bca-globe--float", className)}>
      <div className="bca-globe__ball">
        <span className="bca-globe__shadow" aria-hidden />
        <canvas ref={canvas} width={140} height={140} className="bca-globe__canvas" role="img" aria-label="A turning globe with India marked" />
      </div>
      {label && (
        // Where space is tight (phones, and small laptops) the line breaks at its " · " into two centred lines.
        <span className="bca-globe__pill max-sm:whitespace-normal max-sm:text-center lg:max-xl:whitespace-normal lg:max-xl:text-center">
          <span className="bca-globe__live" aria-hidden />
          <span>
            {label.split(/\s+·\s+/).map((part, i) => (
              <Fragment key={`${part}-${i}`}>
                {i > 0 && (
                  <>
                    <span className="max-sm:hidden lg:max-xl:hidden"> · </span>
                    <br className="hidden max-sm:inline lg:max-xl:inline" />
                  </>
                )}
                {part}
              </Fragment>
            ))}
          </span>
        </span>
      )}
    </div>
  );
}
