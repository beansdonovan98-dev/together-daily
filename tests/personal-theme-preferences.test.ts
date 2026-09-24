import { describe, expect, it } from "vitest";

import { removeSharedPageStyle, selectSharedPageStyles, selectSharedTheme } from "../lib/shared-theme-preferences";

describe("shared Theme preferences", () => {
  it("uses one direct shared Theme for both partners", () => {
    const theme = { accentColor: "#A421FF", fontColor: "#FFFFFF" };
    expect(selectSharedTheme(theme, undefined)).toEqual(theme);
  });

  it("migrates older per-partner Theme data into one deterministic shared choice", () => {
    expect(selectSharedTheme(undefined, {
      beans: { backgroundColor: "#201040", fontColor: "#FFFFFF" },
      princess: { backgroundColor: "#4D082A", fontColor: "#FF8FC6" },
    })).toEqual({ backgroundColor: "#201040", fontColor: "#FFFFFF" });
  });

  it("shares page styles and removes only the requested shared page override", () => {
    const styles = selectSharedPageStyles({
      beans: { health: { accentColor: "#123456" } },
      princess: { health: { accentColor: "#FEDCBA" } },
    });
    expect(styles).toEqual({ health: { accentColor: "#123456" } });
    expect(removeSharedPageStyle(styles, "health")).toEqual({});
  });

  it("resets legacy route-key overrides through the page footer", () => {
    const styles = selectSharedPageStyles({
      purchases: { accentColor: "#123456" },
      days: { accentColor: "#FEDCBA" },
    });
    expect(styles).toEqual({
      purchase: { accentColor: "#123456" },
      pastDays: { accentColor: "#FEDCBA" },
    });
    expect(removeSharedPageStyle(styles, "purchase")).toEqual({ pastDays: { accentColor: "#FEDCBA" } });
  });
});
