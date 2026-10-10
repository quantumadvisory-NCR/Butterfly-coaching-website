import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/** scrypt password hashing for local development mode. Format: scrypt$<salt>$<hash>. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, saltPart, hashPart] = stored.split("$");
  if (scheme !== "scrypt" || !saltPart || !hashPart) return false;
  const expected = Buffer.from(hashPart, "base64url");
  const actual = scryptSync(password, Buffer.from(saltPart, "base64url"), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
