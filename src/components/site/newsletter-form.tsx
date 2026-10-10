"use client";

import { CheckCircleIcon } from "@phosphor-icons/react";
import { usePathname } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { getFormToken, subscribeNewsletter } from "@/app/actions/forms";
import { track } from "@/lib/analytics";
import { IDLE } from "@/lib/validation/form-constants";

export function NewsletterForm({ consentText, idPrefix }: { consentText?: string; idPrefix: string }) {
  const pathname = usePathname();
  const [state, action, pending] = useActionState(subscribeNewsletter, IDLE);
  const [token, setToken] = useState("");
  const requested = useRef(false);
  const inputId = `${idPrefix}-newsletter-email`;
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
    if (state.status === "success") track("newsletter_signup", { page_path: pathname });
  }, [state.status, pathname]);

  if (state.status === "success") {
    return (
      <p role="status" className="flex items-center gap-3 rounded-field bg-white/10 px-4 py-3.5 font-semibold [.bg-sky_&]:bg-surface [.bg-surface_&]:bg-sky">
        <CheckCircleIcon aria-hidden weight="fill" className="size-6 shrink-0 text-accent [.bg-sky_&]:text-success [.bg-surface_&]:text-success" />
        {state.message}
      </p>
    );
  }

  return (
    <form action={action} onFocus={requestToken} onPointerDown={requestToken} noValidate className="w-full max-w-xl">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="sourcePath" value={pathname} />
      <div aria-hidden className="sr-only">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <label htmlFor={inputId} className="mb-1.5 block text-[0.9375rem] font-semibold">
        Email address
      </label>
      <div className="flex flex-col gap-3 min-[30rem]:flex-row">
        <input
          id={inputId}
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          defaultValue={state.values?.email}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : consentText ? `${inputId}-help` : undefined}
          className="field-input min-w-0 flex-1"
        />
        <button type="submit" disabled={pending} className="btn btn-primary shrink-0">
          {pending ? "Subscribing" : "Subscribe"}
        </button>
      </div>
      {error ? (
        <p id={`${inputId}-error`} role="alert" className="mt-2 text-sm font-semibold text-danger [.on-dark_&]:text-[#ffb4ab]">
          {error}
        </p>
      ) : (
        consentText && (
          <p id={`${inputId}-help`} className="mt-2 text-sm opacity-80">
            {consentText}
          </p>
        )
      )}
    </form>
  );
}
