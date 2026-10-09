import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Health midnight reset", () => {
  it("publishes the active local date to the Health screen and refreshes it at midnight or on return to the app", () => {
    const journal = readFileSync(resolve(process.cwd(), "lib/local-journal.tsx"), "utf8");
    const health = readFileSync(resolve(process.cwd(), "app/(tabs)/health.tsx"), "utf8");

    expect(journal).toContain("today:string");
    expect(journal).toContain("nextMidnight.setHours(24, 0, 1, 0)");
    expect(journal).toContain('if (nextState === "active") refreshToday()');
    expect(journal).toContain("ready, today, roomCode:prefs.roomCode");
    expect(journal).toContain("[ready,today,prefs,state");
    expect(health).toContain("const { ready, today, ensureDay");
    expect(health).not.toContain("const today = localDateKey()");
  });

  it("creates a clean snack array even when Daily Health tasks carry forward", () => {
    const journal = readFileSync(resolve(process.cwd(), "lib/local-journal.tsx"), "utf8");

    expect(journal).toContain("health: { snacks: [], tasks: carriedTasks }");
    expect(journal).toContain("...freshDailyFoodState()");
  });
});
