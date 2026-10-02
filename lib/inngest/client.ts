import { Inngest } from "inngest";
import type { FeedbackCategory } from "../feedback";

/** One Inngest client for the whole app (like a single Sidekiq config). */
export const inngest = new Inngest({ id: "feedback-inbox" });

/** Event sent after someone submits feedback. */
export const FEEDBACK_SUBMITTED = "feedback/submitted";

export type FeedbackSubmittedData = {
  id: string;
  rating: number;
  category: FeedbackCategory;
  message: string;
  createdAt: string;
};
