import { describe, expect, it } from "vitest";
import { timestampForEditedTime } from "../lib/timeline-time";

describe("Daily Log time editing", () => {
  it("accepts AM, PM, and 24-hour event times on the selected day", () => {
    const morning = new Date(timestampForEditedTime("2026-08-22", "8:30 AM")!);
    const afternoon = new Date(timestampForEditedTime("2026-08-22", "3:15 PM")!);
    const evening = new Date(timestampForEditedTime("2026-08-22", "21:45")!);

    expect([morning.getFullYear(), morning.getMonth(), morning.getDate(), morning.getHours(), morning.getMinutes()]).toEqual([2026, 7, 22, 8, 30]);
    expect([afternoon.getHours(), afternoon.getMinutes()]).toEqual([15, 15]);
    expect([evening.getHours(), evening.getMinutes()]).toEqual([21, 45]);
  });

  it("rejects an invalid event time", () => {
    expect(timestampForEditedTime("2026-08-22", "25:99")).toBeNull();
  });
});
