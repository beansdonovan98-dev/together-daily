import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function projectFile(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("two-person room, reset, and automatic media fitting", () => {
  it("keeps the shared journal limited to Daddy and Princess", () => {
    const journal = projectFile("lib/local-journal.tsx");
    const gate = projectFile("components/together-access.tsx");
    const router = projectFile("server/routers.ts");
    const db = projectFile("server/db.ts");

    expect(journal).toContain('export type PartnerId = "beans" | "princess"');
    expect(journal).not.toContain('"beans" | "princess" | "rara"');
    expect(gate).toContain('(["beans","princess"] as PartnerId[])');
    expect(router).toContain('z.enum(["beans", "princess"])');
    expect(db).toContain('type GuestRoomMemberId = "beans" | "princess"');
    expect(db).toContain("currentMembers.length >= 2");
  });

  it("persists original dimensions, preserves full GIFs, and fills the Calendar backdrop without distortion", () => {
    const journal = projectFile("lib/local-journal.tsx");
    const steamy = projectFile("app/(tabs)/steamy.tsx");
    const calendar = projectFile("app/(tabs)/calendar.tsx");
    const router = projectFile("server/routers.ts");
    const sizing = projectFile("lib/gif-frame.ts");

    expect(journal).toContain("width:input.width,height:input.height");
    expect(router).toContain("width: input.width");
    expect(steamy).toContain("gifFrameHeight(galleryWidth, dimensions)");
    expect(steamy).toContain('contentFit={isGif ? "contain" : "cover"}');
    expect(calendar).toContain('contentFit="cover" contentPosition="center"');
    expect(calendar).toContain("backgroundLayer: { ...StyleSheet.absoluteFillObject");
    expect(calendar).not.toContain("mediaFrameHeight");
    expect(sizing).toContain("maximumHeight = 640");
    expect(sizing).toContain("naturalHeight");
  });

  it("places the confirmation-backed clear control inside every vertical page scroll", () => {
    const frame = projectFile("components/app-frame.tsx");
    const reset = projectFile("components/page-content-reset.tsx");

    expect(frame).toContain("function appendPageContentReset");
    expect(frame).toContain("element.type === ScrollView && !element.props.horizontal");
    expect(frame).toContain("<PageContentReset pageId={pageId} />");
    expect(reset).toContain("`Clear ${label}?`");
    expect(reset).toContain("Clear page");
    expect(reset).toContain("does not change your Theme");
  });
});
