import { describe, expect, it } from "vitest";

import {
  intimateEntriesForDate,
  intimateEntryDateTimeLabel,
  privateMediaForDate,
} from "../lib/steamy-history";

describe("Steamy daily history", () => {
  it("shows only the selected day while retaining older intimate entries", () => {
    const records = [
      { id: "old", recordType: "cumLog", createdAt: "2026-09-23T16:00:00.000Z", content: { date: "2026-09-23" } },
      { id: "today-later", recordType: "cumLog", createdAt: "2026-09-24T20:00:00.000Z", content: { date: "2026-09-24" } },
      { id: "today-earlier", recordType: "cumLog", createdAt: "2026-09-24T08:00:00.000Z", content: { date: "2026-09-24" } },
      { id: "chat", recordType: "steamyChat", createdAt: "2026-09-24T09:00:00.000Z", content: { date: "2026-09-24" } },
    ];

    expect(intimateEntriesForDate(records, "2026-09-24").map((record) => record.id)).toEqual([
      "today-later",
      "today-earlier",
    ]);
    expect(intimateEntriesForDate(records, "2026-09-23").map((record) => record.id)).toEqual(["old"]);
    expect(records).toHaveLength(4);
  });

  it("scopes private media to its saved day", () => {
    const media = [
      { id: "old-photo", kind: "private", dailyDate: "2026-09-23", createdAt: "2026-09-23T12:00:00.000Z" },
      { id: "today-photo", kind: "private", dailyDate: "2026-09-24", createdAt: "2026-09-24T12:00:00.000Z" },
      { id: "cover", kind: "cover", dailyDate: "2026-09-24", createdAt: "2026-09-24T12:00:00.000Z" },
    ];

    expect(privateMediaForDate(media, "2026-09-24").map((item) => item.id)).toEqual(["today-photo"]);
    expect(privateMediaForDate(media, "2026-09-23").map((item) => item.id)).toEqual(["old-photo"]);
  });

  it("places a calendar date beside the intimate-entry time", () => {
    const label = intimateEntryDateTimeLabel("2026-09-24T14:30:00.000Z", "2026-09-24");
    expect(label).toContain("Sep 24, 2026");
    expect(label).toContain("·");
  });
});
