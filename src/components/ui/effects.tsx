import Image from "next/image";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/*
 * Small pieces shared by the page designs. Every decorative one is aria-hidden.
 * Since the owner's brief of 25 November 2026 nothing loops or plays: the flying
 * butterflies, sparkles, hand-drawn arrows and handwritten notes are gone.
 * Styles in src/app/effects.css.
 */

/**
 * The site's butterfly: a monarch, supplied by the owner on 1 November 2026
 * (public/images/brand/butterfly-monarch.webp, background removed). Shown still.
 */
const BUTTERFLY = { src: "/images/brand/butterfly-monarch.webp", width: 320, height: 226 };

export function Butterfly({
  className,
  style,
  sizes = "48px",
}: {
  className?: string;
  style?: CSSProperties;
  /** How wide it shows, so the browser downloads a small enough file. */
  sizes?: string;
}) {
  return (
    <span aria-hidden className={cn("inline-block", className)} style={style}>
      <Image src={BUTTERFLY.src} alt="" width={BUTTERFLY.width} height={BUTTERFLY.height} sizes={sizes} className="block size-full object-contain" />
    </span>
  );
}

/**
 * The soft light gray glow in the top corner that every page header shares with
 * the homepage. Place it first inside a `relative isolate overflow-hidden` section.
 */
export function HeaderFlourish() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute -left-40 -top-44 -z-10 size-[32.5rem] rounded-full bg-[radial-gradient(circle,#f2f2f0_0%,rgb(242_242_240/0)_70%)]"
    />
  );
}

/** The pulsing green "live" dot. */
export function LiveDot({ className }: { className?: string }) {
  return <span aria-hidden className={cn("fx-live inline-block size-2 shrink-0 rounded-full bg-[#2e9e6b]", className)} />;
}

/** A small tick, drawn to match the design's line icons. */
export function Tick({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={cn("fill-none stroke-current", className)} style={{ strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round" }}>
      <path d="M5 12l5 5 9-10" />
    </svg>
  );
}

/** The arrow that nudges forward when its link or button is hovered. */
export function Arrow() {
  return (
    <span aria-hidden className="fx-arrow">
      →
    </span>
  );
}

/** The three ICF accreditation badges, from the static brand files. */
export const ICF_BADGES = [
  { src: "/images/icf/icf-level-1-accredited.webp", level: "Level 1", credential: "ACC" },
  { src: "/images/icf/icf-level-2-accredited.webp", level: "Level 2", credential: "PCC" },
  { src: "/images/icf/icf-level-3-accredited.webp", level: "Level 3", credential: "MCC" },
] as const;
