import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createEmptyDailyContent } from "../server/db";
import { appRouter } from "../server/routers";
import type { TrpcContext } from "../server/_core/context";
import { filterSteamyDailyContent } from "../lib/local-journal";

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

  it("only keeps steamy chat and private photos for the current day", () => {
    const today = "2026-08-22";
    const records = [
      { id: "old-chat", authorId: "beans", recordType: "steamyChat", content: { text: "Old" }, createdAt: "2026-08-21T10:00:00.000Z", dailyDate: "2026-08-21" },
      { id: "today-chat", authorId: "princess", recordType: "steamyChat", content: { text: "Today" }, createdAt: "2026-08-22T11:00:00.000Z", dailyDate: "2026-08-22" },
      { id: "daily-note", authorId: "beans", recordType: "cumLog", content: { text: "Today note" }, createdAt: "2026-08-22T12:00:00.000Z", dailyDate: "2026-08-22" },
    ] as any;
    const media = [
      { id: "old-private", kind: "private", url: "/old.jpg", fileName: "old.jpg", mimeType: "image/jpeg", caption: "Old", createdAt: "2026-08-21T10:00:00.000Z", dailyDate: "2026-08-21", uploadedBy: "beans" },
      { id: "today-private", kind: "private", url: "/today.jpg", fileName: "today.jpg", mimeType: "image/jpeg", caption: "Today", createdAt: "2026-08-22T12:00:00.000Z", dailyDate: "2026-08-22", uploadedBy: "princess" },
      { id: "cover", kind: "cover", url: "/cover.jpg", fileName: "cover.jpg", mimeType: "image/jpeg", caption: "Safe", createdAt: "2026-08-22T08:00:00.000Z", dailyDate: "2026-08-22", uploadedBy: "beans" },
    ] as any;

    const filtered = filterSteamyDailyContent(records, media, today);

    expect(filtered.records.map((item) => item.id)).toEqual(["today-chat", "daily-note"]);
    expect(filtered.media.map((item) => item.id)).toEqual(["today-private", "cover"]);
  });
});
