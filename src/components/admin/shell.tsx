"use client";

import { ArrowSquareOutIcon, BellSimpleIcon, ChatsCircleIcon, ListIcon, MagnifyingGlassIcon, SignOutIcon, XIcon } from "@phosphor-icons/react";
import { usePathname, useRouter } from "next/navigation";
import { Dialog, VisuallyHidden } from "radix-ui";
import { useEffect, useRef, useState, useTransition } from "react";
import { logoutAction } from "@/app/admin/actions/auth";
import { AdminLink as Link } from "@/components/admin/admin-link";
import { Butterfly } from "@/components/ui/effects";
import type { Role } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { CommandPalette } from "./command-palette";
import { NAV, activeItem, allowed } from "./nav";
import { preloadRichTextWhenIdle } from "./rich-text-loader";
import { ToastProvider, useToast } from "./toast";

const PULSE_MS = 60_000;

/**
 * The number of new enquiries, kept current while the admin is open: checked
 * every minute while the tab is visible, and on returning to the tab if the last
 * check is more than half a minute old. A rise announces itself with a toast.
 * It is a plain GET request (/api/admin/pulse), never a server action, so it
 * never queues behind a save or holds up a click.
 */
function useNewEnquiries(initial: number) {
  const [count, setCount] = useState(initial);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);
  // A refreshed layout (the dashboard refreshes itself; saves refresh the screen) brings a
  // newer count with it: the badge follows at once.
  const [given, setGiven] = useState(initial);
  if (given !== initial) {
    setGiven(initial);
    setCount(initial);
  }
  // The last count announced. Whichever source sees a rise first (the minute check or a
  // refreshed layout) announces it, once; a drop (enquiries marked read) just lowers it.
  const latest = useRef(initial);
  const toast = useToast();
  useEffect(() => {
    if (initial > latest.current) {
      const more = initial - latest.current;
      toast({ tone: "info", title: more === 1 ? "A new enquiry has arrived" : `${more} new enquiries have arrived`, detail: "Open Enquiries to reply." });
    }
    latest.current = initial;
  }, [initial, toast]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let soon: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    let lastCheck = Date.now();
    const check = async () => {
      clearTimeout(timer);
      if (document.visibilityState === "visible") {
        lastCheck = Date.now();
        try {
          const response = await fetch("/api/admin/pulse/", { cache: "no-store" });
          const result = (await response.json()) as { ok: boolean; newEnquiries?: number };
          if (!stopped && result.ok && typeof result.newEnquiries === "number") {
            const now = result.newEnquiries;
            if (now > latest.current) {
              const more = now - latest.current;
              toast({ tone: "info", title: more === 1 ? "A new enquiry has arrived" : `${more} new enquiries have arrived`, detail: "Open Enquiries to reply." });
            }
            latest.current = now;
            setCount(now);
            setCheckedAt(new Date());
          }
        } catch {
          // Offline or signed out: try again at the next tick.
        }
      }
      if (!stopped) timer = setTimeout(check, PULSE_MS);
    };
    timer = setTimeout(check, PULSE_MS);
    const onVisible = () => {
      if (document.visibilityState !== "visible" || Date.now() - lastCheck < 30_000) return;
      clearTimeout(soon);
      soon = setTimeout(check, 1000);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      clearTimeout(timer);
      clearTimeout(soon);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [toast]);

  return { count, checkedAt };
}

function NavList({ role, newEnquiries, onNavigate }: { role: Role; newEnquiries: number; onNavigate?: () => void }) {
  const pathname = usePathname();
  const current = activeItem(pathname)?.item.href;
  return (
    <nav aria-label="Admin" className="flex flex-col gap-5">
      {NAV.map((group) => {
        const items = group.items.filter((item) => allowed(role, item.min));
        if (items.length === 0) return null;
        return (
          <div key={group.title || "top"}>
            {group.title && <p className="px-3 pb-1.5 text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-white/40">{group.title}</p>}
            <ul className="grid gap-0.5">
              {items.map((item) => {
                const active = item.href === current;
                const badge = item.href === "/admin/enquiries/" ? newEnquiries : 0;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "admin-nav-link group relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-[0.9375rem] font-semibold transition-colors duration-200",
                        active ? "bg-white/[0.09] text-white" : "text-white/70 hover:bg-white/[0.05] hover:text-white",
                      )}
                    >
                      <span aria-hidden className={cn("absolute inset-y-2 left-0 w-[3px] rounded-full bg-accent transition-opacity", active ? "opacity-100" : "opacity-0")} />
                      <item.icon className={cn("size-5 shrink-0 transition-colors", active ? "text-accent" : "text-white/55 group-hover:text-white")} weight={active ? "fill" : "regular"} />
                      <span className="flex-1">{item.label}</span>
                      {badge ? (
                        <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-navy tabular-nums">
                          {badge}
                          <span className="sr-only"> new</span>
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

const initials = (name: string, email: string) =>
  (name || email)
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");

function AccountBlock({ name, email, roleLabel, onNavigate }: { name: string; email: string; roleLabel: string; onNavigate?: () => void }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-1.5">
      <Link href="/admin/account/" onClick={onNavigate} className="flex min-h-12 items-center gap-3 rounded-xl px-2 text-white/85 hover:bg-white/[0.06] hover:text-white">
        <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-sm font-bold text-navy">
          {initials(name, email)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{name || email}</span>
          <span className="block text-xs text-white/55">{roleLabel}</span>
        </span>
      </Link>
      <form action={logoutAction}>
        <button type="submit" className="flex min-h-11 w-full items-center gap-3 rounded-xl px-2 text-left text-sm font-semibold text-white/70 hover:bg-white/[0.06] hover:text-white">
          <SignOutIcon className="size-5 shrink-0" />
          Sign out
        </button>
      </form>
    </div>
  );
}

function Brand() {
  return (
    <Link href="/admin/" className="admin-brand group flex items-center gap-3 rounded-xl px-1 py-1">
      <Butterfly sizes="56px" className="admin-brand-butterfly shrink-0" />
      <span className="font-sans text-[0.9375rem] font-bold leading-tight text-white">
        Butterfly Coaching
        <span className="block text-xs font-semibold text-white/50">Website studio</span>
      </span>
    </Link>
  );
}

function SearchButton({ onOpen, compact }: { onOpen: () => void; compact?: boolean }) {
  if (compact) {
    return (
      <button type="button" onClick={onOpen} aria-label="Search the admin" className="grid size-12 place-items-center rounded-full text-white hover:bg-white/10">
        <MagnifyingGlassIcon weight="bold" className="size-6" />
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex min-h-11 w-full max-w-md items-center gap-2.5 rounded-full border border-line bg-surface/80 pl-4 pr-2 text-left text-sm text-muted shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-colors hover:border-navy/30 hover:text-navy"
    >
      <MagnifyingGlassIcon aria-hidden weight="bold" className="size-[1.125rem] shrink-0" />
      <span className="flex-1 truncate">Search pages, programmes, people…</span>
      <kbd className="rounded-md border border-line bg-mist px-1.5 py-0.5 text-[0.6875rem] font-semibold">Ctrl K</kbd>
    </button>
  );
}

function Bell({ count, checkedAt, tone = "light" }: { count: number; checkedAt: Date | null; tone?: "light" | "dark" }) {
  const label = count === 0 ? "No new enquiries" : `${count} new ${count === 1 ? "enquiry" : "enquiries"}`;
  return (
    <Link
      href="/admin/enquiries/?status=new"
      aria-label={label}
      title={checkedAt ? `${label} · checked at ${checkedAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}` : label}
      className={cn("relative grid size-11 shrink-0 place-items-center rounded-full transition-colors", tone === "dark" ? "text-white hover:bg-white/10" : "border border-line bg-surface/80 text-navy hover:border-navy/30")}
    >
      <BellSimpleIcon weight={count ? "fill" : "bold"} className={cn("size-5", count > 0 && "admin-bell-ring")} />
      {count > 0 && (
        <span aria-hidden className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-accent px-1 text-[0.6875rem] font-bold text-navy ring-2 ring-page tabular-nums">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

function Shell({
  children,
  user,
  roleLabel,
  newEnquiries,
  localMode,
}: {
  children: React.ReactNode;
  user: { fullName: string; email: string; role: Role };
  roleLabel: string;
  newEnquiries: number;
  localMode: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  // Jumps from the search palette run as a transition, so a thin bar can show until the
  // screen arrives (palette results are not links, so they get no link spinner).
  const [navigating, startNavigation] = useTransition();
  const navigate = (href: string) => startNavigation(() => router.push(href));
  const [open, setOpen] = useState(false);
  const [closedFor, setClosedFor] = useState(pathname);
  const [searching, setSearching] = useState(false);
  const live = useNewEnquiries(newEnquiries);
  // Fetch the rich-text editor in idle time, so opening an editor never waits for it.
  useEffect(() => preloadRichTextWhenIdle(), []);
  const here = activeItem(pathname);

  // The drawer closes after navigating.
  if (closedFor !== pathname) {
    setClosedFor(pathname);
    if (open) setOpen(false);
  }

  return (
    <div className="admin-app min-h-dvh bg-page lg:grid lg:grid-cols-[17.5rem_minmax(0,1fr)]">
      {/* Desktop sidebar */}
      <aside className="admin-sidebar on-dark sticky top-0 hidden h-dvh flex-col gap-6 overflow-y-auto p-4 lg:flex">
        <Brand />
        <div className="flex-1">
          <NavList role={user.role} newEnquiries={live.count} />
        </div>
        <a href="/" target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-white/70 hover:bg-white/[0.05] hover:text-white">
          <ArrowSquareOutIcon className="size-5 shrink-0" />
          View website<span className="sr-only"> (opens in a new tab)</span>
        </a>
        <AccountBlock name={user.fullName} email={user.email} roleLabel={roleLabel} />
      </aside>

      <div className="min-w-0">
        {/* Phone and tablet: top bar and drawer */}
        <header className="admin-sidebar on-dark sticky top-0 z-[var(--z-header)] flex h-16 items-center justify-between gap-1 pl-3 pr-2 lg:hidden">
          <Brand />
          <div className="flex items-center">
            <SearchButton compact onOpen={() => setSearching(true)} />
            <Bell count={live.count} checkedAt={live.checkedAt} tone="dark" />
            <Dialog.Root open={open} onOpenChange={setOpen}>
              <Dialog.Trigger asChild>
                <button type="button" aria-label="Open admin menu" className="relative grid size-12 place-items-center rounded-full text-white hover:bg-white/10">
                  <ListIcon weight="bold" className="size-6" />
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-[var(--z-overlay)] bg-black/50 data-[state=open]:animate-[fade-in_0.2s_ease-out]" />
                <Dialog.Content
                  aria-describedby={undefined}
                  className="admin-sidebar on-dark fixed inset-y-0 right-0 z-[var(--z-overlay)] flex w-[min(20rem,100vw)] flex-col gap-4 overflow-y-auto p-4 outline-none data-[state=open]:animate-[drawer-in_0.28s_var(--ease-out-soft)]"
                >
                  <VisuallyHidden.Root>
                    <Dialog.Title>Admin menu</Dialog.Title>
                  </VisuallyHidden.Root>
                  <div className="flex items-center justify-between">
                    <span className="px-3 font-sans text-lg font-bold text-white">Menu</span>
                    <Dialog.Close asChild>
                      <button type="button" aria-label="Close menu" className="grid size-12 place-items-center rounded-full text-white hover:bg-white/10">
                        <XIcon weight="bold" className="size-6" />
                      </button>
                    </Dialog.Close>
                  </div>
                  <div className="flex-1">
                    <NavList role={user.role} newEnquiries={live.count} onNavigate={() => setOpen(false)} />
                  </div>
                  <a href="/" target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-white/70 hover:bg-white/[0.05] hover:text-white">
                    <ArrowSquareOutIcon className="size-5 shrink-0" />
                    View website<span className="sr-only"> (opens in a new tab)</span>
                  </a>
                  <AccountBlock name={user.fullName} email={user.email} roleLabel={roleLabel} onNavigate={() => setOpen(false)} />
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </header>

        {/* Desktop top bar: where you are, search, live enquiries */}
        <div className="admin-topbar sticky top-0 z-[var(--z-header)] hidden h-16 items-center gap-4 border-b border-line/70 px-6 lg:flex xl:px-10">
          <p className="min-w-0 shrink-0 truncate text-sm text-muted">
            {here?.group ? <span>{here.group} / </span> : null}
            <span className="font-semibold text-navy">{here?.item.label ?? "Admin"}</span>
          </p>
          <div className="flex flex-1 justify-center">
            <SearchButton onOpen={() => setSearching(true)} />
          </div>
          <Bell count={live.count} checkedAt={live.checkedAt} />
        </div>

        {localMode && (
          <p className="flex items-center justify-center gap-2 bg-warning-soft px-4 py-2 text-center text-sm text-[#5c4300]">
            <ChatsCircleIcon aria-hidden className="size-4 shrink-0" />
            Local development mode: data lives on this computer only. Connect Supabase before going live.
          </p>
        )}
        <CommandPalette role={user.role} open={searching} setOpen={setSearching} navigate={navigate} />
        {navigating && <div role="progressbar" aria-label="Opening the next screen" className="admin-progress fixed inset-x-0 top-0 z-[var(--z-toast)] h-[3px]" />}
        <main id="content" aria-busy={navigating || undefined} className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 md:py-9 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}

export function AdminShell(props: {
  children: React.ReactNode;
  user: { fullName: string; email: string; role: Role };
  roleLabel: string;
  newEnquiries: number;
  localMode: boolean;
}) {
  return (
    <ToastProvider>
      <Shell {...props} />
    </ToastProvider>
  );
}
