import { ArrowRightIcon, BuildingsIcon, CompassIcon, GraduationCapIcon, TrendUpIcon, UsersThreeIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { ComponentType } from "react";
import { MediaImage } from "@/components/ui/media-image";
import { Section, SectionHeading } from "@/components/ui/section";
import { resolveHref } from "@/lib/settings";
import { cn } from "@/lib/utils";
import { type BlockProps, pickMedia } from "./types";

const ICONS: Record<string, ComponentType<{ className?: string; weight?: "regular" | "bold" | "fill" | "duotone"; "aria-hidden"?: boolean }>> = {
  cap: GraduationCapIcon,
  trend: TrendUpIcon,
  buildings: BuildingsIcon,
  compass: CompassIcon,
  users: UsersThreeIcon,
};

const POSITION_ICONS = ["cap", "trend", "buildings", "users"];

export function PathCardsBlock(props: BlockProps<"path_cards">) {
  return props.data.layout === "images" ? <ImageCards {...props} /> : <PanelCards {...props} />;
}

/**
 * "Choose your path" as a navy panel of three icon cards. Straight after a
 * homepage hero it rises over the hero's lower edge (the hero leaves room for
 * it); on phones the overlap is small so nothing is ever covered.
 */
function PanelCards({ data, ctx }: BlockProps<"path_cards">) {
  const items = data.items.filter((item) => item.title);
  if (items.length === 0) return null;
  const overlaps = ctx.prev?.type === "hero" && ctx.prev.variant === "home";
  const headingId = `path-${data.anchor || "choose"}`;
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
              {data.heading}
            </h2>
            {data.intro && <p className="max-w-md text-[1.0313rem] leading-snug text-white/80 md:text-right">{data.intro}</p>}
          </div>
          <ul className={cn("mt-7 grid gap-4 md:mt-8 md:gap-5", items.length >= 3 ? "md:grid-cols-3" : "md:grid-cols-2", items.length === 4 && "lg:grid-cols-4")}>
            {items.map((item, i) => {
              const href = item.link?.href ? resolveHref(item.link.href, ctx.settings) : null;
              // Cards saved before icons existed get one by position, so three older cards never share an icon.
              const Icon = ICONS[item.icon] ?? ICONS[POSITION_ICONS[i] ?? "compass"] ?? ICONS.compass!;
              return (
                <li key={`${item.title}-${i}`} className="path-card group flex flex-col p-5 sm:p-6">
                  <span aria-hidden className="grid size-11 place-items-center rounded-xl bg-accent text-navy transition-transform duration-300 group-hover:-rotate-6">
                    <Icon weight="bold" className="size-5" />
                  </span>
                  <h3 className="mt-4 text-[1.25rem] leading-snug tracking-tight !text-navy">
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
                  {item.body && <p className="mt-1.5 text-[0.9688rem] leading-relaxed text-ink">{item.body}</p>}
                  {href && item.link.label && (
                    <span aria-hidden className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[0.9375rem] font-bold text-navy">
                      {item.link.label}
                      <ArrowRightIcon weight="bold" className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </span>
                  )}
                </li>
              );
            })}
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
