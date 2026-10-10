import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { MediaImage } from "@/components/ui/media-image";
import { Section, SectionHeading } from "@/components/ui/section";
import { resolveHref } from "@/lib/settings";
import { cn } from "@/lib/utils";
import { type BlockProps, pickMedia } from "./types";

/**
 * "Choose your path". With three pathways the first is the lead card and the
 * other two sit beside it; on phones every card stacks with a wide image.
 */
export function PathCardsBlock({ data, ctx }: BlockProps<"path_cards">) {
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
                  "reveal group relative isolate overflow-hidden rounded-card border border-sky-line bg-surface transition-shadow duration-300 hover:shadow-lift",
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
