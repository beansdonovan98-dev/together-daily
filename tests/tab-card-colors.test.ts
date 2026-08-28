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

describe("gradient-revealing tab card surfaces", () => {
  it("keeps every navigation tab's primary cards transparent", () => {
    expect(TAB_CARD_IDS).toHaveLength(9);
    for (const tabId of TAB_CARD_IDS) {
      expect(resolveTabCardColor(tabId)).toBe(TAB_CARD_PALETTES[tabId].surface);
      expect(resolveTabCardColor(tabId)).toBe("transparent");
    }
  });

  it("ignores old saved card-fill colors so they cannot cover the active gradient", () => {
    const pageStyles = {
      today: { cardBackgroundColor: "#123456" },
      health: { cardBackgroundColor: "#234567" },
      themes: { cardBackgroundColor: "#345678" },
    };
    const colors = tabCardColorDrafts(pageStyles);

    expect(colors.today).toBe("transparent");
    expect(colors.health).toBe("transparent");
    expect(colors.themes).toBe("transparent");
    expect(colors.cleaning).toBe("transparent");
  });

  it("does not reveal an opaque fill when a saved value is malformed", () => {
    expect(
      tabCardColorFromStyles(
        { steamy: { cardBackgroundColor: "not-a-color" } },
        "steamy",
      ),
    ).toBe("transparent");
  });

  it("builds transparent save patches for every tab", () => {
    const patches = tabCardColorStylePatches({
      today: "#102030",
      health: "#204060",
      themes: "#603080",
    });

    expect(Object.keys(patches)).toEqual(TAB_CARD_IDS);
    expect(patches.today.cardBackgroundColor).toBe("transparent");
    expect(patches.health.cardBackgroundColor).toBe("transparent");
    expect(patches.themes.cardBackgroundColor).toBe("transparent");
    expect(patches.habits.cardBackgroundColor).toBe("transparent");
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
