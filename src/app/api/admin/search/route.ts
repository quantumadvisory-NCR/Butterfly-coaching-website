import { searchAdmin } from "@/lib/admin/search";
import { adminJson } from "../admin-json";

export const runtime = "nodejs";

/**
 * The admin's Ctrl+K search: POST /api/admin/search/ with { q } returns { hits }.
 * POST rather than GET so what was typed (often a person's name or email) never
 * appears in an address or a request log. It only reads; nothing is changed.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { q?: unknown } | null;
  const q = typeof body?.q === "string" ? body.q : "";
  return adminJson(async () => ({ hits: await searchAdmin(q) }));
}
