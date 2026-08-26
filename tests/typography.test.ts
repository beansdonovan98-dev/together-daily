import { PURE_WHITE } from "../lib/typography";
import { describe, expect, it } from "vitest";

describe("shared typography", () => {
  it("uses pure white as the single app-wide text color token", () => {
    expect(PURE_WHITE).toBe("#FFFFFF");
  });
});
