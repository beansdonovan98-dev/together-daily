import { AppFrame } from "@/components/app-frame";
import { COLORS } from "@/lib/together";
import { trpc } from "@/lib/trpc";
import { readPickedImageAsBase64 } from "@/lib/media-base64";
import { imageMimeFromAsset } from "@/lib/media-upload-policy";
import * as ImagePicker from "expo-image-picker";
import { ScrollView, StyleSheet, ActivityIndicator, Image } from "react-native";
import { useState } from "react";
import { VisualText as Text, VisualTouchableOpacity as TouchableOpacity, VisualView as View } from "@/components/visual-primitives";

export default function HalloweenEditorScreen() {
  const [originalUri, setOriginalUri] = useState<string | null>(null);
  const [editedBase64, setEditedBase64] = useState<string | null>(null);
  const [editedMime, setEditedMime] = useState("image/png");
  const [error, setError] = useState<string | null>(null);
  const mutation = trpc.ai.editHalloweenPhoto.useMutation();

  const pickAndEdit = async () => {
    setError(null);
    setEditedBase64(null);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
      base64: false,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setOriginalUri(asset.uri);
    try {
      const mimeType = imageMimeFromAsset(asset.mimeType, asset.fileName, asset.uri);
      const base64 = await readPickedImageAsBase64(asset.uri, asset.base64);
      const cleaned = base64.includes(",") ? base64.split(",").pop() ?? base64 : base64;
      const response = await mutation.mutateAsync({ base64: cleaned, mimeType, promptHint: "" });
      setEditedBase64(response.base64);
      setEditedMime(response.mimeType);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Halloween edit failed.");
    }
  };

  return (
    <AppFrame>
      <ScrollView contentContainerStyle={styles.page}>
        <View>
          <Text style={styles.eyebrow}>HALLOWEEN</Text>
          <Text style={styles.hero}>AI Photo Editor</Text>
          <Text style={styles.copy}>Upload a photo and get a unique AI Halloween edit. Powered by Gemini (free tier).</Text>
        </View>
        <TouchableOpacity onPress={pickAndEdit} disabled={mutation.isPending} style={styles.button}>
          <Text style={styles.buttonText}>{mutation.isPending ? "Summoning spirits…" : "Choose a photo"}</Text>
        </TouchableOpacity>
        {mutation.isPending ? <ActivityIndicator color="#A855F7" /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {originalUri ? (
          <View style={styles.card}>
            <Text style={styles.label}>Original</Text>
            <Image source={{ uri: originalUri }} style={styles.image} resizeMode="contain" />
          </View>
        ) : null}
        {editedBase64 ? (
          <View style={styles.card}>
            <Text style={styles.label}>Halloween edit</Text>
            <Image source={{ uri: `data:${editedMime};base64,${editedBase64}` }} style={styles.image} resizeMode="contain" />
          </View>
        ) : null}
      </ScrollView>
    </AppFrame>
  );
}

const styles = StyleSheet.create({
  page: { padding: 18, paddingBottom: 36, gap: 14 },
  eyebrow: { color: "#A855F7", fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  hero: { color: "#F3E8FF", fontSize: 32, fontWeight: "900", fontStyle: "italic" },
  copy: { color: "#D8B4FE", fontFamily: "monospace", fontSize: 11, lineHeight: 17, marginTop: 4 },
  button: { alignSelf: "flex-start", borderWidth: 1, borderColor: "#A855F7", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "rgba(168,85,247,0.15)" },
  buttonText: { color: "#F3E8FF", fontSize: 11, fontWeight: "900", letterSpacing: 0.7 },
  error: { color: "#F87171", fontSize: 11, fontWeight: "700" },
  card: { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 14, borderWidth: 1, borderColor: "#4C1D95", padding: 12, gap: 8 },
  label: { color: "#D8B4FE", fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  image: { width: "100%", height: 320, borderRadius: 10 },
});
