import { DAILY_FACTS, DAILY_MATURE_JOKES, DAILY_QUOTES, DAILY_RIDDLES, DAILY_WORDS, dailyQuoteFor, dailySparkFor } from "../lib/daily-spark";
import { describe, expect, it } from "vitest";

describe("dailySparkFor", () => {
  it("returns a stable quote and joke for the same local day", () => {
    expect(dailySparkFor("2026-08-26")).toEqual(dailySparkFor("2026-08-26"));
  });

  it("always selects content from the approved daily collections", () => {
    const spark = dailySparkFor("2026-08-26");
    expect(DAILY_QUOTES).toContain(spark.quote);
    expect(DAILY_MATURE_JOKES).toContain(spark.joke);
    expect(DAILY_RIDDLES).toContainEqual({ riddle: spark.riddle, answer: spark.answer });
    expect(DAILY_WORDS).toContainEqual({ word: spark.word, definition: spark.definition });
    expect(DAILY_FACTS).toContain(spark.fact);
  });

  it("switches quotes without changing the date-based joke or riddle", () => {
    expect(DAILY_QUOTES).toContain(dailyQuoteFor("2026-08-26", 1));
    expect(dailySparkFor("2026-08-26")).toEqual(dailySparkFor("2026-08-26"));
  });
});
