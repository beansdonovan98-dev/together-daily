import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { BORDER_COLOR_OPTIONS, FONT_COLOR_OPTIONS, FONT_OPTIONS, fontFamilyFor, normalizeGlobalBorderColor, normalizeGlobalFont, normalizeGlobalTextColor } from "../lib/typography";

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

  it("defaults the shared font color to white and accepts the full Themes color palette", () => {
    expect(FONT_COLOR_OPTIONS[0]).toEqual(["#FFFFFF", "White"]);
    expect(normalizeGlobalTextColor("#FF8FC6")).toBe("#FF8FC6");
    expect(normalizeGlobalTextColor("#000000")).toBe("#000000");
    expect(normalizeGlobalTextColor(undefined)).toBe("#FFFFFF");
  });

  it("offers a wide set of visibly distinct font-color selections", () => {
    expect(FONT_COLOR_OPTIONS.map(([color]) => color)).toEqual(expect.arrayContaining([
      "#FFFFFF", "#000000", "#FF8FC6", "#8FE8FF", "#FFE16B", "#D7A7FF", "#B7ED4B",
    ]));
    expect(FONT_COLOR_OPTIONS).toHaveLength(11);
  });

  it("defaults the shared border color to black and accepts only the Themes border choices", () => {
    expect(BORDER_COLOR_OPTIONS[0]).toEqual(["#000000", "Black"]);
    expect(normalizeGlobalBorderColor("#E454A7")).toBe("#E454A7");
    expect(normalizeGlobalBorderColor("#123456")).toBe("#000000");
    expect(normalizeGlobalBorderColor(undefined)).toBe("#000000");
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
    const profiles = readFileSync(resolve(process.cwd(), "components/partner-profiles-editor.tsx"), "utf8");
    const frame = readFileSync(resolve(process.cwd(), "components/app-frame.tsx"), "utf8");

    expect(today).toContain('const textColor = theme.fontColor ?? "#FFFFFF"');
    expect(today).toContain('style={[styles.dailySparkText, { color: textColor }]}');
    expect(today).toContain('style={[styles.loveName, { color: textColor }]}');
    expect(editor).toContain("PARTNER EMOJI");
    expect(editor).toContain("FONT COLOR");
    expect(editor).toContain("Together Daily header and page navigation above");
    expect(editor).toContain("setActiveGlobalTextColor(color)");
    expect(editor).toContain("setPartnerEmoji");
    expect(profiles).not.toContain("FONT_COLOR_OPTIONS");
    expect(profiles).not.toContain("TextInput value={partnerAvatars[id]}");
    expect(frame).toContain('styles.brand, { fontFamily, color: textColor }');
    expect(frame).toContain('styles.pageMenuCurrent, { fontFamily, color: textColor }');
    expect(frame).toContain('styles.pageMenuItemGlyph, { color: textColor }');
  });

  it("updates the native root typography bridge from the current shared journal state", () => {
    const rootLayout = readFileSync(resolve(process.cwd(), "app/_layout.tsx"), "utf8");

    expect(rootLayout).toContain("function JournalRoutes()");
    expect(rootLayout).toContain("const { theme, customSubheadings } = useLocalJournal();");
    expect(rootLayout).toContain("setActiveGlobalTextColor(normalizeGlobalTextColor(theme.fontColor));");
    expect(rootLayout).toContain("setActiveGlobalFont(selectedFont, fontFamilyFor(selectedFont, Platform.OS as FontPlatform));");
    expect(rootLayout).toContain("<JournalRoutes />");
  });
});
