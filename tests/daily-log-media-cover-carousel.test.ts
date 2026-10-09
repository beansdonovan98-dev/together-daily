import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("Daily Log media and multi-cover carousel", () => {
  it("uploads Daily Log photos and GIFs directly to dated secure storage", () => {
    const journal = source("lib/local-journal.tsx");
    const router = source("server/routers.ts");
    const db = source("server/db.ts");
    const log = source("app/(tabs)/log.tsx");

    expect(router).toContain("requestDailyLogMediaDirectUpload");
    expect(router).toContain("confirmDailyLogMediaDirectUpload");
    expect(router).toContain("guest-rooms/${roomCode}/daily-log/${input.dailyDate}/");
    expect(db).toContain("addGuestRoomDailyLogMedia");
    expect(db).toContain("deleteGuestRoomDailyLogMedia");
    expect(journal).toContain("uploadDailyLogMediaDirect:async");
    expect(journal).toContain("deleteDailyLogMedia:async");
    expect(log).toContain("uploadDailyLogMediaDirect");
    expect(log).toContain("▣ ADD PHOTO OR GIF");
    expect(log).toContain('item.kind === "photo" && item.dailyDate === date');
    expect(log).toContain('contentFit="contain" contentPosition="center"');
  });

  it("adds any number of covers to a paging iPhone carousel without replacing earlier covers", () => {
    const today = source("app/(tabs)/index.tsx");
    const journal = source("lib/local-journal.tsx");
    const router = source("server/routers.ts");
    const db = source("server/db.ts");

    expect(today).toContain("allowsMultipleSelection: true");
    expect(today).toContain("selectionLimit: 0");
    expect(today).toContain("pagingEnabled");
    expect(today).toContain("Swipe left or right to see every cover");
    expect(today).toContain("uploadDailyCoverCarouselDirect");
    expect(journal).toContain("uploadDailyCoverCarouselDirect:async");
    expect(journal).toContain("deleteDailyCoverCarouselItem:async");
    expect(router).toContain("requestDailyCoverCarouselDirectUpload");
    expect(router).toContain("confirmDailyCoverCarouselDirectUpload");
    expect(db).toContain("addGuestRoomDailyCoverCarouselItem");
    expect(db).toContain("coverPhotos: [...existingCovers, input.media]");
  });

  it("keeps cover and Daily Log GIF files on the original iPhone asset path", () => {
    const today = source("app/(tabs)/index.tsx");
    const log = source("app/(tabs)/log.tsx");

    expect(today).toContain("UIImagePickerPreferredAssetRepresentationMode.Current");
    expect(log).toContain("UIImagePickerPreferredAssetRepresentationMode.Current");
    expect(today).toContain("base64: false");
    expect(log).toContain("base64: false");
  });
});
