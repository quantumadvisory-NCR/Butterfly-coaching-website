import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
 * Light markup editors type in the admin:
 *
 *   **words**   bold                     ==words==   yellow highlighter (body text)
 *   ++words++   bold                     __words__   bold
 *   ((words))   bold                     [[words]]   bold
 *
 * Since the owner's brief of 25 November 2026 ("one colour per heading", a gray,
 * white and yellow palette, no playful decorations), headings and labels show
 * their words plainly in one colour, whatever markup they hold. In body text
 * (`strong`) every mark sets the words in bold, and only ==yellow== keeps its
 * highlighter, as on "Rooted in India. Recognised worldwide." in the hero. The
 * other marks once drew a lavender highlighter, hand-drawn underlines and
 * circles, and yellow tags; old content that still has them reads as bold.
 */
const TOKEN = /\*\*(.+?)\*\*|==(.+?)==|\+\+(.+?)\+\+|__(.+?)__|\(\((.+?)\)\)|\[\[(.+?)\]\]/g;

/** The words without the markup, for headings, captions, labels and anywhere effects cannot show. */
export function plainText(text: string): string {
  return text.replace(new RegExp(TOKEN.source, "g"), (_match, a, b, c, d, e, f) => a ?? b ?? c ?? d ?? e ?? f ?? "");
}

type Tone = "light" | "dark";

/** The yellow highlighter stroke behind words in body text, drawn in as it comes into view (or at once with `now`). */
function Mark({ children, now }: { children: ReactNode; now?: boolean }) {
  return <strong className={cn("fx-mark font-semibold text-ink-deep", now && "fx-now")}>{children}</strong>;
}

/**
 * Renders text with the markup above. Without `strong` (headings, labels, intro
 * lines) the words show plainly. With `strong` (body text) marked words are bold,
 * and ==yellow== words on a light background are highlighted. `now` draws the
 * highlighter shortly after the page opens instead of on scroll.
 */
export function Emphasis({ text, tone = "light", now = false, strong = false }: { text: string; tone?: Tone; now?: boolean; strong?: boolean }): ReactNode {
  if (!text) return null;
  if (!strong) return plainText(text);
  const re = new RegExp(TOKEN.source, "g");
  const parts: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const [, bold, yellow, ...others] = match;
    const key = match.index;
    if (yellow !== undefined && tone === "light") {
      parts.push(
        <Mark key={key} now={now}>
          {yellow}
        </Mark>,
      );
    } else {
      parts.push(
        <strong key={key} className={cn("font-semibold", tone === "dark" ? "text-white" : "text-ink-deep")}>
          {bold ?? yellow ?? others.find((value) => value !== undefined)}
        </strong>,
      );
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}
