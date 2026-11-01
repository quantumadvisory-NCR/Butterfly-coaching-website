"use client";

import { usePathname } from "next/navigation";
import { type ReactNode, useActionState, useEffect, useRef, useState } from "react";
import { getFormToken, requestGuide } from "@/app/actions/forms";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { IDLE } from "@/lib/validation/form-constants";

type Props = {
  /** "hero": a compact form inside the hero card. "panel": the larger form on the guide section. */
  variant: "hero" | "panel";
  label: ReactNode;
  idPrefix: string;
  formNote?: string;
};

function Check() {
  return (
    <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-accent">
      <svg viewBox="0 0 24 24" className="size-5 fill-none stroke-ink-deep" style={{ strokeWidth: 2.5, strokeLinecap: "round", strokeLinejoin: "round" }}>
        <path d="M5 12l5 5 9-10" />
      </svg>
    </span>
  );
}

function Form({ variant, label, idPrefix, formNote, onReset }: Props & { onReset: () => void }) {
  const pathname = usePathname();
  const [state, action, pending] = useActionState(requestGuide, IDLE);
  const [token, setToken] = useState("");
  const requested = useRef(false);
  const inputId = `${idPrefix}-guide-email`;
  const error = state.errors?.email ?? (state.status === "error" ? state.message : undefined);

  const requestToken = () => {
    if (requested.current) return;
    requested.current = true;
    getFormToken()
      .then(setToken)
      .catch(() => {
        requested.current = false;
      });
  };

  useEffect(() => {
    if (state.status === "success") track("generate_lead", { form_type: "guide", page_path: pathname });
  }, [state.status, pathname]);

  if (state.status === "success") {
    const email = state.values?.email;
    return (
      <div role="status" className={cn("flex items-center gap-3.5", variant === "panel" ? "rounded-[1.25rem] bg-white px-5 py-[1.125rem]" : "px-1 py-1.5")}>
        <Check />
        <div className="flex min-w-0 flex-col gap-0.5">
          <strong className="text-base text-ink-deep">Thank you. We&rsquo;ll send you the guide shortly.</strong>
          <span className="text-sm text-mauve">
            {email ? <>It will come to {email}. </> : null}
            <button type="button" onClick={onReset} className="cursor-pointer text-lav-deep underline underline-offset-2">
              Use another email
            </button>
          </span>
        </div>
      </div>
    );
  }

  return (
    <form action={action} onFocus={requestToken} onPointerDown={requestToken} noValidate className="m-0 flex flex-col gap-2.5">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="sourcePath" value={pathname} />
      <div aria-hidden className="sr-only">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <label htmlFor={inputId} className="flex items-start gap-2 text-sm font-semibold leading-snug text-[#2a2533]">
        {variant === "hero" && (
          <svg aria-hidden viewBox="0 0 24 24" className="mt-px size-[1.125rem] shrink-0 fill-none stroke-lav-deep" style={{ strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }}>
            <path d="M4 4h16v16H4z" />
            <path d="M4 6l8 7 8-7" />
          </svg>
        )}
        {/* One flex item, so a highlighted word never breaks the line on its own. */}
        <span>{label}</span>
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id={inputId}
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="you@email.com"
          defaultValue={state.values?.email}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : formNote ? `${inputId}-note` : undefined}
          className="min-h-12 min-w-0 flex-[1_1_13rem] rounded-full border-[1.5px] border-[#d9d3e6] bg-white px-5 font-text text-base font-medium text-ink-deep outline-none transition-[border-color,box-shadow] placeholder:text-[#6b6577] focus:border-lav-deep focus:shadow-[0_0_0_4px_var(--color-lav-100)] aria-[invalid=true]:border-danger"
        />
        <button type="submit" disabled={pending} className={cn("btn shrink-0 font-text text-[0.9375rem]", variant === "hero" ? "btn-secondary border-[1.5px] border-ink-deep text-ink-deep" : "btn-primary min-w-32")}>
          {pending ? "Sending" : variant === "hero" ? "Get the programme guide" : "Send it"}
          {!pending && variant === "panel" && (
            <span aria-hidden className="fx-arrow">
              →
            </span>
          )}
        </button>
      </div>
      {error ? (
        <p id={`${inputId}-error`} role="alert" className="text-sm font-semibold text-danger">
          {error}
        </p>
      ) : (
        formNote && (
          <p id={`${inputId}-note`} className="text-[0.8125rem] text-mauve-deep">
            {formNote}
          </p>
        )
      )}
    </form>
  );
}

/** The design's "Get the programme guide" email form. Requests arrive in Admin > Enquiries. */
export function GuideForm(props: Props) {
  // A new key starts a fresh form when the visitor chooses "Use another email".
  const [round, setRound] = useState(0);
  return <Form key={round} {...props} onReset={() => setRound((n) => n + 1)} />;
}
