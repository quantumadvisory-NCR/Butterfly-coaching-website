import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { ButtonLink } from "@/components/ui/button-link";
import { ArtDirectedImage, MediaImage } from "@/components/ui/media-image";
import { type BlockProps, pickMedia, usableLink } from "./types";

export function HeroBlock({ data, ctx }: BlockProps<"hero">) {
  const image = pickMedia(ctx, data.image);
  const tall = pickMedia(ctx, data.imageTall);
  const primary = usableLink(data.primaryCta, ctx.settings);
  const secondary = usableLink(data.secondaryCta, ctx.settings);

  if (data.variant === "page") {
    return (
      <section className="bg-sky">
        <div className="container-site pb-12 pt-5 md:pb-16 lg:pb-20">
          <Breadcrumbs items={ctx.breadcrumbs} />
          <div className={image ? "mt-6 grid items-center gap-8 md:mt-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] lg:gap-14" : "mt-6 md:mt-8"}>
            <div className="hero-enter max-w-2xl">
              {data.eyebrow && <p className="eyebrow mb-3">{data.eyebrow}</p>}
              <h1 className="text-h1">{data.heading}</h1>
              {data.subheading && <p className="mt-4 max-w-xl text-lead">{data.subheading}</p>}
              {(primary || secondary) && (
                <div className="mt-7 flex flex-col gap-3 min-[26rem]:flex-row min-[26rem]:flex-wrap">
                  {primary && <ButtonLink href={primary.href}>{primary.label}</ButtonLink>}
                  {secondary && (
                    <ButtonLink href={secondary.href} variant="secondary">
                      {secondary.label}
                    </ButtonLink>
                  )}
                </div>
              )}
            </div>
            {image && (
              <div className="relative aspect-[16/10] overflow-hidden rounded-card lg:aspect-[4/3] lg:rounded-tr-[var(--radius-wing)]">
                <MediaImage media={image} fill preload={ctx.index === 0} sizes="(min-width: 64rem) 36vw, 100vw" />
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-clip bg-sky">
      <div className="container-site grid items-center gap-9 pb-12 pt-9 md:gap-11 md:pb-16 md:pt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)] lg:gap-16 lg:py-14">
        <div className="hero-enter max-w-xl">
          {data.eyebrow && <p className="eyebrow mb-4">{data.eyebrow}</p>}
          <h1 className="text-display">{data.heading}</h1>
          {data.subheading && <p className="mt-5 max-w-[33rem] text-lead md:mt-6">{data.subheading}</p>}
          {(primary || secondary) && (
            <div className="mt-7 flex flex-col gap-3 min-[26rem]:flex-row min-[26rem]:flex-wrap md:mt-9">
              {primary && <ButtonLink href={primary.href}>{primary.label}</ButtonLink>}
              {secondary && (
                <ButtonLink href={secondary.href} variant="secondary">
                  {secondary.label}
                </ButtonLink>
              )}
            </div>
          )}
        </div>

        {image && (
          <div className="relative">
            {/* Brand accent: a sun-yellow disc tucked behind the photograph. */}
            <div aria-hidden className="absolute -bottom-5 -left-5 size-28 rounded-full bg-accent md:size-36 lg:-bottom-7 lg:-left-7" />
            <div className="relative aspect-[4/3] overflow-hidden rounded-card sm:aspect-[16/10] lg:aspect-auto lg:h-[clamp(22rem,calc(100dvh-var(--header-height)-7rem),34rem)] lg:rounded-tl-[var(--radius-wing)]">
              <ArtDirectedImage wide={image} tall={tall} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
