import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  imageMimeFromAsset,
  isAnimatedGif,
  maxBase64LengthForMedia,
  maxStoredBytesForMedia,
} from "../lib/media-upload-policy";

describe("GIF media upload policy", () => {
  it("preserves GIF identity when Image Picker omits the MIME type", () => {
    expect(imageMimeFromAsset(null, "memory.GIF")).toBe("image/gif");
    expect(imageMimeFromAsset(undefined, undefined, "file:///assets/love-loop.gif?cache=1")).toBe("image/gif");
    expect(isAnimatedGif("image/gif")).toBe(true);
  });

  it("keeps cover GIFs within the same safe transport and storage budget as private GIFs", () => {
    expect(maxBase64LengthForMedia("image/gif", "cover")).toBe(6_700_000);
    expect(maxStoredBytesForMedia("image/gif", "cover")).toBe(5 * 1024 * 1024);
    expect(maxBase64LengthForMedia("image/jpeg", "cover")).toBe(2_400_000);
    expect(maxStoredBytesForMedia("image/jpeg", "cover")).toBe(2.5 * 1024 * 1024);
  });

  it("uses the animation-safe picker and full-fit renderer for GIF cover photos and private media", () => {
    const today = readFileSync(resolve(process.cwd(), "app/(tabs)/index.tsx"), "utf8");
    const steamy = readFileSync(resolve(process.cwd(), "app/(tabs)/steamy.tsx"), "utf8");
    const server = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");

    expect(today).toContain("allowsEditing: false");
    expect(today).toContain("<ExpoImage source={mediaUrl(String(coverSlot.url))}");
    expect(today).toContain("maxBase64LengthForMedia(prepared.mimeType, \"cover\")");
    expect(steamy).toContain("isAnimatedGif(asset.mimeType, asset.fileName, asset.uri)");
    expect(steamy).toContain('contentFit={isGif ? "contain" : "cover"}');
    expect(steamy).toContain('contentFit={pendingPreview.isGif ? "contain" : "cover"}');
    expect(steamy).toContain('gifPhoto:{height:300,aspectRatio:undefined');
    expect(server).toContain("maxStoredBytesForMedia(input.mimeType, \"cover\")");
  });
});
