import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getStaffEmail } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Staff login" };

export default async function LoginPage() {
  // Already logged in? Skip the form.
  if (await getStaffEmail()) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-3xl font-semibold tracking-tight">Staff login</h1>
      <p className="mt-2 text-muted">Sign in to read and triage feedback.</p>
      <div className="mt-6 rounded-2xl border border-line bg-white p-6 shadow-sm">
        <LoginForm />
      </div>
      <p className="mt-4 text-sm text-muted">
        Trying the demo? The demo staff login is listed in the project&apos;s README.
      </p>
    </div>
  );
}
