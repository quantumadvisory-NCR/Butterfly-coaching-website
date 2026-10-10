"use client";

import { CaretDownIcon, ListIcon, PhoneIcon, WhatsappLogoIcon, XIcon } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog, NavigationMenu, VisuallyHidden } from "radix-ui";
import { useEffect, useState } from "react";
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
  const itemClass =
    "inline-flex h-11 items-center gap-1 rounded-full px-3 text-[0.9375rem] font-semibold text-navy transition-colors hover:bg-sky data-[state=open]:bg-sky";
  return (
    <NavigationMenu.Root aria-label="Main" delayDuration={80} className="hidden lg:block">
      <NavigationMenu.List className="flex items-center gap-0.5">
        {nav.map((node) => {
          const active = isActive(pathname, node);
          if (node.children.length === 0) {
            return (
              <NavigationMenu.Item key={node.id}>
                <NavigationMenu.Link asChild active={active}>
                  <NavAnchor node={node} className={cn(itemClass, active && "text-primary")} />
                </NavigationMenu.Link>
              </NavigationMenu.Item>
            );
          }
          return (
            <NavigationMenu.Item key={node.id} className="relative">
              <NavigationMenu.Trigger className={cn(itemClass, "group", active && "text-primary")}>
                {node.label}
                <CaretDownIcon aria-hidden weight="bold" className="size-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </NavigationMenu.Trigger>
              <NavigationMenu.Content className="absolute left-0 top-full z-[var(--z-header)] w-[21rem] pt-2 data-[state=open]:animate-[pop-in_0.18s_var(--ease-out-soft)]">
                <ul className="grid gap-0.5 rounded-card border border-sky-line bg-surface p-2 shadow-lift">
                  {node.children.map((child) => (
                    <li key={child.id}>
                      <NavigationMenu.Link asChild active={pathname === child.href}>
                        <Link
                          href={child.href}
                          className="block rounded-xl px-3.5 py-2.5 hover:bg-sky focus-visible:bg-sky data-[active]:bg-sky"
                        >
                          <span className="block font-semibold text-navy">{child.label}</span>
                          {child.description && <span className="mt-0.5 block text-sm leading-snug text-muted">{child.description}</span>}
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
  const linkClass = "flex min-h-12 items-center rounded-xl px-3 text-[1.0625rem] font-semibold text-navy hover:bg-sky";

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="-mr-2 grid size-12 place-items-center rounded-full text-navy hover:bg-sky lg:hidden"
          aria-label="Open menu"
        >
          <ListIcon aria-hidden weight="bold" className="size-6" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[var(--z-overlay)] bg-navy/50 data-[state=open]:animate-[fade-in_0.2s_ease-out]" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-y-0 right-0 z-[var(--z-overlay)] flex w-[min(24rem,100vw)] flex-col bg-surface shadow-lift outline-none data-[state=open]:animate-[drawer-in_0.28s_var(--ease-out-soft)]"
        >
          <VisuallyHidden.Root>
            <Dialog.Title>{siteName} menu</Dialog.Title>
          </VisuallyHidden.Root>
          <div className="flex h-[var(--header-height)] shrink-0 items-center justify-between border-b border-sky-line pl-5 pr-3">
            <span className="font-display text-lg font-bold text-navy">Menu</span>
            <Dialog.Close asChild>
              <button type="button" aria-label="Close menu" className="grid size-12 place-items-center rounded-full text-navy hover:bg-sky">
                <XIcon aria-hidden weight="bold" className="size-6" />
              </button>
            </Dialog.Close>
          </div>
          <nav aria-label="Main" className="flex-1 overflow-y-auto overscroll-contain px-3 py-4">
            <ul className="grid gap-1">
              {nav.map((node) =>
                node.children.length === 0 ? (
                  <li key={node.id}>
                    <NavAnchor node={node} onClick={close} className={cn(linkClass, isActive(pathname, node) && "text-primary")} />
                  </li>
                ) : (
                  <li key={node.id} className="pb-2">
                    <p className="px-3 pb-1 pt-4 text-[0.8125rem] font-bold uppercase tracking-[0.1em] text-muted">{node.label}</p>
                    <ul className="grid gap-0.5">
                      {node.children.map((child) => (
                        <li key={child.id}>
                          <NavAnchor node={child} onClick={close} className={cn(linkClass, pathname === child.href && "bg-sky text-primary")} />
                        </li>
                      ))}
                    </ul>
                  </li>
                ),
              )}
            </ul>
          </nav>
          <div className="shrink-0 border-t border-sky-line p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
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

export function SiteHeader(props: Props) {
  const pathname = usePathname();
  const { announcement, logo, cta } = props;
  return (
    <>
      {announcement && (
        <div className="on-dark bg-navy text-white">
          <p className="container-site py-2.5 text-center text-sm">
            {announcement.text}{" "}
            {announcement.link && (
              <Link href={announcement.link.href} className="font-semibold text-accent underline underline-offset-4">
                {announcement.link.label}
              </Link>
            )}
          </p>
        </div>
      )}
      <header className="sticky top-0 z-[var(--z-header)] border-b border-sky-line bg-surface/95 backdrop-blur-sm supports-[backdrop-filter]:bg-surface/90">
        <div className="container-site flex h-[var(--header-height)] items-center justify-between gap-4">
          <Link href="/" aria-label={`${props.siteName} home`} className="flex min-h-11 shrink-0 items-center rounded-lg">
            <Image
              src={logo.src}
              alt={props.siteName}
              width={logo.width}
              height={logo.height}
              unoptimized={logo.src.endsWith(".svg")}
              preload
              className="h-9 w-auto md:h-10"
            />
          </Link>
          <DesktopNav nav={props.nav} pathname={pathname} />
          <div className="flex items-center gap-1">
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
