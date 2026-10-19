"use client";

import { WarningCircleIcon } from "@phosphor-icons/react";
import { useActionState } from "react";
import { type AuthState, changeOwnPasswordAction, loginAction, setupAction, updateOwnNameAction } from "@/app/admin/actions/auth";

const EMPTY: AuthState = {};

function FormMessage({ state, success }: { state: AuthState; success?: boolean }) {
  if (!state.message) return null;
  if (success) {
    return (
      <p role="status" className="rounded-xl bg-success-soft px-4 py-3 text-[0.9375rem] font-semibold text-success">
        {state.message}
      </p>
    );
  }
  return (
    <p role="alert" className="flex gap-2.5 rounded-xl bg-danger-soft px-4 py-3 text-[0.9375rem] font-semibold text-danger">
      <WarningCircleIcon aria-hidden weight="fill" className="mt-0.5 size-5 shrink-0" />
      {state.message}
    </p>
  );
}

function Input({
  name,
  label,
  type = "text",
  autoComplete,
  state,
  help,
}: {
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  state: AuthState;
  help?: string;
}) {
  const error = state.errors?.[name];
  const id = `auth-${name}`;
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        defaultValue={type === "password" ? undefined : state.values?.[name]}
        required
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : help ? `${id}-help` : undefined}
        className="field-input"
      />
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

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, EMPTY);
  return (
    <form action={action} noValidate className="grid gap-5">
      <FormMessage state={state} />
      <Input name="email" label="Email" type="email" autoComplete="username" state={state} />
      <Input name="password" label="Password" type="password" autoComplete="current-password" state={state} />
      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? "Signing in" : "Sign in"}
      </button>
    </form>
  );
}

export function SetupForm() {
  const [state, action, pending] = useActionState(setupAction, EMPTY);
  return (
    <form action={action} noValidate className="grid gap-5">
      <FormMessage state={state} />
      <Input name="token" label="Setup token" type="password" autoComplete="off" state={state} help="The ADMIN_SETUP_TOKEN value from the server's environment settings." />
      <Input name="fullName" label="Your name" autoComplete="name" state={state} />
      <Input name="email" label="Email" type="email" autoComplete="username" state={state} />
      <Input name="password" label="Choose a password" type="password" autoComplete="new-password" state={state} help="At least 12 characters, with a letter and a number." />
      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? "Creating account" : "Create owner account"}
      </button>
    </form>
  );
}

export function NameForm({ fullName }: { fullName: string }) {
  const [state, action, pending] = useActionState(updateOwnNameAction, { values: { fullName } });
  const success = state.message === "Your name has been saved.";
  return (
    <form action={action} noValidate className="grid max-w-md gap-5">
      <FormMessage state={state} success={success} />
      <Input name="fullName" label="Your name" autoComplete="name" state={state} help="Shown in the admin, for example on the dashboard." />
      <button type="submit" disabled={pending} className="btn btn-primary btn-sm justify-self-start">
        {pending ? "Saving" : "Save name"}
      </button>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changeOwnPasswordAction, EMPTY);
  const success = Boolean(state.message) && !state.errors && state.message === "Your password has been changed.";
  return (
    <form action={action} noValidate className="grid max-w-md gap-5" key={success ? "done" : "form"}>
      <FormMessage state={state} success={success} />
      <Input name="current" label="Current password" type="password" autoComplete="current-password" state={state} />
      <Input name="password" label="New password" type="password" autoComplete="new-password" state={state} help="At least 12 characters, with a letter and a number." />
      <button type="submit" disabled={pending} className="btn btn-primary btn-sm justify-self-start">
        {pending ? "Saving" : "Change password"}
      </button>
    </form>
  );
}
