export const SUPPORTED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export type SupportedImageMimeType = (typeof SUPPORTED_IMAGE_MIME_TYPES)[number];
export type MediaUploadTarget = "cover" | "private";

export function imageMimeFromAsset(
  mimeType?: string | null,
  fileName?: string | null,
  uri?: string | null,
): SupportedImageMimeType {
  if (SUPPORTED_IMAGE_MIME_TYPES.includes(mimeType as SupportedImageMimeType)) {
    return mimeType as SupportedImageMimeType;
  }

  const fileHint = `${fileName ?? ""} ${uri ?? ""}`.toLowerCase();
  if (fileHint.includes(".gif")) return "image/gif";
  if (fileHint.includes(".png")) return "image/png";
  if (fileHint.includes(".webp")) return "image/webp";
  return "image/jpeg";
}

export function isAnimatedGif(mimeType?: string | null, fileName?: string | null, uri?: string | null) {
  return imageMimeFromAsset(mimeType, fileName, uri) === "image/gif";
}

export function maxBase64LengthForMedia(mimeType: SupportedImageMimeType, target: MediaUploadTarget) {
  if (target === "private" && mimeType === "image/gif") return 26_800_000;
  if (target === "private" || mimeType === "image/gif") return 6_700_000;
  return 2_400_000;
}

export function maxStoredBytesForMedia(mimeType: SupportedImageMimeType, target: MediaUploadTarget) {
  if (target === "private" && mimeType === "image/gif") return 20 * 1024 * 1024;
  if (target === "private" || mimeType === "image/gif") return 5 * 1024 * 1024;
  return 2.5 * 1024 * 1024;
}
