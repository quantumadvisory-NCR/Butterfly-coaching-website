import { WhatsappLogoIcon } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { NewsletterForm } from "@/components/site/newsletter-form";
import { Accordion } from "@/components/ui/accordion";
import { ButtonLink } from "@/components/ui/button-link";
import { MediaImage } from "@/components/ui/media-image";
import { Section, SectionHeading } from "@/components/ui/section";
import { getFaqs, getPosts } from "@/lib/content/public";
import { formatDate, readingMinutes } from "@/lib/utils";
import { JsonLd } from "@/components/site/json-ld";
import { type BlockProps, pickMedia, usableLink } from "./types";

export async function FaqBlock({ data, ctx }: BlockProps<"faq">) {
  const group = data.group || "general";
  const items = (await getFaqs()).filter((faq) => faq.groupKey === group && !faq.programmeId);
  if (items.length === 0) return null;
  const cta = usableLink(data.cta, ctx.settings);
  return (
    <Section background={data.background} anchor={data.anchor}>
      <div className="container-site grid gap-9 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-4">
          <SectionHeading heading={data.heading} intro={data.intro} />
          {cta && (
            <div className="mt-7">
              <ButtonLink href={cta.href} variant="secondary">
                {cta.label}
              </ButtonLink>
            </div>
          )}
        </div>
        <div className="lg:col-span-8">
          <Accordion items={items.map((f) => ({ id: f.id, question: f.question, answerHtml: f.answerHtml }))} />
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

/** Closing call to action. Always the navy band, so it reads as the page's one dark moment before the footer. */
export function CtaBlock({ data, ctx }: BlockProps<"cta">) {
  const primary = usableLink(data.primaryCta, ctx.settings);
  const secondary = usableLink(data.secondaryCta, ctx.settings);
  return (
    <section id={data.anchor || undefined} className="on-dark relative isolate overflow-clip bg-navy text-white">
      {/* The BCA butterfly mark, used large and quiet as a brand watermark. */}
      <Image
        src="/images/brand/bca-mark.svg"
        alt=""
        width={82}
        height={89}
        unoptimized
        aria-hidden
        className="pointer-events-none absolute -right-10 top-1/2 -z-10 hidden h-[130%] w-auto -translate-y-1/2 opacity-[0.09] md:block"
      />
      <div className="container-site section-space">
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
      </div>
    </section>
  );
}

export function NewsletterBlock({ data, ctx }: BlockProps<"newsletter">) {
  return (
    <Section background={data.background === "white" ? "white" : "sky"} anchor={data.anchor}>
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
                <div className="relative aspect-[16/10] overflow-hidden rounded-card bg-sky-deep">
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
