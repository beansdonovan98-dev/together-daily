import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { PASTEL_THEMES, SAVED_THEMES } from "../lib/ready-made-themes";
import { isThemeGradient, resolveThemeBackdrop, themeGradientColors } from "../lib/theme-gradients";

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

  it("keeps a selected gradient above legacy per-page solid colors on iPhone", () => {
    const vivid = SAVED_THEMES[0];
    const pastel = PASTEL_THEMES[0];

    for (const theme of [vivid, pastel]) {
      const backdrop = resolveThemeBackdrop(
        { backgroundColor: theme.background, backgroundGradient: theme.gradient },
        { backgroundColor: "#171218" },
        "#000000",
      );

      expect(backdrop.gradient).toEqual(theme.gradient);
      expect(backdrop.backgroundColor).toBe(theme.gradient[0]);
    }
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

  it("previews selected gradients across Themes and clears older page overrides by default", () => {
    const editor = readFileSync(resolve(process.cwd(), "components/page-theme-editor.tsx"), "utf8");
    const journal = readFileSync(resolve(process.cwd(), "lib/local-journal.tsx"), "utf8");

    expect(editor).toContain("const previewAcrossPages = (preset: ReadyMadeTheme)");
    expect(editor).toContain("setTheme({ accentColor: preset.accent, backgroundColor: preset.background, backgroundGradient: [...preset.gradient] })");
    expect(editor).toContain("preview it across this entire Themes page");
    expect(editor).toContain("Keep this gradient on every page");
    expect(journal).toContain("pageStyles=patch.backgroundGradient?Object.fromEntries");
    expect(journal).toContain("backgroundGradient:undefined");
  });

  it("does not rely on production-minified component names or global stylesheet rewrites", () => {
    const appFrame = readFileSync(resolve(process.cwd(), "components/app-frame.tsx"), "utf8");
    const rootLayout = readFileSync(resolve(process.cwd(), "app/_layout.tsx"), "utf8");

    expect(appFrame).toContain("function revealGradientCardSurfaces");
    expect(appFrame).toContain("const isNativeView = element.type === View");
    expect(appFrame).toContain("const isTextElement = element.type === Text || element.type === TextInput");
    expect(appFrame).toContain('color: "#FFFFFF",');
    expect(appFrame).toContain("fontFamily,");
    expect(appFrame).toContain("fontSize: Math.round(baseFontSize * 1.16)");
    expect(appFrame).toContain('containerClassName="bg-black"');
    expect(appFrame).toContain('backgroundColor: backgroundGradient ? "transparent" : backgroundColor');
    expect(appFrame).not.toContain("componentName");
    expect(appFrame).not.toContain("applyTabCardColor");
    expect(appFrame).not.toContain("borderColor: accentColor");
    expect(rootLayout).not.toContain("StyleSheet.create =");
    expect(rootLayout).not.toContain("cardLike");
  });

  it("keeps Steamy’s primary safe, chat, gallery, and log cards on the active gradient", () => {
    const steamy = readFileSync(resolve(process.cwd(), "app/(tabs)/steamy.tsx"), "utf8");

    expect(steamy).toContain('const gradientCard = { backgroundColor: "transparent", borderColor: "#000000" }');
    expect(steamy).toContain('style={[styles.safeCard, gradientCard]}');
    expect((steamy.match(/style=\{\[styles\.card, gradientCard\]\}/g) ?? [])).toHaveLength(2);
    expect(steamy).toContain('style={[styles.cumCard, gradientCard]}');
  });

  it("uses transparent shared tab-card surfaces with true-white shared text tokens", async () => {
    const palette = await import("../lib/together");

    expect(Object.values(palette.TAB_CARD_PALETTES).every((card) => card.surface === "transparent")).toBe(true);
    expect(palette.COLORS.slate).toBe("#FFFFFF");
    expect(palette.COLORS.white).toBe("#FFFFFF");
  });

  it("keeps the iPhone status area readable and Today’s five daily cards distinctly outlined", () => {
    const rootLayout = readFileSync(resolve(process.cwd(), "app/_layout.tsx"), "utf8");
    const appFrame = readFileSync(resolve(process.cwd(), "components/app-frame.tsx"), "utf8");
    const today = readFileSync(resolve(process.cwd(), "app/(tabs)/index.tsx"), "utf8");

    expect(rootLayout).toContain('<StatusBar style="light" animated />');
    expect(appFrame).toContain('invitePanelHeader: {');
    expect(appFrame).toContain('backgroundColor: "transparent",');
    expect(appFrame).toContain('invitePanelKicker: {\n    color: "#FFFFFF"');
    expect(today).toContain('dailySparkCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 15, gap: 8, borderWidth: 2, borderColor: "#000000" }');
  });
});
