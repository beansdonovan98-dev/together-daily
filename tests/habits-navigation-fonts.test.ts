import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { FONT_COLOR_OPTIONS, normalizeGlobalTextColor } from "../lib/typography";

describe("compact Pages navigation", () => {
  it("replaces the horizontal strip with an accessible Pages menu and omits removed pages", () => {
    const frame = readFileSync(resolve(process.cwd(), "components/app-frame.tsx"), "utf8");
    const tabs = readFileSync(resolve(process.cwd(), "app/(tabs)/_layout.tsx"), "utf8");

    expect(frame).toContain('accessibilityLabel="Choose a page"');
    expect(frame).toContain("pagesOpen");
    expect(frame).toContain("styles.pageMenuGrid");
    expect(frame).not.toContain("style={styles.tabScroller}");
    expect(frame).not.toContain('id: "puzzles"');
    expect(frame).not.toContain('id: "habits"');
    expect(tabs).not.toContain('name="puzzles"');
    expect(tabs).not.toContain('name="habits"');
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
