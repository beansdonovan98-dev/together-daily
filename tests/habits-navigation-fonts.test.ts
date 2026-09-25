import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { normalizeAffectionGoals, updateAffectionGoal } from "../lib/affection-goals";
import { FONT_COLOR_OPTIONS, normalizeGlobalTextColor } from "../lib/typography";

describe("editable Six Little Things", () => {
  it("keeps all three personalizable goals while rejecting blank edits", () => {
    const defaults = normalizeAffectionGoals(undefined);
    expect(defaults).toHaveLength(3);
    expect(updateAffectionGoal(defaults, "hugs", { emoji: "✨", label: "Check in" })[0]).toEqual({ key: "hugs", emoji: "✨", label: "Check in" });
    expect(updateAffectionGoal(defaults, "hugs", { emoji: "", label: "" })[0]).toEqual(defaults[0]);
  });

  it("persists editable labels and emoji without rendering the separate Good Habits checklist", () => {
    const journal = readFileSync(resolve(process.cwd(), "lib/local-journal.tsx"), "utf8");
    const habits = readFileSync(resolve(process.cwd(), "app/(tabs)/habits.tsx"), "utf8");

    expect(journal).toContain("affectionGoals:AffectionGoal[]");
    expect(journal).toContain("updateAffectionGoal:(key,patch)");
    expect(habits).toContain("Tap Edit to personalize each little thing");
    expect(habits).toContain("startGoalEdit(goal.key)");
    expect(habits).not.toContain("Today’s good habits");
    expect(habits).not.toContain("Add a good habit");
  });
});

describe("compact Pages navigation", () => {
  it("replaces the horizontal strip with an accessible Pages menu", () => {
    const frame = readFileSync(resolve(process.cwd(), "components/app-frame.tsx"), "utf8");

    expect(frame).toContain('accessibilityLabel="Choose a page"');
    expect(frame).toContain("pagesOpen");
    expect(frame).toContain("styles.pageMenuGrid");
    expect(frame).not.toContain("style={styles.tabScroller}");
  });
});

describe("expanded font colors", () => {
  it("includes black and additional shared font color choices", () => {
    expect(FONT_COLOR_OPTIONS).toContainEqual(["#000000", "Black"]);
    expect(FONT_COLOR_OPTIONS.length).toBeGreaterThanOrEqual(10);
    expect(normalizeGlobalTextColor("#000000")).toBe("#000000");
  });
});

describe("Calendar background rendering", () => {
  it("uses a full-page non-stretched background layer rather than a fixed media panel", () => {
    const calendar = readFileSync(resolve(process.cwd(), "app/(tabs)/calendar.tsx"), "utf8");

    expect(calendar).toContain('contentFit="cover"');
    expect(calendar).toContain("backgroundLayer: { ...StyleSheet.absoluteFillObject");
    expect(calendar).not.toContain("mediaFrameHeight");
  });
});
