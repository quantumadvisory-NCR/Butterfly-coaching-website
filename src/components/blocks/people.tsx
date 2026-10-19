import { LinkedinLogoIcon, QuotesIcon } from "@phosphor-icons/react/dist/ssr";
import { type Story, StoryShowcase } from "@/components/site/story-showcase";
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
      <div className="relative aspect-[4/5] overflow-hidden rounded-card bg-tint-deep">
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
              <div className="relative aspect-[5/6] overflow-hidden rounded-card rounded-tl-[var(--radius-wing)] bg-tint-deep">
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
          <div className={cn(showFounder && "mt-16 border-t border-line pt-14 md:mt-20 md:pt-16")}>
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

function Attribution({ t, ctx, tone = "light" }: { t: TestimonialView; ctx: BlockContext; tone?: "light" | "dark" }) {
  const photo = pickMedia(ctx, t.photoId);
  const role = [t.roleTitle, t.organisation].filter(Boolean).join(", ");
  const dark = tone === "dark";
  return (
    <figcaption className={cn("mt-6 flex items-center gap-3.5 border-t pt-5", dark ? "border-white/15" : "border-line")}>
      {photo ? (
        <span className="relative size-12 shrink-0 overflow-hidden rounded-full bg-tint-deep ring-2 ring-transparent ring-offset-2 ring-offset-transparent transition-[box-shadow] duration-300 group-hover:ring-accent">
          <MediaImage media={photo} fill alt="" sizes="48px" className="!object-top" />
        </span>
      ) : (
        <span aria-hidden className={cn("grid size-12 shrink-0 place-items-center rounded-full font-display font-bold", dark ? "bg-accent text-navy" : "bg-navy text-white")}>
          {t.name.charAt(0)}
        </span>
      )}
      <span className="min-w-0">
        <span className={cn("block font-semibold", dark ? "text-white" : "text-navy")}>{t.name}</span>
        {role && <span className={cn("block text-sm", dark ? "text-white/70" : "text-muted")}>{role}</span>}
      </span>
    </figcaption>
  );
}

/**
 * Full, unedited stories in a flowing multi-column layout. Every fifth card is
 * navy, so a long page keeps a rhythm; cards lift and take a yellow edge on hover.
 */
export function TestimonialGrid({ items, ctx }: { items: TestimonialView[]; ctx: BlockContext }) {
  return (
    <div className="gap-5 md:columns-2 md:gap-6 lg:columns-3">
      {items.map((t, i) => {
        const dark = i % 5 === 1;
        return (
          <figure key={t.id} className={cn("reveal lift-card group mb-5 break-inside-avoid p-6 md:mb-6 md:p-7", dark && "!border-navy !bg-navy")}>
            <span
              aria-hidden
              className={cn(
                "grid size-11 place-items-center rounded-full transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110",
                dark ? "bg-accent text-navy" : "bg-accent-soft text-navy",
              )}
            >
              <QuotesIcon weight="fill" className="size-5" />
            </span>
            <blockquote className={cn("mt-4 leading-relaxed", dark ? "text-white/90" : "text-ink")}>
              <p>“{t.quote}”</p>
            </blockquote>
            <Attribution t={t} ctx={ctx} tone={dark ? "dark" : "light"} />
          </figure>
        );
      })}
    </div>
  );
}

/** One story told large on navy at the top of the stories page. Photographs stay small: most are headshots. */
function StorySpotlight({ t, ctx }: { t: TestimonialView; ctx: BlockContext }) {
  const photo = pickMedia(ctx, t.photoId);
  const role = [t.roleTitle, t.organisation].filter(Boolean).join(", ");
  return (
    <figure className="reveal on-dark relative isolate grid gap-8 overflow-hidden rounded-[var(--radius-panel)] bg-navy px-6 py-9 text-white shadow-lift sm:px-10 md:py-12 lg:grid-cols-[minmax(0,0.34fr)_minmax(0,0.66fr)] lg:gap-14 lg:px-14 lg:py-14">
      <figcaption className="flex items-center gap-4 lg:flex-col lg:items-start lg:gap-5">
        {photo ? (
          <span className="relative size-20 shrink-0 overflow-hidden rounded-full bg-tint-deep ring-4 ring-accent lg:size-28">
            <MediaImage media={photo} fill alt="" sizes="112px" className="!object-top" />
          </span>
        ) : (
          <span aria-hidden className="grid size-20 shrink-0 place-items-center rounded-full bg-accent font-display text-3xl font-bold text-navy lg:size-28">
            {t.name.charAt(0)}
          </span>
        )}
        <span className="min-w-0">
          <span className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-accent">
            <span aria-hidden className="size-1.5 rounded-full bg-accent" />
            Featured story
          </span>
          <span className="block font-display text-xl font-bold leading-tight lg:text-2xl">{t.name}</span>
          {role && <span className="mt-1 block text-[0.9375rem] text-white/70">{role}</span>}
        </span>
      </figcaption>
      <div className="relative">
        <QuotesIcon aria-hidden weight="fill" className="size-12 text-accent md:size-14" />
        <blockquote className={cn("mt-4 font-medium leading-relaxed text-white/90", t.quote.length > 420 ? "text-lg" : "text-lg md:text-xl lg:text-[1.375rem] lg:leading-relaxed")}>
          <p>“{t.quote}”</p>
        </blockquote>
      </div>
      {/* Soft light behind the panel. Kept last, so the caption stays the figure's first child. */}
      <div aria-hidden className="pointer-events-none absolute -left-28 -top-28 -z-10 size-80 rounded-full bg-accent/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 right-10 -z-10 size-72 rounded-full bg-primary/40 blur-3xl" />
    </figure>
  );
}

export async function TestimonialsBlock({ data, ctx }: BlockProps<"testimonials">) {
  const approved = await getTestimonials();
  const pool = data.source === "featured" ? approved.filter((t) => t.isFeatured) : approved;
  const items = pool.slice(0, data.limit ?? (data.source === "featured" ? 3 : 60));
  if (items.length === 0) return null;
  const cta = usableLink(data.cta, ctx.settings);

  // Featured: an editorial showcase, one story told large with the others to choose from.
  if (data.source === "featured") {
    const stories: Story[] = items.map((t) => ({
      id: t.id,
      name: t.name,
      role: [t.roleTitle, t.organisation].filter(Boolean).join(", "),
      excerpt: t.excerpt,
      quote: t.quote,
      photo: pickMedia(ctx, t.photoId),
    }));
    return (
      <Section background={data.background} anchor={data.anchor}>
        <div className="container-site">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="eyebrow mb-3 flex items-center gap-2">
                <span aria-hidden className="h-0.5 w-6 rounded-full bg-accent" />
                In their own words
              </p>
              <h2 className="text-h2">{data.heading}</h2>
              {data.intro && <p className="mt-4 max-w-xl text-lead text-ink">{data.intro}</p>}
            </div>
            {cta && (
              <ButtonLink href={cta.href} variant="secondary" className="self-start md:shrink-0 md:self-auto">
                {cta.label}
              </ButtonLink>
            )}
          </div>
          <div className="reveal mt-9 md:mt-11">
            <StoryShowcase stories={stories} label="Choose a student story" />
          </div>
        </div>
      </Section>
    );
  }

  // All: one featured story told large, then the rest, full and unedited, in a flowing multi-column layout.
  const spotlight = items.length >= 4 ? (items.find((t) => t.isFeatured && t.photoId) ?? items.find((t) => t.photoId) ?? null) : null;
  const rest = spotlight ? items.filter((t) => t !== spotlight) : items;
  // Straight under a page title the heading needs no second band of space above it.
  const underPageHero = ctx.prev?.type === "hero" && ctx.prev.variant === "page";
  return (
    <Section background={data.background} anchor={data.anchor} className={cn(underPageHero && "!pt-2 md:!pt-4")}>
      <div className="container-site">
        {spotlight && <StorySpotlight t={spotlight} ctx={ctx} />}
        <div className={cn(spotlight && "mt-16 md:mt-20")}>
          <span aria-hidden className="mb-5 block h-1 w-12 rounded-full bg-accent" />
          <SectionHeading heading={data.heading} intro={data.intro} />
        </div>
        <div className="mt-9 md:mt-12">
          <TestimonialGrid items={rest} ctx={ctx} />
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
