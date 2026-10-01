import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { DYNAMIC_GRADIENT_MOTION, dailyThemePreset, dynamicThemeForDate, HALLOWEEN_MONTH_THEME, isAnimatedTheme, isHalloweenMonth } from "../lib/dynamic-theme";

const sharedTheme = {
  accentColor: "#A421FF",
  backgroundColor: "#22002E",
  backgroundGradient: ["#22002E", "#6B0CAC", "#163F90"],
  fontColor: "#FFFFFF",
  borderColor: "#000000",
  fontId: "handwritten",
};

describe("shared dynamic themes", () => {
  it("calculates the same daily preset for both partners without writing a different theme per device", () => {
    expect(dailyThemePreset("2026-09-25")).toEqual(dailyThemePreset("2026-09-25"));
    expect(dailyThemePreset("2026-09-25").gradient).not.toEqual(dailyThemePreset("2026-09-26").gradient);
  });

  it("rotates only the backdrop colors while preserving shared font and border choices", () => {
    const next = dynamicThemeForDate({ ...sharedTheme, dailyGradientRotation: true }, "2026-09-25");

    expect(next.backgroundGradient).toEqual(dailyThemePreset("2026-09-25").gradient);
    expect(next.fontColor).toBe("#FFFFFF");
    expect(next.borderColor).toBe("#000000");
    expect(next.fontId).toBe("handwritten");
  });

  it("uses Haunted Together across every page through October, then restores the shared selection", () => {
    const october = dynamicThemeForDate({ ...sharedTheme, dailyGradientRotation: true, animatedGradient: false }, "2026-10-01");

    expect(isHalloweenMonth("2026-10-31")).toBe(true);
    expect(isHalloweenMonth("2026-11-01")).toBe(false);
    expect(october.backgroundGradient).toEqual(HALLOWEEN_MONTH_THEME.backgroundGradient);
    expect(october.backgroundColor).toBe(HALLOWEEN_MONTH_THEME.backgroundColor);
    expect(october.accentColor).toBe(HALLOWEEN_MONTH_THEME.accentColor);
    expect(october.fontColor).toBe(HALLOWEEN_MONTH_THEME.fontColor);
    expect(october.borderColor).toBe(HALLOWEEN_MONTH_THEME.borderColor);
    expect(october.fontId).toBe("serif");
    expect(october.animatedGradient).toBe(true);
    expect(HALLOWEEN_MONTH_THEME.backgroundGradient).toHaveLength(5);
    expect(dynamicThemeForDate(sharedTheme, "2026-11-01")).toBe(sharedTheme);
  });

  it("renders the seasonal Halloween characters and palette from the shared global frame", () => {
    const frame = readFileSync(resolve(process.cwd(), "components/app-frame.tsx"), "utf8");

    expect(frame).toContain("testID=\"halloween-month-atmosphere\"");
    expect(frame).toContain("👻");
    expect(frame).toContain("🦇");
    expect(frame).toContain("🐺");
    expect(frame).toContain("🧙‍♀️");
    expect(frame).toContain("🧛");
    expect(frame).toContain("halloweenGhostTwo");
    expect(frame).toContain("halloweenBatTwo");
    expect(frame).toContain("halloweenBatThree");
    expect(frame).toContain("halloweenVampireTwo");
    expect(frame).toContain("testID=\"halloween-season-ribbon\"");
    expect(frame).toContain("halloweenDrift");
    expect(frame).toContain("halloweenFlight");
    expect(frame).toContain("ghostShiftY");
    expect(frame).toContain("batShiftX");
    expect(frame).toContain("mistShiftX");
    expect(frame).toContain("halloweenSkyGlow");
    expect(frame).toContain("halloweenStarFive");
    expect(frame).toContain("halloweenFullPageAura");
    expect(frame).toContain("halloweenMistMiddle");
    expect(frame).toContain("halloweenMistLower");
    expect(frame).toContain("halloweenStarEight");
    expect(frame).toContain("halloweenGhostThreeHitArea");
    expect(frame).toContain("halloweenBatFiveHitArea");
    expect(frame).toContain("starGlow");
    expect(frame).toContain("triggerSpookyCreature");
    expect(frame).toContain('accessibilityLabel="Play with the floating ghost"');
    expect(frame).toContain('accessibilityLabel="Play with the flying bats"');
    expect(frame).toContain("halloweenCreatureMessage");
    expect(frame).toContain("ImpactFeedbackStyle.Light");
    expect(frame).not.toContain("halloween-full-page-sky");
    expect(frame).toContain("normalizeGlobalTextColor(renderedTheme.fontColor)");
    expect(frame).toContain("normalizeGlobalBorderColor(renderedTheme.borderColor)");
  });

  it("leaves a manually selected shared theme unchanged when daily rotation is off", () => {
    expect(dynamicThemeForDate(sharedTheme, "2026-09-25")).toBe(sharedTheme);
    expect(isAnimatedTheme({ ...sharedTheme, animatedGradient: true })).toBe(true);
    expect(isAnimatedTheme(sharedTheme)).toBe(false);
  });

  it("uses clearly visible multi-directional motion for animated backdrops", () => {
    expect(DYNAMIC_GRADIENT_MOTION.legDuration).toBeLessThanOrEqual(3_600);
    expect(DYNAMIC_GRADIENT_MOTION.horizontalTravel).toBeGreaterThanOrEqual(108);
    expect(DYNAMIC_GRADIENT_MOTION.verticalTravel).toBeGreaterThanOrEqual(52);
    expect(DYNAMIC_GRADIENT_MOTION.peakScale).toBeGreaterThan(DYNAMIC_GRADIENT_MOTION.baseScale);
  });

  it("keeps a custom three-color gradient intact while its animation is enabled", () => {
    const custom = {
      ...sharedTheme,
      backgroundGradient: ["#FF3D9A", "#00D8FF", "#B7ED4B"],
      animatedGradient: true,
    };

    expect(dynamicThemeForDate(custom, "2026-09-25").backgroundGradient).toEqual(custom.backgroundGradient);
    expect(isAnimatedTheme(custom)).toBe(true);
  });
});
