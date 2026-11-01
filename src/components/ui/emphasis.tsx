import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
 * Light markup for headings and short texts, from the November 2026 design.
 * Editors type it in the admin; visitors see the effect, and screen readers
 * read the words alone (the drawings are aria-hidden).
 *
 *   **words**   bold                     ==words==   yellow highlighter
 *   ++words++   lavender highlighter     __words__   hand-drawn underline
 *   ((words))   hand-drawn circle        [[words]]   yellow tag
 */
const TOKEN = /\*\*(.+?)\*\*|==(.+?)==|\+\+(.+?)\+\+|__(.+?)__|\(\((.+?)\)\)|\[\[(.+?)\]\]/g;

/** The words without the markup, for captions, labels and anywhere effects cannot show. */
export function plainText(text: string): string {
  return text.replace(new RegExp(TOKEN.source, "g"), (_match, a, b, c, d, e, f) => a ?? b ?? c ?? d ?? e ?? f ?? "");
}

export function hasEmphasis(text: string): boolean {
  return new RegExp(TOKEN.source).test(text);
}

type Tone = "light" | "dark";

/** A thick hand-drawn stroke under the words. Yellow on light; lavender on dark, as in the design. */
export function Scribble({ children, tone = "light", now, className }: { children: ReactNode; tone?: Tone; now?: boolean; className?: string }) {
  return (
    <span className={cn("fx-scribble", tone === "dark" && "fx-scribble-lav", now && "fx-now", className)}>
      {children}
      <svg aria-hidden viewBox="6 0 188 20" preserveAspectRatio="none" overflow="visible">
        <path d="M3 13 C 50 4, 130 3, 197 10" />
      </svg>
    </span>
  );
}

/** A hand-drawn loop around the words. */
export function Circled({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("fx-circle", className)}>
      {children}
      <svg aria-hidden viewBox="14 0 272 90" preserveAspectRatio="none" overflow="visible">
        <path d="M 46 14 C 120 0, 268 4, 292 34 C 308 64, 210 88, 132 84 C 52 80, 4 66, 10 42 C 16 20, 74 8, 176 9" />
      </svg>
    </span>
  );
}

/** A highlighter stroke behind the words. `strong` also sets them in bold, for body text. */
export function Mark({
  children,
  tone = "yellow",
  now,
  strong,
  className,
}: {
  children: ReactNode;
  tone?: "yellow" | "lav" | "dark";
  now?: boolean;
  strong?: boolean;
  className?: string;
}) {
  const classes = cn(
    "fx-mark",
    tone === "lav" && "fx-mark-lav",
    tone === "dark" && "fx-mark-dark",
    now && "fx-now",
    strong && (tone === "dark" ? "font-semibold text-white" : "font-semibold text-ink-deep"),
    className,
  );
  return strong ? <strong className={classes}>{children}</strong> : <span className={classes}>{children}</span>;
}

/**
 * Renders text with the markup above. With `auto`, text that has no markup
 * gets the design's signature: a hand-drawn underline beneath its last word.
 * `now` draws the effects shortly after the page opens instead of on scroll,
 * for text that is on screen from the start. `strong` sets highlighted words
 * in bold, as body text in the design does.
 */
export function Emphasis({
  text,
  tone = "light",
  auto = false,
  now = false,
  strong = false,
}: {
  text: string;
  tone?: Tone;
  auto?: boolean;
  now?: boolean;
  strong?: boolean;
}): ReactNode {
  if (!text) return null;
  const re = new RegExp(TOKEN.source, "g");
  const parts: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const [, bold, yellow, lavender, underline, circle, tag] = match;
    const key = match.index;
    if (bold !== undefined) {
      parts.push(
        <strong key={key} className={tone === "dark" ? "text-white" : "text-ink-deep"}>
          {bold}
        </strong>,
      );
    } else if (yellow !== undefined || lavender !== undefined) {
      const markTone = tone === "dark" ? "dark" : yellow !== undefined ? "yellow" : "lav";
      parts.push(
        <Mark key={key} tone={markTone} now={now} strong={strong}>
          {yellow ?? lavender}
        </Mark>,
      );
    } else if (underline !== undefined) {
      parts.push(
        <Scribble key={key} tone={tone} now={now}>
          {underline}
        </Scribble>,
      );
    } else if (circle !== undefined) {
      // Circled words take the accent of their background: yellow on dark, lavender on light.
      parts.push(
        <Circled key={key} className={tone === "dark" ? "text-accent" : "text-lav-deep"}>
          {circle}
        </Circled>,
      );
    } else if (tag !== undefined) {
      parts.push(
        <span key={key} className="fx-tag">
          {tag}
        </span>,
      );
    }
    last = match.index + match[0].length;
  }
  if (parts.length === 0) {
    if (!auto) return text;
    const trimmed = text.trimEnd();
    const space = trimmed.lastIndexOf(" ");
    return (
      <>
        {space >= 0 ? trimmed.slice(0, space + 1) : null}
        <Scribble tone={tone} now={now}>
          {trimmed.slice(space + 1)}
        </Scribble>
      </>
    );
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}
