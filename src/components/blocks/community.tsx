import { Flyer } from "@/components/ui/effects";
import { Emphasis } from "@/components/ui/emphasis";
import { Section } from "@/components/ui/section";
import { cn } from "@/lib/utils";
import { DESIGN_H2 } from "./content";
import type { BlockProps } from "./types";

/** "IN India" becomes a code and a name; "India" alone is just a name. */
function parsePlace(line: string) {
  const match = line.trim().match(/^([A-Z]{2,3})\s+(.+)$/);
  return match ? { code: match[1]!, name: match[2]! } : { code: "", name: line.trim() };
}

/**
 * "A global learning community" from the November 2026 design: where learners
 * join from, as chips under a dotted flight path that a butterfly follows.
 * Student stories placed straight after it continue the same section.
 */
export function CommunityBlock({ data, ctx }: BlockProps<"community">) {
  const places = data.places.map(parsePlace).filter((place) => place.name);
  const headingId = `community-${data.anchor || "global"}`;
  const storiesFollow = ctx.next?.type === "testimonials";
  return (
    <Section
      background={data.background}
      anchor={data.anchor}
      labelledBy={headingId}
      flush
      className={cn("relative overflow-hidden pt-[clamp(4.5rem,9vw,8rem)] font-text", storiesFollow ? "pb-12" : "pb-[clamp(4.5rem,9vw,8rem)]")}
    >
      <div className="container-site flex flex-col gap-9">
        <div className="reveal flex flex-col gap-3">
          <h2 id={headingId} className={cn(DESIGN_H2, "leading-[1.1]")}>
            <Emphasis text={data.heading} auto />
          </h2>
          {data.intro && (
            <p className="m-0 max-w-2xl text-[1.0625rem] text-mauve">
              <Emphasis text={data.intro} strong />
            </p>
          )}
        </div>
        {places.length > 0 && (
          <div className="reveal relative pt-[4.375rem]">
            <svg aria-hidden viewBox="0 0 1200 90" preserveAspectRatio="none" className="absolute left-0 top-0 h-[5.625rem] w-full overflow-visible">
              <path d="M 0 70 C 220 10, 420 110, 640 40 S 1000 0, 1200 60" style={{ fill: "none", stroke: "var(--color-lav-200)", strokeWidth: 2, strokeDasharray: "6 8" }} />
            </svg>
            <Flyer path="wave" />
            <ul aria-label="Countries our learners join from" className="m-0 flex list-none flex-wrap gap-2.5 p-0">
              {places.map((place, i) => (
                <li
                  key={`${place.name}-${i}`}
                  className={cn(
                    "fx-chip inline-flex items-center gap-2 rounded-full px-[1.125rem] py-2.5 text-[0.9375rem] font-semibold text-ink-deep",
                    i === 0 ? "bg-accent" : "border border-lilac-line bg-white",
                  )}
                >
                  {place.code && (
                    <span aria-hidden className={cn("text-[0.6875rem] font-extrabold tracking-[0.06em]", i === 0 ? "opacity-70" : "text-lav-deep")}>
                      {place.code}
                    </span>
                  )}
                  {place.name}
                </li>
              ))}
              {data.moreLabel && (
                <li className="fx-chip inline-flex items-center rounded-full border border-dashed border-lav bg-lav-50 px-[1.125rem] py-2.5 text-[0.9375rem] font-semibold text-lav-deep">
                  {data.moreLabel}
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </Section>
  );
}
