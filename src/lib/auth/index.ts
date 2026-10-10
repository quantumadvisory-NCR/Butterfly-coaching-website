/**
 * Authentication and authorisation. Every admin page and every server action
 * goes through requireUser(); nothing relies on client-side checks.
 */
import "server-only";
import { randomUUID } from "node:crypto";
import { count, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/lib/db";
import { type Role, profiles } from "@/lib/db/schema";
import { backendMode } from "@/lib/env";
import { localSetPassword, localSignIn, localSignOut, localUserId } from "./local";
import {
  supabaseCreateUser,
  supabaseDeleteUser,
  supabaseSetPassword,
  supabaseSignIn,
  supabaseSignOut,
  supabaseUserId,
} from "./supabase";

export type SessionUser = { id: string; email: string; fullName: string; role: Role };

const RANK: Record<Role, number> = { editor: 1, admin: 2, owner: 3 };

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  admin: "Administrator",
  editor: "Editor",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  owner: "Everything, including managing users and viewing the audit log.",
  admin: "All content plus settings, navigation, redirects, lead exports and deleting media.",
  editor: "Pages, programmes, blog, testimonials, FAQs, media uploads and the enquiry inbox.",
};

export function hasRole(user: Pick<SessionUser, "role">, minimum: Role) {
  return RANK[user.role] >= RANK[minimum];
}

function mode() {
  const m = backendMode();
  if (m === "unconfigured") {
    throw new Error("No backend is configured. Set the Supabase variables or BCA_LOCAL_MODE=1. See .env.example.");
  }
  return m;
}

/** The signed-in staff member for this request, or null. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const userId = mode() === "supabase" ? await supabaseUserId() : await localUserId();
  if (!userId) return null;
  const [profile] = await db().select().from(profiles).where(eq(profiles.id, userId)).limit(1);
  if (!profile || !profile.isActive) return null;
  return { id: profile.id, email: profile.email, fullName: profile.fullName, role: profile.role };
});

export class ForbiddenError extends Error {
  constructor(message = "You do not have permission to do that.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/** Use in pages and layouts: redirects to the login screen when signed out. */
export async function requireUser(minimum: Role = "editor"): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login/");
  if (!hasRole(user, minimum)) redirect("/admin/?denied=1");
  return user;
}

/** Use in server actions and route handlers: throws instead of redirecting. */
export async function assertUser(minimum: Role = "editor"): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new ForbiddenError("Your session has expired. Please sign in again.");
  if (!hasRole(user, minimum)) throw new ForbiddenError();
  return user;
}

export async function signIn(email: string, password: string): Promise<boolean> {
  const userId = mode() === "supabase" ? await supabaseSignIn(email, password) : await localSignIn(email, password);
  if (!userId) return false;
  const [profile] = await db().select().from(profiles).where(eq(profiles.id, userId)).limit(1);
  if (!profile || !profile.isActive) {
    await signOut();
    return false;
  }
  await db().update(profiles).set({ lastSignInAt: new Date() }).where(eq(profiles.id, userId));
  return true;
}

export async function signOut() {
  if (mode() === "supabase") await supabaseSignOut();
  else await localSignOut();
}

export async function staffCount(): Promise<number> {
  const [row] = await db().select({ n: count() }).from(profiles);
  return row?.n ?? 0;
}

export async function createStaffUser(input: { email: string; password: string; fullName: string; role: Role }) {
  const email = input.email.trim().toLowerCase();
  if (mode() === "supabase") {
    const id = await supabaseCreateUser(email, input.password);
    try {
      await db().insert(profiles).values({ id, email, fullName: input.fullName, role: input.role });
    } catch (error) {
      await supabaseDeleteUser(id).catch(() => {});
      throw error;
    }
    return id;
  }
  const id = randomUUID();
  await db().transaction(async (tx) => {
    await tx.insert(profiles).values({ id, email, fullName: input.fullName, role: input.role });
  });
  await localSetPassword(id, input.password);
  return id;
}

export async function setStaffPassword(userId: string, password: string) {
  if (mode() === "supabase") await supabaseSetPassword(userId, password);
  else await localSetPassword(userId, password);
}

export async function deleteStaffUser(userId: string) {
  if (mode() === "supabase") await supabaseDeleteUser(userId).catch(() => {});
  await db().delete(profiles).where(eq(profiles.id, userId));
}

/** Password rules shared by setup, user creation and password changes. */
export function passwordProblem(password: string): string | null {
  if (password.length < 12) return "Use at least 12 characters.";
  if (!/[a-z]/i.test(password) || !/\d/.test(password)) return "Include at least one letter and one number.";
  return null;
}
