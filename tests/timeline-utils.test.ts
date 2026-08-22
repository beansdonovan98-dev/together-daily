import { describe, expect, it } from "vitest";
import { sortTimelineEntriesOldestFirst } from "../lib/timeline-utils";

describe("Daily Log ordering", () => {
  it("sorts events from the earliest logged time to the latest", () => {
    const entries = [
      { id: "later", createdAt: "2026-08-22T18:10:00.000Z" },
      { id: "first", createdAt: "2026-08-22T08:15:00.000Z" },
      { id: "middle", createdAt: "2026-08-22T12:30:00.000Z" },
    ];

    expect(sortTimelineEntriesOldestFirst(entries).map((entry) => entry.id)).toEqual(["first", "middle", "later"]);
  });

  it("orders the full day from just after midnight through the final minute", () => {
    const entries = [
      { id: "late", createdAt: "2026-08-22T23:59:00.000Z" },
      { id: "middle", createdAt: "2026-08-22T12:00:00.000Z" },
      { id: "early", createdAt: "2026-08-22T00:01:00.000Z" },
    ];

    expect(sortTimelineEntriesOldestFirst(entries).map((entry) => entry.id)).toEqual(["early", "middle", "late"]);
  });
});
