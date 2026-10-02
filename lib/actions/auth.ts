"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "../supabase/server";

export type SignInState = { error: string | null; email?: string };

const signInSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

/** Rails equivalent: Devise's SessionsController#create. */
export async function signIn(
  _previousState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const parsed = signInSchema.safeParse({
    email,
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input", email };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // Same message for wrong email or password, so we don't reveal which accounts exist.
    return { error: "Incorrect email or password.", email };
  }

  // redirect() throws on purpose to stop the action, so call it last.
  redirect("/dashboard");
}

/** Rails equivalent: Devise's SessionsController#destroy. */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
