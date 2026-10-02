import { redirect } from "next/navigation";
import { signOut } from "@/lib/actions/auth";
import { getStaffEmail } from "@/lib/supabase/server";

// Wraps every /dashboard page. proxy.ts already redirects logged-out visitors,
// but the real check lives here, next to the data (defence in depth).
export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const email = await getStaffEmail();
  if (!email) redirect("/login");

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
        <p>
          Signed in as <span className="font-medium text-ink">{email}</span>
        </p>
        <form action={signOut}>
          <button
            type="submit"
            className="min-h-10 rounded-lg border border-line bg-white px-3 font-medium text-ink hover:bg-canvas"
          >
            Sign out
          </button>
        </form>
      </div>
      {children}
    </div>
  );
}
