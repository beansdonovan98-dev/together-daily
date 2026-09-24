import { DAILY_FACTS, DAILY_MATURE_JOKES, DAILY_QUOTES, DAILY_RIDDLES, DAILY_WORDS, FRIEND_MOTIVATIONAL_QUOTES, dailySparkFor, friendMotivationFor } from "../lib/daily-spark";
import { describe, expect, it } from "vitest";

describe("dailySparkFor", () => {
  it("returns a stable quote and joke for the same local day", () => {
    expect(dailySparkFor("2026-08-26")).toEqual(dailySparkFor("2026-08-26"));
  });

  it("always selects content from the approved daily collections", () => {
    const spark = dailySparkFor("2026-08-26");
    expect(DAILY_QUOTES).toContain(spark.quote);
    expect(DAILY_MATURE_JOKES).toContain(spark.joke);
    expect(DAILY_RIDDLES).toContainEqual(spark.riddle);
    expect(DAILY_WORDS).toContainEqual(spark.word);
    expect(DAILY_FACTS).toContain(spark.fact);
  });

  it("keeps a long rotation for every daily card", () => {
    for (const collection of [DAILY_QUOTES, DAILY_MATURE_JOKES, DAILY_RIDDLES, DAILY_WORDS, DAILY_FACTS]) {
      expect(collection.length).toBeGreaterThanOrEqual(32);
    }
  });

  it("uses a dedicated non-romantic motivation rotation for Friend mode", () => {
    expect(FRIEND_MOTIVATIONAL_QUOTES.length).toBeGreaterThanOrEqual(15);
    expect(friendMotivationFor("2026-09-24")).toBe(friendMotivationFor("2026-09-24"));
  });
});
