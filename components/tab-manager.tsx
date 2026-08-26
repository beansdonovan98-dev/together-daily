import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { COLORS, TAB_CARD_PALETTES } from "@/lib/together";
import { useLocalJournal } from "@/lib/local-journal";

const TABS = [
  { id: "today", label: "Today", glyph: "✦" },
  { id: "log", label: "Daily Log", glyph: "☰" },
  { id: "habits", label: "Habits", glyph: "✓" },
  { id: "health", label: "Health", glyph: "✚" },
  { id: "steamy", label: "Steamy", glyph: "♥" },
  { id: "purchase", label: "Purchase", glyph: "▤" },
  { id: "cleaning", label: "Cleaning", glyph: "✦" },
  { id: "themes", label: "Themes", glyph: "◐" },
  { id: "pastDays", label: "Past Days", glyph: "▤" },
];

export function TabManager() {
  const { tabLabels, setTabLabel, tabGlyphs, setTabGlyph, tabOrder, setTabOrder, pageStyles, theme } = useLocalJournal();
  const themesCardColor = pageStyles.themes?.cardBackgroundColor ?? TAB_CARD_PALETTES.themes.surface;
  const accentColor = theme.accentColor ?? COLORS.orchid;
  const controlBackground = `${accentColor}26`;
  const [open, setOpen] = useState(false);
  const [order, setOrder] = useState<string[]>([]);
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [glyphs, setGlyphs] = useState<Record<string, string>>({});
  const sorted = [...order].map((id) => TABS.find((tab) => tab.id === id)!).filter(Boolean);

  useEffect(() => { if (!open) { setOrder([...tabOrder.filter((id) => TABS.some((tab) => tab.id === id)), ...TABS.map((tab) => tab.id).filter((id) => !tabOrder.includes(id))]); setLabels(tabLabels); setGlyphs(tabGlyphs); } }, [open, tabLabels, tabGlyphs, tabOrder]);
  const move = (id: string, direction: -1 | 1) => { const index = order.indexOf(id); const target = index + direction; if (target < 0 || target >= order.length) return; const next = [...order]; [next[index], next[target]] = [next[target], next[index]]; setOrder(next); };
  const save = () => { TABS.forEach((tab) => { setTabLabel(tab.id, labels[tab.id] ?? ""); setTabGlyph(tab.id, glyphs[tab.id] ?? ""); }); setTabOrder(order); setOpen(false); };

  return <View style={[styles.card, { backgroundColor: themesCardColor, borderColor: accentColor }]}>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Toggle tab manager" accessibilityState={{ expanded: open }} style={styles.toggle} onPress={() => setOpen((value) => !value)}><View><Text style={styles.kicker}>SHARED NAVIGATION</Text><Text style={styles.title}>Rename & sort tabs</Text></View><Text style={styles.chevron}>{open ? "⌃" : "⌄"}</Text></TouchableOpacity>
    {open ? <View style={[styles.content, { borderTopColor: accentColor }]}><Text style={styles.copy}>Choose each tab’s emoji and name, then use the arrows to sort the top navigation. These changes update for both Daddy and Princess.</Text>{sorted.map((tab, index) => <View key={tab.id} style={styles.row}><TextInput value={glyphs[tab.id] ?? ""} onChangeText={(value) => setGlyphs((current) => ({ ...current, [tab.id]: value }))} placeholder={tab.glyph} placeholderTextColor="#FFFFFF" maxLength={12} style={[styles.glyphInput, { borderColor: accentColor, backgroundColor: controlBackground }]}/><TextInput value={labels[tab.id] ?? ""} onChangeText={(value) => setLabels((current) => ({ ...current, [tab.id]: value }))} placeholder={tab.label} placeholderTextColor="#FFFFFF" maxLength={18} style={[styles.input, { borderColor: accentColor, backgroundColor: controlBackground }]}/><View style={styles.arrows}><TouchableOpacity accessibilityRole="button" accessibilityLabel={`Move ${tab.label} earlier`} disabled={index === 0} onPress={() => move(tab.id, -1)} style={[styles.arrowButton, { borderColor: accentColor }, index === 0 && styles.disabled]}><Text style={styles.arrow}>↑</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" accessibilityLabel={`Move ${tab.label} later`} disabled={index === sorted.length - 1} onPress={() => move(tab.id, 1)} style={[styles.arrowButton, { borderColor: accentColor }, index === sorted.length - 1 && styles.disabled]}><Text style={styles.arrow}>↓</Text></TouchableOpacity></View></View>)}<TouchableOpacity accessibilityRole="button" onPress={save} style={[styles.saveButton, { backgroundColor: accentColor }]}><Text style={styles.saveText}>Save tab layout</Text></TouchableOpacity></View> : null}
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: TAB_CARD_PALETTES.themes.surface, borderRadius: 18, borderWidth: 1, borderColor: TAB_CARD_PALETTES.themes.border, overflow: "hidden" },
  toggle: { minHeight: 62, paddingHorizontal: 15, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  kicker: { color: COLORS.gold, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  title: { color: COLORS.plum, fontSize: 17, fontWeight: "900", fontStyle: "italic", marginTop: 3 },
  chevron: { color: COLORS.orchid, fontSize: 20, fontWeight: "900" },
  content: { borderTopWidth: 1, borderTopColor: "#35273D", padding: 14, gap: 8 },
  copy: { color: COLORS.slate, fontFamily: "monospace", fontSize: 10, lineHeight: 15, marginBottom: 2 },
  row: { flexDirection: "row", gap: 8, alignItems: "center" },
  glyphInput: { width: 42, minHeight: 37, borderRadius: 9, borderWidth: 1, borderColor: "#3A313E", backgroundColor: "#121014", color: COLORS.plum, textAlign: "center", fontSize: 17 },
  input: { flex: 1, minHeight: 37, borderRadius: 9, borderWidth: 1, borderColor: "#3A313E", backgroundColor: "#121014", color: COLORS.plum, paddingHorizontal: 9, fontSize: 12 },
  arrows: { flexDirection: "row", gap: 4 },
  arrowButton: { width: 31, height: 31, borderRadius: 8, borderWidth: 1, borderColor: "#4A3B50", alignItems: "center", justifyContent: "center" },
  arrow: { color: COLORS.plum, fontSize: 15, fontWeight: "900" },
  disabled: { opacity: .32 },
  saveButton: { minHeight: 42, borderRadius: 11, backgroundColor: COLORS.orchid, alignItems: "center", justifyContent: "center", marginTop: 4 },
  saveText: { color: COLORS.white, fontSize: 13, fontWeight: "900" },
});
