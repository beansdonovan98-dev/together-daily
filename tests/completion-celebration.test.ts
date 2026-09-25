import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("task-list completion celebrations", () => {
  it("provides an animated, accessible shared celebration surface", () => {
    const component = readFileSync(resolve(process.cwd(), "components/completion-celebration.tsx"), "utf8");

    expect(component).toContain("Animated.timing");
    expect(component).toContain('accessibilityLiveRegion="polite"');
    expect(component).toContain("✦");
  });

  it("celebrates completed daily Health and daily or weekly Cleaning lists", () => {
    const health = readFileSync(resolve(process.cwd(), "app/(tabs)/health.tsx"), "utf8");
    const cleaning = readFileSync(resolve(process.cwd(), "app/(tabs)/cleaning.tsx"), "utf8");

    expect(health).toContain("healthComplete ? <CompletionCelebration");
    expect(cleaning).toContain("dailyComplete || weeklyComplete ? <CompletionCelebration");
  });
});
