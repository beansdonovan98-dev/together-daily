import { describe, expect, it } from "vitest";

import { mergeSharedThemeRevision } from "../lib/shared-theme-sync";

describe("shared Theme synchronization", () => {
  it("retains the newer shared Theme and clears obsolete per-page styling from a stale room snapshot", () => {
    const next = mergeSharedThemeRevision(
      { theme: { backgroundColor: "#4D082A" }, pageStyles: { health: { accentColor: "#FF2D95" } }, themeUpdatedAt: 200 },
      { theme: { backgroundColor: "#17113A" }, pageStyles: {}, themeUpdatedAt: 100, days: { "2026-09-24": { sharedHighlight: "Dinner" } } },
    );

    expect(next.theme).toEqual({ backgroundColor: "#4D082A" });
    expect(next.pageStyles).toBeUndefined();
    expect(next.themeUpdatedAt).toBe(200);
    expect(next.days).toEqual({ "2026-09-24": { sharedHighlight: "Dinner" } });
  });

  it("accepts a newer shared Theme update from either partner", () => {
    const next = mergeSharedThemeRevision(
      { theme: { fontColor: "#FFFFFF" }, themeUpdatedAt: 100 },
      { theme: { fontColor: "#8FE8FF" }, themeUpdatedAt: 201 },
    );

    expect(next.theme).toEqual({ fontColor: "#8FE8FF" });
    expect(next.themeUpdatedAt).toBe(201);
  });
});
