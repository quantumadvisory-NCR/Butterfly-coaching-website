import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { ReactNode } from "react";
import { todayInIndia } from "@/lib/announcement";
import { ButtonLink, TextLink } from "@/components/ui/button-link";
import { Arrow, LiveDot } from "@/components/ui/effects";
import { Emphasis, plainText } from "@/components/ui/emphasis";
import { MediaImage } from "@/components/ui/media-image";
import { Section, SectionHeading } from "@/components/ui/section";
import { type ProgrammeView, getProgrammes } from "@/lib/content/public";
import { cn, formatDate, formatHours } from "@/lib/utils";
import { DESIGN_H2 } from "./content";
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

/** `reveal: false` when the whole row fades in together. */
function CertificationCard({ p, ctx, reveal = true }: { p: ProgrammeView; ctx: BlockContext; reveal?: boolean }) {
  const badge = p.accreditationStatus === "accredited" ? pickMedia(ctx, p.badgeId) : null;
  const facts = programmeFacts(p).slice(0, 3);
  return (
    <li className={cn("press fx-card group relative isolate flex flex-col rounded-card border border-line bg-surface p-6 max-md:p-5 md:p-7 lg:p-8", reveal && "reveal")}>
      <div className="flex items-start justify-between gap-4">
        <div>
          {p.levelLabel && <p className="text-sm font-semibold text-primary">{p.levelLabel}</p>}
          {p.credential && <p className="mt-1 font-display text-5xl font-bold leading-none tracking-tight text-navy max-md:text-4xl">{p.credential}</p>}
        </div>
        {badge && (
          <div className="relative size-16 shrink-0 max-md:size-14 md:size-[4.5rem]">
            <MediaImage media={badge} fill sizes="72px" className="!object-contain" />
          </div>
        )}
      </div>
      <h3 className="mt-5 text-h3 max-md:mt-4">
        <Link
          href={p.path}
          data-track="cta_click"
          data-track-label={`Programme: ${p.name}`}
          className="outline-none after:absolute after:inset-0 after:z-10 after:rounded-card focus-visible:after:outline-3 focus-visible:after:-outline-offset-3 focus-visible:after:outline-navy"
        >
          {p.name}
        </Link>
      </h3>
      {p.summary && <p className="mt-2.5 max-md:text-[0.9688rem]">{p.summary}</p>}
      {facts.length > 0 && (
        <dl
          className={cn(
            "mt-6 grid gap-2.5 border-t border-line pt-5 text-[0.9375rem] max-md:mt-5 max-md:gap-x-3 max-md:pt-4",
            facts.length === 3 ? "max-md:grid-cols-3" : facts.length === 2 ? "max-md:grid-cols-2" : "",
          )}
        >
          {facts.map((fact) => (
            <div key={fact.label} className="flex items-baseline justify-between gap-4 max-md:flex-col-reverse max-md:items-start max-md:justify-end max-md:gap-0.5">
              <dt className="text-muted max-md:text-[0.8125rem] max-md:leading-snug">{fact.label}</dt>
              <dd className="text-right font-semibold text-navy max-md:text-left max-md:leading-snug">{fact.value}</dd>
            </div>
          ))}
        </dl>
      )}
      <span aria-hidden className="mt-auto inline-flex items-center gap-1.5 pt-6 font-semibold text-primary group-hover:text-navy max-md:pt-5">
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
        "press fx-card reveal group relative isolate grid overflow-hidden rounded-card border border-line bg-surface max-sm:grid-cols-[minmax(0,0.36fr)_minmax(0,1fr)] sm:grid-cols-[minmax(0,0.42fr)_minmax(0,1fr)] md:grid-cols-1",
        !stacked && "xl:grid-cols-[minmax(0,0.42fr)_minmax(0,1fr)]",
      )}
    >
      {image && (
        <div className={cn("relative aspect-[16/10] overflow-hidden max-sm:aspect-auto max-sm:min-h-36 sm:aspect-auto sm:min-h-44 md:aspect-[16/9]", !stacked && "xl:aspect-auto")}>
          <MediaImage
            media={image}
            fill
            alt=""
            sizes="(min-width: 80rem) 20vw, (min-width: 48rem) 45vw, (min-width: 40rem) 40vw, 100vw"
            className="transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        </div>
      )}
      <div className="flex flex-col p-6 max-sm:p-4 md:p-7">
        <h3 className="text-h3 max-sm:text-[1.125rem]">
          <Link
            href={p.path}
            data-track="cta_click"
            data-track-label={`Programme: ${p.name}`}
            className="outline-none after:absolute after:inset-0 after:z-10 after:rounded-card focus-visible:after:outline-3 focus-visible:after:-outline-offset-3 focus-visible:after:outline-navy"
          >
            {p.name}
          </Link>
        </h3>
        {p.summary && <p className="mt-2.5 max-sm:mt-1.5 max-sm:text-[0.9375rem] max-sm:leading-snug">{p.summary}</p>}
        <span aria-hidden className="mt-auto inline-flex items-center gap-1.5 pt-5 font-semibold text-primary group-hover:text-navy max-sm:pt-3">
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
          // Phones and tablets: one pathway per row, every fact in view. Desktop: three across, fading in together.
          <ul className="reveal mt-7 grid gap-4 md:mt-10 md:gap-5 lg:grid-cols-3 lg:gap-6 lg:py-2">
            {certifications.map((p) => (
              <CertificationCard key={p.id} p={p} ctx={ctx} reveal={false} />
            ))}
          </ul>
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

type FeeRow = { label: string; cells: ReactNode[]; top?: boolean };

/** Hours as the design shows them: the number large, "hrs" after it. */
function Hours({ value }: { value: string | number | null }) {
  const formatted = formatHours(value);
  if (!formatted) return <span className="text-mauve">Ask us</span>;
  return (
    <>
      <strong className="font-grotesk text-[1.375rem] font-bold text-ink-deep">{formatted}</strong> hrs
    </>
  );
}

/**
 * The rows of the fees table, in the design's order. A row appears only when at least one programme has
 * that fact in the admin. `format` is the block's own "Format" text, for programmes that have none.
 */
function feeRows(programmes: ProgrammeView[], format: string): FeeRow[] {
  const today = todayInIndia();
  const cohorts = programmes.map((p) => p.cohorts.find((c) => c.isOpen && c.startDate >= today) ?? null);
  const rows: FeeRow[] = [];
  if (programmes.some((p) => formatHours(p.educationHours))) {
    rows.push({ label: "Coach education", cells: programmes.map((p) => <Hours key={p.id} value={p.educationHours} />) });
  }
  if (programmes.some((p) => formatHours(p.mentoringHours))) {
    rows.push({ label: "Mentor coaching", cells: programmes.map((p) => <Hours key={p.id} value={p.mentoringHours} />) });
  }
  if (cohorts.some(Boolean)) {
    rows.push({
      label: "Next start",
      cells: cohorts.map((c, i) => (c ? <span key={i} className="font-semibold">{formatDate(c.startDate)}</span> : <span key={i} className="text-mauve">To be announced</span>)),
    });
  }
  const formats = programmes.map((p) => p.format || format.trim() || null);
  if (formats.some(Boolean)) {
    // The design's "Format" row, with a pulsing live dot. It covers the language, so no separate row.
    rows.push({
      label: "Format",
      cells: formats.map((f, i) =>
        f ? (
          <span key={i} className="inline-flex items-center gap-2 font-medium">
            <LiveDot className="size-[7px]" />
            {f}
          </span>
        ) : (
          <span key={i} className="text-mauve">
            Ask us
          </span>
        ),
      ),
    });
  } else if (programmes.some((p) => p.languages)) {
    rows.push({ label: "Language", cells: programmes.map((p) => <span key={p.id}>{p.languages ?? ""}</span>) });
  }
  if (cohorts.some((c) => c?.schedule)) {
    rows.push({ label: "Session times", top: true, cells: cohorts.map((c, i) => <span key={i}>{c?.schedule || <span className="text-mauve">To be announced</span>}</span>) });
  }
  // Always shown, so a table headed "fees" never leaves the question open.
  rows.push({
    label: "Fee",
    top: true,
    cells: programmes.map((p) =>
      p.feeText ? (
        <span key={p.id} className="flex flex-col gap-1">
          <span className="font-semibold text-ink-deep">{p.feeText}</span>
          {p.feeNote && <span className="text-[0.8125rem] text-mauve">{p.feeNote}</span>}
        </span>
      ) : (
        <span key={p.id} className="text-mauve">
          Ask us for the current fee
        </span>
      ),
    ),
  });
  return rows;
}

/**
 * "Programmes and fees" from the November 2026 design: one white panel with a
 * column per ICF level, its badge at the top and a yellow button at the foot.
 * Rows come from Programmes in the admin. Phones get one card per level, so
 * nothing scrolls sideways.
 */
async function FeesTable({ data, ctx }: BlockProps<"comparison_table">) {
  const programmes = (await getProgrammes()).filter((p) => p.kind === "certification");
  if (programmes.length === 0) return null;
  const rows = feeRows(programmes, data.format);
  const headingId = `fees-${data.anchor || "programmes"}`;
  const button = data.buttonLabel.trim();
  const badge = (p: ProgrammeView) => (p.accreditationStatus === "accredited" ? pickMedia(ctx, p.badgeId) : null);
  const reserve = (p: ProgrammeView) =>
    button ? (
      <ButtonLink href={`${p.path}#enquire`} trackLabel={`Fees: ${button} ${p.credential ?? p.name}`} aria-label={`${button}: ${p.name}`} className="font-text text-[0.9375rem]">
        {button}
        <Arrow />
      </ButtonLink>
    ) : null;

  // Straight after the picture cards on the same band, the table continues that section with little space above.
  const continues = ctx.prev?.type === "feature_list" && ctx.prev.layout === "bento";
  return (
    <Section
      background={data.background}
      anchor={data.anchor}
      labelledBy={headingId}
      flush
      className={cn("pb-[clamp(4.5rem,9vw,8rem)] font-text", continues ? "pt-[clamp(0.5rem,2vw,1.5rem)]" : "pt-[clamp(4.5rem,9vw,8rem)]")}
    >
      <div className="container-site flex flex-col gap-8">
        <div className="reveal flex flex-col gap-3">
          <h2 id={headingId} className={DESIGN_H2}>
            <Emphasis text={data.heading} auto />
          </h2>
          {data.intro && (
            <p className="m-0 text-[1.0625rem] text-mauve">
              <Emphasis text={data.intro} strong />
            </p>
          )}
        </div>

        {/* Tablet and desktop */}
        <div className="reveal hidden overflow-hidden rounded-[1.75rem] border border-lav-100 bg-white shadow-[0_30px_60px_-48px_rgb(70_45_160/0.7)] md:block">
          <table className="fx-table w-full border-collapse text-left text-[0.9375rem] text-ink-deep">
            <caption className="sr-only">{plainText(data.heading)}</caption>
            <thead>
              <tr>
                <td className="w-1/5 px-6 pb-[1.125rem] pt-6" />
                {programmes.map((p) => {
                  const media = badge(p);
                  return (
                    <th key={p.id} scope="col" className="px-5 pb-[1.125rem] pt-6 align-bottom font-normal">
                      <span className="flex items-center gap-3">
                        {media && <MediaImage media={media} alt="" sizes="56px" className="!size-14 shrink-0 object-contain" />}
                        <span className="flex flex-col gap-0.5">
                          {p.levelLabel && <span className="text-xs font-bold uppercase tracking-[0.1em] text-lav-deep">{p.levelLabel}</span>}
                          <span className="font-grotesk text-[1.625rem] font-extrabold leading-none">{p.credential ?? p.name}</span>
                        </span>
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <th scope="row" className={cn("border-t border-[#eeeaf3] px-6 py-4 font-medium text-mauve", row.top && "align-top")}>
                    {row.label}
                  </th>
                  {row.cells.map((cell, c) => (
                    <td key={programmes[c]!.id} className={cn("border-t border-[#eeeaf3] px-5 py-4", row.top && "align-top")}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
              {(button || data.note) && (
                <tr>
                  <td className="border-t border-[#eeeaf3] px-6 pb-[1.625rem] pt-[1.125rem]">
                    {data.note && <span className="fx-note inline-block -rotate-[4deg] text-[1.375rem]">{data.note}</span>}
                  </td>
                  {programmes.map((p) => (
                    <td key={p.id} className="border-t border-[#eeeaf3] px-5 pb-[1.625rem] pt-[1.125rem]">
                      {reserve(p)}
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Phones: one card per level */}
        <ul className="grid gap-4 md:hidden">
          {programmes.map((p, c) => {
            const media = badge(p);
            return (
              <li key={p.id} className="reveal overflow-hidden rounded-[1.75rem] border border-lav-100 bg-white">
                <h3 className="m-0 flex items-center gap-3 border-b border-[#eeeaf3] px-5 py-4">
                  {media && <MediaImage media={media} alt="" sizes="48px" className="!size-12 shrink-0 object-contain" />}
                  <span className="flex flex-col gap-0.5 font-text">
                    {p.levelLabel && <span className="text-xs font-bold uppercase tracking-[0.1em] text-lav-deep">{p.levelLabel}</span>}
                    <span className="font-grotesk text-2xl font-extrabold leading-none text-ink-deep">{p.credential ?? p.name}</span>
                  </span>
                </h3>
                <dl className="grid gap-3.5 px-5 py-4">
                  {rows.map((row) => (
                    <div key={row.label} className="flex items-baseline justify-between gap-4">
                      <dt className="text-sm text-mauve">{row.label}</dt>
                      <dd className="text-right">{row.cells[c]}</dd>
                    </div>
                  ))}
                </dl>
                {button && <div className="border-t border-[#eeeaf3] px-5 py-4">{reserve(p)}</div>}
              </li>
            );
          })}
        </ul>
        {data.note && <p className="fx-note -mt-2 -rotate-2 text-[1.375rem] md:hidden">{data.note}</p>}
        {data.footnote && <p className="m-0 max-w-3xl text-sm text-mauve">{data.footnote}</p>}
      </div>
    </Section>
  );
}

/**
 * Comparison table. A real <table> from tablet upwards; on phones each column
 * becomes its own card so nothing needs sideways scrolling.
 */
export async function ComparisonTableBlock(props: BlockProps<"comparison_table">) {
  if (props.data.source === "fees") return <FeesTable {...props} />;
  const { data, ctx } = props;
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
          <table className="fx-table w-full border-collapse text-left text-[0.9375rem]">
            <caption className="sr-only">{plainText(data.heading)}</caption>
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
