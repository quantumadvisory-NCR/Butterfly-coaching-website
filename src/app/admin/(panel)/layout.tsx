import { count, eq } from "drizzle-orm";
import { AdminShell } from "@/components/admin/shell";
import { ROLE_LABELS, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { enquiries } from "@/lib/db/schema";
import { backendMode } from "@/lib/env";

// Every admin screen reads the session, so none of it is ever cached or prerendered.
export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  // Server-side gate for the whole admin. Each action re-checks on its own.
  const user = await requireUser();
  const [row] = await db().select({ n: count() }).from(enquiries).where(eq(enquiries.status, "new"));
  return (
    <AdminShell
      user={{ fullName: user.fullName, email: user.email, role: user.role }}
      roleLabel={ROLE_LABELS[user.role]}
      newEnquiries={row?.n ?? 0}
      localMode={backendMode() === "local"}
    >
      {children}
    </AdminShell>
  );
}
