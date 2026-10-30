import { Platform } from "react-native";
import { Image } from "react-native";

const MAX_BYTES = 2 * 1024 * 1024;

export async function resizeImageIfNeeded(uri: string, mimeType: string): Promise<string> {
  if (mimeType === "image/gif") return uri;
  if (Platform.OS === "web") {
    const res = await fetch(uri);
    const blob = await res.blob();
    if (blob.size <= MAX_BYTES) return uri;
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not read image."));
      el.src = uri;
    });
    const scale = Math.sqrt(MAX_BYTES / blob.size);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return uri;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.82);
  }

  try {
    const FileSystem = require("expo-file-system/legacy");
    const info = await FileSystem.getInfoAsync(uri);
    if (typeof info?.size === "number" && info.size <= MAX_BYTES) return uri;
    const manipulator = require("expo-image-manipulator");
    const size = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      Image.getSize(uri, (w, h) => resolve({ width: w, height: h }), reject);
    });
    const scale = Math.sqrt(MAX_BYTES / (typeof info?.size === "number" ? info.size : MAX_BYTES * 2));
    const result = await manipulator.manipulateAsync(
      uri,
      [{ resize: { width: Math.max(1, Math.round(size.width * scale)) } }],
      { compress: 0.82, format: manipulator.SaveFormat.JPEG },
    );
    return result?.uri ?? uri;
  } catch {
    return uri;
  }
}