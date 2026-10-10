/**
 * Request-level protections: rate limiting, spam tokens and privacy-preserving
 * client identifiers. Server only.
 */
import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { lt, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { rateLimits } from "@/lib/db/schema";
import { sessionSecret } from "@/lib/env";

/** A salted hash of the caller's IP. Raw addresses are never stored. */
export async function clientKey(): Promise<string> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  return createHash("sha256").update(`${sessionSecret()}:${ip}`).digest("hex").slice(0, 32);
}

/**
 * Fixed-window rate limit backed by Postgres, so it works across serverless
 * instances without another service. Returns false when the limit is exceeded.
 */
export async function rateLimit(name: string, limit: number, windowSeconds: number, key?: string): Promise<boolean> {
  const who = key ?? (await clientKey());
  const windowMs = windowSeconds * 1000;
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs);
  const [row] = await db()
    .insert(rateLimits)
    .values({ key: `${name}:${who}`, windowStart, count: 1 })
    .onConflictDoUpdate({
      target: [rateLimits.key, rateLimits.windowStart],
      set: { count: sql`${rateLimits.count} + 1` },
    })
    .returning({ count: rateLimits.count });
  // Opportunistic clean-up of expired windows.
  if (Math.random() < 0.02) {
    await db()
      .delete(rateLimits)
      .where(lt(rateLimits.windowStart, new Date(Date.now() - 24 * 60 * 60 * 1000)))
      .catch(() => {});
  }
  return (row?.count ?? 1) <= limit;
}

/* ---- form tokens ---------------------------------------------------------- */

const sign = (value: string) => createHmac("sha256", sessionSecret()).update(`form:${value}`).digest("base64url");

/**
 * Issued to the browser when a visitor starts filling in a form. A submission
 * must carry a token that is genuine, at least a few seconds old (humans take
 * time to type) and not stale. Stops the simplest scripted spam with no CAPTCHA.
 */
export function issueFormToken(): string {
  const issued = Date.now().toString(36);
  return `${issued}.${sign(issued)}`;
}

export function verifyFormToken(token: string | null | undefined, minSeconds = 2, maxHours = 12): boolean {
  if (!token) return false;
  const [issued, signature] = token.split(".");
  if (!issued || !signature) return false;
  const expected = sign(issued);
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
  const age = Date.now() - parseInt(issued, 36);
  return age >= minSeconds * 1000 && age <= maxHours * 60 * 60 * 1000;
}
