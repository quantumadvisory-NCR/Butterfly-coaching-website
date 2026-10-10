import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/admin/auth-card";
import { LoginForm } from "@/components/admin/auth-forms";
import { getSessionUser, staffCount } from "@/lib/auth";
import { backendMode } from "@/lib/env";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (backendMode() === "unconfigured") {
    return (
      <AuthCard title="The website is not configured yet">
        <p>
          No database is connected. Add your Supabase details to the environment settings, or set <code>BCA_LOCAL_MODE=1</code> for local development. See{" "}
          <code>docs/DEPLOYMENT.md</code>.
        </p>
      </AuthCard>
    );
  }
  if (await getSessionUser()) redirect("/admin/");
  // A brand-new site has no accounts: send the owner to first-run setup.
  if ((await staffCount()) === 0) redirect("/admin/setup/");

  return (
    <AuthCard
      title="Sign in"
      intro="Manage the Butterfly Coaching Academy website."
      footer={
        <Link href="/" className="font-medium text-primary underline underline-offset-4 hover:text-navy">
          Back to the website
        </Link>
      }
    >
      <LoginForm />
      <p className="mt-5 text-sm text-muted">Forgotten your password? Ask a site owner to reset it from Users.</p>
    </AuthCard>
  );
}
