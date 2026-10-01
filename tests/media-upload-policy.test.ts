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

  it("allows larger private GIFs while keeping cover uploads conservative", () => {
    expect(maxBase64LengthForMedia("image/gif", "cover")).toBe(84_000_000);
    expect(maxStoredBytesForMedia("image/gif", "cover")).toBe(60 * 1024 * 1024);
    expect(maxBase64LengthForMedia("image/gif", "private")).toBe(84_000_000);
    expect(maxStoredBytesForMedia("image/gif", "private")).toBe(60 * 1024 * 1024);
    expect(maxBase64LengthForMedia("image/jpeg", "cover")).toBe(2_400_000);
    expect(maxStoredBytesForMedia("image/jpeg", "cover")).toBe(2.5 * 1024 * 1024);
  });

  it("uses the animation-safe picker and full-fit renderer for GIF cover photos and private media", () => {
    const today = readFileSync(resolve(process.cwd(), "app/(tabs)/index.tsx"), "utf8");
    const steamy = readFileSync(resolve(process.cwd(), "app/(tabs)/steamy.tsx"), "utf8");
    const journal = readFileSync(resolve(process.cwd(), "lib/local-journal.tsx"), "utf8");
    const server = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");

    expect(today).toContain("allowsEditing: false");
    expect(today).toContain("<ExpoImage source={mediaUrl(String(coverSlot.url))}");
    expect(today).toContain("uploadDailyCoverDirect");
    expect(today).toContain("base64: false");
    expect(today).toContain("pickedImageByteSize(asset.uri, asset.fileSize)");
    expect(today).toContain('contentFit="contain" contentPosition="center"');
    expect(today).toContain("mediaFrameHeight(coverFrameWidths[key], coverDimensions[key], 155, 560)");
    expect(today).toContain("onLoad={({ source }) =>");
    expect(today).not.toContain("preparePickedImageForUpload");
    expect(steamy).toContain("isAnimatedGif(asset.mimeType, asset.fileName, asset.uri)");
    expect(steamy).toContain('contentFit={isGif ? "contain" : "cover"}');
    expect(steamy).toContain('contentFit={pendingPreview.isGif ? "contain" : "cover"}');
    expect(steamy).toContain('gifFrameHeight(galleryWidth, dimensions)');
    expect(steamy).toContain("onLayout={(event) =>");
    expect(steamy).toContain("recyclingKey={`${item.id}-${galleryWidth}");
    expect(steamy).toContain('autoplay={isGif}');
    expect(server).toContain("maxStoredBytesForMedia(input.mimeType, \"cover\")");
    expect(server).toContain("maxBase64LengthForMedia(input.mimeType, \"private\")");
    expect(server).toContain(".max(84_000_000)");
    expect(server).toContain("requestDailyCoverDirectUpload");
    expect(server).toContain("confirmDailyCoverDirectUpload");
    expect(journal).toContain("uploadDailyCoverDirect:async");
    expect(journal).toContain("dailyCoverDirectRequest");
  });

  it("uses direct signed storage for private GIFs instead of sending them inside JSON", () => {
    const steamy = readFileSync(resolve(process.cwd(), "app/(tabs)/steamy.tsx"), "utf8");
    const journal = readFileSync(resolve(process.cwd(), "lib/local-journal.tsx"), "utf8");
    const server = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");

    expect(steamy).toContain("uploadPrivateMediaDirect");
    expect(journal).toContain("uploadPickedImageDirect");
    expect(server).toContain("requestPrivateMediaDirectUpload");
    expect(server).toContain("confirmPrivateMediaDirectUpload");
  });
});
