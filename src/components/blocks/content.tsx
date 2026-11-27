import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
import type { ReactNode } from "react";
import { CountUp } from "@/components/ui/count-up";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { ButtonLink } from "@/components/ui/button-link";
import { Emphasis } from "@/components/ui/emphasis";
import { MediaImage } from "@/components/ui/media-image";
import { RichText, Section } from "@/components/ui/section";
import { cn } from "@/lib/utils";
import { type BlockProps, pickMedia, usableLink } from "./types";

/** Headings in the homepage design's display style. */
export const DESIGN_H2 = "m-0 font-grotesk text-[clamp(1.75rem,3.2vw,2.25rem)] leading-[1.12] text-ink-deep";

export function RichTextBlock({ data, ctx }: BlockProps<"rich_text">) {
  // When a page opens with plain text (legal pages), the heading is the page's h1.
  const first = ctx.index === 0;
  return (
    <Section background={data.background} anchor={data.anchor}>
      <div className="container-prose">
        {first && <Breadcrumbs items={ctx.breadcrumbs} className="mb-6" />}
        {data.heading &&
          (first ? (
            <h1 className="text-h1">
              <Emphasis text={data.heading} now />
            </h1>
          ) : (
            <h2 className="text-h2">
              <Emphasis text={data.heading} />
            </h2>
          ))}
        <RichText html={data.body} className={cn("prose-lg", data.heading && "mt-6")} />
      </div>
    </Section>
  );
}

export function ImageTextBlock({ data, ctx }: BlockProps<"image_text">) {
  const image = pickMedia(ctx, data.image);
  const cta = usableLink(data.cta, ctx.settings);
  const imageLeft = data.imageSide === "left";
  return (
    <Section background={data.background} anchor={data.anchor}>
      <div className={cn("container-site grid items-center gap-9 lg:gap-16", image && "lg:grid-cols-2")}>
        <div className={cn("reveal max-w-xl", imageLeft && "lg:order-2")}>
          <h2 className="text-h2">
            <Emphasis text={data.heading} />
          </h2>
          <RichText html={data.body} className="mt-5" />
          {data.bullets.length > 0 && (
            <ul className="mt-6 grid gap-3">
              {data.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-3">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-accent text-navy">
                    <CheckIcon aria-hidden weight="bold" className="size-3.5" />
                  </span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          )}
          {cta && (
            <div className="mt-8">
              <ButtonLink href={cta.href} variant="secondary">
                {cta.label}
              </ButtonLink>
            </div>
          )}
        </div>
        {image && (
          <div
            className={cn(
              "reveal fx-card relative aspect-[16/11] overflow-hidden rounded-card lg:aspect-[5/4]",
              imageLeft ? "lg:order-1 lg:rounded-tr-[var(--radius-wing)]" : "lg:rounded-tl-[var(--radius-wing)]",
            )}
          >
            <MediaImage media={image} fill sizes="(min-width: 64rem) 46vw, 100vw" />
          </div>
        )}
      </div>
    </Section>
  );
}

/** Plain text in which **double asterisks** mark bold letters or words, e.g. the iKAN initials. */
function WithBold({ text, className = "font-bold text-navy" }: { text: string; className?: string }) {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 ? (
      <strong key={i} className={className}>
        {part}
      </strong>
    ) : (
      part
    ),
  );
}

/** "K: Explore the known and unknown" becomes a tile with a big K. */
function parseTile(line: string) {
  const match = line.match(/^\s*([^:|]{1,3}?)\s*[:|]\s*(.+)$/);
  return match ? { letter: match[1]!, text: match[2]! } : { letter: line.trim().charAt(0), text: line.trim().slice(1).trim() };
}

type Item = BlockProps<"feature_list">["data"]["items"][number];

/** The pictures inside the "Why learners choose BCA" cards. */
function BentoVisual({ item, sequence }: { item: Item; sequence: string[] }): ReactNode {
  if (item.visual === "loop" && sequence.length > 0) {
    // Up to four words around a dashed circle.
    const spots = [
      "left-1/2 top-[1.125rem] -translate-x-1/2 bg-ink-deep text-white",
      "right-0 top-1/2 -translate-y-1/2 border border-lav-200 bg-white",
      "bottom-[1.125rem] left-1/2 -translate-x-1/2 border border-lav-200 bg-white",
      "left-0 top-1/2 -translate-y-1/2 bg-accent text-ink-deep",
    ];
    return (
      <div aria-hidden className="relative mx-auto mt-3 size-60 shrink-0">
        <div className="absolute inset-9 rounded-full border-2 border-dashed border-lav-200" />
        {sequence.slice(0, 4).map((word, i) => (
          <span key={`${word}-${i}`} className={cn("absolute rounded-full px-3 py-1.5 text-[0.8125rem] font-semibold leading-tight", spots[i])}>
            {word}
          </span>
        ))}
      </div>
    );
  }
  if (item.visual === "letters" && item.letters.length > 0) {
    return (
      <ul className="mt-auto grid grid-cols-2 gap-2.5 pt-1">
        {item.letters.map((line, i) => {
          const tile = parseTile(line);
          return (
            <li key={`${line}-${i}`} className="fx-tile flex min-h-[7.5rem] flex-col gap-1.5 rounded-[1.25rem] bg-lav-50 p-[1.125rem]">
              <span aria-hidden className="font-grotesk text-[2.75rem] leading-none text-lav-deep">
                {tile.letter}
              </span>
              <span className="text-sm font-semibold leading-[1.35] text-ink-deep">
                <WithBold text={tile.text} className="font-bold text-lav-deep" />
              </span>
            </li>
          );
        })}
      </ul>
    );
  }
  if (item.visual === "figure" && item.figure) {
    return (
      <>
        <p className="mt-auto flex items-baseline gap-2.5">
          <span className="fx-shine font-grotesk text-[4.75rem] leading-none">{item.figure}</span>
          {item.figureLabel && <span className="max-w-[13rem] text-[0.9375rem] leading-[1.35] text-[#f2f2f2]">{item.figureLabel}</span>}
        </p>
        {item.tags.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <li key={tag} className="rounded-full border border-white/20 bg-white/[0.08] px-3 py-1.5 text-[0.8125rem]">
                {tag}
              </li>
            ))}
          </ul>
        )}
      </>
    );
  }
  return null;
}

/** "Why learners choose BCA" as picture cards side by side, from the November 2026 design. */
function FeatureBento({ data, ctx }: BlockProps<"feature_list">) {
  const items = data.items.filter((item) => item.title);
  // The fees table straight after continues the same band, so the gap between them stays small.
  const tableFollows = ctx.next?.type === "comparison_table" && ctx.next.source === "fees";
  const sizes: Record<string, string> = {
    loop: "flex-[1_1_20rem]",
    letters: "flex-[1.35_1_26.25rem]",
    figure: "flex-[1_1_18.75rem]",
    none: "flex-[1_1_20rem]",
  };
  return (
    <Section
      background={data.background}
      anchor={data.anchor}
      flush
      className={cn("pt-[var(--design-space)] font-text", tableFollows ? "pb-[calc(var(--design-space)*0.6)]" : "pb-[var(--design-space)]")}
    >
      <div className="container-site flex flex-col gap-8">
        <div className="reveal flex flex-col gap-3">
          <h2 className={DESIGN_H2}>
            <Emphasis text={data.heading} />
          </h2>
          {data.intro && <p className="m-0 max-w-2xl text-[1.0625rem] leading-normal text-mauve">{data.intro}</p>}
        </div>
        <ul className="flex flex-wrap gap-[1.125rem]">
          {items.map((item, i) => {
            const dark = item.visual === "figure";
            return (
              <li
                key={`${item.title}-${i}`}
                className={cn(
                  "fx-card reveal flex min-w-0 flex-col gap-3.5 rounded-[1.75rem] border p-[1.875rem] max-sm:p-6",
                  sizes[item.visual] ?? sizes.none,
                  dark ? "on-dark border-plum bg-plum text-[#f2f2f2]" : "border-lav-100 bg-white",
                )}
              >
                <h3 className={cn("m-0 font-grotesk text-[1.3125rem] leading-tight", dark ? "!text-white" : "text-ink-deep")}>
                    <Emphasis text={item.title} tone={dark ? "dark" : "light"} />
                </h3>
                {item.body && (
                  <p className={cn("m-0 text-base leading-normal", dark ? "text-lilac" : "text-mauve")}>
                    <Emphasis text={item.body} tone={dark ? "dark" : "light"} strong />
                  </p>
                )}
                <BentoVisual item={item} sequence={data.sequence} />
              </li>
            );
          })}
        </ul>
      </div>
    </Section>
  );
}

/**
 * "Why BCA": heading, introduction and a framed photograph on one side; the
 * points as numbered cards on the other, joined by a thin line. Cards lift and
 * take a gray edge on hover, and ease in as they scroll into view.
 */
export function FeatureListBlock(props: BlockProps<"feature_list">) {
  if (props.data.layout === "bento") return <FeatureBento {...props} />;
  const { data, ctx } = props;
  const image = pickMedia(ctx, data.image);
  const cta = usableLink(data.cta, ctx.settings);
  const items = data.items.filter((item) => item.title);
  return (
    <Section background={data.background} anchor={data.anchor} className="relative isolate overflow-clip">
      {/* On wide screens the button sits under the photograph; on narrow screens it follows the points. */}
      <div className="container-site grid gap-10 lg:grid-cols-12 lg:gap-x-14 lg:gap-y-9">
        <div className="lg:col-span-5">
          <span aria-hidden className="mb-5 block h-1 w-12 rounded-full bg-accent" />
          <h2 className="text-h2">
            <Emphasis text={data.heading} />
          </h2>
          {data.intro && <p className="mt-4 max-w-md text-lead text-ink">{data.intro}</p>}
          {data.sequence.length > 0 && (
            <ol className="mt-4 flex max-w-md flex-wrap items-center gap-x-2 gap-y-2.5">
              {data.sequence.map((word, i) => {
                const last = i === data.sequence.length - 1;
                return (
                  <li key={`${word}-${i}`} className="flex items-center gap-2">
                    <span
                      className={cn(
                        "fx-chip rounded-full border px-3.5 py-1.5 font-sans text-[0.9375rem] font-semibold text-navy",
                        last ? "border-accent bg-accent" : "border-accent/50 bg-accent-soft",
                      )}
                    >
                      {word}
                    </span>
                    {!last && (
                      <span aria-hidden className="font-bold text-accent">
                        →
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
          {image && (
            <div className="reveal relative mt-9 max-w-md max-lg:mt-7 lg:max-w-none">
              {/* A yellow echo of the photograph's curved corner. */}
              <span aria-hidden className="absolute -left-3 -top-3 h-2/3 w-2/3 rounded-card rounded-tl-[var(--radius-wing)] bg-accent" />
              <div className="relative aspect-[4/3] overflow-hidden rounded-card rounded-tl-[var(--radius-wing)] shadow-card ring-4 ring-surface max-lg:aspect-[16/10]">
                <MediaImage media={image} fill sizes="(min-width: 64rem) 36vw, (min-width: 28rem) 28rem, 100vw" className="transition-transform duration-700 ease-out hover:scale-[1.03]" />
              </div>
            </div>
          )}
        </div>
        <div className="relative lg:col-span-7 lg:row-span-2 lg:self-center">
          {/* The thread joining the numbers: through the card edges on desktop, down the number column on phones and tablets. */}
          <span aria-hidden className="absolute bottom-10 left-[2.4375rem] top-10 w-px bg-gradient-to-b from-accent via-lav-200 to-transparent max-lg:bottom-6 max-lg:left-6 max-lg:top-3" />
          <ol className="relative grid gap-4 md:gap-5">
            {items.map((item, i) => (
              <li key={`${item.title}-${i}`} className="reveal lift-card why-step group flex flex-col gap-4 p-5 sm:flex-row sm:gap-5 sm:p-6 md:p-7">
                <span
                  aria-hidden
                  className="relative z-10 grid size-12 shrink-0 place-items-center rounded-2xl bg-accent font-sans text-lg font-extrabold text-navy shadow-[0_6px_16px_-6px_rgb(245_186_0/0.7)] transition-transform duration-300 group-hover:-rotate-6"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 pt-1.5 sm:pt-1">
                  <h3 className="text-h3">{item.title}</h3>
                  {item.body && (
                    <p className="mt-2 max-w-prose text-[0.9688rem] leading-relaxed text-ink">
                      <WithBold text={item.body} />
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
        {cta && (
          <div className="lg:col-span-5 lg:row-start-2">
            <ButtonLink href={cta.href} variant="secondary">
              {cta.label}
            </ButtonLink>
          </div>
        )}
      </div>
    </Section>
  );
}

/** Up to four verified figures. Figures without a number are never shown, so nothing unconfirmed reaches the page. */
export function StatsBlock({ data }: BlockProps<"stats">) {
  const items = data.items.filter((item) => item.label && /\d/.test(item.value ?? "")).slice(0, 4);
  if (items.length === 0) return null;
  const headingId = `stats-${data.anchor || "figures"}`;
  return (
    <section id={data.anchor || undefined} aria-labelledby={data.heading ? headingId : undefined} className={cn(data.background === "surface" ? "bg-surface" : "bg-page", "pb-[var(--section-space)]")}>
      <div className="container-site">
        {data.heading && (
          <h2 id={headingId} className={data.showHeading ? "mb-8 text-h2" : "sr-only"}>
            {data.heading}
          </h2>
        )}
        <dl
          className={cn(
            "grid grid-cols-2 gap-x-5 gap-y-8 sm:gap-x-8",
            items.length === 3 && "md:grid-cols-3",
            items.length === 4 && "lg:grid-cols-4",
          )}
        >
          {items.map((item) => (
            <div key={item.label} className="reveal flex flex-col-reverse justify-end border-l-[3px] border-accent pl-4 sm:pl-5">
              <dt className="mt-1.5 text-[0.9375rem] leading-snug text-ink">{item.label}</dt>
              <dd className="font-display text-[clamp(2.25rem,1.55rem+2.6vw,3.5rem)] font-extrabold leading-none tracking-[-0.03em] text-navy">
                {item.countUp && /^[\d,]+$/.test(item.value) ? (
                  <CountUp value={Number(item.value.replace(/,/g, ""))} grouped={item.value.includes(",")} prefix={item.prefix} suffix={item.suffix} />
                ) : (
                  <span className="tabular-nums">{`${item.prefix}${item.value}${item.suffix}`}</span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/** "ICF Level 1 accredited coaching education" becomes "Level 1"; other names are shown as they are. */
function shortLabel(name: string) {
  return name.match(/\bLevel\s*\d\b/i)?.[0] ?? name;
}

/**
 * The accreditation spotlight from the November 2026 design, calm since the
 * owner's brief of 25 November 2026: a dark section with a small label, one
 * statement in white and a source line. The staircase of ICF badges that sat
 * beside it is gone (they already show in the hero and the fees table), and so
 * are its glow, dotted path, butterfly and handwritten note.
 */
function AccreditationSpotlight({ data }: BlockProps<"trust_strip">) {
  const headingId = `accreditation-${data.anchor || "title"}`;
  return (
    <section
      id={data.anchor || "accreditation"}
      aria-labelledby={data.heading ? headingId : undefined}
      className="on-dark bg-plum py-[var(--design-space)] font-text text-[#f2f2f2]"
    >
      <div className="container-site">
        <div className="reveal flex max-w-[52rem] flex-col gap-5">
          {data.eyebrow && (
            <span className="inline-flex items-center gap-3 self-start text-[0.8125rem] font-bold uppercase tracking-[0.14em] text-lilac">
              <span aria-hidden className="inline-block h-0.5 w-7 bg-accent" />
              {data.eyebrow}
            </span>
          )}
          {data.heading && (
            <h2 id={headingId} className="m-0 font-grotesk text-[clamp(1.375rem,2.6vw,1.625rem)] leading-[1.32] !text-white">
              <Emphasis text={data.heading} tone="dark" />
            </h2>
          )}
          {data.intro && <p className="m-0 text-sm text-lilac-soft">{data.intro}</p>}
        </div>
      </div>
    </section>
  );
}

/**
 * Accreditation badges or client logos, each in its own tile inside one white
 * card, with any verified facts beneath. Tiles lift slightly on hover, and
 * badges turn once like the medals of the homepage design.
 */
export function TrustStripBlock(props: BlockProps<"trust_strip">) {
  if (props.data.layout === "spotlight") return <AccreditationSpotlight {...props} />;
  const { data, ctx } = props;
  const logos = data.logos.map((logo) => ({ ...logo, media: pickMedia(ctx, logo.image) })).filter((l) => l.media);
  const facts = data.facts.filter((f) => f.value && f.label);
  if (logos.length === 0 && facts.length === 0) return null;
  // Square artwork (accreditation badges) gets a label; wide artwork (company logos) speaks for itself.
  const badges = logos.every((logo) => (logo.media!.width ?? 1) / (logo.media!.height ?? 1) < 1.3);
  return (
    <section id={data.anchor || undefined} className={cn(data.background === "surface" ? "bg-surface" : data.background === "lavender" ? "bg-lav-50" : "bg-page", "py-10 md:py-14")}>
      <div className="container-site">
        <div className="reveal grid items-center gap-8 rounded-[var(--radius-panel)] border border-line bg-surface px-6 py-8 shadow-card sm:px-8 md:px-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-12">
          <div>
            <p className="eyebrow mb-2 flex items-center gap-2">
              <span aria-hidden className="h-0.5 w-6 rounded-full bg-accent" />
              {data.eyebrow || (badges ? "Accreditation" : "Experience")}
            </p>
            {data.heading && (
              <h2 className="text-h3 !text-[clamp(1.375rem,1.2rem+0.8vw,1.875rem)]">
                <Emphasis text={data.heading} />
              </h2>
            )}
            {data.intro && <p className="mt-2.5 max-w-md text-[0.9688rem] text-ink">{data.intro}</p>}
          </div>
          {logos.length > 0 && (
            <ul className={cn("grid gap-3 sm:gap-4", logos.length >= 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3")}>
              {logos.map((logo) => (
                <li
                  key={logo.name}
                  className="fx-card fx-medal group flex flex-col items-center justify-center gap-2.5 rounded-2xl border border-line bg-page px-3 py-5 text-center"
                >
                  <MediaImage
                    media={logo.media}
                    alt={logo.name}
                    sizes="160px"
                    className={cn("fx-medal-img !w-auto object-contain", badges ? "!h-20 sm:!h-24" : "!h-12 max-w-[8.5rem] sm:!h-14")}
                  />
                  {badges && (
                    <span aria-hidden className="text-[0.8125rem] font-bold leading-tight text-navy">
                      {logo.caption || shortLabel(logo.name)}
                      <span className="block text-xs font-semibold text-muted">Accredited</span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
          {facts.length > 0 && (
            <dl className="grid grid-cols-1 gap-x-8 gap-y-4 border-t border-line pt-6 min-[30rem]:grid-cols-3 lg:col-span-2">
              {facts.map((fact) => (
                <div key={fact.label} className="flex flex-col-reverse border-l-2 border-accent pl-4">
                  <dt className="text-sm leading-snug text-muted">{fact.label}</dt>
                  <dd className="font-display text-2xl font-bold tracking-tight text-navy">{fact.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </section>
  );
}
