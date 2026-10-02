"use server";

import { z } from "zod";
import { FEEDBACK_SUBMITTED, inngest } from "../inngest/client";
import { feedbackSchema } from "../feedback";
import { createClient } from "../supabase/server";

export type SubmitFeedbackState =
  | { status: "idle" }
  | { status: "success" }
  | {
      status: "error";
      message: string;
      fieldErrors?: Partial<Record<"name" | "email" | "category" | "rating" | "message", string[]>>;
      values?: Record<string, string>;
    };

/**
 * Public form submission. Rails equivalent: FeedbackController#create.
 * Server Actions are plain POST endpoints, so everything is validated here,
 * and the insert runs as the anonymous visitor so RLS still applies.
 */
export async function submitFeedback(
  _previousState: SubmitFeedbackState,
  formData: FormData,
): Promise<SubmitFeedbackState> {
  const raw = Object.fromEntries(
    ["name", "email", "category", "rating", "message"].map((key) => [
      key,
      String(formData.get(key) ?? ""),
    ]),
  );

  const parsed = feedbackSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values: raw,
    };
  }

  // We create the id here because RLS doesn't let anonymous visitors read rows
  // back, so we can't ask Postgres to return it after the insert.
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  const supabase = await createClient();
  const { error } = await supabase.from("feedback").insert({
    id,
    created_at: createdAt,
    name: parsed.data.name ?? null,
    email: parsed.data.email ?? null,
    category: parsed.data.category,
    rating: parsed.data.rating,
    message: parsed.data.message,
  });

  if (error) {
    console.error("[submitFeedback] insert failed", error);
    return {
      status: "error",
      message: "Sorry, we couldn't save your feedback. Please try again.",
      values: raw,
    };
  }

  // Hand off to background jobs. If Inngest is unreachable the feedback is
  // still saved, so log the problem instead of failing the visitor's request.
  try {
    await inngest.send({
      name: FEEDBACK_SUBMITTED,
      data: {
        id,
        rating: parsed.data.rating,
        category: parsed.data.category,
        message: parsed.data.message,
        createdAt,
      },
    });
  } catch (sendError) {
    console.error("[submitFeedback] could not send Inngest event", sendError);
  }

  return { status: "success" };
}
