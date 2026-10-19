"use client";

import {
  ArrowSquareOutIcon,
  ArrowsLeftRightIcon,
  ChatsCircleIcon,
  ClockCounterClockwiseIcon,
  EnvelopeSimpleIcon,
  FilesIcon,
  GearSixIcon,
  GraduationCapIcon,
  HouseIcon,
  ImagesIcon,
  ListIcon,
  NewspaperIcon,
  QuestionIcon,
  QuotesIcon,
  SignOutIcon,
  SignpostIcon,
  TrayIcon,
  UserCircleIcon,
  UsersIcon,
  UsersThreeIcon,
  XIcon,
  FileArrowDownIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import { AdminLink as Link } from "@/components/admin/admin-link";
import { usePathname } from "next/navigation";
import { Dialog, VisuallyHidden } from "radix-ui";
import { type ComponentType, useEffect, useState } from "react";
import { logoutAction } from "@/app/admin/actions/auth";
import type { Role } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; icon: ComponentType<{ className?: string; weight?: "regular" | "fill" | "bold" }>; min: Role; badge?: number };
type Group = { title: string; items: Item[] };

const RANK: Record<Role, number> = { editor: 1, admin: 2, owner: 3 };

function groups(newEnquiries: number): Group[] {
  return [
    { title: "", items: [{ href: "/admin/", label: "Dashboard", icon: HouseIcon, min: "editor" }] },
    {
      title: "Content",
      items: [
        { href: "/admin/pages/", label: "Pages", icon: FilesIcon, min: "editor" },
        { href: "/admin/programmes/", label: "Programmes", icon: GraduationCapIcon, min: "editor" },
        { href: "/admin/faculty/", label: "Faculty", icon: UsersThreeIcon, min: "editor" },
        { href: "/admin/testimonials/", label: "Testimonials", icon: QuotesIcon, min: "editor" },
        { href: "/admin/faqs/", label: "FAQs", icon: QuestionIcon, min: "editor" },
        { href: "/admin/blog/", label: "Blog", icon: NewspaperIcon, min: "editor" },
        { href: "/admin/resources/", label: "Resources", icon: FileArrowDownIcon, min: "editor" },
        { href: "/admin/media/", label: "Media library", icon: ImagesIcon, min: "editor" },
      ],
    },
    {
      title: "Leads",
      items: [
        { href: "/admin/enquiries/", label: "Enquiries", icon: TrayIcon, min: "editor", badge: newEnquiries },
        { href: "/admin/subscribers/", label: "Subscribers", icon: EnvelopeSimpleIcon, min: "editor" },
      ],
    },
    {
      title: "Site",
      items: [
        { href: "/admin/navigation/", label: "Navigation", icon: SignpostIcon, min: "admin" },
        { href: "/admin/redirects/", label: "Redirects", icon: ArrowsLeftRightIcon, min: "admin" },
        { href: "/admin/settings/", label: "Settings", icon: GearSixIcon, min: "admin" },
      ],
    },
    {
      title: "Team",
      items: [
        { href: "/admin/users/", label: "Users", icon: UsersIcon, min: "owner" },
        { href: "/admin/audit/", label: "Audit log", icon: ClockCounterClockwiseIcon, min: "owner" },
      ],
    },
  ];
}

function NavList({ role, newEnquiries, onNavigate }: { role: Role; newEnquiries: number; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = (href: string) => (href === "/admin/" ? pathname === "/admin/" || pathname === "/admin" : pathname.startsWith(href));
  return (
    <nav aria-label="Admin" className="flex flex-col gap-5">
      {groups(newEnquiries).map((group) => {
        const items = group.items.filter((item) => RANK[role] >= RANK[item.min]);
        if (items.length === 0) return null;
        return (
          <div key={group.title || "top"}>
            {group.title && <p className="px-3 pb-1.5 text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-white/50">{group.title}</p>}
            <ul className="grid gap-0.5">
              {items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active(item.href) ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-xl px-3 text-[0.9375rem] font-semibold transition-colors",
                      active(item.href) ? "bg-white text-navy" : "text-white/85 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    <item.icon className="size-5 shrink-0" weight={active(item.href) ? "fill" : "regular"} />
                    <span className="flex-1">{item.label}</span>
                    {item.badge ? (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-navy">
                        {item.badge}
                        <span className="sr-only"> new</span>
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

function AccountBlock({ name, email, roleLabel, onNavigate }: { name: string; email: string; roleLabel: string; onNavigate?: () => void }) {
  return (
    <div className="border-t border-white/10 pt-4">
      <Link href="/admin/account/" onClick={onNavigate} className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-white/85 hover:bg-white/10 hover:text-white">
        <UserCircleIcon className="size-6 shrink-0" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{name || email}</span>
          <span className="block text-xs text-white/60">{roleLabel}</span>
        </span>
      </Link>
      <a href="/" target="_blank" rel="noopener noreferrer" className="mt-0.5 flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-white/85 hover:bg-white/10 hover:text-white">
        <ArrowSquareOutIcon className="size-5 shrink-0" />
        View website<span className="sr-only"> (opens in a new tab)</span>
      </a>
      <form action={logoutAction}>
        <button type="submit" className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-white/85 hover:bg-white/10 hover:text-white">
          <SignOutIcon className="size-5 shrink-0" />
          Sign out
        </button>
      </form>
    </div>
  );
}

export function AdminShell({
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
  const [open, setOpen] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- closes the drawer after navigation
    setOpen(false);
  }, [pathname]);

  const brand = (
    <Link href="/admin/" className="flex items-center gap-3 rounded-lg px-1">
      <Image src="/images/brand/bca-mark-on-dark.svg" alt="" width={98} height={90} unoptimized className="h-9 w-auto" />
      <span className="font-display text-[0.9375rem] font-bold leading-tight text-white">
        Butterfly Coaching
        <span className="block text-xs font-semibold text-white/60">Website admin</span>
      </span>
    </Link>
  );

  return (
    <div className="min-h-dvh bg-page lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      {/* Desktop sidebar */}
      <aside className="on-dark sticky top-0 hidden h-dvh flex-col gap-6 overflow-y-auto bg-navy p-4 lg:flex">
        <div className="pt-1">{brand}</div>
        <div className="flex-1">
          <NavList role={user.role} newEnquiries={newEnquiries} />
        </div>
        <AccountBlock name={user.fullName} email={user.email} roleLabel={roleLabel} />
      </aside>

      <div className="min-w-0">
        {/* Mobile top bar and drawer */}
        <header className="on-dark sticky top-0 z-[var(--z-header)] flex h-14 items-center justify-between bg-navy pl-3 pr-2 lg:hidden">
          {brand}
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
              <button type="button" aria-label="Open admin menu" className="relative grid size-12 place-items-center rounded-full text-white hover:bg-white/10">
                <ListIcon weight="bold" className="size-6" />
                {newEnquiries > 0 && <span aria-hidden className="absolute right-2.5 top-2.5 size-2.5 rounded-full bg-accent" />}
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-[var(--z-overlay)] bg-black/50 data-[state=open]:animate-[fade-in_0.2s_ease-out]" />
              <Dialog.Content
                aria-describedby={undefined}
                className="on-dark fixed inset-y-0 right-0 z-[var(--z-overlay)] flex w-[min(20rem,100vw)] flex-col gap-4 overflow-y-auto bg-navy p-4 outline-none data-[state=open]:animate-[drawer-in_0.28s_var(--ease-out-soft)]"
              >
                <VisuallyHidden.Root>
                  <Dialog.Title>Admin menu</Dialog.Title>
                </VisuallyHidden.Root>
                <div className="flex items-center justify-between">
                  <span className="px-3 font-display text-lg font-bold text-white">Menu</span>
                  <Dialog.Close asChild>
                    <button type="button" aria-label="Close menu" className="grid size-12 place-items-center rounded-full text-white hover:bg-white/10">
                      <XIcon weight="bold" className="size-6" />
                    </button>
                  </Dialog.Close>
                </div>
                <div className="flex-1">
                  <NavList role={user.role} newEnquiries={newEnquiries} onNavigate={() => setOpen(false)} />
                </div>
                <AccountBlock name={user.fullName} email={user.email} roleLabel={roleLabel} onNavigate={() => setOpen(false)} />
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </header>

        {localMode && (
          <p className="flex items-center justify-center gap-2 bg-warning-soft px-4 py-2 text-center text-sm text-[#5c4300]">
            <ChatsCircleIcon aria-hidden className="size-4 shrink-0" />
            Local development mode: data lives on this computer only. Connect Supabase before going live.
          </p>
        )}
        <main id="content" className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 md:py-9 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
