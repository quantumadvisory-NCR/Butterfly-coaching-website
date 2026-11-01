import Image from "next/image";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/*
 * Decorative pieces from the November 2026 homepage design. Every one is
 * aria-hidden: they add delight, never meaning. Their motion lives in
 * src/app/effects.css and stops for anyone who prefers reduced motion.
 */

/**
 * The site's butterfly: a monarch, supplied by the owner on 1 November 2026
 * (public/images/brand/butterfly-monarch.webp, background removed). Its wings
 * beat by squeezing the picture in and out around the body.
 */
const BUTTERFLY = { src: "/images/brand/butterfly-monarch.webp", width: 320, height: 226 };

export function Butterfly({
  className,
  style,
  flap,
  sizes = "48px",
}: {
  className?: string;
  style?: CSSProperties;
  /** Wings beat quickly ("fast") or gently ("slow"). */
  flap?: "fast" | "slow";
  /** How wide it shows, so the browser downloads a small enough file. */
  sizes?: string;
}) {
  return (
    <span aria-hidden className={cn("inline-block", flap === "fast" && "fx-flap", flap === "slow" && "fx-flap-slow", className)} style={style}>
      <Image src={BUTTERFLY.src} alt="" width={BUTTERFLY.width} height={BUTTERFLY.height} sizes={sizes} className="fx-wing-img block size-full object-contain" />
    </span>
  );
}

/**
 * A butterfly that flies along a path across its section, wings beating. Place
 * it inside a positioned section that clips overflow.
 */
export function Flyer({ path = "hero", className }: { path?: "hero" | "wave" | "climb"; className?: string }) {
  return (
    <span aria-hidden className={cn("fx-flyer fx-flap", `fx-flyer-${path}`, className)}>
      <Butterfly sizes="40px" className="block size-full" />
    </span>
  );
}

/**
 * The flourish every page header shares with the homepage: a soft lavender glow
 * in the top corner and a butterfly crossing the header. Place it first inside a
 * `relative isolate overflow-hidden` section.
 */
export function HeaderFlourish() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-44 -z-10 size-[32.5rem] rounded-full bg-[radial-gradient(circle,var(--color-lav-100)_0%,rgb(255_255_255/0)_70%)] opacity-80"
      />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[42%] h-0 max-md:top-[30%]">
        <Flyer path="wave" />
      </div>
    </>
  );
}

/** A four-pointed sparkle that twinkles. Colour it with a fill-* class. */
export function Twinkle({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={cn("fx-twinkle pointer-events-none", className)} style={style}>
      <path d="M12 0 C 13 8, 16 11, 24 12 C 16 13, 13 16, 12 24 C 11 16, 8 13, 0 12 C 8 11, 11 8, 12 0 Z" />
    </svg>
  );
}

/** The pulsing green "live" dot. */
export function LiveDot({ className }: { className?: string }) {
  return <span aria-hidden className={cn("fx-live inline-block size-2 shrink-0 rounded-full bg-[#2e9e6b]", className)} />;
}

/** A hand-drawn arrow pointing back at what it annotates. */
export function HandArrow({ className, variant = "left" }: { className?: string; variant?: "left" | "down" }) {
  if (variant === "down") {
    return (
      <svg aria-hidden viewBox="0 0 50 40" className={cn("fill-none stroke-current", className)} style={{ strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" }}>
        <path d="M46 8 C 30 4, 12 12, 6 30" />
        <path d="M3 21 L 6 31 L 15 26" />
      </svg>
    );
  }
  return (
    <svg aria-hidden viewBox="0 0 60 40" className={cn("fill-none stroke-current", className)} style={{ strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" }}>
      <path d="M56 30 C 40 36, 18 32, 8 14" />
      <path d="M5 24 L 8 13 L 18 17" />
    </svg>
  );
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
