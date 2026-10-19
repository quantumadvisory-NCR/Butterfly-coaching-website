import { CheckIcon, DownloadSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import { FaqJsonLd } from "@/components/blocks/closing";
import { ProfilesBlock, TestimonialGrid } from "@/components/blocks/people";
import { programmeFacts } from "@/components/blocks/programmes";
import type { BlockContext, Crumb } from "@/components/blocks/types";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { EnquiryForm } from "@/components/site/enquiry-form";
import { JsonLd } from "@/components/site/json-ld";
import { Accordion } from "@/components/ui/accordion";
import { ButtonLink } from "@/components/ui/button-link";
import { MediaImage } from "@/components/ui/media-image";
import { RichText } from "@/components/ui/section";
import { type ProgrammeView, getFaculty, getFaqs, getProgrammes, getTestimonials } from "@/lib/content/public";
import { siteUrl } from "@/lib/env";
import { absoluteUrl } from "@/lib/seo";
import { resolveHref } from "@/lib/settings";
import { cn, formatDate, stripHtml } from "@/lib/utils";

function CheckList({ items, columns = false }: { items: string[]; columns?: boolean }) {
  return (
    <ul className={cn("grid gap-3.5", columns && "md:grid-cols-2 md:gap-x-10")}>
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-accent text-navy">
            <CheckIcon aria-hidden weight="bold" className="size-3.5" />
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Detail page for an ICF credential pathway. Every section is driven by the
 * programme record, and sections with no data (fees, dates, brochure) are
 * left out rather than padded with placeholder copy.
 */
export async function ProgrammeTemplate({
  programme: p,
  ctx,
  breadcrumbs,
}: {
  programme: ProgrammeView;
  ctx: Omit<BlockContext, "index" | "breadcrumbs">;
  breadcrumbs: Crumb[];
}) {
  const [allFaculty, allFaqs, allTestimonials, allProgrammes] = await Promise.all([getFaculty(), getFaqs(), getTestimonials(), getProgrammes()]);
  const faqs = allFaqs.filter((f) => f.programmeId === p.id);
  const faculty = p.facultyIds.map((id) => allFaculty.find((f) => f.id === id)).filter((f) => f !== undefined);
  const stories = allTestimonials.filter((t) => t.programmeId === p.id).slice(0, 3);
  const facts = programmeFacts(p);
  const hero = ctx.media[p.heroImageId ?? ""] ?? null;
  const badge = p.accreditationStatus === "accredited" ? (ctx.media[p.badgeId ?? ""] ?? null) : null;
  const brochure = ctx.media[p.brochureId ?? ""] ?? null;
  const today = new Date().toISOString().slice(0, 10);
  const cohorts = p.cohorts.filter((c) => c.startDate >= today);
  const bookingHref = resolveHref("booking", ctx.settings);
  const blockCtx: BlockContext = { ...ctx, breadcrumbs, index: 1 };

  return (
    <>
      {/* Hero */}
      <section className="bg-cream">
        <div className="container-site pb-12 pt-5 md:pb-16 lg:pb-20">
          <Breadcrumbs items={breadcrumbs} />
          <div className={cn("mt-6 grid items-center gap-9 md:mt-8", hero && "lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-14")}>
            <div className="hero-enter max-w-2xl">
              <p className="eyebrow mb-3">{[p.levelLabel, p.credential && `${p.credential} pathway`].filter(Boolean).join(" · ")}</p>
              <h1 className="text-h1">{p.name}</h1>
              {p.tagline && <p className="mt-4 max-w-xl text-lead">{p.tagline}</p>}
              <div className="mt-7 flex flex-col gap-3 min-[26rem]:flex-row min-[26rem]:flex-wrap">
                <ButtonLink href={bookingHref}>Book a discovery call</ButtonLink>
                {brochure ? (
                  <ButtonLink href={brochure.url} variant="secondary" track="download" trackLabel={`Brochure: ${p.name}`} download icon={<DownloadSimpleIcon aria-hidden weight="bold" className="size-4" />}>
                    Download brochure
                  </ButtonLink>
                ) : (
                  <ButtonLink href="#journey" variant="secondary">
                    See the journey
                  </ButtonLink>
                )}
              </div>
            </div>
            {hero && (
              <div className="relative">
                <div className="relative aspect-[16/10] overflow-hidden rounded-card lg:aspect-[4/3] lg:rounded-tr-[var(--radius-wing)]">
                  <MediaImage media={hero} fill preload sizes="(min-width: 64rem) 44vw, 100vw" />
                </div>
                {badge && (
                  <div className="absolute -bottom-6 left-5 size-24 rounded-full bg-surface p-1.5 shadow-card md:size-28 lg:-left-6">
                    <div className="relative size-full">
                      <MediaImage media={badge} fill sizes="112px" className="!object-contain" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Key facts */}
      {facts.length > 0 && (
        <section aria-label="Programme at a glance" className="border-y border-line bg-cream">
          <dl className="container-site grid grid-cols-2 gap-x-6 gap-y-6 py-8 md:grid-cols-3 md:py-10 lg:flex lg:flex-wrap lg:justify-between">
            {facts.map((fact) => (
              <div key={fact.label} className="flex flex-col-reverse border-l-2 border-accent pl-4">
                <dt className="text-sm text-muted">{fact.label}</dt>
                <dd className="font-display text-xl font-bold tracking-tight text-navy md:text-2xl">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* Overview and highlights */}
      <section className="section-space bg-cream">
        <div className="container-site grid gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="reveal lg:col-span-7">
            <h2 className="text-h2">About this pathway</h2>
            <RichText html={p.descriptionHtml} className="prose-lg mt-5" />
            {p.accreditationNote && <p className="mt-6 rounded-field bg-tint px-4 py-3 text-[0.9375rem] text-navy">{p.accreditationNote}</p>}
          </div>
          {p.highlights.length > 0 && (
            <aside className="reveal lg:col-span-5">
              <div className="rounded-card bg-tint p-6 md:p-8">
                <h3 className="text-h3">Programme highlights</h3>
                <div className="mt-5">
                  <CheckList items={p.highlights} />
                </div>
              </div>
            </aside>
          )}
        </div>
      </section>

      {/* Audience and eligibility */}
      {(p.audience.length > 0 || p.eligibility.length > 0) && (
        <section className="section-space bg-cream">
          <div className="container-site grid gap-10 md:grid-cols-2 md:gap-12">
            {p.audience.length > 0 && (
              <div className="reveal">
                <h2 className="text-h2">Who this is for</h2>
                <div className="mt-6">
                  <CheckList items={p.audience} />
                </div>
              </div>
            )}
            {p.eligibility.length > 0 && (
              <div className="reveal">
                <h2 className="text-h2">Before you join</h2>
                <div className="mt-6">
                  <CheckList items={p.eligibility} />
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Journey */}
      {p.modules.length > 0 && (
        <section id="journey" className="section-space bg-cream">
          <div className="container-site grid gap-9 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-4">
              <h2 className="text-h2">The journey, step by step</h2>
              <p className="mt-4 text-lead">Education, practice, mentoring and evaluation, in the order you will experience them.</p>
            </div>
            <ol className="lg:col-span-8">
              {p.modules.map((module, i) => (
                <li key={module.id} className="reveal relative flex gap-5 pb-8 last:pb-0">
                  {i < p.modules.length - 1 && <span aria-hidden className="absolute left-6 top-12 h-[calc(100%-3rem)] w-px bg-line" />}
                  <span
                    className={cn(
                      "relative z-[1] grid size-12 shrink-0 place-items-center rounded-full font-display text-lg font-bold",
                      i === p.modules.length - 1 ? "bg-accent text-navy" : "bg-navy text-white",
                    )}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 pt-1.5">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h3 className="text-h3">{module.title}</h3>
                      {module.hoursLabel && <span className="rounded-full bg-tint px-3 py-0.5 text-sm font-semibold text-navy">{module.hoursLabel}</span>}
                    </div>
                    {module.description && <p className="mt-2 max-w-prose">{module.description}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* Outcomes */}
      {p.outcomes.length > 0 && (
        <section className="section-space bg-cream">
          <div className="container-site">
            <h2 className="text-h2">What you will build</h2>
            <div className="reveal mt-8 rounded-card bg-surface p-6 md:p-9">
              <CheckList items={p.outcomes} columns />
            </div>
          </div>
        </section>
      )}

      {/* Dates and fees: shown only when real data exists */}
      {(cohorts.length > 0 || p.feeText) && (
        <section className="section-space bg-cream">
          <div className="container-site grid gap-10 md:grid-cols-2 md:gap-12">
            {cohorts.length > 0 && (
              <div>
                <h2 className="text-h2">Upcoming cohorts</h2>
                <ul className="mt-6 grid gap-3">
                  {cohorts.map((cohort) => (
                    <li key={cohort.id} className="rounded-card border border-line p-5">
                      <p className="font-display text-lg font-bold text-navy">
                        {cohort.label || "Cohort"}: starts {formatDate(cohort.startDate)}
                      </p>
                      {cohort.endDate && <p className="text-sm text-muted">Ends {formatDate(cohort.endDate)}</p>}
                      {cohort.schedule && <p className="mt-1.5">{cohort.schedule}</p>}
                      {cohort.note && <p className="mt-1.5 text-sm text-muted">{cohort.note}</p>}
                      <p className={cn("mt-2 text-sm font-semibold", cohort.isOpen ? "text-success" : "text-muted")}>
                        {cohort.isOpen ? "Open for enrolment" : "Enrolment closed"}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {p.feeText && (
              <div>
                <h2 className="text-h2">Fees</h2>
                <p className="mt-6 font-display text-3xl font-bold tracking-tight text-navy">{p.feeText}</p>
                {p.feeNote && <p className="mt-3 max-w-prose">{p.feeNote}</p>}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Faculty */}
      {faculty.length > 0 && (
        <section className="section-space border-t border-line bg-cream">
          <div className="container-site">
            <h2 className="text-h2">Who you will learn with</h2>
            <ul className="mt-9 grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
              {faculty.map((person) => {
                const photo = ctx.media[person.photoId ?? ""] ?? null;
                return (
                  <li key={person.id} className="reveal flex items-center gap-4 sm:block">
                    <div className="relative size-24 shrink-0 overflow-hidden rounded-full bg-tint-deep sm:aspect-[4/5] sm:size-auto sm:w-full sm:rounded-card">
                      {photo && <MediaImage media={photo} fill alt="" sizes="(min-width: 64rem) 22vw, (min-width: 40rem) 44vw, 96px" className="!object-top" />}
                    </div>
                    <div className="sm:mt-4">
                      <h3 className="text-h3">{person.name}</h3>
                      <p className="mt-1 text-sm font-semibold text-primary">{[person.credential, person.roleTitle].filter(Boolean).join(" · ")}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      {/* Student stories linked to this programme */}
      {stories.length > 0 && (
        <section className="section-space bg-cream">
          <div className="container-site">
            <h2 className="text-h2">What {p.credential ?? "programme"} learners say</h2>
            <div className="mt-9">
              <TestimonialGrid items={stories} ctx={blockCtx} />
            </div>
          </div>
        </section>
      )}
      {stories.length === 0 && faculty.length === 0 && <ProfilesFallback ctx={blockCtx} />}

      {/* FAQs */}
      {faqs.length > 0 && (
        <section className="section-space bg-cream">
          <div className="container-site grid gap-9 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-4">
              <h2 className="text-h2">Questions about {p.credential ?? "this programme"}</h2>
            </div>
            <div className="lg:col-span-8">
              <Accordion items={faqs.map((f) => ({ id: f.id, question: f.question, answerHtml: f.answerHtml }))} />
            </div>
          </div>
          <FaqJsonLd items={faqs} />
        </section>
      )}

      {/* Enquiry */}
      <section id="enquire" className="section-space bg-cream">
        <div className="container-site grid gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-5">
            <h2 className="text-h2">Talk to us about {p.credential ? `the ${p.credential} pathway` : p.name}</h2>
            <p className="mt-4 text-lead">
              Tell us where you are in your coaching journey. We will help you work out whether this is the right next step, and share current dates and fees.
            </p>
          </div>
          <div className="lg:col-span-7">
            <div className="rounded-card border border-line bg-surface p-5 shadow-card sm:p-7 md:p-9">
              <EnquiryForm type="programme" programmes={allProgrammes.map((x) => ({ id: x.id, name: x.name }))} defaultProgrammeId={p.id} />
            </div>
          </div>
        </div>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Course",
          name: p.name,
          description: p.summary || stripHtml(p.descriptionHtml).slice(0, 300),
          url: absoluteUrl(p.path),
          inLanguage: "en",
          provider: { "@type": "EducationalOrganization", "@id": `${siteUrl()}/#organization`, name: ctx.settings.brand.siteName, url: siteUrl() },
        }}
      />
    </>
  );
}

/** When a programme has no linked faculty or stories yet, show the founder so the page still has a human face. */
function ProfilesFallback({ ctx }: { ctx: BlockContext }) {
  return (
    <ProfilesBlock
      ctx={ctx}
      data={{ heading: "Meet the founder", intro: "", source: "founder", facts: [], cta: { label: "About BCA", href: "/about-us/" }, background: "cream", anchor: "" }}
    />
  );
}
