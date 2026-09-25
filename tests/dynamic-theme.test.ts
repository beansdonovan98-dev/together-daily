import { describe, expect, it } from "vitest";

import { DYNAMIC_GRADIENT_MOTION, dailyThemePreset, dynamicThemeForDate, isAnimatedTheme } from "../lib/dynamic-theme";

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

  it("leaves a manually selected shared theme unchanged when daily rotation is off", () => {
    expect(dynamicThemeForDate(sharedTheme, "2026-09-25")).toBe(sharedTheme);
    expect(isAnimatedTheme({ ...sharedTheme, animatedGradient: true })).toBe(true);
    expect(isAnimatedTheme(sharedTheme)).toBe(false);
  });

  it("uses clearly visible multi-directional motion for animated backdrops", () => {
    expect(DYNAMIC_GRADIENT_MOTION.legDuration).toBeLessThanOrEqual(7_000);
    expect(DYNAMIC_GRADIENT_MOTION.horizontalTravel).toBeGreaterThanOrEqual(90);
    expect(DYNAMIC_GRADIENT_MOTION.verticalTravel).toBeGreaterThanOrEqual(40);
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
