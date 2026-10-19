import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { ButtonLink, TextLink } from "@/components/ui/button-link";
import { MediaImage } from "@/components/ui/media-image";
import { SwipeRail } from "@/components/ui/swipe-rail";
import { Section, SectionHeading } from "@/components/ui/section";
import { type ProgrammeView, getProgrammes } from "@/lib/content/public";
import { cn, formatHours } from "@/lib/utils";
import { type BlockContext, type BlockProps, pickMedia, usableLink } from "./types";

/** Verified facts only: anything left empty in the admin is simply not shown. */
export function programmeFacts(p: ProgrammeView) {
  const facts: { label: string; value: string }[] = [];
  const education = formatHours(p.educationHours);
  const mentoring = formatHours(p.mentoringHours);
  if (education) facts.push({ label: "Coach education", value: `${education} hours` });
  if (mentoring) facts.push({ label: "Mentor coaching", value: `${mentoring} hours` });
  if (p.experienceHours) facts.push({ label: "Coaching experience", value: `${p.experienceHours.toLocaleString("en-IN")} hours` });
  if (p.duration) facts.push({ label: "Duration", value: p.duration });
  if (p.format) facts.push({ label: "Format", value: p.format });
  if (p.languages) facts.push({ label: "Language", value: p.languages });
  return facts;
}

function CertificationCard({ p, ctx, className }: { p: ProgrammeView; ctx: BlockContext; className?: string }) {
  const badge = p.accreditationStatus === "accredited" ? pickMedia(ctx, p.badgeId) : null;
  const facts = programmeFacts(p).slice(0, 3);
  return (
    <li className={cn("press reveal group relative isolate flex flex-col rounded-card border border-line bg-surface p-6 hover:shadow-lift md:p-7 lg:p-8", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          {p.levelLabel && <p className="text-sm font-semibold text-primary">{p.levelLabel}</p>}
          {p.credential && <p className="mt-1 font-display text-5xl font-bold leading-none tracking-tight text-navy">{p.credential}</p>}
        </div>
        {badge && (
          <div className="relative size-16 shrink-0 md:size-[4.5rem]">
            <MediaImage media={badge} fill sizes="72px" className="!object-contain" />
          </div>
        )}
      </div>
      <h3 className="mt-5 text-h3">
        <Link
          href={p.path}
          data-track="cta_click"
          data-track-label={`Programme: ${p.name}`}
          className="outline-none after:absolute after:inset-0 after:z-10 after:rounded-card focus-visible:after:outline-3 focus-visible:after:-outline-offset-3 focus-visible:after:outline-navy"
        >
          {p.name}
        </Link>
      </h3>
      {p.summary && <p className="mt-2.5">{p.summary}</p>}
      {facts.length > 0 && (
        <dl className="mt-6 grid gap-2.5 border-t border-line pt-5 text-[0.9375rem]">
          {facts.map((fact) => (
            <div key={fact.label} className="flex items-baseline justify-between gap-4">
              <dt className="text-muted">{fact.label}</dt>
              <dd className="text-right font-semibold text-navy">{fact.value}</dd>
            </div>
          ))}
        </dl>
      )}
      <span aria-hidden className="mt-auto inline-flex items-center gap-1.5 pt-6 font-semibold text-primary group-hover:text-navy">
        View the {p.credential ?? "programme"} pathway
        <ArrowRightIcon weight="bold" className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
      </span>
    </li>
  );
}

/** `stacked` puts the image on top at every width; used when three cards share a row. */
function ServiceCard({ p, ctx, stacked }: { p: ProgrammeView; ctx: BlockContext; stacked: boolean }) {
  const image = pickMedia(ctx, p.cardImageId ?? p.heroImageId);
  return (
    <li
      className={cn(
        "press reveal group relative isolate grid overflow-hidden rounded-card border border-line bg-surface hover:shadow-lift sm:grid-cols-[minmax(0,0.42fr)_minmax(0,1fr)] md:grid-cols-1",
        !stacked && "xl:grid-cols-[minmax(0,0.42fr)_minmax(0,1fr)]",
      )}
    >
      {image && (
        <div className={cn("relative aspect-[16/10] overflow-hidden sm:aspect-auto sm:min-h-44 md:aspect-[16/9]", !stacked && "xl:aspect-auto")}>
          <MediaImage
            media={image}
            fill
            alt=""
            sizes="(min-width: 80rem) 20vw, (min-width: 48rem) 45vw, (min-width: 40rem) 40vw, 100vw"
            className="transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        </div>
      )}
      <div className="flex flex-col p-6 md:p-7">
        <h3 className="text-h3">
          <Link
            href={p.path}
            data-track="cta_click"
            data-track-label={`Programme: ${p.name}`}
            className="outline-none after:absolute after:inset-0 after:z-10 after:rounded-card focus-visible:after:outline-3 focus-visible:after:-outline-offset-3 focus-visible:after:outline-navy"
          >
            {p.name}
          </Link>
        </h3>
        {p.summary && <p className="mt-2.5">{p.summary}</p>}
        <span aria-hidden className="mt-auto inline-flex items-center gap-1.5 pt-5 font-semibold text-primary group-hover:text-navy">
          Learn more
          <ArrowRightIcon weight="bold" className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
        </span>
      </div>
    </li>
  );
}

export async function ProgrammeCardsBlock({ data, ctx }: BlockProps<"programme_cards">) {
  const all = await getProgrammes();
  const chosen =
    data.source === "certification"
      ? all.filter((p) => p.kind === "certification")
      : data.source === "featured"
        ? all.filter((p) => p.isFeatured)
        : all;
  if (chosen.length === 0) return null;
  const certifications = chosen.filter((p) => p.kind === "certification");
  const services = chosen.filter((p) => p.kind !== "certification");
  const cta = usableLink(data.cta, ctx.settings);
  // Three service cards share one row; two (or four) sit side by side. Never an empty cell.
  const threeUp = services.length % 3 === 0;

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
        {certifications.length >= 3 ? (
          // Three or more pathways swipe sideways on phones and tablets, edge to edge of the screen; a grid from desktop up.
          <div className="reveal mt-7 md:mt-10">
            <SwipeRail
              label="Programme"
              listClassName="gap-4 py-2 max-lg:-mx-[var(--gutter)] max-lg:scroll-px-[var(--gutter)] max-lg:px-[var(--gutter)] md:gap-5 lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible"
            >
              {certifications.map((p) => (
                <CertificationCard key={p.id} p={p} ctx={ctx} className="max-lg:w-[85%] max-lg:shrink-0 max-lg:snap-start sm:max-lg:w-[58%]" />
              ))}
            </SwipeRail>
          </div>
        ) : (
          certifications.length > 0 && (
            <ul className="mt-9 grid gap-5 md:mt-12 md:grid-cols-2 md:gap-6">
              {certifications.map((p) => (
                <CertificationCard key={p.id} p={p} ctx={ctx} />
              ))}
            </ul>
          )
        )}
        {services.length > 0 && (
          <ul className={cn("grid gap-5 md:gap-6", threeUp ? "md:grid-cols-3" : "md:grid-cols-2", certifications.length > 0 ? "mt-5 md:mt-6" : "mt-9 md:mt-12")}>
            {services.map((p) => (
              <ServiceCard key={p.id} p={p} ctx={ctx} stacked={threeUp} />
            ))}
          </ul>
        )}
      </div>
    </Section>
  );
}

type Table = { columns: string[]; rows: { label: string; values: string[] }[]; links?: (string | null)[] };

function programmeTable(programmes: ProgrammeView[]): Table {
  const hours = (v: string | number | null) => {
    const formatted = formatHours(v);
    return formatted ? `${formatted} hours` : "Ask us";
  };
  const rows = [
    { label: "Best for", values: programmes.map((p) => p.tagline || "") },
    { label: "Coach education", values: programmes.map((p) => hours(p.educationHours)) },
    { label: "Mentor coaching", values: programmes.map((p) => (p.mentoringHours ? hours(p.mentoringHours) : "Included")) },
    {
      label: "Coaching experience for the credential",
      values: programmes.map((p) => (p.experienceHours ? `${p.experienceHours.toLocaleString("en-IN")} hours` : "Ask us")),
    },
    { label: "Entry point", values: programmes.map((p) => p.eligibility[0] ?? "Open to committed learners") },
    { label: "Language", values: programmes.map((p) => p.languages ?? "") },
  ].filter((row) => row.values.some(Boolean));
  return {
    columns: programmes.map((p) => [p.levelLabel, p.credential].filter(Boolean).join(": ") || p.name),
    rows,
    links: programmes.map((p) => p.path),
  };
}

/**
 * Comparison table. A real <table> from tablet upwards; on phones each column
 * becomes its own card so nothing needs sideways scrolling.
 */
export async function ComparisonTableBlock({ data, ctx }: BlockProps<"comparison_table">) {
  let table: Table;
  if (data.source === "programmes") {
    const programmes = (await getProgrammes()).filter((p) => p.kind === "certification");
    if (programmes.length === 0) return null;
    table = programmeTable(programmes);
  } else {
    table = {
      columns: data.columns,
      rows: data.rows.map((row) => ({ label: row.label, values: row.values })),
    };
    if (table.columns.length === 0 || table.rows.length === 0) return null;
  }
  void ctx;

  return (
    <Section background={data.background} anchor={data.anchor}>
      <div className="container-site">
        <SectionHeading heading={data.heading} intro={data.intro} />

        {/* Tablet and desktop */}
        <div className="reveal mt-9 hidden overflow-hidden rounded-card border border-line bg-surface md:mt-12 md:block">
          <table className="w-full border-collapse text-left text-[0.9375rem]">
            <caption className="sr-only">{data.heading}</caption>
            <thead>
              <tr className="bg-navy text-white">
                <td className="w-[22%] p-5" />
                {table.columns.map((column) => (
                  <th key={column} scope="col" className="p-5 font-display text-lg font-semibold">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, r) => (
                <tr key={row.label} className={cn(r > 0 && "border-t border-line")}>
                  <th scope="row" className="bg-tint p-5 align-top font-semibold text-navy">
                    {row.label}
                  </th>
                  {table.columns.map((column, c) => (
                    <td key={column} className="p-5 align-top">
                      {row.values[c] ?? ""}
                    </td>
                  ))}
                </tr>
              ))}
              {table.links && (
                <tr className="border-t border-line">
                  <td className="bg-tint p-5" />
                  {table.columns.map((column, c) => (
                    <td key={column} className="px-5 py-3">
                      {table.links?.[c] && <TextLink href={table.links[c]}>View pathway</TextLink>}
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Phones: one card per column */}
        <ul className="mt-9 grid gap-4 md:hidden">
          {table.columns.map((column, c) => (
            <li key={column} className="overflow-hidden rounded-card border border-line bg-surface">
              <h3 className="bg-navy px-5 py-4 font-display text-lg font-semibold text-white">{column}</h3>
              <dl className="grid gap-4 p-5">
                {table.rows.map((row) =>
                  row.values[c] ? (
                    <div key={row.label}>
                      <dt className="text-sm text-muted">{row.label}</dt>
                      <dd className="mt-0.5 font-semibold text-navy">{row.values[c]}</dd>
                    </div>
                  ) : null,
                )}
              </dl>
              {table.links?.[c] && (
                <div className="border-t border-line px-5 py-2">
                  <TextLink href={table.links[c]}>View pathway</TextLink>
                </div>
              )}
            </li>
          ))}
        </ul>

        {data.footnote && <p className="mt-5 max-w-3xl text-sm text-muted">{data.footnote}</p>}
      </div>
    </Section>
  );
}
