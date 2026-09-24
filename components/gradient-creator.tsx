import { useState } from "react";
import { StyleSheet } from "react-native";
import { VisualText as Text, VisualTouchableOpacity as TouchableOpacity, VisualView as View } from "@/components/visual-primitives";
import { LinearGradient } from "expo-linear-gradient";

import { useLocalJournal } from "@/lib/local-journal";

const COLOR_CHOICES = ["#FF3D9A", "#B955FF", "#00D8FF", "#00E6AE", "#FFD54F", "#FF6B35", "#FF8A80", "#CEBFFF", "#98E8CF", "#B8E1FF"];

export function GradientCreator() {
  const { theme, setTheme } = useLocalJournal();
  const [open, setOpen] = useState(false);
  const [first, setFirst] = useState(theme.backgroundColor ?? "#17113A");
  const [second, setSecond] = useState(theme.accentColor ?? "#FF3D9A");
  const apply = () => {
    setTheme({ accentColor: second, backgroundColor: first, backgroundGradient: [first, second] });
    setOpen(false);
  };
  return <View style={styles.card}>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Toggle gradient creator" accessibilityState={{ expanded: open }} onPress={() => setOpen((value) => !value)} style={styles.toggle}>
      <View><Text style={styles.kicker}>MAKE YOUR OWN</Text><Text style={styles.title}>Gradient Creator</Text></View><Text style={styles.chevron}>{open ? "⌃" : "⌄"}</Text>
    </TouchableOpacity>
    {open ? <View style={styles.body}>
      <Text style={styles.copy}>Tap a start color and an end color. This changes the shared Theme for both of you.</Text>
      <LinearGradient colors={[first, second]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.preview}><Text style={styles.previewText}>Your shared gradient</Text></LinearGradient>
      <Text style={styles.label}>START COLOR</Text><View style={styles.swatches}>{COLOR_CHOICES.map((color) => <TouchableOpacity key={`start-${color}`} accessibilityRole="button" accessibilityLabel={`Choose ${color} as start color`} onPress={() => setFirst(color)} style={[styles.swatch, { backgroundColor: color }, first === color && styles.selectedSwatch]}/>)}</View>
      <Text style={styles.label}>END COLOR</Text><View style={styles.swatches}>{COLOR_CHOICES.map((color) => <TouchableOpacity key={`end-${color}`} accessibilityRole="button" accessibilityLabel={`Choose ${color} as end color`} onPress={() => setSecond(color)} style={[styles.swatch, { backgroundColor: color }, second === color && styles.selectedSwatch]}/>)}</View>
      <TouchableOpacity accessibilityRole="button" onPress={apply} style={styles.apply}><Text style={styles.applyText}>Apply gradient</Text></TouchableOpacity>
    </View> : null}
  </View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, borderWidth: 1, borderColor: "#000000", backgroundColor: "transparent", overflow: "hidden" }, toggle: { minHeight: 62, paddingHorizontal: 15, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, kicker: { color: "#FFFFFF", fontSize: 9, fontWeight: "900", letterSpacing: 1 }, title: { color: "#FFFFFF", fontSize: 17, fontWeight: "900", fontStyle: "italic", marginTop: 3 }, chevron: { color: "#FFFFFF", fontSize: 20, fontWeight: "900" }, body: { borderTopWidth: 1, borderTopColor: "#000000", padding: 14, gap: 11 }, copy: { color: "#FFFFFF", fontSize: 11, lineHeight: 16 }, preview: { height: 86, borderRadius: 13, justifyContent: "flex-end", padding: 12 }, previewText: { color: "#FFFFFF", fontSize: 18, fontWeight: "900", fontStyle: "italic" }, label: { color: "#FFFFFF", fontSize: 9, fontWeight: "900", letterSpacing: 0.8 }, swatches: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, swatch: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: "rgba(0,0,0,0.82)" }, selectedSwatch: { borderColor: "#FFFFFF", borderWidth: 3, transform: [{ scale: 1.12 }] }, apply: { minHeight: 42, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.19)", borderWidth: 1, borderColor: "rgba(255,255,255,0.6)" }, applyText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
});
