import { describe, expect, it } from "vitest";

import { removePersonalPageStyle } from "../lib/page-style-reset";

describe("page style reset", () => {
  it("removes only the active partner's selected page overrides", () => {
    const next = removePersonalPageStyle({
      beans: { health: { accentColor: "#123456" }, habits: { cardStyle: "outlined" } },
      princess: { health: { accentColor: "#FEDCBA" } },
    }, "beans", "health");

    expect(next.beans).toEqual({ habits: { cardStyle: "outlined" } });
    expect(next.princess).toEqual({ health: { accentColor: "#FEDCBA" } });
  });
});
