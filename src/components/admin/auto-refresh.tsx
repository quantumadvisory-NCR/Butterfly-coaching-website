"use client";

import { ArrowClockwiseIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { LiveDot } from "@/components/ui/effects";
import { cn } from "@/lib/utils";

const time = (date: Date) => date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

/**
 * Keeps a read-only screen (the dashboard) current: it reloads its figures
 * every few minutes while the tab is visible and on returning to the tab, and
 * says when they were last brought up to date. Never used on editing screens.
 */
export function AutoRefresh({ everyMs = 120_000, className }: { everyMs?: number; className?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [updated, setUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let last = Date.now();
    let soon: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      last = Date.now();
      startTransition(() => {
        router.refresh();
        setUpdated(new Date());
      });
    };
    // A refresh started just as someone clicks a link would make the click wait for it, so
    // a click cancels a refresh that is about to start.
    const cancelSoon = (event: PointerEvent) => {
      if ((event.target as Element | null)?.closest?.("a[href]")) clearTimeout(soon);
    };
    // The page arrived just now; the clock starts from here.
    const first = setTimeout(() => setUpdated(new Date()), 0);
    const timer = setInterval(() => document.visibilityState === "visible" && Date.now() - last >= everyMs - 1000 && refresh(), everyMs);
    // Back on the tab: refresh after a moment, and only if the figures are out of date.
    const onVisible = () => {
      if (document.visibilityState !== "visible" || Date.now() - last < everyMs) return;
      clearTimeout(soon);
      soon = setTimeout(refresh, 1500);
    };
    document.addEventListener("visibilitychange", onVisible);
    document.addEventListener("pointerdown", cancelSoon, true);
    return () => {
      clearTimeout(first);
      clearTimeout(soon);
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      document.removeEventListener("pointerdown", cancelSoon, true);
    };
  }, [everyMs, router]);

  return (
    <p className={cn("flex items-center gap-2 text-xs font-semibold", className)}>
      <LiveDot />
      <span>
        Live{updated ? ` · updated ${time(updated)}` : ""}
        <span className="sr-only">. The figures refresh every {Math.round(everyMs / 60000)} minutes.</span>
      </span>
      <button
        type="button"
        onClick={() =>
          startTransition(() => {
            router.refresh();
            setUpdated(new Date());
          })
        }
        aria-label="Refresh the figures now"
        className="grid size-8 place-items-center rounded-full hover:bg-white/10"
      >
        <ArrowClockwiseIcon weight="bold" className={cn("size-3.5", pending && "animate-spin")} />
      </button>
    </p>
  );
}
