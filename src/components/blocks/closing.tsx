import { WhatsappLogoIcon } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { NewsletterForm } from "@/components/site/newsletter-form";
import { Accordion } from "@/components/ui/accordion";
import { ButtonLink } from "@/components/ui/button-link";
import { MediaImage } from "@/components/ui/media-image";
import { Section, SectionHeading } from "@/components/ui/section";
import { getFaqs, getPosts } from "@/lib/content/public";
import { whatsappHref } from "@/lib/settings";
import { formatDate, readingMinutes } from "@/lib/utils";
import { JsonLd } from "@/components/site/json-ld";
import { type BlockProps, pickMedia, usableLink } from "./types";

export async function FaqBlock({ data, ctx }: BlockProps<"faq">) {
  const group = data.group || "general";
  const items = (await getFaqs()).filter((faq) => faq.groupKey === group && !faq.programmeId);
  if (items.length === 0) return null;
  const cta = usableLink(data.cta, ctx.settings);
  const whatsapp = whatsappHref(ctx.settings.contact);
  const helpCard = Boolean(data.helpHeading);
  return (
    <Section background={data.background} anchor={data.anchor}>
      {/* Phones and tablets read heading, questions, then the help card; desktop keeps the help card beside the questions. */}
      <div className="container-site grid gap-9 max-lg:gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="max-lg:contents lg:col-span-5 xl:col-span-4">
          <div className="max-lg:contents lg:sticky lg:top-[calc(var(--header-height)+2rem)]">
            <div>
              {/* A thin yellow wing-stroke above the heading: the butterfly, at a whisper. */}
              <svg aria-hidden viewBox="0 0 120 60" className="pointer-events-none mb-3 h-9 w-[4.5rem] text-accent">
                <path d="M60 52 C48 22 26 6 12 10 C0 14 2 34 16 42 C30 50 48 52 60 52 Z" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M60 52 C72 22 94 6 108 10 C120 14 118 34 104 42 C90 50 72 52 60 52 Z" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.55" />
              </svg>
              <SectionHeading heading={data.heading} intro={data.intro} />
            </div>
            {helpCard ? (
              <div className="mt-8 rounded-card border border-line bg-surface p-6 max-lg:order-last max-lg:mt-0 max-sm:p-5">
                <p className="font-display text-lg font-bold text-navy">{data.helpHeading}</p>
                {data.helpText && <p className="mt-1.5 text-[0.9688rem] text-ink">{data.helpText}</p>}
                {(cta || whatsapp) && (
                  <div className="mt-5 flex flex-col gap-2.5 min-[26rem]:flex-row min-[26rem]:flex-wrap">
                    {cta && (
                      <ButtonLink href={cta.href} size="sm">
                        {cta.label}
                      </ButtonLink>
                    )}
                    {whatsapp && (
                      <ButtonLink href={whatsapp} variant="quiet" size="sm" trackLabel="FAQ: WhatsApp" icon={<WhatsappLogoIcon aria-hidden weight="fill" className="size-4 text-[#0f7a5f]" />}>
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
        <div className="lg:col-span-7 xl:col-span-8">
          <Accordion numbered items={items.map((f) => ({ id: f.id, question: f.question, answerHtml: f.answerHtml }))} />
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
    <section id={data.anchor || undefined} className="on-dark relative isolate overflow-clip bg-navy text-white max-lg:hidden">
      <div className="container-site section-space grid items-center gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] lg:gap-16">
        <div className="reveal max-w-2xl">
          <h2 className="text-h1 !text-white">{data.heading}</h2>
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
        {/* The full BCA butterfly, whole and centred in a quiet emblem: rings and a slow orbit. */}
        <div aria-hidden className="relative mx-auto aspect-square w-full max-w-[24rem]">
          <div className="absolute inset-0 rounded-full border border-white/10" />
          <div className="orbit-spin absolute inset-[9%] rounded-full border-2 border-dashed border-accent/45">
            <span className="absolute left-1/2 top-0 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_0_6px_rgb(245_186_0/0.18)]" />
          </div>
          <div className="absolute inset-[22%] grid place-items-center rounded-full bg-white/[0.06] shadow-[0_0_64px_-12px_rgb(245_186_0/0.55)] ring-1 ring-white/15">
            <Image src="/images/brand/bca-mark-on-dark.svg" alt="" width={98} height={90} unoptimized className="mark-float h-auto w-[62%]" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function NewsletterBlock({ data, ctx }: BlockProps<"newsletter">) {
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
