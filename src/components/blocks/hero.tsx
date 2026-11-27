import Link from "next/link";
import type { CSSProperties } from "react";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { GlobeBadge } from "@/components/site/globe-badge";
import { GuideForm } from "@/components/site/guide-form";
import { LivePill } from "@/components/site/live-pill";
import { HeroSlideshow } from "@/components/site/hero-slideshow";
import { WorldMap } from "@/components/site/world-map";
import { ButtonLink } from "@/components/ui/button-link";
import { Arrow, Butterfly, LiveDot } from "@/components/ui/effects";
import { Emphasis, plainText } from "@/components/ui/emphasis";
import { ArtDirectedImage, MediaImage } from "@/components/ui/media-image";
import { cn } from "@/lib/utils";
import { type BlockProps, pickMedia, usableLink } from "./types";

const FOCUS: Record<string, string | undefined> = { left: "35% 42%", right: "65% 42%" };

const delay = (seconds: number): CSSProperties => ({ animationDelay: `${seconds}s` });

/** The soft light gray glow in the top corner of both hero layouts. */
function CornerGlow({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute -left-40 -top-44 size-[32.5rem] rounded-full bg-[radial-gradient(circle,#f2f2f0_0%,rgb(242_242_240/0)_70%)]",
        className,
      )}
    />
  );
}

/** The pill above the homepage heading: a live dot, then phrases separated by " · ". */
function HeroPill({ text }: { text: string }) {
  const parts = text.split(/\s+·\s+/).filter(Boolean);
  return (
    <p className="fx-rise inline-flex flex-wrap items-center gap-2.5 self-start rounded-full border border-[#ececec] bg-white py-2 pl-3 pr-4 text-sm font-semibold text-ink-deep shadow-[0_6px_20px_-14px_rgb(43_43_43/0.5)]">
      <LiveDot />
      {parts.map((part, i) => (
        <span key={`${part}-${i}`} className="inline-flex items-center gap-2.5">
          {i > 0 && (
            <span aria-hidden className="text-[#9a9a97]">
              ·
            </span>
          )}
          <span>
            <Emphasis text={part} />
          </span>
        </span>
      ))}
    </p>
  );
}

/** Homepage hero, from the November 2026 design. */
function HomeHero({ data, ctx }: BlockProps<"hero">) {
  const image = pickMedia(ctx, data.image);
  const tall = pickMedia(ctx, data.imageTall);
  const primary = usableLink(data.primaryCta, ctx.settings);
  const secondary = usableLink(data.secondaryCta, ctx.settings);
  const mainPhoto = image ? (
    tall ? (
      <ArtDirectedImage wide={image} tall={tall} />
    ) : (
      <MediaImage media={image} fill preload={ctx.index === 0} sizes="(min-width: 64rem) 400px, 82vw" position={FOCUS[data.imageFocus]} />
    )
  ) : null;
  // More photographs turn the arched frame into a slideshow that starts with the main image.
  const slides = (data.slides ?? []).map((slide) => pickMedia(ctx, slide.image)).filter((m): m is NonNullable<typeof m> => Boolean(m));
  const badges = (data.badges ?? []).map((badge) => ({ ...badge, media: pickMedia(ctx, badge.image) })).filter((badge) => badge.media);
  // One colour throughout; the last word of the second line sits on a yellow stroke that draws in.
  const accent = data.headingAccent.trim();
  const split = accent.lastIndexOf(" ");
  const accentLead = split > 0 ? accent.slice(0, split) : "";
  const accentLast = split > 0 ? accent.slice(split + 1) : accent;

  return (
    <section id={data.anchor || "top"} className="relative isolate overflow-hidden pb-[clamp(4.25rem,3.25rem+2vw,5.5rem)] pt-[clamp(1.25rem,0.5rem+2vw,2.5rem)] font-text text-ink-deep">
      {/* Desktop: a static world map in the top-right corner, against the hero's top and right edges, with routes from India. */}
      <WorldMap />
      <CornerGlow />

      <div className="container-site relative flex flex-wrap items-center gap-[clamp(3rem,5vw,4.5rem)]">
        <div className="flex min-w-0 flex-[1_1_30rem] flex-col gap-6">
          {data.eyebrow && <HeroPill text={data.eyebrow} />}

          <h1 className="relative m-0 font-grotesk text-[length:clamp(2.5rem,4.6vw,3.75rem)] leading-[1.08] text-ink-deep">
            <span className="fx-rise block" style={delay(0.08)}>
              <Emphasis text={data.heading} now />
            </span>
            {accent && (
              <>
                {" "}
                {accentLead && (
                  <>
                    <span className="fx-rise block" style={delay(0.22)}>
                      {accentLead}
                    </span>{" "}
                  </>
                )}
                <span className="fx-rise relative isolate inline-block" style={delay(0.36)}>
                  {accentLast}
                  <svg aria-hidden viewBox="7 0 316 26" preserveAspectRatio="none" className="absolute -bottom-[0.06em] left-0 -z-10 h-[0.32em] w-full overflow-visible">
                    <path className="fx-draw" d="M6 18 C 90 6, 210 2, 324 13" style={{ fill: "none", stroke: "var(--color-accent)", strokeWidth: 14, strokeLinecap: "round" }} />
                  </svg>
                </span>
              </>
            )}
          </h1>

          {data.subheading && (
            <p className="fx-rise m-0 max-w-[33.75rem] text-[clamp(1.0625rem,1.4vw,1.25rem)] leading-[1.6] text-mauve-deep" style={delay(0.5)}>
              <Emphasis text={data.subheading} now strong />
            </p>
          )}

          {primary && (
            <div className="fx-rise flex flex-wrap items-center gap-x-[1.375rem] gap-y-3.5" style={delay(0.62)}>
              <ButtonLink href={primary.href} trackLabel={`Hero: ${primary.label}`} className="min-h-14 px-[1.875rem] font-text text-base">
                {primary.label}
                <Arrow />
              </ButtonLink>
            </div>
          )}
          {secondary && (
            <Link
              href={secondary.href}
              data-track="cta_click"
              data-track-label={`Hero: ${secondary.label}`}
              className="fx-rise fx-link -mt-3 self-start text-[0.9375rem] text-[#16131d]"
              style={delay(0.68)}
            >
              {secondary.label}
            </Link>
          )}

          {data.guideForm && (
            <div id="programme-guide" className="fx-rise max-w-[33.75rem] rounded-[1.375rem] border border-[#ececec] bg-white p-[1.125rem] shadow-[0_20px_40px_-32px_rgb(43_43_43/0.7)]" style={delay(0.74)}>
              <GuideForm variant="hero" idPrefix="hero" label={<Emphasis text={data.guideLabel || "Free programme guide: fees, dates and session times"} />} />
            </div>
          )}
        </div>

        <div className="relative flex min-h-[38.75rem] min-w-0 flex-[1_1_25rem] items-center justify-center pb-10 max-sm:min-h-[32rem]">
          <div className="fx-rise relative w-[min(25rem,82%)]" style={delay(0.3)}>
            {/* Phones and tablets: the turning globe badge on the frame's corner, as before. Desktop: the label beside the world map. */}
            {data.stickerText && <GlobeBadge label={data.stickerText} className="bca-globe--edge" />}
            {data.stickerText && <LivePill text={data.stickerText} breakOn="laptop" className="bca-live-pill" />}
            <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-[12.5rem_12.5rem_2rem_2rem] border-[10px] border-accent bg-[linear-gradient(180deg,var(--color-lav-50),#fff)] shadow-[0_40px_70px_-40px_rgb(43_43_43/0.7)]">
              {image ? (
                slides.length > 0 ? (
                  <HeroSlideshow label="Photographs from our programmes">
                    {mainPhoto}
                    {slides.map((slide) => (
                      <MediaImage key={slide.id} media={slide} fill sizes="(min-width: 64rem) 400px, 82vw" />
                    ))}
                  </HeroSlideshow>
                ) : (
                  mainPhoto
                )
              ) : (
                <>
                  <svg aria-hidden viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full">
                    <g style={{ fill: "none", stroke: "var(--color-lav-200)", strokeWidth: 1.5 }}>
                      <circle cx="200" cy="210" r="70" />
                      <circle cx="200" cy="210" r="120" />
                      <circle cx="200" cy="210" r="170" />
                      <circle cx="200" cy="210" r="220" />
                    </g>
                  </svg>
                  <Butterfly sizes="240px" className="relative -mt-14 w-[58%] drop-shadow-[0_18px_24px_rgb(43_43_43/0.25)]" />
                </>
              )}
            </div>

            {/* The badges under the photograph: all the same size, side by side in one still row (the owner's
                request of 27 November 2026; they used to overlap and bob). They pop in once with the rest of the hero. */}
            {badges.length > 0 && (
              <div data-badges className="absolute -bottom-[3.25rem] left-1/2 z-[3] flex -translate-x-1/2 items-center gap-2.5 max-sm:gap-1.5">
                {badges.map((badge, i) => (
                  <span key={`${badge.name}-${i}`} className="fx-pop block shrink-0" style={delay(1 + i * 0.15)}>
                    <span className="flex size-[6.5rem] items-center justify-center rounded-full bg-white shadow-[0_0_0_4px_var(--color-accent),0_18px_30px_-12px_rgb(30_30_30/0.55)] max-sm:size-[5.25rem]">
                      <MediaImage media={badge.media} alt={badge.name} sizes="86px" className="!size-[5.375rem] object-contain max-sm:!size-[4.25rem]" />
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {data.credentialValue && (
            <div className="absolute left-0 top-[6%] z-[4] flex items-center gap-3 rounded-[1.25rem] bg-ink-deep py-3.5 pl-3.5 pr-[1.125rem] text-white shadow-[0_22px_40px_-22px_rgb(22_19_29/0.8)] max-sm:top-0 max-sm:gap-2.5 max-sm:py-2.5 max-sm:pl-3 max-sm:pr-3.5">
              <span className="fx-shine font-grotesk text-[2.375rem] leading-none max-sm:text-[1.875rem]">{data.credentialValue}</span>
              {(data.credentialLabel || data.credentialDetail) && (
                <span className="flex flex-col text-[0.8125rem] leading-[1.35]">
                  {data.credentialLabel && <strong className="font-semibold">{data.credentialLabel}</strong>}
                  {data.credentialDetail && <span className="text-lilac">{data.credentialDetail}</span>}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * The page header on every other page, with the homepage's soft gray glow in
 * the top corner.
 */
function PageHero({ data, ctx }: BlockProps<"hero">) {
  const image = pickMedia(ctx, data.image);
  const primary = usableLink(data.primaryCta, ctx.settings);
  const secondary = usableLink(data.secondaryCta, ctx.settings);
  return (
    <section className="relative isolate overflow-hidden bg-page">
      <CornerGlow />
      <div className="container-site relative pb-12 pt-5 md:pb-16 lg:pb-20">
        <Breadcrumbs items={ctx.breadcrumbs} />
        <div className={image ? "mt-6 grid items-center gap-8 md:mt-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] lg:gap-14" : "mt-6 md:mt-8"}>
          <div className="hero-enter max-w-2xl">
            {data.eyebrow && <p className="eyebrow mb-3">{plainText(data.eyebrow)}</p>}
            <h1 className="relative text-h1">
              <Emphasis text={data.heading} now />
            </h1>
            {data.subheading && (
              <p className="mt-4 max-w-xl text-lead">
                <Emphasis text={data.subheading} now />
              </p>
            )}
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
            <div className="relative">
              <div className="relative aspect-[16/10] overflow-hidden rounded-card lg:aspect-[4/3] lg:rounded-tr-[var(--radius-wing)]">
                <MediaImage media={image} fill preload={ctx.index === 0} sizes="(min-width: 64rem) 36vw, 100vw" />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function HeroBlock(props: BlockProps<"hero">) {
  return props.data.variant === "page" ? <PageHero {...props} /> : <HomeHero {...props} />;
}
