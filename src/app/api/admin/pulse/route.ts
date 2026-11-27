import { newEnquiryCount } from "@/lib/admin/search";
import { adminJson } from "../admin-json";

export const runtime = "nodejs";

/** The live figure behind the admin's bell: GET /api/admin/pulse/ returns { newEnquiries }. */
export function GET() {
  return adminJson(async () => ({ newEnquiries: await newEnquiryCount() }));
}
