import { readFileSync } from "node:fs";
import { resolve } from "node:path";
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

  it("keeps every Themes utility card transparent for both vivid and pastel gradients", () => {
    const cardFiles = [
      "components/page-theme-editor.tsx",
      "components/gradient-creator.tsx",
      "components/partner-profiles-editor.tsx",
      "components/page-descriptions-editor.tsx",
    ];
    const gradientCases = [
      { label: "vivid", theme: SAVED_THEMES[0] },
      { label: "pastel", theme: PASTEL_THEMES[0] },
    ];

    for (const { label, theme } of gradientCases) {
      expect(theme, `${label} test theme`).toBeDefined();
      expect(isThemeGradient(theme.gradient), `${label} theme must be a valid gradient`).toBe(true);

      for (const file of cardFiles) {
        const source = readFileSync(resolve(process.cwd(), file), "utf8");
        expect(source).toContain('card: { borderRadius: 18, borderWidth: 1, borderColor: "#000000", backgroundColor: "transparent"');
        expect(source).toContain('body: { borderTopWidth: 1, borderTopColor: "#000000"');
        expect(source).not.toContain('card: { borderRadius: 18, borderWidth: 1, borderColor: "rgba(255,255,255,0.34)", backgroundColor: "rgba(20,12,30,0.42)"');
      }
    }
  });
});
