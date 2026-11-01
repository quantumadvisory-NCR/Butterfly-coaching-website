import type { ReactNode } from "react";
import { Emphasis } from "@/components/ui/emphasis";
import { cn, slugify } from "@/lib/utils";

type Props = {
  children: ReactNode;
  background?: string;
  anchor?: string;
  className?: string;
  /** Skip the default vertical padding (for sections that manage their own). */
  flush?: boolean;
  labelledBy?: string;
};

/**
 * Every standard section sits on the page background (#FCFCFC, the grey-white
 * of the logo artwork), so the page reads as one surface. "cream", "white" and
 * "sky" are stored values from earlier themes; all resolve to the page colour.
 * "surface" is the white card colour, for the rare section that should step forward.
 * "lavender" is the soft band of the November 2026 homepage design; its first
 * section in a run gets rounded top corners (see .section-lav in globals.css).
 */
const BACKGROUNDS: Record<string, string> = {
  cream: "bg-page",
  white: "bg-page",
  sky: "bg-page",
  surface: "bg-surface",
  lavender: "section-lav bg-lav-50",
  navy: "bg-navy text-white on-dark",
};

/** The classes for a stored background value, for blocks that render their own <section>. */
export function sectionBackground(background: string | undefined) {
  return BACKGROUNDS[background ?? "cream"] ?? BACKGROUNDS.cream;
}

/** Page section wrapper: background, optional anchor id and consistent spacing. */
export function Section({ children, background = "cream", anchor, className, flush, labelledBy }: Props) {
  const id = anchor ? slugify(anchor) : undefined;
  return (
    <section id={id || undefined} aria-labelledby={labelledBy} className={cn(sectionBackground(background), !flush && "section-space", className)}>
      {children}
    </section>
  );
}

/**
 * Section heading with optional eyebrow and introduction, stacked vertically.
 * The heading takes the design's effects: editors' markup, or by default a
 * hand-drawn underline beneath the last word that draws in as it scrolls into view.
 */
export function SectionHeading({
  id,
  eyebrow,
  heading,
  intro,
  align = "left",
  as: Tag = "h2",
  className,
  tone = "light",
}: {
  id?: string;
  eyebrow?: string;
  heading: string;
  intro?: string;
  align?: "left" | "center";
  as?: "h1" | "h2";
  className?: string;
  tone?: "light" | "dark";
}) {
  if (!heading) return null;
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <Tag id={id} className={Tag === "h1" ? "text-h1" : "text-h2"}>
        <Emphasis text={heading} tone={tone} auto />
      </Tag>
      {intro && (
        <p className={cn("mt-4 text-lead text-ink", align === "center" && "mx-auto", "max-w-2xl")}>
          <Emphasis text={intro} tone={tone} />
        </p>
      )}
    </div>
  );
}

export function RichText({ html, className }: { html: string; className?: string }) {
  if (!html) return null;
  // Content is sanitised with sanitiseRichText() before it is stored.
  return <div className={cn("prose", className)} dangerouslySetInnerHTML={{ __html: html }} />;
}
