import { formatDailyDigest, formatLowRatingAlert, postToDiscord } from "../discord";
import { daysAgoIso, isLowRating } from "../feedback";
import { createAdminClient } from "../supabase/admin";
import { FEEDBACK_SUBMITTED, inngest, type FeedbackSubmittedData } from "./client";

const appUrl = process.env.APP_URL;

/**
 * Event-driven job: runs every time feedback is submitted.
 * Rails equivalent: a Sidekiq job enqueued from the controller.
 */
export const notifyLowRating = inngest.createFunction(
  { id: "notify-low-rating", triggers: [{ event: FEEDBACK_SUBMITTED }] },
  async ({ event, step }) => {
    const data = event.data as FeedbackSubmittedData;

    if (!isLowRating(data.rating)) {
      return { skipped: true, reason: "rating above threshold" };
    }

    // Each step.run is retried on its own if it throws (e.g. Discord is down).
    const result = await step.run("post-discord-alert", () =>
      postToDiscord(formatLowRatingAlert({ ...data, appUrl })),
    );

    return { alerted: true, ...result };
  },
);

/**
 * Scheduled job: every day at 8:00 Manila time.
 * Rails equivalent: a sidekiq-scheduler / cron entry.
 */
export const dailyDigest = inngest.createFunction(
  { id: "daily-digest", triggers: [{ cron: "TZ=Asia/Manila 0 8 * * *" }] },
  async ({ step }) => {
    const counts = await step.run("count-feedback", async () => {
      const supabase = createAdminClient();
      const since = daysAgoIso(1);

      const [total, negative, resolved, open] = await Promise.all([
        supabase.from("feedback").select("*", { count: "exact", head: true }).gte("created_at", since),
        supabase
          .from("feedback")
          .select("*", { count: "exact", head: true })
          .gte("created_at", since)
          .lte("rating", 2),
        supabase.from("feedback").select("*", { count: "exact", head: true }).gte("resolved_at", since),
        supabase.from("feedback").select("*", { count: "exact", head: true }).neq("status", "resolved"),
      ]);

      const failed = [total, negative, resolved, open].find((result) => result.error);
      if (failed?.error) throw failed.error;

      return {
        total: total.count ?? 0,
        negative: negative.count ?? 0,
        resolved: resolved.count ?? 0,
        open: open.count ?? 0,
      };
    });

    const result = await step.run("post-discord-digest", () =>
      postToDiscord(formatDailyDigest({ ...counts, appUrl })),
    );

    return { ...counts, ...result };
  },
);

export const functions = [notifyLowRating, dailyDigest];
