import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { appendWeeklyCleaningTask, weeklyCleaningTasks } from "../lib/weekly-cleaning";

describe("weekly cleaning additions", () => {
  it("preserves saved chores and appends a new chore at the bottom", () => {
    const current = [
      { id: "weekly-1", text: "Vacuum", createdBy: "beans" as const, completed: false },
    ];
    const next = appendWeeklyCleaningTask(current, {
      id: "weekly-2",
      text: "Clean the bathroom",
      createdBy: "princess",
      completed: false,
    });

    expect(next.map((task) => task.text)).toEqual(["Vacuum", "Clean the bathroom"]);
  });

  it("recovers safely from malformed legacy cleaning task data", () => {
    expect(weeklyCleaningTasks([{ id: "bad", text: "", createdBy: "beans", completed: false }, null])).toEqual([]);
  });

  it("uses the atomic room mutation and gives the add control visible progress or errors", () => {
    const journal = readFileSync(resolve(process.cwd(), "lib/local-journal.tsx"), "utf8");
    const router = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
    const database = readFileSync(resolve(process.cwd(), "server/db.ts"), "utf8");
    const cleaning = readFileSync(resolve(process.cwd(), "app/(tabs)/cleaning.tsx"), "utf8");

    expect(journal).toContain("addWeeklyCleaningTask:async(weekStart,text)");
    expect(router).toContain("addWeeklyCleaningTask: publicProcedure");
    expect(database).toContain("addGuestRoomWeeklyCleaningTask");
    expect(database).toContain("appendWeeklyCleaningTask(cleaning.tasks, task)");
    expect(cleaning).toContain("weeklySaving ? \"Adding…\" : \"Add\"");
    expect(cleaning).toContain("weeklyError ? <Text style={styles.addError}");
  });
});
