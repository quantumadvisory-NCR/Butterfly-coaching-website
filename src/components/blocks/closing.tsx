import { WhatsappLogoIcon } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { GuideForm } from "@/components/site/guide-form";
import { NewsletterForm } from "@/components/site/newsletter-form";
import { Accordion } from "@/components/ui/accordion";
import { ButtonLink } from "@/components/ui/button-link";
import { Butterfly } from "@/components/ui/effects";
import { Emphasis } from "@/components/ui/emphasis";
import { MediaImage } from "@/components/ui/media-image";
import { Section, SectionHeading, sectionBackground } from "@/components/ui/section";
import { getFaqs, getPosts } from "@/lib/content/public";
import { whatsappHref } from "@/lib/settings";
import { cn, formatDate, readingMinutes } from "@/lib/utils";
import { JsonLd } from "@/components/site/json-ld";
import { DESIGN_H2 } from "./content";
import { type BlockProps, pickMedia, usableLink } from "./types";

export async function FaqBlock({ data, ctx }: BlockProps<"faq">) {
  const group = data.group || "general";
  const items = (await getFaqs()).filter((faq) => faq.groupKey === group && !faq.programmeId);
  if (items.length === 0) return null;
  const cta = usableLink(data.cta, ctx.settings);
  const whatsapp = whatsappHref(ctx.settings.contact);
  const helpCard = Boolean(data.helpHeading);
  // On the light gray band of the homepage design the section takes the design's spacing and display heading.
  const design = data.background === "lavender";
  return (
    <Section background={data.background} anchor={data.anchor} flush={design} className={cn(design && "py-[var(--design-space)]")}>
      {/* Phones and tablets read heading, questions, then the help card; desktop keeps the help card beside the questions. */}
      <div className="container-site grid gap-9 max-lg:gap-8 lg:grid-cols-12 lg:gap-12">
        <div className={cn("max-lg:contents lg:col-span-5", !design && "xl:col-span-4")}>
          <div className="max-lg:contents lg:sticky lg:top-[calc(var(--header-height)+2rem)]">
            <div>
              {design ? (
                <div className="reveal">
                  <h2 className={DESIGN_H2}>
                    <Emphasis text={data.heading} />
                  </h2>
                  {data.intro && <p className="mt-4 max-w-md text-[1.0625rem] leading-normal text-mauve">{data.intro}</p>}
                </div>
              ) : (
                <>
                  {/* The design's butterfly above the heading. */}
                  <Butterfly className="pointer-events-none mb-3 w-12" />
                  <SectionHeading heading={data.heading} intro={data.intro} />
                </>
              )}
            </div>
            {helpCard ? (
              <div className="mt-8 rounded-[1.5rem] border border-lav-100 bg-surface p-6 max-lg:order-last max-lg:mt-0 max-sm:p-5">
                <p className="font-display text-xl font-bold text-ink-deep">{data.helpHeading}</p>
                {data.helpText && <p className="mt-1.5 text-[0.9375rem] leading-normal text-mauve">{data.helpText}</p>}
                {(cta || whatsapp) && (
                  <div className="mt-5 flex flex-col gap-2.5 min-[26rem]:flex-row min-[26rem]:flex-wrap">
                    {cta && (
                      <ButtonLink href={cta.href} variant="ink" size="sm">
                        {cta.label}
                      </ButtonLink>
                    )}
                    {whatsapp && (
                      <ButtonLink href={whatsapp} variant="secondary" size="sm" trackLabel="FAQ: WhatsApp" icon={<WhatsappLogoIcon aria-hidden weight="fill" className="size-4 text-[#0f7a5f]" />}>
                        WhatsApp us
                      </ButtonLink>
                    )}
                  </div>
                )}
              </div>
            ) : (
              cta && (
                <div className="mt-7 max-lg:order-last max-lg:mt-0">
                  <ButtonLink href={cta.href} variant="secondary">
                    {cta.label}
                  </ButtonLink>
                </div>
              )
            )}
          </div>
        </div>
        <div className={cn("lg:col-span-7", !design && "xl:col-span-8")}>
          {/* The homepage design lists the questions without numbers. */}
          <Accordion numbered={!design} items={items.map((f) => ({ id: f.id, question: f.question, answerHtml: f.answerHtml }))} />
        </div>
      </div>
      <FaqJsonLd items={items} />
    </Section>
  );
}

export function FaqJsonLd({ items }: { items: { question: string; answerHtml: string }[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answerHtml },
        })),
      }}
    />
  );
}

/** Closing call to action. Always the charcoal band, so it reads as the page's one dark moment before the footer. */
/**
 * The closing call to action. Desktop only: on phones and tablets the floating
 * WhatsApp and "Need help?" buttons and the menu already carry the next step.
 */
export function CtaBlock({ data, ctx }: BlockProps<"cta">) {
  const primary = usableLink(data.primaryCta, ctx.settings);
  const secondary = usableLink(data.secondaryCta, ctx.settings);
  return (
    <section id={data.anchor || undefined} className="on-dark relative isolate overflow-clip bg-ink-deep text-white max-lg:hidden">
      <div className="container-site section-space grid items-center gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] lg:gap-16">
        <div className="reveal max-w-2xl">
          <h2 className="text-h1 !text-white">
            <Emphasis text={data.heading} tone="dark" />
          </h2>
          {data.body && <p className="mt-4 max-w-xl text-lead text-white/85">{data.body}</p>}
          {(primary || secondary) && (
            <div className="mt-8 flex flex-col gap-3 min-[26rem]:flex-row min-[26rem]:flex-wrap">
              {primary && <ButtonLink href={primary.href}>{primary.label}</ButtonLink>}
              {secondary && (
                <ButtonLink
                  href={secondary.href}
                  variant="secondary"
                  icon={secondary.href.startsWith("https://wa.me/") ? <WhatsappLogoIcon aria-hidden weight="fill" className="size-5" /> : undefined}
                >
                  {secondary.label}
                </ButtonLink>
              )}
            </div>
          )}
        </div>
        {/* The full BCA butterfly, whole and centred in a quiet emblem of rings. */}
        <div aria-hidden className="relative mx-auto aspect-square w-full max-w-[24rem]">
          <div className="absolute inset-0 rounded-full border border-white/10" />
          <div className="absolute inset-[9%] rounded-full border-2 border-dashed border-accent/45" />
          <div className="absolute inset-[22%] grid place-items-center rounded-full bg-white/[0.06] shadow-[0_0_64px_-12px_rgb(245_186_0/0.55)] ring-1 ring-white/15">
            <Image src="/images/brand/bca-mark-on-dark.svg" alt="" width={98} height={90} unoptimized className="h-auto w-[62%]" />
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * "Get the programme guide" from the November 2026 design: a light gray panel
 * with the heading on one side and an email form on the other. Requests arrive
 * in Enquiries. (Taken off the homepage by the owner's brief of 25 November 2026.)
 */
function GuidePanel({ data }: BlockProps<"newsletter">) {
  return (
    <section id={data.anchor || "guide"} className={cn(sectionBackground(data.background), "py-[var(--design-space)] font-text")}>
      <div className="container-site">
        <div className="reveal relative flex flex-wrap items-center gap-x-12 gap-y-7 overflow-hidden rounded-[2rem] bg-lav-100 p-[clamp(1.75rem,4vw,3.5rem)]">
          <div className="relative flex min-w-0 flex-[1_1_21.25rem] flex-col gap-2.5">
            <h2 className="m-0 font-grotesk text-[clamp(1.4375rem,2.5vw,2.125rem)] leading-[1.12] text-ink-deep">
              <Emphasis text={data.heading} />
            </h2>
            {data.body && <p className="m-0 text-base leading-normal text-mauve">{data.body}</p>}
          </div>
          <div className="relative min-w-0 flex-[1.2_1_25rem]">
            <GuideForm variant="panel" idPrefix={data.anchor || "guide-section"} label="Email" formNote={data.formNote} />
          </div>
        </div>
      </div>
    </section>
  );
}

export function NewsletterBlock(props: BlockProps<"newsletter">) {
  if (props.data.layout === "guide") return <GuidePanel {...props} />;
  const { data, ctx } = props;
  return (
    <Section background={data.background} anchor={data.anchor}>
      <div className="container-site grid items-center gap-7 lg:grid-cols-2 lg:gap-14">
        <SectionHeading heading={data.heading} intro={data.body} />
        <NewsletterForm consentText={ctx.settings.newsletter.consentText} idPrefix="block" />
      </div>
    </Section>
  );
}

export async function BlogTeasersBlock({ data, ctx }: BlockProps<"blog_teasers">) {
  const posts = (await getPosts()).slice(0, data.limit ?? 3);
  if (posts.length === 0) return null;
  const cta = usableLink(data.cta, ctx.settings);
  return (
    <Section background={data.background} anchor={data.anchor}>
      <div className="container-site">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading heading={data.heading} intro={data.intro} />
          {cta && (
            <ButtonLink href={cta.href} variant="secondary" className="self-start md:shrink-0 md:self-auto">
              {cta.label}
            </ButtonLink>
          )}
        </div>
        <ul className="mt-9 grid gap-x-6 gap-y-10 md:mt-12 md:grid-cols-3">
          {posts.map((post) => {
            const image = pickMedia(ctx, post.featuredImageId);
            return (
              <li key={post.id} className="reveal group relative isolate flex flex-col">
                <div className="relative aspect-[16/10] overflow-hidden rounded-card bg-tint-deep">
                  {image && (
                    <MediaImage
                      media={image}
                      fill
                      alt=""
                      sizes="(min-width: 48rem) 31vw, 100vw"
                      className="transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                  )}
                </div>
                <p className="mt-5 text-sm text-muted">
                  {formatDate(post.publishedAt)} <span aria-hidden>·</span> {readingMinutes(post.contentHtml)} min read
                </p>
                <h3 className="mt-2 text-h3">
                  <Link href={`/${post.slug}/`} className="outline-none after:absolute after:inset-0 after:z-10 group-hover:text-primary focus-visible:underline">
                    {post.title}
                  </Link>
                </h3>
              </li>
            );
          })}
        </ul>
      </div>
    </Section>
  );
}
