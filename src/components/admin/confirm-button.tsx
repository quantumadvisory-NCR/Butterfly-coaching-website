"use client";

import { AlertDialog } from "radix-ui";
import { type ReactNode, useState, useTransition } from "react";
import { cn } from "@/lib/utils";

type Result = { ok: boolean; message?: string };

/**
 * A button that asks for confirmation before running an action. Used for
 * anything destructive or publicly visible (delete, unpublish, archive).
 */
export function ConfirmButton({
  label,
  title,
  description,
  confirmLabel,
  action,
  onDone,
  tone = "danger",
  className,
  icon,
}: {
  label: string;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  action: () => Promise<Result>;
  onDone?: (result: Result) => void;
  tone?: "danger" | "neutral";
  className?: string;
  icon?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError("");
      }}
    >
      <AlertDialog.Trigger asChild>
        <button type="button" className={cn("btn btn-quiet btn-sm", tone === "danger" && "text-danger hover:border-danger", className)}>
          {icon}
          {label}
        </button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-[var(--z-overlay)] bg-navy/50 data-[state=open]:animate-[fade-in_0.2s_ease-out]" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-[var(--z-overlay)] max-h-[88dvh] w-[min(30rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-surface p-6 shadow-lift outline-none">
          <AlertDialog.Title className="text-xl">{title}</AlertDialog.Title>
          <AlertDialog.Description asChild>
            <div className="mt-2 text-[0.9375rem] text-ink">{description}</div>
          </AlertDialog.Description>
          {error && (
            <p role="alert" className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-sm font-semibold text-danger">
              {error}
            </p>
          )}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Cancel asChild>
              <button type="button" className="btn btn-quiet btn-sm">
                Cancel
              </button>
            </AlertDialog.Cancel>
            <button
              type="button"
              disabled={pending}
              className={cn("btn btn-sm", tone === "danger" ? "btn-danger" : "btn-blue")}
              onClick={() =>
                startTransition(async () => {
                  const result = await action();
                  if (result.ok) {
                    setOpen(false);
                    onDone?.(result);
                  } else setError(result.message ?? "That did not work. Please try again.");
                })
              }
            >
              {pending ? "Working" : confirmLabel}
            </button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
