import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useLocalJournal } from "@/lib/local-journal";

type Preset = { name: string; accent: string; background: string; colors: [string, string, string] };

const PRESETS: Preset[] = [
  { name: "Electric Rose", accent: "#FF3D9A", background: "#260021", colors: ["#260021", "#9D0060", "#FF3D9A"] },
  { name: "Ocean Glow", accent: "#00D8FF", background: "#001E38", colors: ["#001E38", "#006B99", "#00D8FF"] },
  { name: "Violet Night", accent: "#B955FF", background: "#1B0736", colors: ["#1B0736", "#5B1D9B", "#B955FF"] },
  { name: "Tropical Mint", accent: "#00E6AE", background: "#003B36", colors: ["#003B36", "#007F71", "#00E6AE"] },
  { name: "Peach Cloud", accent: "#FF8A80", background: "#512B42", colors: ["#512B42", "#B8577B", "#FFB6A3"] },
  { name: "Lemon Lavender", accent: "#FFD54F", background: "#33265B", colors: ["#33265B", "#7761AC", "#FFD54F"] },
];

const FONTS = [["handwritten", "Handwritten"], ["notebook", "Notebook"], ["casual", "Casual"], ["classic", "Classic"], ["serif", "Serif"], ["mono", "Mono"], ["comic", "Comic Sans"], ["typewriter", "Typewriter"]] as const;

export function PageThemeEditor() {
  const { theme, setTheme, customSubheadings, setCustomSubheading } = useLocalJournal();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Preset>(() => PRESETS.find((preset) => preset.background === theme.backgroundColor) ?? PRESETS[0]);
  const activeFont = customSubheadings.globalFont ?? "handwritten";
  const preview = useMemo(() => draft.colors, [draft]);
  const apply = () => { setTheme({ accentColor: draft.accent, backgroundColor: draft.background, backgroundGradient: [...draft.colors] }); setOpen(false); };
  return <View style={styles.card}>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Toggle gradients and fonts" accessibilityState={{ expanded: open }} onPress={() => setOpen((value) => !value)} style={styles.toggle}><View><Text style={styles.kicker}>THEME COLLECTION</Text><Text style={styles.title}>Gradients & Fonts</Text></View><Text style={styles.chevron}>{open ? "⌃" : "⌄"}</Text></TouchableOpacity>
    {open ? <View style={styles.body}>
      <Text style={styles.copy}>Choose a gradient, preview it here, then apply it throughout Together Daily.</Text>
      <LinearGradient colors={preview} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.preview}><Text style={styles.previewKicker}>GRADIENT PREVIEW</Text><Text style={styles.previewTitle}>Together Daily</Text><Text style={styles.previewCopy}>This background will be used across your pages.</Text></LinearGradient>
      <View style={styles.grid}>{PRESETS.map((preset) => <TouchableOpacity key={preset.name} accessibilityRole="button" accessibilityLabel={`Preview ${preset.name}`} onPress={() => setDraft(preset)} style={[styles.preset, draft.name === preset.name && styles.selected]}><LinearGradient colors={preset.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.presetStrip}/><Text style={styles.presetName}>{preset.name}</Text></TouchableOpacity>)}</View>
      <TouchableOpacity accessibilityRole="button" onPress={apply} style={styles.apply}><Text style={styles.applyText}>Apply gradient to all pages</Text></TouchableOpacity>
      <Text style={styles.sectionLabel}>GLOBAL FONT</Text><Text style={styles.copy}>Your chosen font applies throughout the app.</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fontRow}>{FONTS.map(([id, label]) => <TouchableOpacity key={id} accessibilityRole="button" accessibilityLabel={`Use ${label} font`} onPress={() => setCustomSubheading("globalFont", id)} style={[styles.fontChip, activeFont === id && styles.fontChipSelected]}><Text style={styles.fontChipText}>{label}</Text></TouchableOpacity>)}</ScrollView>
    </View> : null}
  </View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, borderWidth: 1, borderColor: "rgba(255,255,255,0.34)", backgroundColor: "rgba(20,12,30,0.42)", overflow: "hidden" }, toggle: { minHeight: 62, paddingHorizontal: 15, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, kicker: { color: "#FFFFFF", fontSize: 9, fontWeight: "900", letterSpacing: 1 }, title: { color: "#FFFFFF", fontSize: 17, fontWeight: "900", fontStyle: "italic", marginTop: 3 }, chevron: { color: "#FFFFFF", fontSize: 20, fontWeight: "900" }, body: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.24)", padding: 14, gap: 11 }, copy: { color: "#FFFFFF", fontSize: 11, lineHeight: 16 }, preview: { minHeight: 138, borderRadius: 14, padding: 14, justifyContent: "flex-end", gap: 5 }, previewKicker: { color: "#FFFFFF", fontSize: 9, fontWeight: "900", letterSpacing: 1 }, previewTitle: { color: "#FFFFFF", fontSize: 25, fontWeight: "900", fontStyle: "italic" }, previewCopy: { color: "#FFFFFF", fontSize: 11 }, grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, preset: { width: "48%", borderRadius: 10, padding: 7, borderWidth: 1, borderColor: "rgba(255,255,255,0.32)", gap: 5 }, selected: { borderColor: "#FFFFFF", borderWidth: 2 }, presetStrip: { height: 18, borderRadius: 6 }, presetName: { color: "#FFFFFF", fontSize: 10, fontWeight: "900" }, apply: { minHeight: 42, borderRadius: 10, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.65)", backgroundColor: "rgba(255,255,255,0.2)" }, applyText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" }, sectionLabel: { color: "#FFFFFF", fontSize: 10, fontWeight: "900", letterSpacing: 1, marginTop: 4 }, fontRow: { gap: 8, paddingVertical: 2 }, fontChip: { minHeight: 38, borderWidth: 1, borderColor: "rgba(255,255,255,0.42)", paddingHorizontal: 12, justifyContent: "center", borderRadius: 19 }, fontChipSelected: { backgroundColor: "rgba(255,255,255,0.25)", borderColor: "#FFFFFF" }, fontChipText: { color: "#FFFFFF", fontWeight: "900", fontSize: 11 },
});
