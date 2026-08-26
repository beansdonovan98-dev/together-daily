import { DAILY_MATURE_JOKES, DAILY_QUOTES, dailySparkFor, nextQuoteOffset } from "../lib/daily-spark";
import { describe, expect, it } from "vitest";

describe("dailySparkFor", () => {
  it("returns a stable quote and joke for the same local day", () => {
    expect(dailySparkFor("2026-08-26")).toEqual(dailySparkFor("2026-08-26"));
  });

  it("always selects content from the approved daily collections", () => {
    const spark = dailySparkFor("2026-08-26");
    expect(DAILY_QUOTES).toContain(spark.quote);
    expect(DAILY_MATURE_JOKES).toContain(spark.joke);
  });

  it("switches to the next quote without changing the daily joke", () => {
    const first = dailySparkFor("2026-08-26", 0);
    const next = dailySparkFor("2026-08-26", nextQuoteOffset(0));
    expect(next.quote).not.toBe(first.quote);
    expect(next.joke).toBe(first.joke);
  });
});
