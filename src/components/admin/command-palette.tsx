"use client";

import { ArrowRightIcon, ArrowSquareOutIcon, MagnifyingGlassIcon, SpinnerGapIcon } from "@phosphor-icons/react";
import { Dialog, VisuallyHidden } from "radix-ui";
import { type Dispatch, type SetStateAction, useEffect, useId, useMemo, useRef, useState } from "react";
import type { SearchHit } from "@/lib/admin/search";
import type { Role } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { CREATE, NAV, type NavItem, allowed } from "./nav";

type Option = { key: string; section: string; label: string; detail?: string; href: string; icon?: NavItem["icon"]; external?: boolean };

const words = (text: string) => text.toLowerCase().split(/\s+/).filter(Boolean);
const fits = (query: string, text: string) => words(query).every((word) => text.toLowerCase().includes(word));

/**
 * Search everything in the admin, or jump anywhere, from the keyboard
 * (Ctrl+K or ⌘K). Menu items and "create" actions match instantly; pages,
 * programmes, people, enquiries and files are searched on the server as you type.
 */
export function CommandPalette({
  role,
  open,
  setOpen,
  navigate,
}: {
  role: Role;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  /** Opens an admin address; the shell shows a progress bar until the screen arrives. */
  navigate: (href: string) => void;
}) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<{ query: string; hits: SearchHit[] }>({ query: "", hits: [] });
  const [active, setActive] = useState(0);
  const q = query.trim();
  const searching = q.length >= 2 && answer.query !== q;
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  // Server search, debounced. Each new keystroke cancels the request before it, so an older
  // answer never replaces a newer one and the server never works on a search nobody wants.
  useEffect(() => {
    if (q.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        // POST, so what was typed (often a person's name or email) never appears in an address or a request log.
        const response = await fetch("/api/admin/search/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ q }),
          signal: controller.signal,
          cache: "no-store",
        });
        const result = (await response.json()) as { ok: boolean; hits?: SearchHit[] };
        setAnswer({ query: q, hits: result.ok && result.hits ? result.hits : [] });
      } catch {
        if (!controller.signal.aborted) setAnswer({ query: q, hits: [] });
      }
    }, 160);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q]);

  const options = useMemo<Option[]>(() => {
    const menu = NAV.flatMap((group) =>
      group.items
        .filter((item) => allowed(role, item.min) && (!q || fits(q, `${item.label} ${group.title} ${item.keywords ?? ""}`)))
        .map((item) => ({ key: `go:${item.href}`, section: "Go to", label: item.label, detail: group.title || undefined, href: item.href, icon: item.icon })),
    );
    const create = CREATE.filter((item) => allowed(role, item.min) && (!q || fits(q, `${item.label} ${item.keywords ?? ""}`))).map((item) => ({
      key: `new:${item.href}`,
      section: "Create",
      label: item.label,
      href: item.href,
      icon: item.icon,
    }));
    const site = !q || fits(q, "view website live site open") ? [{ key: "site", section: "Website", label: "View the website", detail: "Opens in a new tab", href: "/", icon: ArrowSquareOutIcon, external: true }] : [];
    const found = (q.length >= 2 && answer.query === q ? answer.hits : []).map((hit, i) => ({ key: `hit:${i}:${hit.href}`, section: hit.group, label: hit.title, detail: hit.detail, href: hit.href }));
    return [...(q ? found : []), ...menu.slice(0, q ? 6 : 8), ...create, ...site];
  }, [q, answer, role]);

  // The highlight returns to the top whenever the results change.
  const [seen, setSeen] = useState(options);
  if (seen !== options) {
    setSeen(options);
    setActive(0);
  }

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const choose = (option: Option | undefined) => {
    if (!option) return;
    setOpen(false);
    setQuery("");
    if (option.external) window.open(option.href, "_blank", "noopener,noreferrer");
    else navigate(option.href);
  };

  let lastSection = "";

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[var(--z-overlay)] bg-[#141414]/50 backdrop-blur-[3px] data-[state=open]:animate-[fade-in_0.15s_ease-out]" />
        <Dialog.Content
          aria-describedby={undefined}
          className="admin-palette fixed left-1/2 top-[max(1rem,10vh)] z-[var(--z-overlay)] flex max-h-[min(36rem,80dvh)] w-[min(40rem,calc(100vw-1.5rem))] -translate-x-1/2 flex-col overflow-hidden rounded-3xl border border-white/60 bg-surface shadow-[0_30px_80px_-20px_rgb(0_0_0/0.45)] outline-none"
        >
          <VisuallyHidden.Root>
            <Dialog.Title>Search the admin</Dialog.Title>
          </VisuallyHidden.Root>
          <div className="flex items-center gap-3 border-b border-line px-4">
            {searching ? <SpinnerGapIcon aria-hidden className="size-5 shrink-0 animate-spin text-muted" /> : <MagnifyingGlassIcon aria-hidden className="size-5 shrink-0 text-muted" />}
            <input
              autoFocus
              role="combobox"
              aria-expanded
              aria-controls={listId}
              aria-activedescendant={options[active] ? `${listId}-${active}` : undefined}
              aria-label="Search pages, programmes, people, enquiries and files"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setActive((i) => Math.min(options.length - 1, i + 1));
                } else if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setActive((i) => Math.max(0, i - 1));
                } else if (event.key === "Enter") {
                  event.preventDefault();
                  choose(options[active]);
                }
              }}
              placeholder="Search pages, programmes, people, enquiries, files…"
              className="min-h-14 flex-1 bg-transparent text-base text-navy outline-none placeholder:text-muted"
            />
            <kbd className="hidden rounded-md border border-line bg-mist px-1.5 py-0.5 text-[0.6875rem] font-semibold text-muted sm:inline">Esc</kbd>
          </div>
          <ul ref={listRef} id={listId} role="listbox" aria-label="Results" className="flex-1 overflow-y-auto overscroll-contain p-2">
            {options.length === 0 && !searching && <li className="px-3 py-10 text-center text-sm text-muted">Nothing matches “{q}”.</li>}
            {options.map((option, index) => {
              const heading = option.section !== lastSection ? option.section : null;
              lastSection = option.section;
              const Icon = option.icon;
              return (
                <li key={option.key} role="presentation">
                  {heading && <p className="px-3 pb-1 pt-3 text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-muted first:pt-1">{heading}</p>}
                  <div
                    id={`${listId}-${index}`}
                    role="option"
                    aria-selected={index === active}
                    data-index={index}
                    onMouseMove={() => setActive(index)}
                    onClick={() => choose(option)}
                    className={cn("flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl px-3 py-2", index === active ? "bg-navy text-white" : "text-navy")}
                  >
                    <span aria-hidden className={cn("grid size-8 shrink-0 place-items-center rounded-xl", index === active ? "bg-white/10 text-accent" : "bg-mist")}>
                      {Icon ? <Icon weight="bold" className="size-4" /> : <ArrowRightIcon weight="bold" className="size-4" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.9375rem] font-semibold">{option.label}</span>
                      {option.detail && <span className={cn("block truncate text-xs", index === active ? "text-white/65" : "text-muted")}>{option.detail}</span>}
                    </span>
                    {index === active && <kbd className="hidden rounded-md bg-white/10 px-1.5 py-0.5 text-[0.6875rem] font-semibold sm:inline">Enter</kbd>}
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="hidden border-t border-line bg-[#faf9f6] px-4 py-2 text-xs text-muted sm:block">
            <kbd className="font-semibold">↑</kbd> <kbd className="font-semibold">↓</kbd> to move · <kbd className="font-semibold">Enter</kbd> to open · <kbd className="font-semibold">Ctrl K</kbd> anywhere to search
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
