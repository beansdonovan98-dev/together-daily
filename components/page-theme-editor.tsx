import { useMemo, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { VisualText as Text, VisualTextInput as TextInput, VisualTouchableOpacity as TouchableOpacity, VisualView as View } from "@/components/visual-primitives";
import { LinearGradient } from "expo-linear-gradient";

import { useLocalJournal } from "@/lib/local-journal";
import { PASTEL_THEMES, SAVED_THEMES, type ReadyMadeTheme } from "@/lib/ready-made-themes";
import { BORDER_COLOR_OPTIONS, FONT_COLOR_OPTIONS, FONT_OPTIONS, fontFamilyFor, normalizeGlobalBorderColor, normalizeGlobalTextColor, setActiveGlobalTextColor } from "@/lib/typography";

const PRESETS: readonly ReadyMadeTheme[] = [...SAVED_THEMES, ...PASTEL_THEMES];

export function PageThemeEditor() {
  const { theme, setTheme, partnerAvatars, partnerNames, partnerColors, setPartnerProfiles } = useLocalJournal();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ReadyMadeTheme>(() => PRESETS.find((preset) => preset.background === theme.backgroundColor) ?? PRESETS[0]);
  const activeFont = theme.fontId ?? "handwritten";
  const activeFontColor = normalizeGlobalTextColor(theme.fontColor);
  const activeBorderColor = normalizeGlobalBorderColor(theme.borderColor);
  const preview = useMemo(() => draft.gradient, [draft]);
  const previewAcrossPages = (preset: ReadyMadeTheme) => {
    setDraft(preset);
    setTheme({ accentColor: preset.accent, backgroundColor: preset.background, backgroundGradient: [...preset.gradient] });
  };
  const apply = () => { previewAcrossPages(draft); setOpen(false); };
  const applyFontColor = (color: string) => { setActiveGlobalTextColor(color); setTheme({ fontColor: color }); };
  const setPartnerDetails = (id: "beans" | "princess", patch: { name?: string; avatar?: string }) => setPartnerProfiles({
    names: { ...partnerNames, ...(patch.name !== undefined ? { [id]: patch.name.slice(0, 28) } : {}) },
    colors: partnerColors,
    avatars: { ...partnerAvatars, ...(patch.avatar !== undefined ? { [id]: patch.avatar.slice(0, 12) } : {}) },
  });
  return <View style={styles.card}>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Toggle gradients and fonts" accessibilityState={{ expanded: open }} onPress={() => setOpen((value) => !value)} style={styles.toggle}><View><Text style={styles.kicker}>THEME COLLECTION</Text><Text style={styles.title}>Gradients & Fonts</Text></View><Text style={styles.chevron}>{open ? "⌃" : "⌄"}</Text></TouchableOpacity>
    {open ? <View style={styles.body}>
      <Text style={styles.copy}>Your Theme is shared, so you both see the same colors, gradient, font, and border choices.</Text>
      <LinearGradient colors={preview} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.preview}><Text style={styles.previewKicker}>SHARED THEME PREVIEW</Text><Text style={styles.previewTitle}>Together Daily</Text><Text style={styles.previewCopy}>This background will be used across both of your pages.</Text></LinearGradient>
      <Text style={styles.collectionLabel}>VIVID GRADIENTS</Text><View style={styles.grid}>{SAVED_THEMES.map((preset) => <TouchableOpacity key={preset.name} accessibilityRole="button" accessibilityLabel={`Preview ${preset.name} across all pages`} onPress={() => previewAcrossPages(preset)} style={[styles.preset, draft.name === preset.name && styles.selected]}><LinearGradient colors={preset.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.presetStrip}/><Text style={styles.presetName}>{preset.name}</Text></TouchableOpacity>)}</View>
      <Text style={styles.collectionLabel}>PASTEL GRADIENTS</Text><View style={styles.grid}>{PASTEL_THEMES.map((preset) => <TouchableOpacity key={preset.name} accessibilityRole="button" accessibilityLabel={`Preview ${preset.name} across all pages`} onPress={() => previewAcrossPages(preset)} style={[styles.preset, draft.name === preset.name && styles.selected]}><LinearGradient colors={preset.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.presetStrip}/><Text style={styles.presetName}>{preset.name}</Text></TouchableOpacity>)}</View>
      <TouchableOpacity accessibilityRole="button" onPress={apply} style={styles.apply}><Text style={styles.applyText}>Apply shared Theme</Text></TouchableOpacity>
      <Text style={styles.sectionLabel}>SHARED FONT</Text><Text style={styles.copy}>Your chosen font applies throughout both apps.</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fontRow}>{FONT_OPTIONS.map(([id, label]) => <TouchableOpacity key={id} accessibilityRole="button" accessibilityLabel={`Use ${label} font`} onPress={() => setTheme({ fontId: id })} style={[styles.fontChip, activeFont === id && styles.fontChipSelected]}><Text style={[styles.fontChipText, { fontFamily: fontFamilyFor(id) }]}>{label}</Text></TouchableOpacity>)}</ScrollView>
      <Text style={styles.sectionLabel}>PARTNER NAMES & EMOJI</Text><Text style={styles.copy}>Edit each name and emoji here. These appear together throughout the shared journal.</Text>
      <View style={styles.emojiRow}>{(["beans", "princess"] as const).map((id) => <View key={id} style={styles.emojiField}><Text style={styles.emojiLabel}>{id === "beans" ? "PARTNER ONE" : "PARTNER TWO"}</Text><TextInput value={partnerNames[id]} onChangeText={(value) => setPartnerDetails(id, { name: value })} maxLength={28} accessibilityLabel={`Name for ${id === "beans" ? "partner one" : "partner two"}`} placeholder="Name" placeholderTextColor="#FFFFFF99" style={styles.nameInput}/><TextInput value={partnerAvatars[id]} onChangeText={(value) => setPartnerDetails(id, { avatar: value })} maxLength={12} accessibilityLabel={`Emoji for ${partnerNames[id]}`} placeholder="✦" placeholderTextColor="#FFFFFF99" style={styles.emojiInput}/></View>)}</View>
      <Text style={styles.sectionLabel}>FONT COLOR</Text><Text style={styles.copy}>This changes all app text, including the Together Daily header and page navigation above.</Text>
      <View style={styles.colorRow}>{FONT_COLOR_OPTIONS.map(([color, label]) => <TouchableOpacity key={color} accessibilityRole="button" accessibilityLabel={`Use ${label} font color`} onPress={() => applyFontColor(color)} style={[styles.colorChip, activeFontColor === color && styles.colorChipSelected]}><View style={[styles.colorSwatch, { backgroundColor: color }]} /><Text style={styles.colorChipLabel}>{label}</Text></TouchableOpacity>)}</View>
      <Text style={styles.sectionLabel}>BORDER COLOR</Text><Text style={styles.copy}>This color outlines every card, subsection, and nested habit item. Black is the default.</Text>
      <View style={styles.colorRow}>{BORDER_COLOR_OPTIONS.map(([color, label]) => <TouchableOpacity key={color} accessibilityRole="button" accessibilityLabel={`Use ${label} border color`} onPress={() => setTheme({ borderColor: color })} style={[styles.colorChip, activeBorderColor === color && styles.colorChipSelected]}><View style={[styles.colorSwatch, { backgroundColor: color }]} /><Text style={styles.colorChipLabel}>{label}</Text></TouchableOpacity>)}</View>
    </View> : null}
  </View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, borderWidth: 1, borderColor: "#000000", backgroundColor: "transparent", overflow: "hidden" }, toggle: { minHeight: 62, paddingHorizontal: 15, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, kicker: { color: "#FFFFFF", fontSize: 9, fontWeight: "900", letterSpacing: 1 }, title: { color: "#FFFFFF", fontSize: 17, fontWeight: "900", fontStyle: "italic", marginTop: 3 }, chevron: { color: "#FFFFFF", fontSize: 20, fontWeight: "900" }, body: { borderTopWidth: 1, borderTopColor: "#000000", padding: 14, gap: 11 }, copy: { color: "#FFFFFF", fontSize: 11, lineHeight: 16 }, preview: { minHeight: 138, borderRadius: 14, padding: 14, justifyContent: "flex-end", gap: 5 }, previewKicker: { color: "#FFFFFF", fontSize: 9, fontWeight: "900", letterSpacing: 1 }, previewTitle: { color: "#FFFFFF", fontSize: 25, fontWeight: "900", fontStyle: "italic" }, previewCopy: { color: "#FFFFFF", fontSize: 11 }, collectionLabel: { color: "#FFFFFF", fontSize: 10, fontWeight: "900", letterSpacing: 1, marginTop: 2 }, grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, preset: { width: "48%", borderRadius: 10, padding: 7, borderWidth: 1, borderColor: "rgba(255,255,255,0.32)", gap: 5 }, selected: { borderColor: "#FFFFFF", borderWidth: 2 }, presetStrip: { height: 18, borderRadius: 6 }, presetName: { color: "#FFFFFF", fontSize: 10, fontWeight: "900" }, apply: { minHeight: 42, borderRadius: 10, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.65)", backgroundColor: "rgba(255,255,255,0.2)" }, applyText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" }, sectionLabel: { color: "#FFFFFF", fontSize: 10, fontWeight: "900", letterSpacing: 1, marginTop: 4 }, fontRow: { gap: 8, paddingVertical: 2 }, fontChip: { minHeight: 38, borderWidth: 1, borderColor: "rgba(255,255,255,0.42)", paddingHorizontal: 12, justifyContent: "center", borderRadius: 19 }, fontChipSelected: { backgroundColor: "rgba(255,255,255,0.25)", borderColor: "#FFFFFF" }, fontChipText: { color: "#FFFFFF", fontWeight: "900", fontSize: 11 }, emojiRow: { flexDirection: "row", gap: 8 }, emojiField: { flex: 1, gap: 6 }, emojiLabel: { color: "#FFFFFF", fontSize: 10, fontWeight: "900" }, nameInput: { minHeight: 40, borderWidth: 1, borderColor: "rgba(255,255,255,0.45)", borderRadius: 10, backgroundColor: "rgba(9,7,14,0.42)", color: "#FFFFFF", paddingHorizontal: 10, fontSize: 12, fontWeight: "800" }, emojiInput: { minHeight: 42, borderWidth: 1, borderColor: "rgba(255,255,255,0.45)", borderRadius: 10, backgroundColor: "rgba(9,7,14,0.42)", color: "#FFFFFF", textAlign: "center", fontSize: 20 }, colorRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, colorChip: { minHeight: 36, flexDirection: "row", alignItems: "center", gap: 7, borderWidth: 1, borderColor: "rgba(255,255,255,0.45)", borderRadius: 18, paddingHorizontal: 10 }, colorChipSelected: { borderColor: "#000000", borderWidth: 2, backgroundColor: "rgba(255,255,255,0.22)" }, colorSwatch: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: "#000000" }, colorChipLabel: { color: "#FFFFFF", fontSize: 10, fontWeight: "900" },
});
