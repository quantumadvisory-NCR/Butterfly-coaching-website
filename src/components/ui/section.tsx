import type { ReactNode } from "react";
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

const BACKGROUNDS: Record<string, string> = {
  white: "bg-surface",
  sky: "bg-sky",
  navy: "bg-navy text-white on-dark",
};

/** Page section wrapper: background, optional anchor id and consistent spacing. */
export function Section({ children, background = "white", anchor, className, flush, labelledBy }: Props) {
  const id = anchor ? slugify(anchor) : undefined;
  return (
    <section
      id={id || undefined}
      aria-labelledby={labelledBy}
      className={cn(BACKGROUNDS[background] ?? BACKGROUNDS.white, !flush && "section-space", className)}
    >
      {children}
    </section>
  );
}

/** Section heading with optional eyebrow and introduction, stacked vertically. */
export function SectionHeading({
  id,
  eyebrow,
  heading,
  intro,
  align = "left",
  as: Tag = "h2",
  className,
}: {
  id?: string;
  eyebrow?: string;
  heading: string;
  intro?: string;
  align?: "left" | "center";
  as?: "h1" | "h2";
  className?: string;
}) {
  if (!heading) return null;
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <Tag id={id} className={Tag === "h1" ? "text-h1" : "text-h2"}>
        {heading}
      </Tag>
      {intro && <p className={cn("mt-4 text-lead text-ink", align === "center" && "mx-auto", "max-w-2xl")}>{intro}</p>}
    </div>
  );
}

export function RichText({ html, className }: { html: string; className?: string }) {
  if (!html) return null;
  // Content is sanitised with sanitiseRichText() before it is stored.
  return <div className={cn("prose", className)} dangerouslySetInnerHTML={{ __html: html }} />;
}
