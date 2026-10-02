"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { statusUpdateSchema } from "../feedback";
import { createClient } from "../supabase/server";

/**
 * Staff changes a feedback item's status.
 * Server Actions can be called directly with a POST, so this checks the user
 * itself instead of trusting that the dashboard page already did.
 */
export async function updateStatus(formData: FormData) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) redirect("/login");

  const parsed = statusUpdateSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });
  if (!parsed.success) throw new Error("Invalid status update");

  const { id, status } = parsed.data;
  const { error } = await supabase
    .from("feedback")
    .update({
      status,
      resolved_at: status === "resolved" ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) throw new Error(`Could not update feedback: ${error.message}`);

  // Like expiring a Rails cache: re-render these pages with fresh data.
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/${id}`);
}
