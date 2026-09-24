import { describe, expect, it } from "vitest";

import { carryDailyHabitList } from "../lib/daily-habits-rollover";

describe("Good Habits carry-forward", () => {
  it("uses the newest saved habit list without copying either partner’s completion checks", () => {
    expect(carryDailyHabitList({
      "2026-09-20": { habits: { list: ["Stretch"], checks: { Stretch: { beans: true } } } },
      "2026-09-21": { habits: { list: ["Walk", "Read"], checks: { Walk: { princess: true } } } },
    }, "2026-09-22")).toEqual(["Walk", "Read"]);
  });

  it("starts with no carried list when there is no previous saved Good Habits list", () => {
    expect(carryDailyHabitList({}, "2026-09-22")).toEqual([]);
  });
});
