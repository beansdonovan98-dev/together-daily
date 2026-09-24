import { describe, expect, it } from "vitest";

import { clearPageContent } from "../lib/page-content-reset";

const emptyDay = (date: string) => ({ date, timelineEvents: [], todos: [], sharedNotes: "" });

function state() {
  return {
    days: {
      "2026-09-24": {
        date: "2026-09-24",
        timelineEvents: [{ id: "log" }],
        todos: [{ id: "todo" }],
        loveNotes: { beans: "Love you" },
        coverPhoto: { id: "cover" },
        habits: { list: ["Walk"], checks: { Walk: { beans: true } } },
        health: { tasks: [{ id: "health" }] },
      },
      "2026-09-21": { date: "2026-09-21", cleaning: { tasks: [{ id: "weekly" }] } },
    },
    records: [
      { id: "today-intimate", recordType: "cumLog", dailyDate: "2026-09-24" },
      { id: "past-intimate", recordType: "cumLog", dailyDate: "2026-09-23" },
    ],
    media: [
      { id: "cover", kind: "cover", dailyDate: "2026-09-24" },
      { id: "private-today", kind: "private", dailyDate: "2026-09-24" },
      { id: "private-past", kind: "private", dailyDate: "2026-09-23" },
    ],
    purchaseItems: [{ id: "purchase" }],
    calendarEntries: [{ id: "calendar" }],
    calendarBackground: { id: "background" },
  };
}

describe("page content reset", () => {
  it("clears Today additions without deleting Daily Log content", () => {
    const next = clearPageContent(state(), "today", "2026-09-24", "2026-09-21", emptyDay);

    expect(next.days["2026-09-24"].loveNotes).toEqual({});
    expect(next.days["2026-09-24"].coverPhoto).toBeNull();
    expect(next.days["2026-09-24"].timelineEvents).toEqual([{ id: "log" }]);
    expect(next.days["2026-09-24"].todos).toEqual([{ id: "todo" }]);
    expect(next.media.map((item) => item.id)).not.toContain("cover");
  });

  it("clears the selected page while leaving unrelated and previous-day content", () => {
    const steamy = clearPageContent(state(), "steamy", "2026-09-24", "2026-09-21", emptyDay);
    const calendar = clearPageContent(state(), "calendar", "2026-09-24", "2026-09-21", emptyDay);

    expect(steamy.records.map((item) => item.id)).toEqual(["past-intimate"]);
    expect(steamy.media.map((item) => item.id)).toContain("private-past");
    expect(steamy.media.map((item) => item.id)).not.toContain("private-today");
    expect(calendar.calendarEntries).toEqual([]);
    expect(calendar.calendarBackground).toBeUndefined();
    expect(calendar.days["2026-09-24"].timelineEvents).toEqual([{ id: "log" }]);
  });

  it("clears Daily Log, habits, health, cleaning, and purchase content independently", () => {
    const log = clearPageContent(state(), "log", "2026-09-24", "2026-09-21", emptyDay);
    const habits = clearPageContent(state(), "habits", "2026-09-24", "2026-09-21", emptyDay);
    const health = clearPageContent(state(), "health", "2026-09-24", "2026-09-21", emptyDay);
    const cleaning = clearPageContent(state(), "cleaning", "2026-09-24", "2026-09-21", emptyDay);
    const purchase = clearPageContent(state(), "purchase", "2026-09-24", "2026-09-21", emptyDay);

    expect(log.days["2026-09-24"].timelineEvents).toEqual([]);
    expect(habits.days["2026-09-24"].habits).toEqual({ list: [], checks: {} });
    expect(health.days["2026-09-24"].health).toEqual({});
    expect(cleaning.days["2026-09-24"].dailyCleaning).toEqual({ tasks: [], date: "2026-09-24" });
    expect(cleaning.days["2026-09-21"].cleaning).toEqual({ tasks: [], weekStart: "2026-09-21" });
    expect(purchase.purchaseItems).toEqual([]);
  });
});
