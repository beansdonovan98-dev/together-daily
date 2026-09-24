import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const file = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("page reset confirmation", () => {
  it("asks before restoring a page and clears normalized route-key overrides", () => {
    const frame = file("components/app-frame.tsx");
    const theme = file("lib/shared-theme-preferences.ts");
    expect(frame).toContain("Alert.alert(");
    expect(frame).toContain("Reset page");
    expect(frame).toContain("Your journal entries are not changed.");
    expect(theme).toContain('purchases: "purchase"');
    expect(theme).toContain('days: "pastDays"');
  });
});

describe("medicine reminders and long-term calendar", () => {
  it("provides private daily medicine reminder controls", () => {
    const health = file("app/(tabs)/health.tsx");
    const reminders = file("lib/medicine-reminders.ts");
    expect(health).toContain("Set reminder");
    expect(health).toContain("Reminder on");
    expect(reminders).toContain("SchedulableTriggerInputTypes.DAILY");
    expect(reminders).toContain('kind: "medicine-reminder"');
  });

  it("adds a shared calendar route with a monthly ninth heart day", () => {
    const calendar = file("app/(tabs)/calendar.tsx");
    const frame = file("components/app-frame.tsx");
    expect(calendar).toContain('cell.isHeartDay ? "♥" : cell.day');
    expect(calendar).toContain("Add to calendar");
    expect(frame).toContain('id: "calendar"');
  });
});
