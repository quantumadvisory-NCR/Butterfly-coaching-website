"use client";

import { CircleNotchIcon, WarningCircleIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useActionState, useEffect, useId, useRef, useState } from "react";
import { getFormToken, submitEnquiry } from "@/app/actions/forms";
import { readUtm, track } from "@/lib/analytics";
import { ENQUIRY_LABELS, IDLE, TEAM_SIZES } from "@/lib/validation/form-constants";
import { cn } from "@/lib/utils";

type EnquiryType = keyof typeof ENQUIRY_LABELS;

type Props = {
  type: EnquiryType;
  programmes: { id: string; name: string }[];
  /** Pre-selects a programme, e.g. on that programme's own page. */
  defaultProgrammeId?: string;
  submitLabel?: string;
};

const INTENTS = new Set(Object.keys(ENQUIRY_LABELS));

function Field({
  id,
  label,
  error,
  help,
  optional,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  help?: string;
  optional?: boolean;
  children: (describedBy: string | undefined) => React.ReactNode;
}) {
  const describedBy = [error && `${id}-error`, help && `${id}-help`].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label} {optional && <span className="font-normal text-muted">(optional)</span>}
      </label>
      {children(describedBy)}
      {help && !error && (
        <p id={`${id}-help`} className="field-help">
          {help}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

function EnquiryFormInner({ type: baseType, programmes, defaultProgrammeId, submitLabel }: Props) {
  const uid = useId();
  const pathname = usePathname();
  const search = useSearchParams();
  const intent = search.get("intent");
  // ?intent=discovery_call lets any "Book a discovery call" button reuse the contact form.
  const type = (intent && INTENTS.has(intent) ? intent : baseType) as EnquiryType;

  const [state, action, pending] = useActionState(submitEnquiry, IDLE);
  const [token, setToken] = useState("");
  const tokenRequested = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const errors = state.errors ?? {};
  const v = state.values ?? {};

  const requestToken = () => {
    if (tokenRequested.current) return;
    tokenRequested.current = true;
    getFormToken()
      .then(setToken)
      .catch(() => {
        tokenRequested.current = false;
      });
  };

  // After a failed submission, move focus to the first field with a problem.
  useEffect(() => {
    if (state.status !== "error") return;
    const first = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    (first ?? formRef.current?.querySelector<HTMLElement>('[role="alert"]'))?.focus();
  }, [state]);

  const id = (name: string) => `${uid}-${name}`;
  const corporate = type === "corporate";
  const showProgramme = !corporate && type !== "general" && programmes.length > 0;
  const messageLabel = corporate
    ? "What would you like to achieve?"
    : type === "discovery_call"
      ? "What would you like to talk about?"
      : "Your message";

  return (
    <form
      ref={formRef}
      action={action}
      onFocus={requestToken}
      onPointerDown={requestToken}
      onSubmit={() => track("form_submit", { form_type: type, page_path: pathname })}
      noValidate
      className="grid gap-5"
    >
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="sourcePath" value={pathname} />
      <UtmFields />
      {/* Honeypot. Hidden from people and assistive technology; bots tend to fill it. */}
      <div aria-hidden className="sr-only">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {type !== baseType && (
        <p className="rounded-field bg-tint px-4 py-3 text-sm font-semibold text-navy">{ENQUIRY_LABELS[type]}</p>
      )}

      {state.status === "error" && state.message && (
        <div role="alert" tabIndex={-1} className="flex gap-3 rounded-field bg-danger-soft px-4 py-3 text-danger outline-none">
          <WarningCircleIcon aria-hidden weight="fill" className="mt-0.5 size-5 shrink-0" />
          <p className="font-semibold">{state.message}</p>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id={id("name")} label="Full name" error={errors.name}>
          {(describedBy) => (
            <input
              id={id("name")}
              name="name"
              type="text"
              required
              autoComplete="name"
              defaultValue={v.name}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={describedBy}
              className="field-input"
            />
          )}
        </Field>
        <Field id={id("email")} label="Email" error={errors.email}>
          {(describedBy) => (
            <input
              id={id("email")}
              name="email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              defaultValue={v.email}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={describedBy}
              className="field-input"
            />
          )}
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id={id("phone")} label="Phone or WhatsApp" error={errors.phone} optional>
          {(describedBy) => (
            <input
              id={id("phone")}
              name="phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              defaultValue={v.phone}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={describedBy}
              className="field-input"
            />
          )}
        </Field>
        {showProgramme && (
          <Field id={id("programmeId")} label="I am interested in" error={errors.programmeId} optional>
            {(describedBy) => (
              <select
                id={id("programmeId")}
                name="programmeId"
                defaultValue={v.programmeId ?? defaultProgrammeId ?? ""}
                aria-describedby={describedBy}
                className="field-input"
              >
                <option value="">Not sure yet</option>
                {programmes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
        )}
        {corporate && (
          <Field id={id("organisation")} label="Organisation" error={errors.organisation}>
            {(describedBy) => (
              <input
                id={id("organisation")}
                name="organisation"
                type="text"
                required
                autoComplete="organization"
                defaultValue={v.organisation}
                aria-invalid={Boolean(errors.organisation)}
                aria-describedby={describedBy}
                className="field-input"
              />
            )}
          </Field>
        )}
      </div>

      {corporate && (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id={id("roleTitle")} label="Your role" error={errors.roleTitle} optional>
            {(describedBy) => (
              <input
                id={id("roleTitle")}
                name="roleTitle"
                type="text"
                autoComplete="organization-title"
                defaultValue={v.roleTitle}
                aria-describedby={describedBy}
                className="field-input"
              />
            )}
          </Field>
          <Field id={id("teamSize")} label="How many people would take part?" error={errors.teamSize} optional>
            {(describedBy) => (
              <select id={id("teamSize")} name="teamSize" defaultValue={v.teamSize ?? ""} aria-describedby={describedBy} className="field-input">
                <option value="">Not sure yet</option>
                {TEAM_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>
      )}

      <Field id={id("message")} label={messageLabel} error={errors.message} optional={type !== "general"}>
        {(describedBy) => (
          <textarea
            id={id("message")}
            name="message"
            rows={5}
            required={type === "general"}
            defaultValue={v.message}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={describedBy}
            className="field-input"
          />
        )}
      </Field>

      <label className="flex cursor-pointer items-start gap-3 text-[0.9375rem]">
        <input
          type="checkbox"
          name="consentMarketing"
          defaultChecked={v.consentMarketing === "on"}
          className="mt-0.5 size-5 shrink-0 rounded border-2 border-[#8a8f8d] accent-[var(--color-primary)]"
        />
        <span>Send me occasional emails about coaching and upcoming cohorts.</span>
      </label>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button type="submit" disabled={pending} className={cn("btn btn-primary sm:min-w-44", pending && "cursor-progress")}>
          {pending && <CircleNotchIcon aria-hidden className="size-5 animate-spin" />}
          {pending ? "Sending" : (submitLabel ?? (type === "discovery_call" ? "Request my call" : "Send enquiry"))}
        </button>
        <p className="max-w-sm text-sm text-muted">
          We use your details only to reply to you. See our{" "}
          <Link href="/privacy-policy/" className="font-semibold text-navy underline">
            privacy policy
          </Link>
          .
        </p>
      </div>
      <noscript>
        <p className="field-error">This form needs JavaScript. You can also reach us by phone, WhatsApp or email.</p>
      </noscript>
    </form>
  );
}

/** Campaign parameters and referrer, read after hydration so the page itself stays cacheable. */
function UtmFields() {
  const [fields, setFields] = useState({ utm: "", referrer: "" });
  useEffect(() => {
    const utm = readUtm();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads browser-only storage once after mount
    setFields({
      utm: Object.keys(utm).length ? JSON.stringify(utm) : "",
      referrer: document.referrer && !document.referrer.startsWith(window.location.origin) ? document.referrer.slice(0, 500) : "",
    });
  }, []);
  return (
    <>
      <input type="hidden" name="utm" value={fields.utm} />
      <input type="hidden" name="referrer" value={fields.referrer} />
    </>
  );
}

export function EnquiryForm(props: Props) {
  // useSearchParams needs a Suspense boundary so static pages can still prerender.
  return (
    <Suspense fallback={<div className="min-h-96" aria-hidden />}>
      <EnquiryFormInner {...props} />
    </Suspense>
  );
}
