import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";
import type { SupportedImageMimeType } from "./media-upload-policy";

function base64FromDataUrl(value: string) {
  const separator = value.indexOf(",");
  return separator >= 0 ? value.slice(separator + 1) : value;
}

async function readWebUriAsBase64(uri: string) {
  if (uri.startsWith("data:")) return base64FromDataUrl(uri);

  const response = await fetch(uri);
  if (!response.ok) throw new Error("The selected image could not be opened in the preview.");
  const blob = await response.blob();

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The selected image could not be read in the preview."));
    reader.onload = () => {
      const value = typeof reader.result === "string" ? reader.result : "";
      if (!value) {
        reject(new Error("The selected image could not be read in the preview."));
        return;
      }
      resolve(base64FromDataUrl(value));
    };
    reader.readAsDataURL(blob);
  });
}

/** Reads an ImagePicker asset without depending on native-only filesystem paths. */
export async function readPickedImageAsBase64(uri: string, providedBase64?: string | null) {
  if (providedBase64) return providedBase64.startsWith("data:") ? base64FromDataUrl(providedBase64) : providedBase64;
  if (Platform.OS === "web") return readWebUriAsBase64(uri);
  return FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
}

/** Keeps ordinary browser photos small enough for a JSON-based private upload without altering GIF animation. */
export async function preparePickedImageForUpload(input: {
  uri: string;
  base64?: string | null;
  mimeType: SupportedImageMimeType;
}) {
  const base64 = await readPickedImageAsBase64(input.uri, input.base64);
  if (Platform.OS !== "web" || input.mimeType === "image/gif") return { base64, mimeType: input.mimeType };

  const source = `data:${input.mimeType};base64,${base64}`;
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("The selected image could not be prepared for upload."));
    element.src = source;
  });
  const largestSide = Math.max(image.naturalWidth, image.naturalHeight);
  if (largestSide <= 1280 && base64.length <= 2_400_000) return { base64, mimeType: input.mimeType };

  const scale = Math.min(1, 1280 / largestSide);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("The selected image could not be prepared for upload.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return { base64: base64FromDataUrl(canvas.toDataURL("image/jpeg", 0.68)), mimeType: "image/jpeg" as const };
}

/** Returns the binary file size without putting the full item into a JSON request. */
export async function pickedImageByteSize(uri: string, knownSize?: number | null) {
  if (typeof knownSize === "number" && Number.isFinite(knownSize) && knownSize > 0) return knownSize;
  if (Platform.OS === "web") {
    const response = await fetch(uri);
    if (!response.ok) throw new Error("The selected image could not be opened for upload.");
    return (await response.blob()).size;
  }
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists || typeof info.size !== "number" || info.size <= 0) {
    throw new Error("The selected image could not be prepared for upload.");
  }
  return info.size;
}

/** Uploads a selected asset directly to S3, bypassing JSON/body-parser limits for large GIFs. */
export async function uploadPickedImageDirect(input: {
  uri: string;
  uploadUrl: string;
  mimeType: SupportedImageMimeType;
}) {
  if (Platform.OS === "web") {
    const source = await fetch(input.uri);
    if (!source.ok) throw new Error("The selected image could not be opened for upload.");
    const response = await fetch(input.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": input.mimeType },
      body: await source.blob(),
    });
    if (!response.ok) throw new Error("The private upload was rejected. Please try again.");
    return;
  }

  const result = await FileSystem.uploadAsync(input.uploadUrl, input.uri, {
    httpMethod: "PUT",
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: { "Content-Type": input.mimeType },
  });
  if (result.status < 200 || result.status >= 300) {
    throw new Error(`The private upload was rejected (status ${result.status}). Please try again.`);
  }
}
