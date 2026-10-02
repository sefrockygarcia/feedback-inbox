import { describe, expect, it } from "vitest";
import { feedbackSchema, isLowRating, statusUpdateSchema } from "./feedback";

// Rails equivalent: model specs for validations.
describe("feedbackSchema", () => {
  const valid = {
    name: "Maria",
    email: "maria@example.com",
    category: "food",
    rating: "2",
    message: "Dinner was cold",
  };

  it("accepts a complete submission and turns the rating into a number", () => {
    const result = feedbackSchema.parse(valid);
    expect(result.rating).toBe(2);
    expect(result.category).toBe("food");
  });

  it("treats blank optional fields as missing", () => {
    const result = feedbackSchema.parse({ ...valid, name: "  ", email: "" });
    expect(result.name).toBeUndefined();
    expect(result.email).toBeUndefined();
  });

  it("trims the message", () => {
    expect(feedbackSchema.parse({ ...valid, message: "  hi  " }).message).toBe("hi");
  });

  it.each([
    ["rating 0", { rating: "0" }, "rating"],
    ["rating 6", { rating: "6" }, "rating"],
    ["unknown category", { category: "parking" }, "category"],
    ["empty message", { message: "   " }, "message"],
    ["too-long message", { message: "x".repeat(2001) }, "message"],
    ["invalid email", { email: "not-an-email" }, "email"],
  ])("rejects %s", (_label, override, field) => {
    const result = feedbackSchema.safeParse({ ...valid, ...override });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.path[0] === field)).toBe(true);
  });
});

describe("statusUpdateSchema", () => {
  it("requires a UUID and a known status", () => {
    expect(
      statusUpdateSchema.safeParse({ id: "6f2b8a4e-0c1d-4e9a-9b7f-2d5c8e1a3f00", status: "resolved" }).success,
    ).toBe(true);
    expect(statusUpdateSchema.safeParse({ id: "1", status: "resolved" }).success).toBe(false);
    expect(
      statusUpdateSchema.safeParse({ id: "6f2b8a4e-0c1d-4e9a-9b7f-2d5c8e1a3f00", status: "deleted" }).success,
    ).toBe(false);
  });
});

describe("isLowRating", () => {
  it("flags 1 and 2 only", () => {
    expect([1, 2, 3, 4, 5].map(isLowRating)).toEqual([true, true, false, false, false]);
  });
});
