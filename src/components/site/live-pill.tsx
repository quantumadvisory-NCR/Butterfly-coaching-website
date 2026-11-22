import { Fragment } from "react";
import { cn } from "@/lib/utils";

/** Where the label breaks at its " · " into two centred lines: on phones (under the globe badge) or on small laptops (the desktop label). */
const BREAKS = {
  phone: { pill: "max-sm:text-center", dot: "max-sm:hidden", br: "hidden max-sm:inline" },
  laptop: { pill: "lg:max-xl:text-center", dot: "lg:max-xl:hidden", br: "hidden lg:max-xl:inline" },
} as const;

/**
 * The homepage hero's "Live online · join from anywhere" pill, with a pulsing
 * live dot. Phones and tablets show it under the turning globe (globe-badge.tsx);
 * desktops show it beside the photograph, over the world map. Styles in
 * effects.css (.bca-globe__pill, .bca-globe__live).
 */
export function LivePill({ text, breakOn, className }: { text: string; breakOn: keyof typeof BREAKS; className?: string }) {
  const breaks = BREAKS[breakOn];
  return (
    <span className={cn("bca-globe__pill", breaks.pill, className)}>
      <span className="bca-globe__live" aria-hidden />
      <span>
        {text.split(/\s+·\s+/).map((part, i) => (
          <Fragment key={`${part}-${i}`}>
            {i > 0 && (
              <>
                <span className={breaks.dot}> · </span>
                <br className={breaks.br} />
              </>
            )}
            {part}
          </Fragment>
        ))}
      </span>
    </span>
  );
}
