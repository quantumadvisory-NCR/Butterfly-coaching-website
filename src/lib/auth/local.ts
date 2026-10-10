/**
 * Local development sign-in. Used only when BCA_LOCAL_MODE=1 and Supabase is
 * not configured. Passwords are hashed with scrypt; the session is a signed,
 * http-only cookie. Production uses Supabase Auth (see supabase.ts).
 */
import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { localCredentials, profiles } from "@/lib/db/schema";
import { sessionSecret } from "@/lib/env";
import { hashPassword, verifyPassword } from "./password";

const COOKIE = "bca_session";
const MAX_AGE = 60 * 60 * 24 * 7;

const sign = (payload: string) => createHmac("sha256", sessionSecret()).update(payload).digest("base64url");

function encode(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp: Date.now() + MAX_AGE * 1000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decode(token: string | undefined): string | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const { uid, exp } = JSON.parse(Buffer.from(payload, "base64url").toString()) as { uid: string; exp: number };
    return typeof uid === "string" && exp > Date.now() ? uid : null;
  } catch {
    return null;
  }
}

export async function localUserId(): Promise<string | null> {
  return decode((await cookies()).get(COOKIE)?.value);
}

export async function localSignIn(email: string, password: string): Promise<string | null> {
  const [row] = await db()
    .select({ id: profiles.id, hash: localCredentials.passwordHash })
    .from(profiles)
    .innerJoin(localCredentials, eq(localCredentials.userId, profiles.id))
    .where(sql`lower(${profiles.email}) = ${email.toLowerCase()}`)
    .limit(1);
  // Hash even when the account does not exist so timing does not reveal it.
  const ok = row ? verifyPassword(password, row.hash) : (hashPassword(password), false);
  if (!row || !ok) return null;
  (await cookies()).set(COOKIE, encode(row.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
  return row.id;
}

export async function localSignOut() {
  (await cookies()).delete(COOKIE);
}

export async function localSetPassword(userId: string, password: string) {
  const passwordHash = hashPassword(password);
  await db()
    .insert(localCredentials)
    .values({ userId, passwordHash })
    .onConflictDoUpdate({ target: localCredentials.userId, set: { passwordHash, updatedAt: new Date() } });
}
