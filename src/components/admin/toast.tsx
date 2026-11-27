"use client";

import { CheckCircleIcon, InfoIcon, WarningCircleIcon, XIcon } from "@phosphor-icons/react";
import { type ReactNode, createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/*
 * Short confirmations ("Uploaded 3 files") that slide in at the bottom right and
 * leave on their own. They are announced to screen readers, pause while the
 * pointer is over them, and never carry the only copy of an error: forms keep
 * their own messages beside the fields.
 */

type Tone = "success" | "error" | "info";
type Toast = { id: number; tone: Tone; title: string; detail?: string };
type Show = (toast: Omit<Toast, "id">) => void;

const ToastContext = createContext<Show | null>(null);

/** Shows a toast. Outside the admin shell (for example in a test) it does nothing. */
export function useToast(): Show {
  return useContext(ToastContext) ?? (() => {});
}

const ICONS = { success: CheckCircleIcon, error: WarningCircleIcon, info: InfoIcon } as const;
const LIFETIME_MS = 5000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const next = useRef(1);

  const dismiss = useCallback((id: number) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((all) => all.filter((t) => t.id !== id));
  }, []);

  const schedule = useCallback((id: number) => timers.current.set(id, setTimeout(() => dismiss(id), LIFETIME_MS)), [dismiss]);

  const show = useCallback<Show>(
    (toast) => {
      const id = next.current++;
      setToasts((all) => [...all.slice(-3), { ...toast, id }]);
      schedule(id);
    },
    [schedule],
  );

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ol aria-live="polite" aria-label="Notifications" className="admin-toasts pointer-events-none fixed bottom-24 right-4 z-[var(--z-toast)] grid w-[min(24rem,calc(100vw-2rem))] gap-2">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.tone];
          return (
            <li
              key={toast.id}
              role={toast.tone === "error" ? "alert" : "status"}
              onMouseEnter={() => clearTimeout(timers.current.get(toast.id))}
              onMouseLeave={() => schedule(toast.id)}
              className="admin-toast pointer-events-auto flex items-start gap-3 rounded-2xl border border-white/10 bg-[#1b1b1b]/95 py-3 pl-4 pr-2 text-white shadow-[0_18px_40px_-12px_rgb(0_0_0/0.45)] backdrop-blur"
            >
              <Icon
                aria-hidden
                weight="fill"
                className={cn("mt-0.5 size-5 shrink-0", toast.tone === "success" ? "text-[#5fd39b]" : toast.tone === "error" ? "text-[#ff8a80]" : "text-accent")}
              />
              <div className="min-w-0 flex-1">
                <p className="text-[0.9375rem] font-semibold leading-snug [overflow-wrap:anywhere]">{toast.title}</p>
                {toast.detail && <p className="mt-0.5 text-sm leading-snug text-white/70 [overflow-wrap:anywhere]">{toast.detail}</p>}
              </div>
              <button type="button" onClick={() => dismiss(toast.id)} aria-label="Dismiss" className="grid size-8 shrink-0 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white">
                <XIcon weight="bold" className="size-4" />
              </button>
            </li>
          );
        })}
      </ol>
    </ToastContext.Provider>
  );
}
