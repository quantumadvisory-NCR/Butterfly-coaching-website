import { Section, SectionHeading } from "@/components/ui/section";
import { cn } from "@/lib/utils";
import { LearningLoop } from "./learning-loop";
import { type BlockProps, usableLink } from "./types";

/**
 * A sequence of steps. Horizontal with a connecting rail on large screens,
 * a vertical rail on tablets and phones. The loop layout places the steps on
 * a circle around the last one, the outcome (see LearningLoop).
 */
export function TimelineBlock({ data, ctx }: BlockProps<"timeline">) {
  const steps = data.steps.filter((step) => step.title);
  if (steps.length === 0) return null;
  if (data.layout === "loop" && steps.length >= 4) {
    const outcome = steps[steps.length - 1]!;
    return (
      <LearningLoop
        anchor={data.anchor}
        eyebrow={data.eyebrow}
        heading={data.heading}
        intro={data.intro}
        steps={steps.slice(0, -1).map((step) => ({ title: step.title, body: step.body, quote: step.quote ?? "", quoteBy: step.quoteBy ?? "" }))}
        outcome={outcome.title}
        ctaLead={data.ctaLead}
        cta={usableLink(data.cta, ctx.settings)}
      />
    );
  }
  return (
    <Section background={data.background} anchor={data.anchor}>
      <div className="container-site">
        <SectionHeading eyebrow={data.eyebrow} heading={data.heading} intro={data.intro} />
        <ol
          className="relative mt-10 grid gap-0 md:mt-14 lg:grid-cols-[repeat(var(--steps),minmax(0,1fr))] lg:gap-6"
          style={{ "--steps": steps.length } as React.CSSProperties}
        >
          {steps.map((step, i) => (
            <li key={`${step.title}-${i}`} className="reveal relative flex gap-5 pb-9 last:pb-0 lg:block lg:pb-0">
              {/* Rail: vertical on small screens, horizontal on large. */}
              {i < steps.length - 1 && (
                <span
                  aria-hidden
                  className="absolute left-6 top-12 h-[calc(100%-3rem)] w-px bg-line lg:left-12 lg:top-6 lg:h-px lg:w-[calc(100%+1.5rem-3rem)]"
                />
              )}
              <span
                className={cn(
                  "relative z-[1] grid size-12 shrink-0 place-items-center rounded-full font-display text-lg font-bold",
                  i === steps.length - 1 ? "bg-accent text-navy" : "bg-navy text-white",
                )}
              >
                {step.marker || i + 1}
              </span>
              <div className="pt-1.5 lg:mt-5 lg:pr-2 lg:pt-0">
                <h3 className="text-h3">{step.title}</h3>
                {step.body && <p className="mt-2 text-[0.9688rem]">{step.body}</p>}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
