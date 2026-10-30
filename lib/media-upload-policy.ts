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
  // A 60 MiB binary GIF encodes to 83,886,080 Base64 characters. Leave a small
  // amount of headroom so the app's preflight check and the server agree.
  if (mimeType === "image/gif") return 84_000_000;
  if (target === "private") return 6_700_000;
  return 2_400_000;
}

export function maxStoredBytesForMedia(mimeType: SupportedImageMimeType, target: MediaUploadTarget) {
  if (mimeType === "image/gif") return 60 * 1024 * 1024;
  if (target === "private") return 5 * 1024 * 1024;
  return 2.5 * 1024 * 1024;
}
