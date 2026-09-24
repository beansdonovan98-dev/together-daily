import { describe, expect, it } from "vitest";
import { filterSteamyEntriesForDate } from "../lib/steamy-archive";

describe("filterSteamyEntriesForDate", () => {
  it("keeps only entries for the selected day when dailyDate is present", () => {
    const entries = [
      { id: "a", dailyDate: "2026-09-23", createdAt: "2026-09-23T10:00:00.000Z" },
      { id: "b", dailyDate: "2026-09-22", createdAt: "2026-09-22T10:00:00.000Z" },
      { id: "c", dailyDate: "2026-09-23", createdAt: "2026-09-23T18:15:00.000Z" },
    ];

    expect(filterSteamyEntriesForDate(entries, "2026-09-23")).toEqual([entries[0], entries[2]]);
  });

  it("falls back to createdAt date when dailyDate is missing", () => {
    const entries = [
      { id: "x", createdAt: "2026-09-21T08:00:00.000Z" },
      { id: "y", createdAt: "2026-09-23T11:30:00.000Z" },
    ];

    expect(filterSteamyEntriesForDate(entries, "2026-09-23")).toEqual([entries[1]]);
  });
});
