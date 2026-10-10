import { asc } from "drizzle-orm";
import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { UsersManager } from "@/components/admin/users-manager";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ROLES, profiles } from "@/lib/db/schema";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage() {
  const user = await requireUser("owner");
  const rows = await db().select().from(profiles).orderBy(asc(profiles.createdAt));
  return (
    <>
      <PageHeader title="Users" description="Who can sign in to this admin, and what they are allowed to do." />
      <UsersManager
        currentUserId={user.id}
        users={rows.map((row) => ({
          id: row.id,
          email: row.email,
          fullName: row.fullName,
          role: row.role,
          isActive: row.isActive,
          lastSignIn: row.lastSignInAt ? formatDateTime(row.lastSignInAt) : "",
        }))}
        roles={[...ROLES].reverse().map((role) => ({ value: role, label: ROLE_LABELS[role], description: ROLE_DESCRIPTIONS[role] }))}
      />
    </>
  );
}
