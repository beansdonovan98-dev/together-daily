import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const file = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("global Theme application", () => {
  it("uses the shared Theme for every page without a page-by-page reset control", () => {
    const frame = file("components/app-frame.tsx");
    const journal = file("lib/local-journal.tsx");
    expect(frame).toContain("resolveThemeBackdrop(renderedTheme, undefined, COLORS.blush)");
    expect(frame).not.toContain("resetPageStyle");
    expect(frame).not.toContain("Reset {currentPage.label} to default");
    expect(journal).toContain("pageStyles: undefined");
  });
});

describe("medicine reminders and long-term calendar", () => {
  it("provides private daily medicine reminder controls", () => {
    const health = file("app/(tabs)/health.tsx");
    const reminders = file("lib/medicine-reminders.ts");
    expect(health).toContain("Set reminder");
    expect(health).toContain("Set reminder time");
    expect(health).toContain("REMIND ME AT");
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
