import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

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
  if (providedBase64) return providedBase64;
  if (Platform.OS === "web") return readWebUriAsBase64(uri);
  return FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
}
