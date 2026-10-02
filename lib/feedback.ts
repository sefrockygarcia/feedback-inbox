import { z } from "zod";
import type { Database } from "./database.types";

export type Feedback = Database["public"]["Tables"]["feedback"]["Row"];
export type FeedbackCategory = Database["public"]["Enums"]["feedback_category"];
export type FeedbackStatus = Database["public"]["Enums"]["feedback_status"];

export const CATEGORIES = [
  "care",
  "food",
  "cleanliness",
  "staff",
  "activities",
  "other",
] as const satisfies readonly FeedbackCategory[];

export const STATUSES = [
  "new",
  "in_progress",
  "resolved",
] as const satisfies readonly FeedbackStatus[];

export const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  care: "Care",
  food: "Food",
  cleanliness: "Cleanliness",
  staff: "Staff",
  activities: "Activities",
  other: "Other",
};

export const STATUS_LABELS: Record<FeedbackStatus, string> = {
  new: "New",
  in_progress: "In progress",
  resolved: "Resolved",
};

/** Ratings at or below this count as negative and trigger a Discord alert. */
export const LOW_RATING_THRESHOLD = 2;

export function isLowRating(rating: number): boolean {
  return rating <= LOW_RATING_THRESHOLD;
}

/** ISO timestamp for `days` days ago, for "this week" style queries. */
export function daysAgoIso(days: number, now: number = Date.now()): string {
  return new Date(now - days * 24 * 60 * 60 * 1000).toISOString();
}

// Blank optional inputs arrive from forms as "", so turn them into undefined.
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value === "" ? undefined : value))
    .optional();

/** Validates what the public form sends. Mirrors the CHECK constraints in the migration. */
export const feedbackSchema = z.object({
  name: optionalText(100),
  email: z
    .string()
    .trim()
    .transform((value) => (value === "" ? undefined : value))
    .pipe(z.email("Enter a valid email address").optional())
    .optional(),
  category: z.enum(CATEGORIES, { error: "Choose a category" }),
  rating: z.coerce
    .number({ error: "Choose a rating" })
    .int()
    .min(1, "Choose a rating from 1 to 5")
    .max(5, "Choose a rating from 1 to 5"),
  message: z
    .string()
    .trim()
    .min(1, "Tell us what happened")
    .max(2000, "Keep it under 2,000 characters"),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;

export const statusUpdateSchema = z.object({
  id: z.uuid(),
  status: z.enum(STATUSES),
});
