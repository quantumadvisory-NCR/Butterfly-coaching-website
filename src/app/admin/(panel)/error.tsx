"use client";

import { ArrowClockwiseIcon } from "@phosphor-icons/react";
import { useEffect } from "react";
import { Butterfly } from "@/components/ui/effects";

/** An admin screen that failed to load: say so plainly and offer to try again. */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[admin] screen failed", error);
  }, [error]);
  return (
    <div className="grid justify-items-center gap-4 rounded-3xl border border-line bg-surface px-6 py-16 text-center">
      <Butterfly sizes="64px" className="size-16 opacity-90" />
      <h1 className="text-2xl">This screen did not load</h1>
      <p className="max-w-md text-[0.9375rem] text-muted">
        Nothing you saved has been lost. Try again; if it keeps happening, check your connection or come back in a few minutes.
        {error.digest && <span className="mt-2 block text-xs">Reference: {error.digest}</span>}
      </p>
      <button type="button" onClick={reset} className="btn btn-primary btn-sm">
        <ArrowClockwiseIcon weight="bold" className="size-4" />
        Try again
      </button>
    </div>
  );
}
