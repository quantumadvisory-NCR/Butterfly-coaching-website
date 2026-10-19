import { ClockIcon, GraduationCapIcon, SealCheckIcon, UserIcon } from "@phosphor-icons/react/dist/ssr";
import type { ComponentType } from "react";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { ButtonLink } from "@/components/ui/button-link";
import { ArtDirectedImage, MediaImage } from "@/components/ui/media-image";
import { getTestimonials } from "@/lib/content/public";
import { cn } from "@/lib/utils";
import { type BlockContext, type BlockProps, pickMedia, usableLink } from "./types";

const CHIP_ICONS: Record<string, ComponentType<{ className?: string; weight?: "regular" | "bold" | "fill"; "aria-hidden"?: boolean }>> = {
  seal: SealCheckIcon,
  person: UserIcon,
  clock: ClockIcon,
  cap: GraduationCapIcon,
};

const FOCUS: Record<string, string | undefined> = { left: "35% 42%", right: "65% 42%" };

/**
 * The brand motif: soft butterfly wings drawn behind the photograph. Purely
 * decorative, low in contrast, and never placed over faces.
 */
function WingMotif({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 560 500" preserveAspectRatio="xMidYMid meet" className={cn("pointer-events-none", className)}>
      <defs>
        <linearGradient id="wing-upper-left" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--color-accent)" stopOpacity="0.95" />
          <stop offset="1" stopColor="var(--color-accent)" stopOpacity="0.45" />
        </linearGradient>
        <linearGradient id="wing-upper-right" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--color-accent)" stopOpacity="0.8" />
          <stop offset="1" stopColor="var(--color-accent)" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      {/* Upper wings */}
      <path d="M280 250 C228 128 140 26 84 34 C30 42 18 150 58 210 C98 268 210 276 280 250 Z" fill="url(#wing-upper-left)" />
      <path d="M280 250 C332 128 420 26 476 34 C530 42 542 150 502 210 C462 268 350 276 280 250 Z" fill="url(#wing-upper-right)" />
      {/* Lower wings */}
      <path d="M280 262 C238 304 178 380 166 428 C154 476 206 486 230 450 C258 410 278 340 280 262 Z" fill="var(--color-tint-deep)" />
      <path d="M280 262 C322 304 382 380 394 428 C406 476 354 486 330 450 C302 410 282 340 280 262 Z" fill="var(--color-tint-deep)" />
      {/* Fine orbit lines, echoing the curve of a wing */}
      <path d="M36 300 C30 160 140 18 280 14 C420 18 530 160 524 300" fill="none" stroke="var(--color-accent)" strokeOpacity="0.5" strokeWidth="1.5" strokeDasharray="2 7" strokeLinecap="round" />
    </svg>
  );
}

async function TrustRow({ text, photos, ctx }: { text: string; photos: boolean; ctx: BlockContext }) {
  const people = photos
    ? (await getTestimonials())
        .filter((t) => t.photoId && pickMedia(ctx, t.photoId))
        .sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured))
        .slice(0, 4)
    : [];
  if (!text && people.length === 0) return null;
  return (
    <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
      {people.length > 0 && (
        <span aria-hidden className="flex -space-x-2.5">
          {people.map((person) => (
            <span key={person.id} className="relative size-10 overflow-hidden rounded-full bg-tint-deep ring-[3px] ring-page">
              <MediaImage media={pickMedia(ctx, person.photoId)} fill alt="" sizes="40px" className="!object-top" />
            </span>
          ))}
        </span>
      )}
      {text && <p className="max-w-[22rem] text-[0.9375rem] leading-snug text-ink">{text}</p>}
    </div>
  );
}

export async function HeroBlock({ data, ctx }: BlockProps<"hero">) {
  const image = pickMedia(ctx, data.image);
  const tall = pickMedia(ctx, data.imageTall);
  const primary = usableLink(data.primaryCta, ctx.settings);
  const secondary = usableLink(data.secondaryCta, ctx.settings);

  if (data.variant === "page") {
    return (
      <section className="bg-page">
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

  const chips = (data.chips ?? []).filter((chip) => chip.label);
  // A "Choose your path" panel straight after the hero overlaps its lower edge, so leave room for it.
  const overlapped = ctx.next?.type === "path_cards" && ctx.next.layout === "panel";
  const credential = data.credentialValue ? { value: data.credentialValue, label: data.credentialLabel } : null;

  return (
    <section className="relative isolate overflow-clip bg-page">
      <div
        className={cn(
          "container-site grid items-center gap-10 pt-8 sm:pt-10 md:gap-12 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] lg:gap-8 lg:pt-14 xl:gap-14",
          overlapped ? "pb-20 sm:pb-24 lg:pb-48" : "pb-12 md:pb-16 lg:pb-16",
        )}
      >
        <div className="hero-enter min-w-0 max-w-[40rem]">
          {data.eyebrow && (
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-3.5 py-1.5 text-[0.8125rem] font-semibold leading-tight text-navy">
              <span aria-hidden className="size-2 shrink-0 rounded-full bg-accent" />
              {data.eyebrow}
            </p>
          )}
          {/* Beside the photo the text column is narrower, so the size follows a gentler curve there and the heading keeps to three lines. */}
          <h1 className="text-[clamp(2.375rem,1.5rem+3.6vw,4.25rem)] font-extrabold leading-[1.02] tracking-[-0.035em] lg:text-[clamp(3.25rem,1.1rem+3.4vw,4.25rem)]">
            <span className="block">{data.heading}</span>
            {data.headingAccent && (
              <>
                {" "}
                <span className="block text-primary">{data.headingAccent}</span>
              </>
            )}
          </h1>
          {data.subheading && <p className="mt-5 max-w-[31rem] text-lead text-ink md:mt-6">{data.subheading}</p>}
          {(primary || secondary) && (
            <div className="mt-7 flex flex-col gap-3 min-[26rem]:flex-row min-[26rem]:flex-wrap md:mt-8">
              {primary && <ButtonLink href={primary.href}>{primary.label}</ButtonLink>}
              {secondary && (
                <ButtonLink href={secondary.href} variant="secondary">
                  {secondary.label}
                </ButtonLink>
              )}
            </div>
          )}
          {chips.length > 0 && (
            <ul aria-label="At a glance" className="mt-6 flex flex-wrap gap-2">
              {chips.map((chip) => {
                const Icon = CHIP_ICONS[chip.icon];
                return (
                  <li
                    key={chip.label}
                    className="inline-flex min-h-9 items-center gap-2 rounded-full border border-line bg-surface/80 px-3.5 py-1.5 text-[0.875rem] font-semibold leading-tight text-navy"
                  >
                    {Icon && <Icon aria-hidden weight="bold" className="size-4 shrink-0 text-primary" />}
                    {chip.label}
                  </li>
                );
              })}
            </ul>
          )}
          <TrustRow text={data.trustText} photos={data.trustPhotos} ctx={ctx} />
        </div>

        {image && (
          // The arch keeps one shape at every desktop width, so the photograph stays level with the heading
          // and the two columns centre on each other rather than the photo sinking towards the panel.
          <div className="relative mx-auto w-full max-w-[30rem] sm:max-w-[34rem] lg:mx-0 lg:max-w-[33rem] lg:justify-self-end">
            <div className="relative aspect-[10/9] lg:aspect-[12/13]">
              <WingMotif className="absolute -inset-x-[5%] top-0 h-full w-[110%]" />
              <div className="absolute inset-x-[8%] bottom-0 top-[7%] overflow-hidden rounded-b-[var(--radius-card)] rounded-t-[999px] bg-tint-deep shadow-card ring-4 ring-surface/70">
                {tall ? (
                  <ArtDirectedImage wide={image} tall={tall} />
                ) : (
                  <MediaImage media={image} fill preload={ctx.index === 0} sizes="(min-width: 64rem) 760px, (min-width: 36rem) 610px, 112vw" position={FOCUS[data.imageFocus]} />
                )}
              </div>
              {credential && (
                <div className="absolute left-0 top-[52%] max-w-[13.5rem] rounded-2xl border border-line/70 bg-surface px-4 py-3 shadow-lift sm:top-[55%]">
                  <p className="font-display text-lg font-extrabold leading-tight tracking-tight text-navy">{credential.value}</p>
                  {credential.label && <p className="mt-0.5 text-[0.8125rem] font-medium leading-snug text-muted">{credential.label}</p>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
