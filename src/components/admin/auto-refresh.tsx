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
    const refresh = () =>
      startTransition(() => {
        router.refresh();
        setUpdated(new Date());
      });
    // The page arrived just now; the clock starts from here.
    const first = setTimeout(() => setUpdated(new Date()), 0);
    const timer = setInterval(() => document.visibilityState === "visible" && refresh(), everyMs);
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
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
