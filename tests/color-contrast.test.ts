import { describe, expect, it } from "vitest";

import { colorContrastRatio, contrastGuidance } from "../lib/color-contrast";

describe("theme color contrast", () => {
  it("calculates a high ratio for white on black", () => {
    expect(colorContrastRatio("#FFFFFF", "#000000")).toBe(21);
  });

  it("classifies strong, moderate, and low readability guidance", () => {
    expect(contrastGuidance(5).tone).toBe("strong");
    expect(contrastGuidance(3.5).tone).toBe("moderate");
    expect(contrastGuidance(2.2).tone).toBe("low");
  });
});
