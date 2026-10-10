/**
 * Supabase Auth adapter (production). The browser only ever holds Supabase's
 * own session cookies; the service role key stays on the server.
 */
import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

function env() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error("Supabase is not configured.");
  return { url, anon };
}

/** Request-scoped client bound to the visitor's auth cookies. */
export async function supabaseServer() {
  const { url, anon } = env();
  const store = await cookies();
  return createServerClient(url, anon, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // src/proxy.ts refreshes the session, so this is safe to ignore.
        }
      },
    },
  });
}

/** Service-role client for user administration and storage. Server only. */
export function supabaseAdmin() {
  const { url } = env();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function supabaseUserId(): Promise<string | null> {
  const client = await supabaseServer();
  // getUser() validates the token with Supabase; never trust getSession() on the server.
  const { data, error } = await client.auth.getUser();
  return error || !data.user ? null : data.user.id;
}

export async function supabaseSignIn(email: string, password: string): Promise<string | null> {
  const client = await supabaseServer();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  return error || !data.user ? null : data.user.id;
}

export async function supabaseSignOut() {
  const client = await supabaseServer();
  await client.auth.signOut();
}

export async function supabaseCreateUser(email: string, password: string): Promise<string> {
  const { data, error } = await supabaseAdmin().auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) throw new Error(error?.message ?? "Could not create the account.");
  return data.user.id;
}

export async function supabaseSetPassword(userId: string, password: string) {
  const { error } = await supabaseAdmin().auth.admin.updateUserById(userId, { password });
  if (error) throw new Error(error.message);
}

export async function supabaseDeleteUser(userId: string) {
  const { error } = await supabaseAdmin().auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);
}
