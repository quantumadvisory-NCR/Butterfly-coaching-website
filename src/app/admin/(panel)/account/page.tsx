import type { Metadata } from "next";
import { ChangePasswordForm } from "@/components/admin/auth-forms";
import { Card, PageHeader } from "@/components/admin/ui";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Your account" };

export default async function AccountPage() {
  const user = await requireUser();
  return (
    <>
      <PageHeader title="Your account" />
      <div className="grid gap-6">
        <Card title="Profile">
          <dl className="grid gap-3 text-[0.9375rem] sm:grid-cols-[8rem_minmax(0,1fr)]">
            <dt className="text-muted">Name</dt>
            <dd>{user.fullName || "Not set"}</dd>
            <dt className="text-muted">Email</dt>
            <dd className="[overflow-wrap:anywhere]">{user.email}</dd>
            <dt className="text-muted">Role</dt>
            <dd>
              <span className="font-semibold text-navy">{ROLE_LABELS[user.role]}</span>
              <span className="block text-muted">{ROLE_DESCRIPTIONS[user.role]}</span>
            </dd>
          </dl>
        </Card>
        <Card title="Change password">
          <ChangePasswordForm />
        </Card>
      </div>
    </>
  );
}
