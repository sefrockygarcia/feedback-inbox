import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../database.types";

/**
 * Admin client using the secret key. It BYPASSES row level security,
 * so only use it in trusted server code such as background jobs.
 * The "server-only" import makes the build fail if a browser bundle imports it.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
