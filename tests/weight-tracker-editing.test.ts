import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Weight Tracker editing", () => {
  it("offers a direct edit control for the newest personal check-in", () => {
    const source = readFileSync(
      resolve(process.cwd(), "components/weight-tracker-sections.tsx"),
      "utf8",
    );

    expect(source).toContain("const [editingWeightDate, setEditingWeightDate]");
    expect(source).toContain("Edit latest");
    expect(source).toContain("EDIT THIS CHECK-IN");
    expect(source).toContain("saveLatestWeightEdit");
    expect(source).toContain("Cancel");
  });

  it("preserves a saved entry date while allowing the value to be corrected", () => {
    const source = readFileSync(
      resolve(process.cwd(), "components/weight-tracker-sections.tsx"),
      "utf8",
    );

    expect(source).toContain("updateDay(editingWeightDate");
    expect(source).toContain("recordedAt: existing?.recordedAt ?? new Date().toISOString()");
    expect(source).toContain("You can edit your own latest check-in any time.");
  });
});
