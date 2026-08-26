import { describe, expect, it } from "vitest";

import { TAB_CARD_PALETTES } from "../lib/together";
import {
  TAB_CARD_IDS,
  resolveTabCardColor,
  shouldApplyTabCardColor,
  tabCardColorDrafts,
  tabCardColorFromStyles,
  tabCardColorStylePatches,
} from "../lib/tab-card-colors";

describe("per-tab card colors", () => {
  it("provides one valid default color for every navigation tab", () => {
    expect(TAB_CARD_IDS).toHaveLength(9);
    for (const tabId of TAB_CARD_IDS) {
      expect(resolveTabCardColor(tabId)).toBe(TAB_CARD_PALETTES[tabId].surface);
      expect(resolveTabCardColor(tabId)).toMatch(/^#[0-9A-F]{6}$/);
    }
  });

  it("keeps each custom tab color independent", () => {
    const pageStyles = {
      today: { cardBackgroundColor: "#123456" },
      health: { cardBackgroundColor: "#234567" },
      themes: { cardBackgroundColor: "#345678" },
    };
    const colors = tabCardColorDrafts(pageStyles);

    expect(colors.today).toBe("#123456");
    expect(colors.health).toBe("#234567");
    expect(colors.themes).toBe("#345678");
    expect(colors.cleaning).toBe(TAB_CARD_PALETTES.cleaning.surface);
  });

  it("falls back to the tab default when a saved value is malformed", () => {
    expect(
      tabCardColorFromStyles(
        { steamy: { cardBackgroundColor: "not-a-color" } },
        "steamy",
      ),
    ).toBe(TAB_CARD_PALETTES.steamy.surface);
  });

  it("builds one valid save patch for every tab without dropping earlier choices", () => {
    const patches = tabCardColorStylePatches({
      today: "#102030",
      health: "#204060",
      themes: "#603080",
    });

    expect(Object.keys(patches)).toEqual(TAB_CARD_IDS);
    expect(patches.today.cardBackgroundColor).toBe("#102030");
    expect(patches.health.cardBackgroundColor).toBe("#204060");
    expect(patches.themes.cardBackgroundColor).toBe("#603080");
    expect(patches.habits.cardBackgroundColor).toBe(TAB_CARD_PALETTES.habits.surface);
  });

  it("targets card surfaces without recoloring compact controls", () => {
    expect(
      shouldApplyTabCardColor({
        backgroundColor: "#101923",
        borderRadius: 18,
        padding: 14,
      }),
    ).toBe(true);
    expect(
      shouldApplyTabCardColor({
        backgroundColor: "#101923",
        borderRadius: 10,
        width: 40,
        height: 40,
        padding: 8,
      }),
    ).toBe(false);
    expect(
      shouldApplyTabCardColor({
        backgroundColor: "#101923",
        borderRadius: 10,
        padding: 10,
        position: "absolute",
      }),
    ).toBe(false);
  });
});
