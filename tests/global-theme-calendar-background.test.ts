import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("global Theme and Calendar background", () => {
  it("uses one shared Theme across every page without a page-by-page reset path", () => {
    const themes = readFileSync(resolve(process.cwd(), "app/(tabs)/themes.tsx"), "utf8");
    const frame = readFileSync(resolve(process.cwd(), "components/app-frame.tsx"), "utf8");
    const journal = readFileSync(resolve(process.cwd(), "lib/local-journal.tsx"), "utf8");

    expect(themes).toContain("ONE SHARED LOOK");
    expect(themes).toContain("Every selection automatically applies across both of your apps and every page.");
    expect(frame).not.toContain("resetPageStyle");
    expect(frame).not.toContain("Reset {currentPage.label} to default");
    expect(frame).toContain("resolveThemeBackdrop(theme, undefined, COLORS.blush)");
    expect(journal).toContain("pageStyles: undefined");
    expect(journal).not.toContain("setPageStyle:");
  });

  it("lets either partner choose, share, replace, and remove a Calendar background photo", () => {
    const calendar = readFileSync(resolve(process.cwd(), "app/(tabs)/calendar.tsx"), "utf8");
    const journal = readFileSync(resolve(process.cwd(), "lib/local-journal.tsx"), "utf8");
    const router = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
    const database = readFileSync(resolve(process.cwd(), "server/db.ts"), "utf8");

    expect(calendar).toContain("Choose photo");
    expect(calendar).toContain("Change photo");
    expect(calendar).toContain("uploadCalendarBackground");
    expect(calendar).toContain("deleteCalendarBackground");
    expect(calendar).toContain('contentFit="contain"');
    expect(journal).toContain("uploadCalendarBackground:async");
    expect(journal).toContain("calendarBackground:state.calendarBackground??null");
    expect(router).toContain("uploadCalendarBackground: publicProcedure");
    expect(router).toContain("deleteCalendarBackground: publicProcedure");
    expect(database).toContain("setGuestRoomCalendarBackground");
  });
});
