import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/admin/auth-card";
import { SetupForm } from "@/components/admin/auth-forms";
import { staffCount } from "@/lib/auth";
import { backendMode } from "@/lib/env";

export const metadata: Metadata = { title: "First-time setup" };
export const dynamic = "force-dynamic";

export default async function SetupPage() {
  if (backendMode() === "unconfigured") redirect("/admin/login/");
  // Setup is only ever available while there are no accounts at all.
  if ((await staffCount()) > 0) redirect("/admin/login/");

  return (
    <AuthCard
      title="Create the owner account"
      intro="This one-time step creates the first administrator. You will need the setup token from the server's environment settings."
    >
      <SetupForm />
    </AuthCard>
  );
}
