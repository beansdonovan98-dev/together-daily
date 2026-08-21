import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createEmptyDailyContent } from "../server/db";
import { appRouter } from "../server/routers";
import type { TrpcContext } from "../server/_core/context";

describe("daily template", () => {
  it("is valid cleared JSON with explicit upload-ready photo fields", () => {
    const raw = readFileSync(`${process.cwd()}/data/daily-log-template.json`, "utf8");
    const template = JSON.parse(raw);

    expect(template.settings.pageTitle).toBe("Together Daily");
    expect(template.logs).toEqual([]);
    expect(template.chatMessages).toEqual([]);
    expect(template.loveNotes).toEqual([]);
    expect(template.dateIdeas).toEqual([]);
    expect(template.dailyLogTemplate.coverPhoto).toBeNull();
    expect(template.dailyLogTemplate.photos).toEqual([]);
    expect(template.photoTemplate).toMatchObject({ url: null, storageKey: null, mimeType: null, caption: "" });
    expect(template.coverPhotoTemplate).toMatchObject({ url: null, storageKey: null, mimeType: null, altText: "" });
  });

  it("creates a fresh daily log from empty defaults and rotates its prompt by date", () => {
    const firstDay = createEmptyDailyContent("2026-08-21");
    const nextDay = createEmptyDailyContent("2026-08-22");

    expect(firstDay).toMatchObject({
      date: "2026-08-21",
      coverPhoto: null,
      todos: [],
      photos: [],
      checkIns: {},
      sharedHighlight: "",
    });
    expect(firstDay.questionText).not.toEqual(nextDay.questionText);
    expect(nextDay).toMatchObject({ date: "2026-08-22", water: { glassesLogged: 0, dailyGoalGlasses: 8 } });
  });

  it("rejects private couple and daily-log routes before data access when a session is absent", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: {} as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    });

    await expect(caller.couple.mine()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.daily.get({ date: "2026-08-21" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
