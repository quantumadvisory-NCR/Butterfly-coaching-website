import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { ButtonLink } from "@/components/ui/button-link";
import { MediaImage } from "@/components/ui/media-image";
import { RichText, Section, SectionHeading } from "@/components/ui/section";
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

/** "Why BCA": heading and image on one side, a short list of points on the other. */
export function FeatureListBlock({ data, ctx }: BlockProps<"feature_list">) {
  const image = pickMedia(ctx, data.image);
  const cta = usableLink(data.cta, ctx.settings);
  const items = data.items.filter((item) => item.title);
  return (
    <Section background={data.background} anchor={data.anchor}>
      <div className="container-site grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-[calc(var(--header-height)+2rem)]">
            <SectionHeading heading={data.heading} intro={data.intro} />
            {image && (
              <div className="reveal relative mt-8 aspect-[16/10] overflow-hidden rounded-card lg:aspect-[4/3]">
                <MediaImage media={image} fill sizes="(min-width: 64rem) 38vw, 100vw" />
              </div>
            )}
          </div>
        </div>
        <div className="lg:col-span-6 lg:col-start-7">
          <ol className="grid">
            {items.map((item, i) => (
              <li
                key={`${item.title}-${i}`}
                className={cn("reveal py-7 md:py-8", i > 0 && "border-t border-sky-line", i === 0 && "pt-0 md:pt-0 lg:pt-2")}
              >
                <h3 className="text-h3">{item.title}</h3>
                {item.body && <p className="mt-2.5 max-w-prose">{item.body}</p>}
              </li>
            ))}
          </ol>
          {cta && (
            <div className="mt-2">
              <ButtonLink href={cta.href} variant="secondary">
                {cta.label}
              </ButtonLink>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}

/** Accreditation badges, client logos and a few verified facts. */
export function TrustStripBlock({ data, ctx }: BlockProps<"trust_strip">) {
  const logos = data.logos.map((logo) => ({ ...logo, media: pickMedia(ctx, logo.image) })).filter((l) => l.media);
  const facts = data.facts.filter((f) => f.value && f.label);
  if (logos.length === 0 && facts.length === 0) return null;
  return (
    <section id={data.anchor || undefined} className={cn("border-b border-sky-line", data.background === "sky" ? "bg-sky" : "bg-surface")}>
      <div className="container-site flex flex-col gap-7 py-8 md:py-10 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
        {logos.length > 0 && (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            {data.heading && <h2 className="max-w-[15rem] font-sans text-[0.9375rem] font-semibold leading-snug text-navy">{data.heading}</h2>}
            <ul className="flex flex-wrap items-center gap-x-7 gap-y-4">
              {logos.map((logo) => (
                // A fixed height with the width following each image's own shape: square badges sit close
                // together, and a wide logo is capped so it cannot crowd the row.
                <li key={logo.name} className="shrink-0">
                  <MediaImage media={logo.media} alt={logo.name} sizes="128px" className="!h-14 !w-auto max-w-32 object-contain md:!h-16" />
                </li>
              ))}
            </ul>
          </div>
        )}
        {facts.length > 0 && (
          <dl className="grid grid-cols-1 gap-x-8 gap-y-4 min-[30rem]:grid-cols-3 lg:max-w-xl lg:shrink-0">
            {facts.map((fact) => (
              <div key={fact.label} className="flex flex-col-reverse border-l-2 border-accent pl-4">
                <dt className="text-sm leading-snug text-muted">{fact.label}</dt>
                <dd className="font-display text-2xl font-bold tracking-tight text-navy">{fact.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}
