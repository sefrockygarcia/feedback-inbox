import { CATEGORY_LABELS, type FeedbackCategory } from "./feedback";

/** The JSON body Discord's "Execute Webhook" endpoint accepts (only the fields we use). */
export type DiscordMessage = {
  content?: string;
  embeds?: {
    title: string;
    description?: string;
    color?: number;
    url?: string;
    fields?: { name: string; value: string; inline?: boolean }[];
    timestamp?: string;
  }[];
  allowed_mentions?: { parse: string[] };
};

const RED = 0xb3123b;
const BLUE = 0x1f5fbf;

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

function stars(rating: number): string {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

export function formatLowRatingAlert(input: {
  id: string;
  rating: number;
  category: FeedbackCategory;
  message: string;
  createdAt: string;
  appUrl?: string;
}): DiscordMessage {
  return {
    embeds: [
      {
        title: `Low rating: ${stars(input.rating)} (${input.rating}/5)`,
        description: truncate(input.message, 500),
        color: RED,
        url: input.appUrl ? `${input.appUrl}/dashboard/${input.id}` : undefined,
        fields: [
          { name: "Category", value: CATEGORY_LABELS[input.category], inline: true },
        ],
        timestamp: input.createdAt,
      },
    ],
    // Never let user-written text ping @everyone or roles.
    allowed_mentions: { parse: [] },
  };
}

export function formatDailyDigest(input: {
  total: number;
  negative: number;
  resolved: number;
  open: number;
  appUrl?: string;
}): DiscordMessage {
  return {
    embeds: [
      {
        title: "Daily feedback digest (last 24 hours)",
        color: BLUE,
        url: input.appUrl ? `${input.appUrl}/dashboard` : undefined,
        fields: [
          { name: "New", value: String(input.total), inline: true },
          { name: "Negative (1–2★)", value: String(input.negative), inline: true },
          { name: "Resolved", value: String(input.resolved), inline: true },
          { name: "Still open overall", value: String(input.open), inline: true },
        ],
      },
    ],
    allowed_mentions: { parse: [] },
  };
}

/**
 * Posts to the Discord webhook in DISCORD_WEBHOOK_URL.
 * Without one (local development), it logs the message instead so the rest
 * of the flow can still be tested.
 */
export async function postToDiscord(
  message: DiscordMessage,
): Promise<{ sent: boolean }> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    console.log("[discord] DISCORD_WEBHOOK_URL not set, would send:", JSON.stringify(message));
    return { sent: false };
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    // Throwing lets Inngest retry the step automatically.
    throw new Error(`Discord webhook failed: ${response.status} ${await response.text()}`);
  }

  return { sent: true };
}
