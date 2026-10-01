import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { activityMinutes, addForegroundUsage, formatActivityMinutes, mergeUsageTotals, splitForegroundSession } from "../lib/app-usage";

describe("foreground app activity tracking", () => {
  it("records only the measured active interval and splits a session at midnight", () => {
    const start = new Date(2026, 9, 1, 23, 59, 50).getTime();
    const end = new Date(2026, 9, 2, 0, 0, 20).getTime();

    expect(splitForegroundSession(start, end)).toEqual([
      { date: "2026-10-01", milliseconds: 10_000 },
      { date: "2026-10-02", milliseconds: 20_000 },
    ]);
    expect(splitForegroundSession(end, start)).toEqual([]);
  });

  it("keeps separate cumulative activity totals for both partners", () => {
    const daddy = addForegroundUsage(undefined, "beans", [{ date: "2026-10-01", milliseconds: 61_000 }]);
    const both = addForegroundUsage(daddy, "princess", [{ date: "2026-10-01", milliseconds: 125_000 }]);

    expect(both["2026-10-01"]).toEqual({ beans: 61_000, princess: 125_000 });
    expect(formatActivityMinutes(125_000)).toBe("2 min");
    expect(activityMinutes(3_660_000)).toBe(61);
  });

  it("does not let a stale shared snapshot reduce tracked activity", () => {
    expect(mergeUsageTotals(
      { "2026-10-01": { beans: 190_000, princess: 85_000 } },
      { "2026-10-01": { beans: 120_000, princess: 210_000 } },
    )).toEqual({ "2026-10-01": { beans: 190_000, princess: 210_000 } });
  });

  it("wires app lifecycle pauses, atomic recording, and the shared Today card", () => {
    const journal = readFileSync(resolve(process.cwd(), "lib/local-journal.tsx"), "utf8");
    const router = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
    const database = readFileSync(resolve(process.cwd(), "server/db.ts"), "utf8");
    const today = readFileSync(resolve(process.cwd(), "app/(tabs)/index.tsx"), "utf8");

    expect(journal).toContain('AppState.addEventListener("change"');
    expect(journal).toContain("setInterval(() => { void flushForegroundTime(); }, 15_000)");
    expect(journal).toContain("recordAppUsage.useMutation()");
    expect(journal).toContain("appUsageRecordRef");
    expect(journal).toContain("let flushing = false");
    expect(router).toContain("recordAppUsage");
    expect(database).toContain('for("update")');
    expect(database).toContain("mergeGuestRoomAppUsage");
    expect(today).toContain("TODAY’S APP TIME");
    expect(today).toContain("Only counts while Together Daily is open and active");
    expect(today).toContain("formatActivityMinutes");
    expect(today).toContain('testID="shared-app-time-card"');
    expect(today).toContain("SHARED ACTIVE TIME");
    expect(today).toContain("appActivityTrack");
    expect(today).toContain("appActivityFill");
  });
});
