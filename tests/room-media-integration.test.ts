import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function projectFile(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("room switching and automatic media fitting", () => {
  it("keeps a saved-room switcher and three-person room identity choices", () => {
    const journal = projectFile("lib/local-journal.tsx");
    const switcher = projectFile("components/room-switcher.tsx");
    const gate = projectFile("components/together-access.tsx");
    const router = projectFile("server/routers.ts");
    const db = projectFile("server/db.ts");

    expect(journal).toContain('export type PartnerId = "beans" | "princess" | "rara"');
    expect(journal).toContain("savedRooms:prefs.savedRooms");
    expect(journal).toContain("switchRoom:async(room)");
    expect(switcher).toContain("Add & open room");
    expect(gate).toContain("ROOM_MEMBER_IDS.map");
    expect(router).toContain('z.enum(["beans", "princess", "rara"])');
    expect(db).toContain("currentMembers.length >= 3");
  });

  it("persists selected media dimensions and fits GIFs and Calendar images without cropping", () => {
    const journal = projectFile("lib/local-journal.tsx");
    const steamy = projectFile("app/(tabs)/steamy.tsx");
    const calendar = projectFile("app/(tabs)/calendar.tsx");
    const router = projectFile("server/routers.ts");

    expect(journal).toContain("width:input.width,height:input.height");
    expect(router).toContain("width: input.width");
    expect(steamy).toContain("const dimensions = item.width && item.height");
    expect(steamy).toContain("gifFrameHeight(galleryWidth, dimensions)");
    expect(calendar).toContain('contentFit="contain" transition={180}');
    expect(calendar).toContain("width: asset.width");
  });

  it("restores a confirmation-backed page-content clear without changing the Theme", () => {
    const frame = projectFile("components/app-frame.tsx");
    const reset = projectFile("components/page-content-reset.tsx");

    expect(frame).toContain("<PageContentReset pageId={currentPage.id} />");
    expect(reset).toContain("`Clear ${label}?`");
    expect(reset).toContain("Clear page");
    expect(reset).toContain("does not change your Theme");
  });
});
