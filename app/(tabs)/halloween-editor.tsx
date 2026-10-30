import { AppFrame } from "@/components/app-frame";
import { COLORS } from "@/lib/together";

import { resizeImageIfNeeded } from "@/lib/image-resize";
import { imageMimeFromAsset } from "@/lib/media-upload-policy";
import * as ImagePicker from "expo-image-picker";
import { Image, Platform } from "react-native";
import { ScrollView, StyleSheet, ActivityIndicator, View, Text } from "react-native";
import { useState } from "react";
import { VisualText, VisualTouchableOpacity } from "@/components/visual-primitives";

const MAX_BYTES = 2 * 1024 * 1024;

export default function HalloweenEditorScreen() {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  const [originalUri, setOriginalUri] = useState<string | null>(null);
  const [editedBase64, setEditedBase64] = useState<string | null>(null);
  const [editedMime, setEditedMime] = useState("image/png");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    if (!apiKey) {
      setError("Missing EXPO_PUBLIC_OPENAI_API_KEY.");
      return;
    }
    setLoading(true);
    try {
      const mimeType = imageMimeFromAsset(asset.mimeType, asset.fileName, asset.uri);
      const resizedUri = await resizeImageIfNeeded(asset.uri, mimeType);
      const scenes = [
        "a haunted Victorian mansion with fog, glowing jack-o-lanterns, bats, and a purple moon",
        "a spooky graveyard at midnight with mist, tombstones, and ghostly wisps",
        "a witch's cottage in an enchanted forest with floating candles and black cats",
        "a gothic castle with lightning, gargoyles, and a blood-red sky",
        "a pumpkin patch at dusk with scarecrows, ravens, and orange lanterns",
      ];
      const costumes = [
        "vampire with fangs and a black cape",
        "witch with a pointed hat and green glow",
        "ghost with a translucent sheet and hollow eyes",
        "skeleton with glowing bones",
        "zombie with tattered clothes and pale skin",
      ];
      const scene = scenes[Math.floor(Math.random() * scenes.length)];
      const costume = costumes[Math.floor(Math.random() * costumes.length)];
      const prompt = `Edit this entire photo for Halloween: transform every person in the image into a ${costume} and replace the background with ${scene}. Keep each person's face recognizable but make them spooky and Halloween-themed. Apply the scene, lighting, colors, and atmosphere to the whole image. Cinematic lighting, dramatic shadows, purple-orange color grade. High quality, detailed, photorealistic.`;

      const form = new FormData();
      form.append("model", "gpt-image-2.5-sunburst");
      form.append("prompt", prompt);
      form.append("size", "1024x1024");
      form.append("quality", "medium");
      if (Platform.OS === "web") {
        const blob = await (await fetch(resizedUri)).blob();
        form.append("image", blob, "photo.jpg");
      } else {
        form.append("image", { uri: resizedUri, name: "photo.jpg", type: mimeType } as any);
      }

      const response = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text.slice(0, 300) || "OpenAI request failed.");
      }
      const data = (await response.json()) as any;
      const b64 = data?.data?.[0]?.b64_json;
      if (!b64) throw new Error("OpenAI did not return an image.");
      setEditedBase64(b64);
      setEditedMime("image/png");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Halloween edit failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppFrame>
      <ScrollView contentContainerStyle={styles.page}>
        <View>
          <Text style={styles.eyebrow}>HALLOWEEN</Text>
          <Text style={styles.hero}>AI Photo Editor</Text>
          <Text style={styles.copy}>Upload a photo and get a unique AI Halloween edit. (OpenAI; images auto-resized to ~2MB.)</Text>
        </View>
        <VisualTouchableOpacity onPress={pickAndEdit} disabled={loading} style={styles.button}>
          <Text style={styles.buttonText}>{loading ? "Summoning spirits…" : "Choose a photo"}</Text>
        </VisualTouchableOpacity>
        {loading ? <ActivityIndicator color="#A855F7" /> : null}
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