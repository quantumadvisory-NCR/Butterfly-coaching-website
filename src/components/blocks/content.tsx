import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
import { CountUp } from "@/components/ui/count-up";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { ButtonLink } from "@/components/ui/button-link";
import { MediaImage } from "@/components/ui/media-image";
import { RichText, Section } from "@/components/ui/section";
import { cn } from "@/lib/utils";
import { type BlockProps, pickMedia, usableLink } from "./types";

export function RichTextBlock({ data, ctx }: BlockProps<"rich_text">) {
  // When a page opens with plain text (legal pages), the heading is the page's h1.
  const first = ctx.index === 0;
  return (
    <Section background={data.background} anchor={data.anchor}>
      <div className="container-prose">
        {first && <Breadcrumbs items={ctx.breadcrumbs} className="mb-6" />}
        {data.heading && (first ? <h1 className="text-h1">{data.heading}</h1> : <h2 className="text-h2">{data.heading}</h2>)}
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
          <h2 className="text-h2">{data.heading}</h2>
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
              "reveal relative aspect-[16/11] overflow-hidden rounded-card lg:aspect-[5/4]",
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
function WithBold({ text }: { text: string }) {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <strong key={i} className="font-bold text-navy">{part}</strong> : part));
}

/**
 * "Why BCA": heading, introduction and a framed photograph on one side; the
 * points as numbered cards on the other, joined by a thin line. Cards lift and
 * take a yellow edge on hover, and ease in as they scroll into view.
 */
export function FeatureListBlock({ data, ctx }: BlockProps<"feature_list">) {
  const image = pickMedia(ctx, data.image);
  const cta = usableLink(data.cta, ctx.settings);
  const items = data.items.filter((item) => item.title);
  return (
    <Section background={data.background} anchor={data.anchor} className="relative isolate overflow-clip">
      {/* A soft yellow glow behind the cards: the brand colour, barely there. */}
      <div aria-hidden className="pointer-events-none absolute -right-40 top-16 -z-10 size-[30rem] rounded-full bg-accent/15 blur-3xl" />
      {/* On wide screens the button sits under the photograph; on narrow screens it follows the points. */}
      <div className="container-site grid gap-10 lg:grid-cols-12 lg:gap-x-14 lg:gap-y-9">
        <div className="lg:col-span-5">
          <span aria-hidden className="mb-5 block h-1 w-12 rounded-full bg-accent" />
          <h2 className="text-h2">{data.heading}</h2>
          {data.intro && <p className="mt-4 max-w-md text-lead text-ink">{data.intro}</p>}
          {data.sequence.length > 0 && (
            <ol className="mt-4 flex max-w-md flex-wrap items-center gap-x-2 gap-y-2.5">
              {data.sequence.map((word, i) => {
                const last = i === data.sequence.length - 1;
                return (
                  <li key={`${word}-${i}`} className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full border px-3.5 py-1.5 font-display text-[0.9375rem] font-semibold text-navy",
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
              <span aria-hidden className="absolute -bottom-4 -right-4 size-20 rounded-full border-2 border-dashed border-accent/70" />
              <div className="relative aspect-[4/3] overflow-hidden rounded-card rounded-tl-[var(--radius-wing)] shadow-card ring-4 ring-surface max-lg:aspect-[16/10]">
                <MediaImage media={image} fill sizes="(min-width: 64rem) 36vw, (min-width: 28rem) 28rem, 100vw" className="transition-transform duration-700 ease-out hover:scale-[1.03]" />
              </div>
            </div>
          )}
        </div>
        <div className="relative lg:col-span-7 lg:row-span-2 lg:self-center">
          {/* The thread joining the numbers: through the card edges on desktop, down the number column on phones and tablets. */}
          <span aria-hidden className="absolute bottom-10 left-[2.4375rem] top-10 w-px bg-gradient-to-b from-accent via-line to-transparent max-lg:bottom-6 max-lg:left-6 max-lg:top-3" />
          <ol className="relative grid gap-4 md:gap-5">
            {items.map((item, i) => (
              <li key={`${item.title}-${i}`} className="reveal lift-card why-step group flex flex-col gap-4 p-5 sm:flex-row sm:gap-5 sm:p-6 md:p-7">
                <span
                  aria-hidden
                  className="relative z-10 grid size-12 shrink-0 place-items-center rounded-2xl bg-accent font-display text-lg font-extrabold text-navy shadow-[0_6px_16px_-6px_rgb(245_186_0/0.7)] transition-transform duration-300 group-hover:-rotate-6"
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
 * Accreditation badges or client logos, each in its own tile inside one white
 * card, with any verified facts beneath. Tiles lift slightly on hover.
 */
export function TrustStripBlock({ data, ctx }: BlockProps<"trust_strip">) {
  const logos = data.logos.map((logo) => ({ ...logo, media: pickMedia(ctx, logo.image) })).filter((l) => l.media);
  const facts = data.facts.filter((f) => f.value && f.label);
  if (logos.length === 0 && facts.length === 0) return null;
  // Square artwork (accreditation badges) gets a label; wide artwork (company logos) speaks for itself.
  const badges = logos.every((logo) => (logo.media!.width ?? 1) / (logo.media!.height ?? 1) < 1.3);
  return (
    <section id={data.anchor || undefined} className={cn(data.background === "surface" ? "bg-surface" : "bg-page", "py-10 md:py-14")}>
      <div className="container-site">
        <div className="reveal grid items-center gap-8 rounded-[var(--radius-panel)] border border-line bg-surface px-6 py-8 shadow-card sm:px-8 md:px-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-12">
          <div>
            <p className="eyebrow mb-2 flex items-center gap-2">
              <span aria-hidden className="h-0.5 w-6 rounded-full bg-accent" />
              {badges ? "Accreditation" : "Experience"}
            </p>
            {data.heading && <h2 className="text-h3 !text-[clamp(1.375rem,1.2rem+0.8vw,1.875rem)]">{data.heading}</h2>}
            {data.intro && <p className="mt-2.5 max-w-md text-[0.9688rem] text-ink">{data.intro}</p>}
          </div>
          {logos.length > 0 && (
            <ul className={cn("grid gap-3 sm:gap-4", logos.length >= 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3")}>
              {logos.map((logo) => (
                <li
                  key={logo.name}
                  className="group flex flex-col items-center justify-center gap-2.5 rounded-2xl border border-line bg-page px-3 py-5 text-center transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-accent/60 hover:shadow-lift"
                >
                  <MediaImage
                    media={logo.media}
                    alt={logo.name}
                    sizes="160px"
                    className={cn("!w-auto object-contain transition-transform duration-300 group-hover:scale-105", badges ? "!h-20 sm:!h-24" : "!h-12 max-w-[8.5rem] sm:!h-14")}
                  />
                  {badges && (
                    <span aria-hidden className="text-[0.8125rem] font-bold leading-tight text-navy">
                      {shortLabel(logo.name)}
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
