import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { PASTEL_THEMES, SAVED_THEMES } from "../lib/ready-made-themes";
import { isThemeGradient, resolveEffectiveTheme, resolveThemeBackdrop, themeGradientColors } from "../lib/theme-gradients";

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

  it("prefers the active partner theme over the shared fallback", () => {
    const theme = resolveEffectiveTheme(
      { accentColor: "#A421FF", backgroundColor: "#22002E", fontColor: "#FFFFFF" },
      { accentColor: "#FF2D95", backgroundColor: "#4D082A", fontColor: "#FF8FC6" },
    );

    expect(theme.accentColor).toBe("#FF2D95");
    expect(theme.backgroundColor).toBe("#4D082A");
    expect(theme.fontColor).toBe("#FF8FC6");
  });

  it("gives every ready-made Theme a valid vibrant gradient", () => {
    const allThemes = [...SAVED_THEMES, ...PASTEL_THEMES];
    expect(allThemes.length).toBeGreaterThan(0);
    expect(allThemes.every((theme) => isThemeGradient(theme.gradient))).toBe(true);
  });

  it("includes an expanded pastel collection of readable gradient presets", () => {
    expect(PASTEL_THEMES.length).toBeGreaterThanOrEqual(20);
    expect(PASTEL_THEMES.map((theme) => theme.name)).toContain("Strawberry Cream");
    expect(PASTEL_THEMES.map((theme) => theme.name)).toContain("Robin Egg");
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
    const tabManager = readFileSync(resolve(process.cwd(), "components/tab-manager.tsx"), "utf8");

    expect(appFrame).toContain("function revealGradientCardSurfaces");
    expect(appFrame).toContain("const isNativeView = element.type === View");
    expect(appFrame).toContain("const isTextElement = element.type === Text || element.type === TextInput");
    expect(appFrame).toContain("const hasRoundedOutline =");
    expect(appFrame).toContain("Number(flatStyle.borderWidth ?? 0) > 0");
    expect(appFrame).toContain("isCardSurface || hasRoundedOutline");
    expect(appFrame).toContain("const borderColor = normalizeGlobalBorderColor(theme.borderColor)");
    expect(appFrame).toContain("borderColor,");
    expect(tabManager).toContain("const textColor = normalizeGlobalTextColor(theme.fontColor)");
    expect(tabManager).toContain("const borderColor = normalizeGlobalBorderColor(theme.borderColor)");
    expect(tabManager).toContain("borderTopColor: borderColor");
    expect(tabManager).toContain("style={[styles.kicker, { color: textColor }]}");
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

  it("keeps Steamy’s primary safe, gallery, and log cards on the active gradient", () => {
    const steamy = readFileSync(resolve(process.cwd(), "app/(tabs)/steamy.tsx"), "utf8");

    expect(steamy).toContain('const gradientCard = { backgroundColor: "transparent", borderColor: "#000000" }');
    expect(steamy).toContain('style={[styles.safeCard, gradientCard]}');
    expect((steamy.match(/style=\{\[styles\.card, gradientCard\]\}/g) ?? [])).toHaveLength(1);
    expect(steamy).toContain('style={[styles.cumCard, gradientCard]}');
    expect(steamy).not.toContain("Just the two of you");
    expect(steamy).toContain("intimateEntryDateTimeLabel(record.createdAt, date)");
    expect(steamy).toContain('pathname: "/steamy", params: { date:');
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

  it("routes all primary pages and shared card sections through the global visual primitives", () => {
    const primitives = readFileSync(resolve(process.cwd(), "components/visual-primitives.tsx"), "utf8");
    const files = [
      "app/(tabs)/index.tsx",
      "app/(tabs)/log.tsx",
      "app/(tabs)/puzzles.tsx",
      "app/(tabs)/habits.tsx",
      "app/(tabs)/health.tsx",
      "app/(tabs)/cleaning.tsx",
      "app/(tabs)/days.tsx",
      "app/(tabs)/memories.tsx",
      "app/(tabs)/purchases.tsx",
      "app/(tabs)/steamy.tsx",
      "app/(tabs)/themes.tsx",
      "components/page-theme-editor.tsx",
      "components/gradient-creator.tsx",
      "components/partner-profiles-editor.tsx",
      "components/page-descriptions-editor.tsx",
      "components/tab-manager.tsx",
      "components/together-access.tsx",
      "components/weight-tracker-sections.tsx",
      "components/weight-history-graph.tsx",
    ];

    expect(primitives).toContain("normalizeGlobalTextColor(theme.fontColor)");
    expect(primitives).toContain("normalizeGlobalBorderColor(theme.borderColor)");
    expect(primitives).toContain("borderLeftColor: borderColor");
    expect(primitives).toContain("export function VisualText");
    expect(primitives).toContain("export function VisualView");

    for (const file of files) {
      const source = readFileSync(resolve(process.cwd(), file), "utf8");
      expect(source, file).toContain("@/components/visual-primitives");
    }
  });

  it("keeps Puzzles after Daily Log and preserves an optional shared Health Period section", () => {
    const frame = readFileSync(resolve(process.cwd(), "components/app-frame.tsx"), "utf8");
    const tabManager = readFileSync(resolve(process.cwd(), "components/tab-manager.tsx"), "utf8");
    const health = readFileSync(resolve(process.cwd(), "app/(tabs)/health.tsx"), "utf8");
    const journal = readFileSync(resolve(process.cwd(), "lib/local-journal.tsx"), "utf8");

    expect(frame.indexOf('id: "log"')).toBeLessThan(frame.indexOf('id: "puzzles"'));
    expect(frame.indexOf('id: "puzzles"')).toBeLessThan(frame.indexOf('id: "habits"'));
    expect(tabManager.indexOf('id: "log"')).toBeLessThan(tabManager.indexOf('id: "puzzles"'));
    expect(tabManager.indexOf('id: "puzzles"')).toBeLessThan(tabManager.indexOf('id: "habits"'));
    expect(health).toContain("setHealthPeriodVisible(!healthPeriodVisible)");
    expect(health).toContain("healthPeriodVisible ? periodTracker : null");
    expect(journal).toContain("healthPeriodVisible:state.healthPeriodVisible!==false");
  });

  it("keeps Daily Log event-creator surfaces transparent above the active gradient", () => {
    const dailyLog = readFileSync(resolve(process.cwd(), "app/(tabs)/log.tsx"), "utf8");

    expect(dailyLog).toContain('composer: { backgroundColor: "transparent"');
    expect(dailyLog).toContain('customPanel: { borderRadius: 12, backgroundColor: "transparent"');
  });

  it("renders a dedicated event-color rail without bypassing the shared border color", () => {
    const log = readFileSync(resolve(process.cwd(), "app/(tabs)/log.tsx"), "utf8");
    expect(log).toContain("eventColorRail");
    expect(log).toContain("backgroundColor: style.color");
    expect(log).toContain("backgroundColor: `${style.color}55`");
    expect(log).not.toContain("borderLeftColor: author.color");
  });

  it("offers a persisted color editor for every saved Daily Log Moment Type", () => {
    const log = readFileSync(resolve(process.cwd(), "app/(tabs)/log.tsx"), "utf8");
    const journal = readFileSync(resolve(process.cwd(), "lib/local-journal.tsx"), "utf8");

    expect(log).toContain("Edit saved ${styleOption.label} color");
    expect(log).toContain("CHOOSE A NEW SAVED COLOR");
    expect(log).toContain("updateLogStyleColor(style.id, color)");
    expect(journal).toContain("updateLogStyleColor:(id,color)");
    expect(journal).toContain("recolorSavedLogStyle");
  });

  it("keeps Medicine as a checkbox-free time log and places Snack Tracker between Meals and Water", () => {
    const health = readFileSync(resolve(process.cwd(), "app/(tabs)/health.tsx"), "utf8");

    expect(health).toContain('kind === "tasks" ? <TouchableOpacity');
    expect(health).not.toContain('REMINDER ON');
    expect(health).toContain("SNACK LOG");
    expect(health.indexOf("MEAL PLANNER")).toBeLessThan(health.indexOf("SNACK LOG"));
    expect(health.indexOf("SNACK LOG")).toBeLessThan(health.indexOf("DAILY WATER"));
  });

  it("persists tab emoji and label changes as one shared update and shows Love Notes before covers", () => {
    const journal = readFileSync(resolve(process.cwd(), "lib/local-journal.tsx"), "utf8");
    const tabs = readFileSync(resolve(process.cwd(), "components/tab-manager.tsx"), "utf8");
    const today = readFileSync(resolve(process.cwd(), "app/(tabs)/index.tsx"), "utf8");

    expect(journal).toContain("setTabCustomizations:");
    expect(journal).toContain("tabLabels:nextLabels,tabGlyphs:nextGlyphs,tabOrder:order");
    expect(tabs).toContain("setTabCustomizations({ labels, glyphs, order })");
    expect(today.indexOf("{loveNotesSection}")).toBeLessThan(today.indexOf("<View style={styles.coverGrid}"));
  });
});
