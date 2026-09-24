import { describe, expect, it } from "vitest";

import {
  mergePersonalThemeUpdate,
  selectPersonalTheme,
  updatePersonalTheme,
} from "../lib/personal-theme-preferences";

describe("personal Theme preferences", () => {
  it("uses a legacy shared theme only until each partner selects their own", () => {
    const legacy = { accentColor: "#A421FF", fontColor: "#FFFFFF" };
    const saved = { princess: { accentColor: "#FF2D95", fontColor: "#FF8FC6" } };

    expect(selectPersonalTheme(legacy, saved, "beans")).toEqual(legacy);
    expect(selectPersonalTheme(legacy, saved, "princess")).toEqual({
      accentColor: "#FF2D95",
      fontColor: "#FF8FC6",
    });
  });

  it("updates only the active partner and preserves the other partner theme", () => {
    const saved = {
      beans: { backgroundColor: "#201040", fontColor: "#FFFFFF" },
      princess: { backgroundColor: "#4D082A", fontColor: "#FF8FC6" },
    };

    expect(updatePersonalTheme({}, saved, "beans", { fontColor: "#8FE8FF" })).toEqual({
      beans: { backgroundColor: "#201040", fontColor: "#8FE8FF" },
      princess: { backgroundColor: "#4D082A", fontColor: "#FF8FC6" },
    });
  });

  it("merges a partner update on the server without erasing the other partner theme", () => {
    const existing = {
      beans: { backgroundColor: "#201040" },
      princess: { backgroundColor: "#4D082A" },
    };
    const incoming = {
      beans: { backgroundColor: "#003D3B", fontColor: "#8FE8FF" },
    };

    expect(mergePersonalThemeUpdate(existing, incoming, "beans")).toEqual({
      beans: { backgroundColor: "#003D3B", fontColor: "#8FE8FF" },
      princess: { backgroundColor: "#4D082A" },
    });
  });
});
