import { LinkedinLogoIcon, QuotesIcon } from "@phosphor-icons/react/dist/ssr";
import { ButtonLink } from "@/components/ui/button-link";
import { MediaImage } from "@/components/ui/media-image";
import { Section, SectionHeading } from "@/components/ui/section";
import { type FacultyView, type TestimonialView, getFaculty, getTestimonials } from "@/lib/content/public";
import { cn } from "@/lib/utils";
import { type BlockContext, type BlockProps, pickMedia, usableLink } from "./types";

/* ---- founder and faculty -------------------------------------------------- */

function FacultyCard({ person, ctx }: { person: FacultyView; ctx: BlockContext }) {
  const photo = pickMedia(ctx, person.photoId);
  return (
    <li className="reveal flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-card bg-sky-deep">
        {photo && (
          <MediaImage
            media={photo}
            fill
            alt={`${person.name}${person.credential ? `, ${person.credential}` : ""}`}
            sizes="(min-width: 64rem) 22vw, (min-width: 40rem) 44vw, 100vw"
            className="!object-top"
          />
        )}
      </div>
      <h3 className="mt-5 text-h3">{person.name}</h3>
      <p className="mt-1 text-sm font-semibold text-primary">{[person.credential, person.roleTitle].filter(Boolean).join(" · ")}</p>
      {person.shortBio && <p className="mt-3 text-[0.9688rem]">{person.shortBio}</p>}
      {person.linkedinUrl && (
        <a
          href={person.linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-track="outbound_click"
          data-track-label={`LinkedIn: ${person.name}`}
          className="mt-auto inline-flex min-h-11 items-center gap-2 self-start pt-3 text-sm font-semibold text-navy underline-offset-4 hover:underline"
        >
          <LinkedinLogoIcon aria-hidden weight="fill" className="size-5 text-primary" />
          <span>
            {person.name.split(" ")[0]} on LinkedIn<span className="sr-only"> (opens in a new tab)</span>
          </span>
        </a>
      )}
    </li>
  );
}

export async function ProfilesBlock({ data, ctx }: BlockProps<"profiles">) {
  const everyone = await getFaculty();
  const founder = everyone.find((p) => p.isFounder) ?? null;
  const team = everyone.filter((p) => !p.isFounder);
  const cta = usableLink(data.cta, ctx.settings);
  const showFounder = data.source !== "faculty" && founder;
  const showTeam = data.source !== "founder" && team.length > 0;
  if (!showFounder && !showTeam) return null;
  const photo = founder ? pickMedia(ctx, founder.photoId) : null;
  const facts = data.facts.filter((f) => f.value && f.label);

  return (
    <Section background={data.background} anchor={data.anchor}>
      <div className="container-site">
        {showFounder && founder && (
          <div className="grid items-center gap-9 lg:grid-cols-12 lg:gap-14">
            <div className="reveal relative mx-auto w-full max-w-md lg:col-span-5 lg:max-w-none">
              <div aria-hidden className="absolute -right-3 top-8 size-24 rounded-full bg-accent md:size-32 lg:-right-6" />
              <div className="relative aspect-[5/6] overflow-hidden rounded-card rounded-tl-[var(--radius-wing)] bg-sky-deep">
                {photo && (
                  <MediaImage
                    media={photo}
                    fill
                    alt={`${founder.name}${founder.credential ? `, ${founder.credential}` : ""}, founder of Butterfly Coaching Academy`}
                    sizes="(min-width: 64rem) 38vw, (min-width: 40rem) 28rem, 100vw"
                    className="!object-top"
                  />
                )}
              </div>
            </div>
            <div className="reveal lg:col-span-7">
              <p className="eyebrow mb-3">{data.heading}</p>
              <h2 className="text-h2">{founder.name}</h2>
              <p className="mt-2 font-semibold text-primary">{[founder.credential, founder.roleTitle].filter(Boolean).join(" · ")}</p>
              {(data.intro || founder.shortBio) && <p className="mt-5 max-w-2xl text-lead">{data.intro || founder.shortBio}</p>}
              {facts.length > 0 && (
                <dl className="mt-8 grid max-w-2xl grid-cols-1 gap-5 min-[30rem]:grid-cols-3">
                  {facts.map((fact) => (
                    <div key={fact.label} className="flex flex-col-reverse border-l-2 border-accent pl-4">
                      <dt className="text-sm leading-snug text-muted">{fact.label}</dt>
                      <dd className="font-display text-[1.75rem] font-bold leading-tight tracking-tight text-navy">{fact.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {cta && (
                <div className="mt-9">
                  <ButtonLink href={cta.href} variant="secondary">
                    {cta.label}
                  </ButtonLink>
                </div>
              )}
            </div>
          </div>
        )}

        {showTeam && (
          <div className={cn(showFounder && "mt-16 border-t border-sky-line pt-14 md:mt-20 md:pt-16")}>
            {!showFounder && <SectionHeading heading={data.heading} intro={data.intro} />}
            {showFounder && <h3 className="text-h2">Faculty and mentor coaches</h3>}
            <ul className="mt-9 grid gap-x-6 gap-y-11 sm:grid-cols-2 lg:grid-cols-4">
              {team.map((person) => (
                <FacultyCard key={person.id} person={person} ctx={ctx} />
              ))}
            </ul>
            {!showFounder && cta && (
              <div className="mt-10">
                <ButtonLink href={cta.href} variant="secondary">
                  {cta.label}
                </ButtonLink>
              </div>
            )}
          </div>
        )}
      </div>
    </Section>
  );
}

/* ---- testimonials --------------------------------------------------------- */

function Attribution({ t, ctx, size = "md" }: { t: TestimonialView; ctx: BlockContext; size?: "md" | "lg" }) {
  const photo = pickMedia(ctx, t.photoId);
  const role = [t.roleTitle, t.organisation].filter(Boolean).join(", ");
  return (
    <figcaption className="mt-6 flex items-center gap-3.5">
      {photo ? (
        <span className={cn("relative shrink-0 overflow-hidden rounded-full bg-sky-deep", size === "lg" ? "size-16" : "size-12")}>
          <MediaImage media={photo} fill alt="" sizes="64px" className="!object-top" />
        </span>
      ) : (
        <span aria-hidden className={cn("grid shrink-0 place-items-center rounded-full bg-navy font-display font-bold text-white", size === "lg" ? "size-16 text-xl" : "size-12")}>
          {t.name.charAt(0)}
        </span>
      )}
      <span>
        <span className="block font-semibold text-navy">{t.name}</span>
        {role && <span className="block text-sm text-muted">{role}</span>}
      </span>
    </figcaption>
  );
}

/** Full, unedited stories in a flowing multi-column layout. */
export function TestimonialGrid({ items, ctx }: { items: TestimonialView[]; ctx: BlockContext }) {
  return (
    <div className="gap-6 [column-fill:_balance] md:columns-2 lg:columns-3">
      {items.map((t) => (
        <figure key={t.id} className="mb-6 break-inside-avoid rounded-card border border-sky-line bg-surface p-6 md:p-7">
          <QuotesIcon aria-hidden weight="fill" className="size-7 text-accent" />
          <blockquote className="mt-3 leading-relaxed text-ink">
            <p>“{t.quote}”</p>
          </blockquote>
          <Attribution t={t} ctx={ctx} />
        </figure>
      ))}
    </div>
  );
}

export async function TestimonialsBlock({ data, ctx }: BlockProps<"testimonials">) {
  const approved = await getTestimonials();
  const pool = data.source === "featured" ? approved.filter((t) => t.isFeatured) : approved;
  const items = pool.slice(0, data.limit ?? (data.source === "featured" ? 3 : 60));
  if (items.length === 0) return null;
  const cta = usableLink(data.cta, ctx.settings);

  // Featured: one lead story with supporting quotes beside it.
  if (data.source === "featured") {
    const [lead, ...rest] = items;
    if (!lead) return null;
    return (
      <Section background={data.background} anchor={data.anchor}>
        <div className="container-site">
          <SectionHeading heading={data.heading} intro={data.intro} />
          <div className="mt-9 grid gap-5 md:mt-12 md:gap-6 lg:grid-cols-12">
            <figure className={cn("reveal relative overflow-hidden rounded-card bg-navy p-7 text-white md:p-10 lg:p-12", rest.length ? "lg:col-span-7" : "lg:col-span-12")}>
              <QuotesIcon aria-hidden weight="fill" className="size-10 text-accent" />
              <blockquote className="mt-5 font-display text-[clamp(1.25rem,1.05rem+0.9vw,1.75rem)] font-medium leading-snug tracking-tight">
                <p>“{lead.excerpt || lead.quote}”</p>
              </blockquote>
              <div className="[&_.text-muted]:text-white/70 [&_.text-navy]:text-white">
                <Attribution t={lead} ctx={ctx} size="lg" />
              </div>
            </figure>
            {rest.length > 0 && (
              <div className="grid gap-5 md:grid-cols-2 md:gap-6 lg:col-span-5 lg:grid-cols-1">
                {rest.map((t) => (
                  <figure key={t.id} className="reveal rounded-card border border-sky-line bg-surface p-6 md:p-7">
                    <blockquote className="text-[1.0313rem] leading-relaxed text-navy">
                      <p>“{t.excerpt || t.quote}”</p>
                    </blockquote>
                    <Attribution t={t} ctx={ctx} />
                  </figure>
                ))}
              </div>
            )}
          </div>
          {cta && (
            <div className="mt-9">
              <ButtonLink href={cta.href} variant="secondary">
                {cta.label}
              </ButtonLink>
            </div>
          )}
        </div>
      </Section>
    );
  }

  // All: full, unedited stories in a flowing multi-column layout.
  return (
    <Section background={data.background} anchor={data.anchor}>
      <div className="container-site">
        <SectionHeading heading={data.heading} intro={data.intro} />
        <div className="mt-9 md:mt-12">
          <TestimonialGrid items={items} ctx={ctx} />
        </div>
        {cta && (
          <div className="mt-6">
            <ButtonLink href={cta.href} variant="secondary">
              {cta.label}
            </ButtonLink>
          </div>
        )}
      </div>
    </Section>
  );
}
