"use client";

import { useState, useTransition } from "react";
import { createUserAction, deleteUserAction, resetUserPasswordAction, updateUserAction } from "@/app/admin/actions/operations";
import { cn } from "@/lib/utils";
import { ConfirmButton } from "./confirm-button";
import { Card, Notice, StatusBadge } from "./ui";

type User = { id: string; email: string; fullName: string; role: string; isActive: boolean; lastSignIn: string };
type RoleInfo = { value: string; label: string; description: string };

export function UsersManager({ users, roles, currentUserId }: { users: User[]; roles: RoleInfo[]; currentUserId: string }) {
  const [form, setForm] = useState({ fullName: "", email: "", role: "editor", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [resetFor, setResetFor] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [pending, startTransition] = useTransition();

  const run = (work: () => Promise<{ ok: boolean; message?: string; errors?: Record<string, string> }>, after?: () => void) =>
    startTransition(async () => {
      const result = await work();
      setMessage({ ok: result.ok, text: result.message ?? "" });
      setErrors(result.ok ? {} : (result.errors ?? {}));
      if (result.ok) after?.();
    });

  return (
    <div className="grid gap-6">
      {message?.text && <Notice tone={message.ok ? "success" : "danger"}>{message.text}</Notice>}

      <Card title="Team members">
        <ul className="-my-3 divide-y divide-line">
          {users.map((user) => {
            const self = user.id === currentUserId;
            return (
              <li key={user.id} className="grid gap-3 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-navy">
                    <span className="[overflow-wrap:anywhere]">{user.fullName || user.email}</span>
                    {self && <span className="rounded-full bg-tint px-2 py-0.5 text-xs font-bold text-primary-strong">You</span>}
                    {!user.isActive && <StatusBadge status="archived" label="Deactivated" />}
                  </p>
                  <p className="text-sm text-muted [overflow-wrap:anywhere]">
                    {user.email}. {user.lastSignIn ? `Last signed in ${user.lastSignIn}.` : "Has not signed in yet."}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label htmlFor={`role-${user.id}`} className="sr-only">
                    Role for {user.fullName || user.email}
                  </label>
                  <select
                    id={`role-${user.id}`}
                    value={user.role}
                    disabled={self || pending}
                    onChange={(event) => run(() => updateUserAction(user.id, { role: event.target.value, isActive: user.isActive }))}
                    className="field-input min-h-11 w-auto py-1.5"
                  >
                    {roles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  {!self && (
                    <>
                      <button type="button" className="btn btn-quiet btn-sm" disabled={pending} onClick={() => run(() => updateUserAction(user.id, { role: user.role, isActive: !user.isActive }))}>
                        {user.isActive ? "Deactivate" : "Reactivate"}
                      </button>
                      <button type="button" className="btn btn-quiet btn-sm" onClick={() => { setResetFor(resetFor === user.id ? null : user.id); setNewPassword(""); }}>
                        Reset password
                      </button>
                      <ConfirmButton
                        label="Delete"
                        title={`Delete ${user.fullName || user.email}?`}
                        description="They will lose access immediately. Their past changes stay in the audit log."
                        confirmLabel="Delete account"
                        action={() => deleteUserAction(user.id)}
                      />
                    </>
                  )}
                </div>
                {resetFor === user.id && (
                  <div className="rounded-xl bg-mist p-3 md:col-span-2">
                    <label htmlFor={`reset-${user.id}`} className="field-label">
                      New password for {user.fullName || user.email}
                    </label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input id={`reset-${user.id}`} type="text" autoComplete="off" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="field-input flex-1 font-mono" />
                      <button type="button" className="btn btn-dark btn-sm" disabled={pending || newPassword.length < 12} onClick={() => run(() => resetUserPasswordAction(user.id, newPassword), () => setResetFor(null))}>
                        Set password
                      </button>
                    </div>
                    <p className="field-help">At least 12 characters with a letter and a number. Share it securely and ask them to change it after signing in.</p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      <Card title="Add a team member">
        <form
          noValidate
          className="grid gap-5 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            run(() => createUserAction(form), () => setForm({ fullName: "", email: "", role: "editor", password: "" }));
          }}
        >
          {(
            [
              ["fullName", "Name", "text", "name"],
              ["email", "Email", "email", "off"],
            ] as const
          ).map(([name, label, type, autoComplete]) => (
            <div key={name}>
              <label htmlFor={`new-${name}`} className="field-label">
                {label}
              </label>
              <input
                id={`new-${name}`}
                type={type}
                autoComplete={autoComplete}
                value={form[name]}
                onChange={(event) => setForm({ ...form, [name]: event.target.value })}
                aria-invalid={Boolean(errors[name])}
                className="field-input"
              />
              {errors[name] && <p className="field-error">{errors[name]}</p>}
            </div>
          ))}
          <div>
            <label htmlFor="new-role" className="field-label">
              Role
            </label>
            <select id="new-role" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="field-input">
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
            <p className="field-help">{roles.find((role) => role.value === form.role)?.description}</p>
          </div>
          <div>
            <label htmlFor="new-password" className="field-label">
              Temporary password
            </label>
            <input
              id="new-password"
              type="text"
              autoComplete="off"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              aria-invalid={Boolean(errors.password)}
              className="field-input font-mono"
            />
            <p className={cn("field-help", errors.password && "hidden")}>At least 12 characters with a letter and a number.</p>
            {errors.password && <p className="field-error">{errors.password}</p>}
          </div>
          <div className="md:col-span-2">
            <button type="submit" disabled={pending} className="btn btn-primary btn-sm">
              {pending ? "Working" : "Create account"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
