"use client";

import { CaretDownIcon, ListIcon, PhoneIcon, WhatsappLogoIcon, XIcon } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog, NavigationMenu, VisuallyHidden } from "radix-ui";
import { Fragment, useEffect, useState } from "react";
import { Arrow, ICF_BADGES, LiveDot } from "@/components/ui/effects";
import type { NavNode } from "@/lib/content/public";
import { cn, isExternalHref } from "@/lib/utils";

type Props = {
  nav: NavNode[];
  logo: { src: string; width: number; height: number };
  siteName: string;
  cta: { label: string; href: string } | null;
  tel: string | null;
  phoneDisplay: string;
  whatsapp: string | null;
  announcement: { text: string; link: { label: string; href: string } | null } | null;
};

function isActive(pathname: string, node: NavNode): boolean {
  const own = node.href !== "/" && pathname.startsWith(node.href);
  return own || node.children.some((child) => isActive(pathname, child));
}

function NavAnchor({ node, className, onClick }: { node: NavNode; className?: string; onClick?: () => void }) {
  const external = isExternalHref(node.href) || node.openInNewTab;
  if (external) {
    return (
      <a href={node.href} target="_blank" rel="noopener noreferrer" className={className} onClick={onClick}>
        {node.label}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }
  return (
    <Link href={node.href} className={className} onClick={onClick}>
      {node.label}
    </Link>
  );
}

function DesktopNav({ nav, pathname }: { nav: NavNode[]; pathname: string }) {
  // A lavender line draws in beneath each link on hover, and stays under the current section.
  const itemClass =
    "fx-nav-link inline-flex h-11 items-center gap-1 rounded-full px-3 font-text text-[0.9375rem] font-medium text-[#2a2533] transition-colors hover:text-ink-deep data-[state=open]:text-ink-deep";
  return (
    <NavigationMenu.Root aria-label="Main" delayDuration={80} className="hidden lg:block">
      <NavigationMenu.List className="flex items-center gap-1 xl:gap-2">
        {nav.map((node) => {
          const active = isActive(pathname, node);
          if (node.children.length === 0) {
            return (
              <NavigationMenu.Item key={node.id}>
                <NavigationMenu.Link asChild active={active}>
                  <NavAnchor node={node} className={itemClass} />
                </NavigationMenu.Link>
              </NavigationMenu.Item>
            );
          }
          return (
            <NavigationMenu.Item key={node.id} className="relative">
              <NavigationMenu.Trigger className={cn(itemClass, "group")} {...(active ? { "data-active": "" } : {})}>
                {node.label}
                <CaretDownIcon aria-hidden weight="bold" className="size-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </NavigationMenu.Trigger>
              <NavigationMenu.Content className="absolute left-0 top-full z-[var(--z-header)] w-[21rem] pt-2 data-[state=open]:animate-[pop-in_0.18s_var(--ease-out-soft)]">
                <ul className="grid gap-0.5 rounded-[1.375rem] border border-lilac-line bg-surface p-2 font-text shadow-[0_28px_50px_-28px_rgb(70_45_160/0.45)]">
                  {node.children.map((child) => (
                    <li key={child.id}>
                      <NavigationMenu.Link asChild active={pathname === child.href}>
                        <Link
                          href={child.href}
                          className="block rounded-2xl px-3.5 py-2.5 transition-colors hover:bg-lav-50 focus-visible:bg-lav-50 data-[active]:bg-lav-50"
                        >
                          <span className="block font-semibold text-ink-deep">{child.label}</span>
                          {child.description && <span className="mt-0.5 block text-sm leading-snug text-mauve">{child.description}</span>}
                        </Link>
                      </NavigationMenu.Link>
                    </li>
                  ))}
                </ul>
              </NavigationMenu.Content>
            </NavigationMenu.Item>
          );
        })}
      </NavigationMenu.List>
    </NavigationMenu.Root>
  );
}

function MobileNav({ nav, pathname, cta, tel, phoneDisplay, whatsapp, siteName }: Omit<Props, "logo" | "announcement"> & { pathname: string }) {
  const [open, setOpen] = useState(false);
  // Close the drawer whenever navigation completes.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncs UI state to a route change
    setOpen(false);
  }, [pathname]);
  const close = () => setOpen(false);
  const linkClass = "flex min-h-12 items-center rounded-2xl px-3 font-text text-[1.0625rem] font-semibold text-ink-deep transition-colors hover:bg-lav-50";

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="-mr-2 grid size-12 place-items-center rounded-full text-ink-deep hover:bg-lav-50 lg:hidden"
          aria-label="Open menu"
        >
          <ListIcon aria-hidden weight="bold" className="size-6" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[var(--z-overlay)] bg-ink-deep/50 data-[state=open]:animate-[fade-in_0.2s_ease-out]" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-y-0 right-0 z-[var(--z-overlay)] flex w-[min(24rem,100vw)] flex-col bg-surface shadow-lift outline-none data-[state=open]:animate-[drawer-in_0.28s_var(--ease-out-soft)] max-sm:w-full"
        >
          <VisuallyHidden.Root>
            <Dialog.Title>{siteName} menu</Dialog.Title>
          </VisuallyHidden.Root>
          <div className="flex h-[var(--header-height)] shrink-0 items-center justify-between border-b border-line pl-5 pr-3">
            <span className="flex items-center gap-2.5 font-grotesk text-lg font-bold text-ink-deep">
              <Image src="/images/brand/bca-mark-mid-gray.svg" alt="" width={98} height={90} unoptimized className="h-7 w-auto" />
              Menu
            </span>
            <Dialog.Close asChild>
              <button type="button" aria-label="Close menu" className="grid size-12 place-items-center rounded-full text-ink-deep hover:bg-lav-50">
                <XIcon aria-hidden weight="bold" className="size-6" />
              </button>
            </Dialog.Close>
          </div>
          <nav aria-label="Main" className="flex-1 overflow-y-auto overscroll-contain px-3 py-4">
            <ul className="grid gap-1">
              {nav.map((node) =>
                node.children.length === 0 ? (
                  <li key={node.id}>
                    <NavAnchor node={node} onClick={close} className={cn(linkClass, isActive(pathname, node) && "bg-lav-50")} />
                  </li>
                ) : (
                  <li key={node.id} className="pb-2">
                    <p className="flex items-center gap-2 px-3 pb-1 pt-4 text-[0.8125rem] font-bold uppercase tracking-[0.1em] text-mauve">
                      <span aria-hidden className="h-0.5 w-4 rounded-full bg-accent" />
                      {node.label}
                    </p>
                    <ul className="grid gap-0.5">
                      {node.children.map((child) => (
                        <li key={child.id}>
                          <NavAnchor node={child} onClick={close} className={cn(linkClass, pathname === child.href && "bg-lav-50")} />
                        </li>
                      ))}
                    </ul>
                  </li>
                ),
              )}
            </ul>
          </nav>
          <div className="shrink-0 border-t border-line p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            {cta && (
              <Link href={cta.href} onClick={close} data-track="cta_click" data-track-label={`Menu: ${cta.label}`} className="btn btn-primary w-full">
                {cta.label}
              </Link>
            )}
            <div className="mt-3 grid grid-cols-2 gap-3">
              {tel && (
                <a href={tel} data-track="phone_click" className="btn btn-quiet btn-sm" aria-label={`Call ${phoneDisplay}`}>
                  <PhoneIcon aria-hidden weight="fill" className="size-4" />
                  Call
                </a>
              )}
              {whatsapp && (
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" data-track="whatsapp_click" className="btn btn-quiet btn-sm">
                  <WhatsappLogoIcon aria-hidden weight="fill" className="size-4" />
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/**
 * The dark strip above the menu, with the pulsing "live" dot. Edited in Admin >
 * Settings > Header and announcement; parts separated by " · " are shown as
 * separate phrases, the later ones in bold.
 */
function AnnouncementBar({ announcement }: { announcement: NonNullable<Props["announcement"]> }) {
  const external = announcement.link ? isExternalHref(announcement.link.href) : false;
  const parts = announcement.text.split(/\s+·\s+/).filter(Boolean);
  const dot = (
    <span aria-hidden className="text-[#6e6880]">
      ·
    </span>
  );
  return (
    <div className="bg-ink-deep font-text text-[#f4f1fd]">
      <p className="container-site flex flex-wrap items-center justify-center gap-x-2.5 gap-y-0.5 py-2.5 text-center text-sm leading-snug max-sm:gap-x-2 max-sm:py-2 max-sm:text-[0.8125rem] max-sm:leading-tight">
        <LiveDot />
        {parts.map((part, i) => (
          <Fragment key={`${part}-${i}`}>
            {i > 0 && dot}
            <span className={i > 0 ? "font-semibold text-white" : undefined}>{part}</span>
          </Fragment>
        ))}
        {announcement.link && (
          <>
            {dot}
            <Link
              href={announcement.link.href}
              data-track="cta_click"
              data-track-label={`Announcement: ${announcement.link.label}`}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              className="inline-flex min-h-6 items-center gap-1.5 font-semibold text-accent underline decoration-[1.5px] underline-offset-[5px] hover:text-[#ffd23f]"
            >
              {announcement.link.label}
              <Arrow />
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

export function SiteHeader(props: Props) {
  const pathname = usePathname();
  const { announcement, logo, cta } = props;
  return (
    <>
      {announcement && <AnnouncementBar announcement={announcement} />}
      <header className="sticky top-0 z-[var(--z-header)] border-b border-[#ece8f1] bg-[rgb(251_250_247/0.95)] backdrop-blur-[14px] supports-[backdrop-filter]:bg-[rgb(251_250_247/0.86)]">
        <div className="container-site flex h-[var(--header-height)] items-center justify-between gap-4">
          <Link href="/" aria-label={`${props.siteName} home`} className="flex min-h-11 shrink-0 items-center rounded-lg">
            <Image
              src={logo.src}
              alt={props.siteName}
              width={logo.width}
              height={logo.height}
              unoptimized={logo.src.endsWith(".svg")}
              preload
              className="h-8 w-auto sm:h-9 lg:h-10"
            />
          </Link>
          <DesktopNav nav={props.nav} pathname={pathname} />
          <div className="flex items-center gap-3">
            {/* The three ICF accreditation badges, overlapping, on wide screens. */}
            <span role="img" aria-label="ICF accredited at Level 1, 2 and 3" className="hidden items-center xl:flex">
              {ICF_BADGES.map((badge, i) => (
                <Image key={badge.src} src={badge.src} alt="" width={34} height={34} sizes="34px" className={cn("size-[2.125rem] object-contain", i > 0 && "-ml-1.5")} />
              ))}
            </span>
            {cta && (
              <Link
                href={cta.href}
                data-track="cta_click"
                data-track-label={`Header: ${cta.label}`}
                className="btn btn-primary btn-sm hidden min-[40rem]:inline-flex"
              >
                {cta.label}
              </Link>
            )}
            <MobileNav {...props} pathname={pathname} />
          </div>
        </div>
      </header>
    </>
  );
}
