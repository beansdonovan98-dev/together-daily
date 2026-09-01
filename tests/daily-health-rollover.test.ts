import { describe, expect, it } from "vitest";

import { carryDailyHealthTasks } from "../lib/daily-health-rollover";

describe("Daily Health carry-forward", () => {
  it("copies the most recent Health task list into a new day with clean completion marks", () => {
    const newTasks = carryDailyHealthTasks(
      {
        "2026-08-30": {
          health: {
            tasks: [{ id: "health-task-1", text: "Take vitamins", done: { beans: true, princess: true } }],
            medicines: [{ id: "medicine-1", text: "Morning medicine", time: "8:00 AM" }],
          },
        },
        "2026-08-31": {
          health: {
            tasks: [{ id: "health-task-2", text: "Go for a walk", done: { beans: true } }],
          },
        },
      },
      "2026-09-01",
    );

    expect(newTasks).toEqual([{ id: "health-task-2", text: "Go for a walk", done: {} }]);
  });

  it("starts blank when no earlier Daily Health list exists", () => {
    const newTasks = carryDailyHealthTasks({}, "2026-09-01");

    expect(newTasks).toEqual([]);
  });
});
