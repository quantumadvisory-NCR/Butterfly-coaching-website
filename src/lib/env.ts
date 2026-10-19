/**
 * Central place for reading environment configuration. Nothing in here may be
 * imported by client components except the NEXT_PUBLIC_* helpers.
 */

/** Connection string for the embedded development database (scripts/with-db.ts). */
export const LOCAL_DATABASE_URL = "postgres://postgres:postgres@127.0.0.1:54329/bca";

export type BackendMode = "supabase" | "local" | "unconfigured";

/**
 * supabase: production. Supabase Postgres, Auth and Storage.
 * local:    development. Embedded Postgres, local sign-in, disk uploads.
 *           Only ever active when BCA_LOCAL_MODE=1 is set explicitly.
 */
export function backendMode(): BackendMode {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return "supabase";
  }
  if (process.env.BCA_LOCAL_MODE === "1") return "local";
  return "unconfigured";
}

/**
 * The Supabase project address, reduced to its origin. The Supabase dashboard
 * also shows this address with "/rest/v1/" on the end; pasted like that, every
 * sign-in and upload request would go to the wrong place.
 */
export function supabaseUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return null;
  try {
    return new URL(raw.trim()).origin;
  } catch {
    return null;
  }
}

export function databaseUrl(): string | null {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.BCA_LOCAL_MODE === "1") return LOCAL_DATABASE_URL;
  return null;
}

export function siteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000");
  return raw.replace(/\/+$/, "");
}

export function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set to at least 32 characters. See .env.example.");
  }
  return secret;
}

export function maxUploadBytes(): number {
  const mb = Number(process.env.MAX_UPLOAD_MB ?? 4);
  return (Number.isFinite(mb) && mb > 0 ? mb : 4) * 1024 * 1024;
}

/** What is and is not wired up, for the admin "Integrations" panel. */
export function integrationStatus() {
  return {
    backend: backendMode(),
    database: Boolean(databaseUrl()),
    email: Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM),
    storage: backendMode() === "supabase" ? Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) : true,
    setupToken: Boolean(process.env.ADMIN_SETUP_TOKEN),
  };
}
