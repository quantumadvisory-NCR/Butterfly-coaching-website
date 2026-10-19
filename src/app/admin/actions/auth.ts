"use server";

import { timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { assertUser, createStaffUser, getSessionUser, passwordProblem, setStaffPassword, signIn, signOut, staffCount } from "@/lib/auth";
import { rateLimit } from "@/lib/security";

export type AuthState = { message?: string; errors?: Record<string, string>; values?: Record<string, string> };

const credentials = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credentials.safeParse(Object.fromEntries(formData));
  const email = String(formData.get("email") ?? "");
  if (!parsed.success) {
    return { errors: Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])), values: { email } };
  }
  // Limit guesses per visitor and per account.
  const allowed = (await rateLimit("login", 10, 15 * 60)) && (await rateLimit("login-email", 8, 15 * 60, parsed.data.email));
  if (!allowed) return { message: "Too many sign-in attempts. Please wait 15 minutes and try again.", values: { email } };

  const ok = await signIn(parsed.data.email, parsed.data.password);
  if (!ok) {
    await logAudit({ user: null, action: "login.failed", summary: `Failed sign-in for ${parsed.data.email}` });
    // One message for every failure, so the form never reveals which accounts exist.
    return { message: "That email and password do not match an active account.", values: { email } };
  }
  const user = await getSessionUser();
  await logAudit({ user, action: "login", summary: "Signed in" });
  redirect("/admin/");
}

export async function logoutAction() {
  const user = await getSessionUser();
  await signOut();
  if (user) await logAudit({ user, action: "logout", summary: "Signed out" });
  redirect("/admin/login/");
}

const setupSchema = z.object({
  token: z.string().min(1, "Enter the setup token."),
  fullName: z.string().trim().min(2, "Enter your name.").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string(),
});

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/**
 * Creates the first administrator. Only works while there are no staff
 * accounts at all, and only for someone who holds ADMIN_SETUP_TOKEN, so a
 * stranger can never claim a freshly deployed site.
 */
export async function setupAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const values = { fullName: String(formData.get("fullName") ?? ""), email: String(formData.get("email") ?? "") };
  if ((await staffCount()) > 0) return { message: "Setup has already been completed. Please sign in instead." };
  if (!(await rateLimit("setup", 10, 15 * 60))) return { message: "Too many attempts. Please wait 15 minutes and try again.", values };

  const expected = process.env.ADMIN_SETUP_TOKEN;
  if (!expected || expected.length < 16) {
    return { message: "ADMIN_SETUP_TOKEN is not configured on the server. Add it to the environment and redeploy. See docs/ADMIN_SETUP.md.", values };
  }
  const parsed = setupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])), values };
  }
  if (!safeEqual(parsed.data.token, expected)) return { errors: { token: "That setup token is not correct." }, values };
  const problem = passwordProblem(parsed.data.password);
  if (problem) return { errors: { password: problem }, values };

  let id: string;
  try {
    id = await createStaffUser({ email: parsed.data.email, password: parsed.data.password, fullName: parsed.data.fullName, role: "owner" });
  } catch (error) {
    // Almost always a configuration problem (wrong Supabase address or keys). Say so, rather than showing a crash page.
    console.error("[setup] could not create the owner account:", error);
    return {
      message:
        "The account could not be created because the sign-in service refused the request. This usually means the Supabase address or keys are not set correctly on the server. Check them, redeploy and try again.",
      values,
    };
  }
  await logAudit({ user: { id, email: parsed.data.email }, action: "setup", entityType: "user", entityId: id, summary: "Created the first owner account" });
  await signIn(parsed.data.email, parsed.data.password);
  redirect("/admin/");
}

export async function changeOwnPasswordAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  let user;
  try {
    user = await assertUser();
  } catch {
    return { message: "Your session has expired. Please sign in again." };
  }
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("password") ?? "");
  const problem = passwordProblem(next);
  if (problem) return { errors: { password: problem } };
  if (!(await rateLimit("password-change", 6, 15 * 60, user.id))) return { message: "Too many attempts. Please wait 15 minutes." };
  if (!(await signIn(user.email, current))) return { errors: { current: "Your current password is not correct." } };
  await setStaffPassword(user.id, next);
  await signIn(user.email, next);
  await logAudit({ user, action: "password.change", entityType: "user", entityId: user.id, summary: "Changed own password" });
  return { message: "Your password has been changed." };
}
