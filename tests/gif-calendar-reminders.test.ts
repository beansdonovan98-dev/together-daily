import { describe, expect, it } from "vitest";

import { gifFrameHeight } from "../lib/gif-frame";
import { monthCells, shiftMonth } from "../lib/shared-calendar";
import { medicineReminderTime } from "../lib/medicine-reminder-time";

describe("responsive GIF frames", () => {
  it("keeps both wide and tall GIFs fully within the gallery’s bounded frame", () => {
    expect(gifFrameHeight(320, { width: 1600, height: 800 })).toBe(160);
    expect(gifFrameHeight(320, { width: 800, height: 1600 })).toBe(420);
  });
});

describe("shared calendar", () => {
  it("renders each monthly ninth as an accessible heart day", () => {
    const ninth = monthCells(2026, 8).find((cell) => cell?.day === 9);
    expect(ninth).toEqual({ date: "2026-09-09", day: 9, isHeartDay: true });
    expect(shiftMonth(2026, 0, -1)).toEqual({ year: 2025, monthIndex: 11 });
  });
});

describe("medicine reminder time", () => {
  it("turns the saved time-only medicine log value into a daily trigger", () => {
    expect(medicineReminderTime("12:01 AM")).toEqual({ hour: 0, minute: 1 });
    expect(medicineReminderTime("11:59 PM")).toEqual({ hour: 23, minute: 59 });
    expect(medicineReminderTime("noon")).toBeNull();
  });
});
