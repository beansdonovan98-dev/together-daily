import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Together Daily header", () => {
  it("shows a readable current calendar date", () => {
    const source = readFileSync(
      resolve(process.cwd(), "components/app-frame.tsx"),
      "utf8",
    );

    expect(source).toContain("const headerDate = new Date().toLocaleDateString");
    expect(source).toContain('weekday: "short"');
    expect(source).toContain("styles.brandDate");
    expect(source).toContain("{headerDate}");
  });
});
