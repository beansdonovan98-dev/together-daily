import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { FONT_COLOR_OPTIONS, FONT_OPTIONS, fontFamilyFor, normalizeGlobalFont, normalizeGlobalTextColor } from "../lib/typography";

describe("global typography", () => {
  const customFontIds = ["handwritten", "notebook", "casual", "comic", "typewriter"] as const;

  it("maps every decorative selector choice to a unique embedded iOS family", () => {
    const nativeFamilies = customFontIds.map((id) => fontFamilyFor(id, "ios"));

    expect(new Set(nativeFamilies).size).toBe(customFontIds.length);
    expect(nativeFamilies).not.toContain("cursive");
  });

  it("normalizes a stale or unknown saved font selection to Handwritten", () => {
    expect(normalizeGlobalFont("comic")).toBe("comic");
    expect(normalizeGlobalFont("script")).toBe("handwritten");
    expect(normalizeGlobalFont(undefined)).toBe("handwritten");
  });

  it("defaults the shared font color to white and accepts only the Themes color choices", () => {
    expect(FONT_COLOR_OPTIONS[0]).toEqual(["#FFFFFF", "White"]);
    expect(normalizeGlobalTextColor("#FFEAF4")).toBe("#FFEAF4");
    expect(normalizeGlobalTextColor("#000000")).toBe("#FFFFFF");
    expect(normalizeGlobalTextColor(undefined)).toBe("#FFFFFF");
  });

  it("bundles every decorative font and registers it with the Expo font plugin", () => {
    const fontFiles = [
      "Kalam-Regular.ttf",
      "PatrickHand-Regular.ttf",
      "Caveat-Variable.ttf",
      "Bangers-Regular.ttf",
      "CourierPrime-Regular.ttf",
    ];
    const config = readFileSync(resolve(process.cwd(), "app.config.ts"), "utf8");

    expect(FONT_OPTIONS.map(([id]) => id)).toEqual([
      "handwritten", "notebook", "casual", "classic", "serif", "mono", "comic", "typewriter",
    ]);
    for (const file of fontFiles) {
      expect(existsSync(resolve(process.cwd(), "assets/fonts", file))).toBe(true);
      expect(config).toContain(`./assets/fonts/${file}`);
    }
  });

  it("routes Today’s daily content and partner labels through the shared font color", () => {
    const today = readFileSync(resolve(process.cwd(), "app/(tabs)/index.tsx"), "utf8");
    const editor = readFileSync(resolve(process.cwd(), "components/page-theme-editor.tsx"), "utf8");

    expect(today).toContain('const textColor = theme.fontColor ?? "#FFFFFF"');
    expect(today).toContain('style={[styles.dailySparkText, { color: textColor }]}');
    expect(today).toContain('style={[styles.loveName, { color: textColor }]}');
    expect(editor).toContain("FONT COLOR");
    expect(editor).toContain("all app text, including Daddy and Princess labels");
  });
});
