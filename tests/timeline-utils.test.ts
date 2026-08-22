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
});
