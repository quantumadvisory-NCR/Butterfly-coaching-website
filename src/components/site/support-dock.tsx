"use client";

import {
  ArrowRightIcon,
  CalendarCheckIcon,
  ChatCircleDotsIcon,
  EnvelopeSimpleIcon,
  GraduationCapIcon,
  PhoneIcon,
  WhatsappLogoIcon,
  XIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { Popover } from "radix-ui";
import { type ComponentType, useEffect, useState } from "react";
import { cn, isExternalHref } from "@/lib/utils";

export type SupportLink = { label: string; description: string; href: string; kind: string };
export type SupportPanel = { heading: string; body: string; links: SupportLink[] };

type IconType = ComponentType<{ className?: string; weight?: "regular" | "bold" | "fill"; "aria-hidden"?: boolean }>;

function iconFor(link: SupportLink): { Icon: IconType; tone: string; track: string } {
  if (link.kind === "whatsapp" || link.href.startsWith("https://wa.me/")) return { Icon: WhatsappLogoIcon, tone: "bg-[#e3f3ec] text-[#0f7a5f]", track: "whatsapp_click" };
  if (link.kind === "phone" || link.href.startsWith("tel:")) return { Icon: PhoneIcon, tone: "bg-tint text-navy", track: "phone_click" };
  if (link.kind === "booking" || link.href.includes("discovery")) return { Icon: CalendarCheckIcon, tone: "bg-accent text-navy", track: "cta_click" };
  if (link.href.includes("contact")) return { Icon: EnvelopeSimpleIcon, tone: "bg-tint text-navy", track: "cta_click" };
  if (link.href.includes("program") || link.href.includes("certification")) return { Icon: GraduationCapIcon, tone: "bg-tint text-navy", track: "cta_click" };
  return { Icon: ArrowRightIcon, tone: "bg-tint text-navy", track: "cta_click" };
}

/**
 * The floating support controls in the bottom corner: a WhatsApp shortcut
 * stacked above "Need help?", which opens a small panel of next steps. Stacked,
 * they cover a narrow strip at the edge rather than a wide one across the text;
 * both stay clear of the cookie banner on smaller screens. The panel is a Radix
 * popover: it takes focus when opened, closes with Escape or a click outside,
 * and returns focus to the button.
 *
 * They step aside at the foot of the footer, so the last links stay clear
 * without empty space kept free below them. On phones and tablets they also
 * wait until the visitor has scrolled past most of the first screen, so they
 * never sit over the hero's message and buttons.
 */
export function SupportDock({ panel, whatsapp }: { panel: SupportPanel | null; whatsapp: string | null }) {
  const [open, setOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 63.999rem)");
    let frame = 0;
    const update = () => {
      frame = 0;
      const footerEnd = document.querySelector("[data-footer-end]");
      const atFooterEnd = footerEnd ? footerEnd.getBoundingClientRect().top < window.innerHeight : false;
      const pastHero = !query.matches || window.scrollY > window.innerHeight * 0.6;
      setRevealed(pastHero && !atFooterEnd);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    query.addEventListener("change", update);
    return () => {
      window.removeEventListener("scroll", onScroll);
      query.removeEventListener("change", update);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  if (!panel && !whatsapp) return null;
  const waiting = !revealed && !open;
  return (
    <div
      data-support-dock
      inert={waiting ? true : undefined}
      className={cn(
        "fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-[var(--z-floating)] flex flex-col items-end gap-2.5 max-lg:[html[data-consent-open]_&]:hidden print:hidden",
        "transition-[opacity,translate] duration-300 motion-reduce:transition-none",
        waiting && "pointer-events-none translate-y-3 opacity-0",
      )}
    >
      {whatsapp && (
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          data-track="whatsapp_click"
          data-track-label="Floating button"
          className="grid size-12 place-items-center rounded-full bg-[#0f7a5f] text-white shadow-lift ring-2 ring-white transition-[transform,scale] duration-200 hover:-translate-y-0.5 active:scale-95 sm:size-14"
        >
          <WhatsappLogoIcon aria-hidden weight="fill" className="size-6 sm:size-7" />
          <span className="sr-only">Chat with us on WhatsApp (opens in a new tab)</span>
        </a>
      )}
      {panel && (
        <Popover.Root open={open} onOpenChange={setOpen}>
          <Popover.Trigger asChild>
            <button
              type="button"
              data-track="cta_click"
              data-track-label="Need help: open"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-navy pl-3.5 pr-4 font-display text-[0.9375rem] font-semibold text-white shadow-lift ring-2 ring-white transition-[transform,background-color,scale] duration-200 hover:-translate-y-0.5 hover:bg-navy-soft active:scale-95 data-[state=open]:bg-navy-soft sm:h-14 sm:pl-4 sm:pr-5"
            >
              <span aria-hidden className="grid size-7 place-items-center rounded-full bg-accent text-navy">
                {open ? <XIcon weight="bold" className="size-4" /> : <ChatCircleDotsIcon weight="fill" className="size-4" />}
              </span>
              Need help?
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              side="top"
              align="end"
              sideOffset={12}
              collisionPadding={12}
              aria-labelledby="support-panel-heading"
              className="z-[var(--z-overlay)] flex max-h-[min(34rem,calc(100dvh-7rem))] w-[min(23rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-[var(--radius-panel)] border border-line bg-surface shadow-lift outline-none data-[state=open]:animate-[pop-in_0.2s_var(--ease-out-soft)]"
            >
              <div className="relative bg-navy px-5 pb-5 pt-5 text-white">
                <Popover.Close asChild>
                  <button type="button" aria-label="Close help panel" className="absolute right-2.5 top-2.5 grid size-10 place-items-center rounded-full text-white/80 hover:bg-white/10 hover:text-white">
                    <XIcon aria-hidden weight="bold" className="size-5" />
                  </button>
                </Popover.Close>
                <p id="support-panel-heading" className="pr-10 font-display text-lg font-bold leading-snug text-white">
                  {panel.heading}
                </p>
                {panel.body && <p className="mt-1.5 text-[0.9375rem] leading-snug text-white/80">{panel.body}</p>}
              </div>
              <ul className="grid gap-1 overflow-y-auto overscroll-contain p-2.5">
                {panel.links.map((link) => {
                  const { Icon, tone, track } = iconFor(link);
                  const external = isExternalHref(link.href) || link.href.startsWith("https://wa.me/");
                  const special = /^(https?:|mailto:|tel:)/i.test(link.href);
                  const body = (
                    <>
                      <span aria-hidden className={`grid size-10 shrink-0 place-items-center rounded-full ${tone}`}>
                        <Icon weight={track === "whatsapp_click" ? "fill" : "bold"} className="size-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-navy">{link.label}</span>
                        {link.description && <span className="block text-sm leading-snug text-muted">{link.description}</span>}
                      </span>
                      <ArrowRightIcon aria-hidden weight="bold" className="size-4 shrink-0 text-navy/40 transition-transform group-hover:translate-x-0.5 group-hover:text-navy" />
                      {external && <span className="sr-only"> (opens in a new tab)</span>}
                    </>
                  );
                  const className = "group flex min-h-14 items-center gap-3 rounded-xl px-2.5 py-2 text-left hover:bg-tint focus-visible:bg-tint";
                  const tracking = { "data-track": track, "data-track-label": `Need help: ${link.label}` };
                  return (
                    <li key={link.label}>
                      {special ? (
                        <a href={link.href} className={className} onClick={() => setOpen(false)} {...tracking} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                          {body}
                        </a>
                      ) : (
                        <Link href={link.href} className={className} onClick={() => setOpen(false)} {...tracking}>
                          {body}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      )}
    </div>
  );
}
