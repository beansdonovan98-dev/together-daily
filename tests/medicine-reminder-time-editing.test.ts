import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("medicine reminder time editing", () => {
  it("offers an independent reminder-time entry beside the medicine log", () => {
    const health = readFileSync(resolve(process.cwd(), "app/(tabs)/health.tsx"), "utf8");

    expect(health).toContain("reminderTime?: string");
    expect(health).toContain("setEditingReminderTime(item.id)");
    expect(health).toContain("REMIND ME AT");
    expect(health).toContain("reminderTime, reminder: true");
    expect(health).toContain("Save reminder");
  });
});
