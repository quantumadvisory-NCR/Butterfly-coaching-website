import Link from "next/link";
import type { CSSProperties } from "react";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { GuideForm } from "@/components/site/guide-form";
import { ButtonLink } from "@/components/ui/button-link";
import { Arrow, Butterfly, Flyer, HandArrow, LiveDot, Twinkle } from "@/components/ui/effects";
import { Emphasis, plainText } from "@/components/ui/emphasis";
import { ArtDirectedImage, MediaImage } from "@/components/ui/media-image";
import { cn } from "@/lib/utils";
import { type BlockProps, pickMedia, usableLink } from "./types";

const FOCUS: Record<string, string | undefined> = { left: "35% 42%", right: "65% 42%" };

const delay = (seconds: number): CSSProperties => ({ animationDelay: `${seconds}s` });

/** The soft lavender glow in the top corner of both hero layouts. */
function CornerGlow({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute -left-40 -top-44 size-[32.5rem] rounded-full bg-[radial-gradient(circle,var(--color-lav-100)_0%,rgb(255_255_255/0)_70%)]",
        className,
      )}
    />
  );
}

/** The pill above the homepage heading: a live dot, then phrases separated by " · ". */
function HeroPill({ text }: { text: string }) {
  const parts = text.split(/\s+·\s+/).filter(Boolean);
  return (
    <p className="fx-rise inline-flex flex-wrap items-center gap-2.5 self-start rounded-full border border-[#e6e0f3] bg-white py-2 pl-3 pr-4 text-sm font-semibold text-[#2a2533] shadow-[0_6px_20px_-14px_rgb(70_45_160/0.6)]">
      <LiveDot />
      {parts.map((part, i) => (
        <span key={`${part}-${i}`} className="inline-flex items-center gap-2.5">
          {i > 0 && (
            <span aria-hidden className="text-[#a39db0]">
              ·
            </span>
          )}
          <span className="[&_.fx-mark-lav]:bg-none [&_.fx-mark-lav]:p-0 [&_.fx-mark-lav]:text-lav-deep">
            <Emphasis text={part} />
          </span>
        </span>
      ))}
    </p>
  );
}

/** The slowly turning circle of words beside the photograph, with a globe at its centre. */
function TurningSticker({ text }: { text: string }) {
  return (
    <div role="img" aria-label={text.replace(/[✦★•]/g, " ").replace(/\s+/g, " ").trim()} className="fx-bob-slow absolute right-0 top-[2%] z-[4] size-32 max-sm:-right-1 max-sm:top-[17%] max-sm:size-24">
      <svg aria-hidden viewBox="0 0 120 120" className="fx-spin absolute inset-0 size-full overflow-visible">
        <defs>
          <path id="hero-sticker-ring" d="M60,60 m-47,0 a47,47 0 1,1 94,0 a47,47 0 1,1 -94,0" />
        </defs>
        <circle cx="60" cy="60" r="59" style={{ fill: "var(--color-ink-deep)" }} />
        <text style={{ fontFamily: "var(--ff-inter), sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: 1.6, fill: "var(--color-accent)" }}>
          <textPath href="#hero-sticker-ring" textLength="292" lengthAdjust="spacing">
            {text}
          </textPath>
        </text>
      </svg>
      <span aria-hidden className="absolute inset-[24%] flex items-center justify-center rounded-full bg-lav shadow-[inset_0_0_0_3px_rgb(255_255_255/0.25)]">
        <OnlineGlobe className="size-[3.6rem] max-sm:size-[2.9rem]" />
      </span>
    </div>
  );
}

/**
 * "Live online, from anywhere": a solid ink globe with lavender meridians, a
 * tilted yellow orbit passing behind and in front of it, and a pulsing "live"
 * dot riding the orbit.
 */
function OnlineGlobe({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 48 48" className={className}>
      <defs>
        <clipPath id="hero-globe-clip">
          <circle cx="24" cy="24" r="12.5" />
        </clipPath>
      </defs>
      {/* The far half of the orbit, behind the globe. */}
      <path d="M3 24 A21 7.5 0 0 1 45 24" transform="rotate(-24 24 24)" style={{ fill: "none", stroke: "var(--color-ink-deep)", strokeOpacity: 0.3, strokeWidth: 1.6, strokeLinecap: "round" }} />
      <circle cx="24" cy="24" r="12.5" style={{ fill: "var(--color-ink-deep)" }} />
      <g clipPath="url(#hero-globe-clip)" style={{ fill: "none", stroke: "var(--color-lav-200)", strokeWidth: 1.3, strokeLinecap: "round" }}>
        <ellipse cx="24" cy="24" rx="5.5" ry="12.5" />
        <path d="M11.5 24h25" />
        <path d="M12.6 18.2 Q24 15.6 35.4 18.2" />
        <path d="M12.6 29.8 Q24 32.4 35.4 29.8" />
      </g>
      <circle cx="19.5" cy="18.5" r="3.2" style={{ fill: "#fff", opacity: 0.14 }} />
      {/* The near half of the orbit and the live dot, in front of the globe. */}
      <g transform="rotate(-24 24 24)">
        <path d="M45 24 A21 7.5 0 0 1 3 24" style={{ fill: "none", stroke: "var(--color-accent)", strokeWidth: 2.2, strokeLinecap: "round" }} />
        <circle className="fx-glow" cx="36.05" cy="30.14" r="2.8" style={{ fill: "var(--color-accent)", stroke: "var(--color-ink-deep)", strokeWidth: 1.1 }} />
      </g>
    </svg>
  );
}

/** Homepage hero, from the November 2026 design. */
function HomeHero({ data, ctx }: BlockProps<"hero">) {
  const image = pickMedia(ctx, data.image);
  const tall = pickMedia(ctx, data.imageTall);
  const primary = usableLink(data.primaryCta, ctx.settings);
  const secondary = usableLink(data.secondaryCta, ctx.settings);
  const badges = (data.badges ?? []).map((badge) => ({ ...badge, media: pickMedia(ctx, badge.image) })).filter((badge) => badge.media);
  // The second line is gray, with its last word set apart in lavender over a hand-drawn yellow stroke.
  const accent = data.headingAccent.trim();
  const split = accent.lastIndexOf(" ");
  const accentLead = split > 0 ? accent.slice(0, split) : "";
  const accentLast = split > 0 ? accent.slice(split + 1) : accent;

  return (
    <section id={data.anchor || "top"} className="relative isolate overflow-hidden pb-[clamp(5.5rem,9vw,8.5rem)] pt-[clamp(3rem,7vw,6rem)] font-text text-ink-deep">
      <Flyer path="hero" />
      <CornerGlow />

      <div className="container-site relative flex flex-wrap items-center gap-[clamp(3rem,5vw,4.5rem)]">
        <div className="flex min-w-0 flex-[1_1_30rem] flex-col gap-7">
          {data.eyebrow && <HeroPill text={data.eyebrow} />}

          <h1 className="relative m-0 font-grotesk text-[clamp(2.875rem,6.6vw,5.875rem)] font-extrabold leading-[0.98] tracking-[-0.025em] text-ink-deep">
            <Twinkle className="absolute -top-[1.125rem] left-[62%] size-[1.625rem] fill-accent max-md:hidden" />
            <Twinkle className="absolute right-[4%] top-[46%] size-[1.125rem] fill-lav max-md:hidden" style={delay(1.1)} />
            <span className="fx-rise block" style={delay(0.08)}>
              <Emphasis text={data.heading} now />
            </span>
            {accent && (
              <>
                {" "}
                {accentLead && (
                  <>
                    <span className="fx-rise block text-[#6a6475]" style={delay(0.22)}>
                      {accentLead}
                    </span>{" "}
                  </>
                )}
                <span className="fx-rise relative isolate inline-block text-lav-deep" style={delay(0.36)}>
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

          {(primary || data.ctaNote) && (
            <div className="fx-rise flex flex-wrap items-center gap-x-[1.375rem] gap-y-3.5" style={delay(0.62)}>
              {primary && (
                <ButtonLink href={primary.href} trackLabel={`Hero: ${primary.label}`} className="min-h-14 px-[1.875rem] font-text text-base">
                  {primary.label}
                  <Arrow />
                </ButtonLink>
              )}
              {data.ctaNote && (
                <span className="-ml-1.5 inline-flex items-center gap-1 text-lav-deep max-md:hidden">
                  <HandArrow className="h-[1.875rem] w-[2.875rem]" />
                  <span className="fx-note fx-wiggle inline-block text-[1.625rem]">{data.ctaNote}</span>
                </span>
              )}
            </div>
          )}
          {secondary && (
            <Link
              href={secondary.href}
              data-track="cta_click"
              data-track-label={`Hero: ${secondary.label}`}
              className="fx-rise fx-link -mt-3 self-start text-[0.9375rem] text-[#2a2533]"
              style={delay(0.68)}
            >
              {secondary.label}
            </Link>
          )}

          {data.guideForm && (
            <div className="fx-rise max-w-[33.75rem] rounded-[1.375rem] border border-[#e6e0f3] bg-white p-[1.125rem] shadow-[0_20px_40px_-32px_rgb(70_45_160/0.7)]" style={delay(0.74)}>
              <GuideForm variant="hero" idPrefix="hero" label={<Emphasis text={data.guideLabel || "Free programme guide: fees, dates and session times"} />} />
            </div>
          )}
        </div>

        <div className="relative flex min-h-[38.75rem] min-w-0 flex-[1_1_25rem] items-center justify-center pb-10 max-sm:min-h-[32rem]">
          <div aria-hidden className="fx-blob absolute aspect-square w-[min(31.25rem,92%)] bg-lav-100" />
          <div aria-hidden className="absolute aspect-square w-[min(35rem,100%)] rounded-full border-[1.5px] border-dashed border-lav-200" />

          <div className="fx-rise relative w-[min(25rem,82%)]" style={delay(0.3)}>
            <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-[12.5rem_12.5rem_2rem_2rem] border-[10px] border-accent bg-[linear-gradient(180deg,var(--color-lav-50),#fff)] shadow-[0_40px_70px_-40px_rgb(70_45_160/0.7)]">
              {image ? (
                tall ? (
                  <ArtDirectedImage wide={image} tall={tall} />
                ) : (
                  <MediaImage media={image} fill preload={ctx.index === 0} sizes="(min-width: 64rem) 400px, 82vw" position={FOCUS[data.imageFocus]} />
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
                  <Butterfly flap="slow" sizes="240px" className="relative -mt-14 w-[58%] drop-shadow-[0_18px_24px_rgb(70_45_160/0.25)]" />
                </>
              )}
            </div>

            {badges.length > 0 && (
              <div className="absolute -bottom-[3.375rem] left-1/2 z-[3] flex -translate-x-1/2 items-end">
                {badges.map((badge, i) => {
                  const big = badges.length === 3 ? i === 1 : false;
                  return (
                    <span
                      key={`${badge.name}-${i}`}
                      className={cn("fx-pop block", big && "relative z-[2] mb-3.5", badges.length === 3 && i === 0 && "-mr-3", badges.length === 3 && i === 2 && "-ml-3")}
                      style={delay(1 + i * 0.15)}
                    >
                      <span className="fx-bob block" style={delay(0.2 + i * 0.9)}>
                        <span
                          className={cn(
                            "flex items-center justify-center rounded-full bg-white",
                            big
                              ? "size-[7.25rem] shadow-[0_0_0_5px_var(--color-accent),0_22px_36px_-12px_rgb(28_22_49/0.6)] max-sm:size-24"
                              : "size-24 shadow-[0_0_0_4px_var(--color-accent),0_18px_30px_-12px_rgb(28_22_49/0.55)] max-sm:size-20",
                          )}
                        >
                          <MediaImage media={badge.media} alt={badge.name} sizes={big ? "98px" : "80px"} className={cn("object-contain", big ? "!size-[6.125rem] max-sm:!size-20" : "!size-20 max-sm:!size-16")} />
                        </span>
                      </span>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {data.credentialValue && (
            <div className="fx-bob absolute left-0 top-[6%] z-[4] flex items-center gap-3 rounded-[1.25rem] bg-ink-deep py-3.5 pl-3.5 pr-[1.125rem] text-white shadow-[0_22px_40px_-22px_rgb(22_19_29/0.8)] max-sm:top-0 max-sm:gap-2.5 max-sm:py-2.5 max-sm:pl-3 max-sm:pr-3.5">
              <span className="fx-shine font-grotesk text-[2.375rem] font-extrabold leading-none tracking-[-0.025em] max-sm:text-[1.875rem]">{data.credentialValue}</span>
              {(data.credentialLabel || data.credentialDetail) && (
                <span className="flex flex-col text-[0.8125rem] leading-[1.35]">
                  {data.credentialLabel && <strong className="font-semibold">{data.credentialLabel}</strong>}
                  {data.credentialDetail && <span className="text-lilac">{data.credentialDetail}</span>}
                </span>
              )}
            </div>
          )}
          {data.stickerText && <TurningSticker text={data.stickerText} />}
        </div>
      </div>
    </section>
  );
}

/**
 * The page header on every other page. It keeps its layout and takes the
 * design's effects: a butterfly flying across, two sparkles, a lavender glow
 * and a hand-drawn underline beneath the heading's last word.
 */
function PageHero({ data, ctx }: BlockProps<"hero">) {
  const image = pickMedia(ctx, data.image);
  const primary = usableLink(data.primaryCta, ctx.settings);
  const secondary = usableLink(data.secondaryCta, ctx.settings);
  return (
    <section className="relative isolate overflow-hidden bg-page">
      <CornerGlow className="opacity-80" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[42%] h-0 max-md:top-[30%]">
        <Flyer path="wave" />
      </div>
      <div className="container-site relative pb-12 pt-5 md:pb-16 lg:pb-20">
        <Breadcrumbs items={ctx.breadcrumbs} />
        <div className={image ? "mt-6 grid items-center gap-8 md:mt-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] lg:gap-14" : "mt-6 md:mt-8"}>
          <div className="hero-enter max-w-2xl">
            {data.eyebrow && <p className="eyebrow mb-3">{plainText(data.eyebrow)}</p>}
            <h1 className="relative text-h1">
              <Twinkle className="absolute -top-4 right-0 size-5 fill-accent max-sm:hidden" />
              <Emphasis text={data.heading} auto now />
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
              <Twinkle className="absolute -left-3 top-8 z-10 size-4 fill-lav max-lg:hidden" style={delay(1.1)} />
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
