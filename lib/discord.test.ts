import { afterEach, describe, expect, it, vi } from "vitest";
import { formatDailyDigest, formatLowRatingAlert, postToDiscord } from "./discord";

describe("formatLowRatingAlert", () => {
  const input = {
    id: "6f2b8a4e-0c1d-4e9a-9b7f-2d5c8e1a3f00",
    rating: 1,
    category: "cleanliness" as const,
    message: "Bathroom not cleaned",
    createdAt: "2026-10-01T08:00:00.000Z",
  };

  it("builds a red embed with the rating, category and message", () => {
    const [embed] = formatLowRatingAlert(input).embeds!;
    expect(embed.title).toContain("1/5");
    expect(embed.description).toBe("Bathroom not cleaned");
    expect(embed.fields).toEqual([{ name: "Category", value: "Cleanliness", inline: true }]);
    expect(embed.url).toBeUndefined();
  });

  it("links to the dashboard when the app URL is known", () => {
    const [embed] = formatLowRatingAlert({ ...input, appUrl: "https://inbox.example.com" }).embeds!;
    expect(embed.url).toBe(`https://inbox.example.com/dashboard/${input.id}`);
  });

  it("truncates very long messages", () => {
    const [embed] = formatLowRatingAlert({ ...input, message: "x".repeat(900) }).embeds!;
    expect(embed.description!.length).toBe(500);
    expect(embed.description!.endsWith("…")).toBe(true);
  });

  it("never allows mentions such as @everyone", () => {
    expect(formatLowRatingAlert({ ...input, message: "@everyone help" }).allowed_mentions).toEqual({ parse: [] });
  });
});

describe("formatDailyDigest", () => {
  it("lists the four counts", () => {
    const [embed] = formatDailyDigest({ total: 12, negative: 3, resolved: 5, open: 7 }).embeds!;
    expect(embed.fields!.map((field) => field.value)).toEqual(["12", "3", "5", "7"]);
  });
});

describe("postToDiscord", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("only logs when no webhook URL is configured", async () => {
    vi.stubEnv("DISCORD_WEBHOOK_URL", "");
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    vi.spyOn(console, "log").mockImplementation(() => {});

    await expect(postToDiscord({ content: "hi" })).resolves.toEqual({ sent: false });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("POSTs JSON to the webhook", async () => {
    vi.stubEnv("DISCORD_WEBHOOK_URL", "https://discord.test/webhook");
    const fetchSpy = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchSpy);

    await expect(postToDiscord({ content: "hi" })).resolves.toEqual({ sent: true });
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://discord.test/webhook",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ content: "hi" }) }),
    );
  });

  it("throws when Discord rejects the request, so Inngest retries", async () => {
    vi.stubEnv("DISCORD_WEBHOOK_URL", "https://discord.test/webhook");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("rate limited", { status: 429 })));

    await expect(postToDiscord({ content: "hi" })).rejects.toThrow("429");
  });
});
