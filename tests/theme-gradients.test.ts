import { describe, expect, it } from "vitest";

import { PASTEL_THEMES, SAVED_THEMES } from "../lib/ready-made-themes";
import { isThemeGradient, themeGradientColors } from "../lib/theme-gradients";

describe("theme gradients", () => {
  it("accepts vivid two-to-four stop hex gradients", () => {
    expect(isThemeGradient(["#003D3B", "#00476E", "#32105A"])).toBe(true);
    expect(themeGradientColors(["#003D3B", "#00476E"])).toEqual(["#003D3B", "#00476E"]);
  });

  it("rejects incomplete and malformed gradient data", () => {
    expect(isThemeGradient(["#003D3B"])).toBe(false);
    expect(isThemeGradient(["#003D3B", "blue"])).toBe(false);
    expect(themeGradientColors(undefined)).toBeNull();
  });

  it("gives every ready-made Theme a valid vibrant gradient", () => {
    const allThemes = [...SAVED_THEMES, ...PASTEL_THEMES];
    expect(allThemes.length).toBeGreaterThan(0);
    expect(allThemes.every((theme) => isThemeGradient(theme.gradient))).toBe(true);
  });
});
