import { describe, expect, it } from "vitest";

import { recolorSavedLogStyle } from "../lib/log-style-utils";

describe("saved Daily Log Moment Type colors", () => {
  it("updates the saved color and matching existing events across days", () => {
    const styles = [{ id: "date-night", label: "Date night", emoji: "♥", color: "#EE43B8", createdBy: "beans" as const }];
    const days = {
      "2026-09-23": { timelineEvents: [{ id: "old", type: "Date night", emoji: "♥", color: "#EE43B8" }] },
      "2026-09-24": { timelineEvents: [{ id: "today", type: "Date night", emoji: "♥", color: "#EE43B8" }] },
    };

    const result = recolorSavedLogStyle(styles, days, "date-night", "#4E8FE8");

    expect(result.changed).toBe(true);
    expect(result.styles[0].color).toBe("#4E8FE8");
    expect((result.days["2026-09-23"].timelineEvents?.[0] as { color: string }).color).toBe("#4E8FE8");
    expect((result.days["2026-09-24"].timelineEvents?.[0] as { color: string }).color).toBe("#4E8FE8");
  });

  it("preserves independently recolored events and rejects malformed colors", () => {
    const styles = [{ id: "date-night", label: "Date night", emoji: "♥", color: "#EE43B8" }];
    const days = {
      "2026-09-24": { timelineEvents: [{ id: "custom", type: "Date night", emoji: "♥", color: "#63C8A3" }] },
    };

    const updated = recolorSavedLogStyle(styles, days, "date-night", "#4E8FE8");
    expect((updated.days["2026-09-24"].timelineEvents?.[0] as { color: string }).color).toBe("#63C8A3");

    const rejected = recolorSavedLogStyle(styles, days, "date-night", "blue");
    expect(rejected.changed).toBe(false);
    expect(rejected.styles).toBe(styles);
    expect(rejected.days).toBe(days);
  });
});
