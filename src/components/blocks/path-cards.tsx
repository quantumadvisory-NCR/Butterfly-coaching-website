import { ArrowRightIcon, BuildingsIcon, CompassIcon, GraduationCapIcon, TrendUpIcon, UsersThreeIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { ComponentType } from "react";
import { ButtonLink } from "@/components/ui/button-link";
import { Arrow } from "@/components/ui/effects";
import { Emphasis } from "@/components/ui/emphasis";
import { MediaImage } from "@/components/ui/media-image";
import { Section, SectionHeading } from "@/components/ui/section";
import { resolveHref } from "@/lib/settings";
import { cn } from "@/lib/utils";
import { DESIGN_H2 } from "./content";
import { type BlockProps, pickMedia, usableLink } from "./types";

const ICONS: Record<string, ComponentType<{ className?: string; weight?: "regular" | "bold" | "fill" | "duotone"; "aria-hidden"?: boolean }>> = {
  cap: GraduationCapIcon,
  trend: TrendUpIcon,
  buildings: BuildingsIcon,
  compass: CompassIcon,
  users: UsersThreeIcon,
};

const POSITION_ICONS = ["cap", "trend", "buildings", "users"];

export function PathCardsBlock(props: BlockProps<"path_cards">) {
  switch (props.data.layout) {
    case "images":
      return <ImageCards {...props} />;
    case "numbered":
      return <NumberedCards {...props} />;
    case "choices":
      return <ChoiceCards {...props} />;
    default:
      return <PanelCards {...props} />;
  }
}

/**
 * "Choose your path" from the November 2026 design: white cards with a big
 * outlined number that tilts and fills with yellow on hover, a small label,
 * a button and an optional text link. A coloured card is soft lavender.
 */
function NumberedCards({ data, ctx }: BlockProps<"path_cards">) {
  const items = data.items.filter((item) => item.title);
  if (items.length === 0) return null;
  const headingId = `path-${data.anchor || "choose"}`;
  return (
    <Section background={data.background} anchor={data.anchor} labelledBy={headingId} flush className="py-[clamp(4.5rem,9vw,8rem)] font-text">
      <div className="container-site flex flex-col gap-10">
        <div className="reveal flex flex-wrap items-end justify-between gap-4">
          <h2 id={headingId} className={DESIGN_H2}>
            <Emphasis text={data.heading} auto />
          </h2>
          {data.intro && (
            <p className="m-0 max-w-[23.75rem] text-[1.0625rem] leading-normal text-mauve">
              <Emphasis text={data.intro} />
            </p>
          )}
        </div>
        <ul className="flex flex-wrap gap-[1.125rem]">
          {items.map((item, i) => {
            const link = usableLink(item.link, ctx.settings);
            const second = usableLink(item.secondaryLink, ctx.settings);
            return (
              <li
                key={`${item.title}-${i}`}
                className={cn(
                  "fx-card reveal relative flex min-h-80 min-w-0 flex-[1_1_18.75rem] flex-col gap-3.5 overflow-hidden rounded-[1.75rem] border p-[1.875rem] max-sm:min-h-0 max-sm:p-6",
                  item.accent ? "border-lav-100 bg-lav-50" : "border-lilac-line bg-white",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "fx-bignum absolute right-5 top-1 font-grotesk text-[7rem] font-extrabold leading-none text-transparent max-sm:text-[5.5rem]",
                    item.accent ? "[-webkit-text-stroke:1.5px_var(--lav)]" : "[-webkit-text-stroke:1.5px_var(--color-lav-200)]",
                  )}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                {item.tag && (
                  <span className={cn("self-start rounded-lg px-2.5 py-1.5 text-xs font-bold uppercase tracking-[0.1em] text-lav-deep", item.accent ? "bg-white" : "bg-lav-50")}>
                    {item.tag}
                  </span>
                )}
                <h3 className="relative mb-0 mt-[2.875rem] font-grotesk text-[2rem] font-bold leading-[1.05] tracking-[-0.025em] text-ink-deep max-sm:mt-8 max-sm:text-[1.75rem]">
                  {item.title}
                </h3>
                {item.body && (
                  <p className="relative m-0 grow text-base leading-normal text-mauve">
                    <Emphasis text={item.body} strong />
                  </p>
                )}
                {(link || second) && (
                  <div className="flex flex-wrap items-center gap-[1.125rem]">
                    {link && (
                      <ButtonLink href={link.href} variant={item.accent ? "lav" : "primary"} trackLabel={`Path: ${item.title}`} className="font-text text-[0.9375rem]">
                        {link.label}
                      </ButtonLink>
                    )}
                    {second && (
                      <Link href={second.href} data-track="cta_click" data-track-label={`Path: ${item.title}: ${second.label}`} className="fx-link text-ink-deep">
                        {second.label}
                      </Link>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </Section>
  );
}

/**
 * "Where are you today?" from the November 2026 design: a deep ink section with
 * a slow lavender glow, and one card per choice. A coloured card is butterfly
 * yellow with a dark button; its small label becomes a handwritten note.
 */
function ChoiceCards({ data, ctx }: BlockProps<"path_cards">) {
  const items = data.items.filter((item) => item.title);
  if (items.length === 0) return null;
  const headingId = `choices-${data.anchor || "today"}`;
  return (
    <section
      id={data.anchor || undefined}
      aria-labelledby={headingId}
      className="on-dark relative isolate overflow-hidden bg-ink-deep py-[clamp(4.5rem,9vw,8rem)] font-text text-[#f4f1fd]"
    >
      <div
        aria-hidden
        className="fx-glow pointer-events-none absolute -bottom-64 -left-40 size-[38.75rem] rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--lav)_35%,transparent)_0%,rgb(22_19_29/0)_65%)]"
      />
      <div className="container-site relative flex flex-col gap-10">
        <div className="reveal flex flex-col gap-3">
          <h2 id={headingId} className={cn(DESIGN_H2, "!text-white")}>
            <Emphasis text={data.heading} tone="dark" auto />
          </h2>
          {data.intro && (
            <p className="m-0 max-w-2xl text-[1.0625rem] text-lilac">
              <Emphasis text={data.intro} tone="dark" />
            </p>
          )}
        </div>
        <ul className="flex flex-wrap gap-[1.125rem]">
          {items.map((item, i) => {
            const link = usableLink(item.link, ctx.settings);
            return (
              <li
                key={`${item.title}-${i}`}
                className={cn(
                  "fx-card reveal relative flex min-h-[16.25rem] min-w-0 flex-[1_1_17.5rem] flex-col gap-2.5 rounded-[1.75rem] border p-[1.875rem] max-sm:min-h-0 max-sm:p-6",
                  item.accent ? "border-accent bg-accent text-ink-deep" : "border-plum-line bg-plum-card",
                )}
              >
                <h3 className={cn("m-0 font-grotesk text-[1.875rem] font-extrabold leading-tight tracking-[-0.025em]", item.accent ? "!text-ink-deep" : "!text-white")}>{item.title}</h3>
                {item.tag && <span className={cn("fx-note text-[1.625rem]", item.accent ? "!text-ink-deep" : "!text-lav-200", !item.body && "grow")}>{item.tag}</span>}
                {item.body && (
                  <p className={cn("m-0 grow text-base", item.accent ? "text-ink-deep" : "text-lilac")}>
                    <Emphasis text={item.body} tone={item.accent ? "light" : "dark"} strong />
                  </p>
                )}
                {link && (
                  <ButtonLink href={link.href} variant={item.accent ? "ink" : "secondary"} trackLabel={`Choice: ${item.title}`} className="mt-1 self-start font-text text-[0.9375rem]">
                    {link.label}
                    {item.accent && <Arrow />}
                  </ButtonLink>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/**
 * "Choose your path" as a charcoal panel of three icon cards. Straight after a
 * homepage hero it rises over the hero's lower edge (the hero leaves room for
 * it); on phones the overlap is small so nothing is ever covered.
 */
function PanelCards({ data, ctx }: BlockProps<"path_cards">) {
  const items = data.items.filter((item) => item.title);
  if (items.length === 0) return null;
  const overlaps = ctx.prev?.type === "hero" && ctx.prev.variant === "home";
  const headingId = `path-${data.anchor || "choose"}`;
  const cards = items.map((item, i) => {
    const href = item.link?.href ? resolveHref(item.link.href, ctx.settings) : null;
    // Cards saved before icons existed get one by position, so three older cards never share an icon.
    const Icon = ICONS[item.icon] ?? ICONS[POSITION_ICONS[i] ?? "compass"] ?? ICONS.compass!;
    return (
      <li
        key={`${item.title}-${i}`}
        // On phones and tablets each path is a compact row: the icon on the left; title, line and link beside it.
        className="path-card group flex flex-col p-5 sm:p-6 max-lg:grid max-lg:grid-cols-[auto_minmax(0,1fr)] max-lg:content-start max-lg:gap-x-4 max-lg:px-4 max-lg:py-4 sm:max-lg:px-5"
      >
        <span aria-hidden className="grid size-11 place-items-center rounded-xl bg-accent text-navy transition-transform duration-300 group-hover:-rotate-6 max-lg:row-span-3">
          <Icon weight="bold" className="size-5" />
        </span>
        <h3 className="mt-4 text-[1.25rem] leading-snug tracking-tight !text-navy max-lg:mt-0 max-lg:text-[1.125rem]">
          {href ? (
            <Link
              href={href}
              data-track="cta_click"
              data-track-label={`Path: ${item.title}`}
              className="outline-none after:absolute after:inset-0 after:z-10 after:rounded-[inherit]"
            >
              {item.title}
            </Link>
          ) : (
            item.title
          )}
        </h3>
        {item.body && <p className="mt-1.5 text-[0.9688rem] leading-relaxed text-ink max-lg:mt-0.5 max-lg:text-[0.9375rem] max-lg:leading-snug">{item.body}</p>}
        {href && item.link.label && (
          <span aria-hidden className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[0.9375rem] font-bold text-navy max-lg:pt-2.5">
            {item.link.label}
            <ArrowRightIcon weight="bold" className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
          </span>
        )}
      </li>
    );
  });
  return (
    <section
      id={data.anchor || undefined}
      aria-labelledby={headingId}
      className={cn("relative z-10", overlaps ? "-mt-12 pb-[var(--section-space)] sm:-mt-14 lg:-mt-28" : "section-space")}
    >
      <div className="container-site">
        <div className="on-dark relative overflow-hidden rounded-[var(--radius-panel)] bg-navy px-5 py-7 shadow-panel sm:px-8 sm:py-9 lg:px-10 lg:py-10">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between md:gap-8">
            <h2 id={headingId} className="text-h2 !text-white">
              <Emphasis text={data.heading} tone="dark" auto />
            </h2>
            {data.intro && <p className="max-w-md text-[1.0313rem] leading-snug text-white/80 md:text-right">{data.intro}</p>}
          </div>
          {/* Phones and tablets: one path per row, all three in view. Desktop: side by side. */}
          <ul
            className={cn(
              "mt-5 grid gap-3 sm:gap-4 md:mt-6 lg:mt-8 lg:gap-5",
              items.length >= 3 ? (items.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3") : "lg:grid-cols-2",
            )}
          >
            {cards}
          </ul>
        </div>
      </div>
    </section>
  );
}

/**
 * Image-led variant. With three pathways the first is the lead card and the
 * other two sit beside it; on phones every card stacks with a wide image.
 */
function ImageCards({ data, ctx }: BlockProps<"path_cards">) {
  const items = data.items.filter((item) => item.title);
  if (items.length === 0) return null;
  const featured = items.length === 3;

  return (
    <Section background={data.background} anchor={data.anchor}>
      <div className="container-site">
        <SectionHeading heading={data.heading} intro={data.intro} />
        <ul
          className={cn(
            "mt-9 grid gap-5 md:mt-12 md:gap-6",
            featured ? "lg:grid-cols-12 lg:grid-rows-2" : "md:grid-cols-2",
          )}
        >
          {items.map((item, i) => {
            const image = pickMedia(ctx, item.image);
            const href = item.link?.href ? resolveHref(item.link.href, ctx.settings) : null;
            const lead = featured && i === 0;
            const side = featured && i > 0;
            return (
              <li
                key={`${item.title}-${i}`}
                className={cn(
                  "reveal group relative isolate overflow-hidden rounded-card border border-line bg-surface transition-shadow duration-300 hover:shadow-lift",
                  lead && "lg:col-span-5 lg:row-span-2 lg:flex lg:flex-col",
                  side && "md:grid md:grid-cols-[minmax(0,0.42fr)_minmax(0,1fr)] lg:col-span-7",
                )}
              >
                {image && (
                  <div
                    className={cn(
                      "relative overflow-hidden",
                      lead ? "aspect-[16/10] lg:aspect-auto lg:min-h-0 lg:flex-1" : "aspect-[16/10]",
                      side && "md:aspect-auto md:min-h-48",
                    )}
                  >
                    <MediaImage
                      media={image}
                      fill
                      alt=""
                      sizes={lead ? "(min-width: 64rem) 40vw, 100vw" : "(min-width: 64rem) 24vw, (min-width: 48rem) 40vw, 100vw"}
                      className="transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                  </div>
                )}
                <div className={cn("flex flex-col p-6 md:p-7", side && "md:justify-center lg:p-8")}>
                  <h3 className="text-h3">
                    {href ? (
                      <Link
                        href={href}
                        data-track="cta_click"
                        data-track-label={`Path: ${item.title}`}
                        className="outline-none after:absolute after:inset-0 after:z-10 after:rounded-card focus-visible:after:outline-3 focus-visible:after:-outline-offset-3 focus-visible:after:outline-navy"
                      >
                        {item.title}
                      </Link>
                    ) : (
                      item.title
                    )}
                  </h3>
                  {item.body && <p className="mt-2.5 text-ink">{item.body}</p>}
                  {href && item.link.label && (
                    <span aria-hidden className="mt-5 inline-flex items-center gap-1.5 font-semibold text-primary group-hover:text-navy">
                      {item.link.label}
                      <ArrowRightIcon weight="bold" className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </Section>
  );
}
