import { useState } from "react";
import { StyleSheet } from "react-native";
import { VisualText as Text, VisualTextInput as TextInput, VisualTouchableOpacity as TouchableOpacity, VisualView as View } from "@/components/visual-primitives";

import { COLORS } from "@/lib/together";
import { useLocalJournal } from "@/lib/local-journal";
import { normalizeGlobalBorderColor, normalizeGlobalTextColor } from "@/lib/typography";

const TABS = [
  { id: "today", label: "Today", glyph: "🏠" },
  { id: "log", label: "Daily Log", glyph: "📋" },
  { id: "health", label: "Health", glyph: "❤️" },
  { id: "nba", label: "NBA", glyph: "🏀" },
  { id: "halloweenEditor", label: "Halloween Editor", glyph: "🎃" },
  { id: "crashReports", label: "Crash Reports", glyph: "🐛" },
  { id: "steamy", label: "Steamy", glyph: "♥️" },
  { id: "purchase", label: "Purchase", glyph: "🛒" },
  { id: "cleaning", label: "Cleaning", glyph: "🧹" },
  { id: "calendar", label: "Calendar", glyph: "📅" },
  { id: "themes", label: "Themes", glyph: "🎨" },
  { id: "pastDays", label: "Past Days", glyph: "📖" },
];

export function TabManager() {
  const { tabLabels, tabGlyphs, setTabCustomizations, tabOrder, theme } = useLocalJournal();
  const accentColor = theme?.accentColor ?? COLORS.orchid;
  const textColor = normalizeGlobalTextColor(theme?.fontColor);
  const borderColor = normalizeGlobalBorderColor(theme?.borderColor);
  const [open, setOpen] = useState(false);
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [glyphs, setGlyphs] = useState<Record<string, string>>({});

  const save = () => {
    setTabCustomizations({ labels, glyphs, order: TABS.map((t) => t.id) });
    setOpen(false);
  };

  return (
    <View style={[styles.card, { backgroundColor: "transparent", borderColor }]}>
      <TouchableOpacity accessibilityRole="button" onPress={() => setOpen((v) => !v)} style={styles.toggle}>
        <View><Text style={[styles.kicker, { color: textColor }]}>SHARED NAVIGATION</Text><Text style={[styles.title, { color: textColor }]}>Rename & sort tabs</Text></View>
        <Text style={[styles.chevron, { color: textColor }]}>{open ? "⌃" : "⌄"}</Text>
      </TouchableOpacity>
      {open ? (
        <View style={[styles.content, { borderTopColor: borderColor }]}>
          {TABS.map((tab) => (
            <View key={tab.id} style={styles.row}>
              <TextInput
                value={glyphs[tab.id] ?? ""}
                onChangeText={(value) => setGlyphs((current) => ({ ...current, [tab.id]: value }))}
                placeholder={tab.glyph}
                placeholderTextColor={textColor}
                maxLength={12}
                style={[styles.glyphInput, { borderColor, color: textColor }]}
              />
              <TextInput
                value={labels[tab.id] ?? ""}
                onChangeText={(value) => setLabels((current) => ({ ...current, [tab.id]: value }))}
                placeholder={tab.label}
                placeholderTextColor={textColor}
                maxLength={18}
                style={[styles.input, { borderColor, color: textColor }]}
              />
            </View>
          ))}
          <TouchableOpacity accessibilityRole="button" onPress={save} style={[styles.saveButton, { backgroundColor: accentColor }]}>
            <Text style={styles.saveText}>Save tab layout</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "transparent", borderRadius: 18, borderWidth: 1, borderColor: "#000000", overflow: "hidden" },
  toggle: { minHeight: 62, paddingHorizontal: 15, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  kicker: { color: "#FFFFFF", fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  title: { color: "#FFFFFF", fontSize: 17, fontWeight: "900", fontStyle: "italic", marginTop: 3 },
  chevron: { color: "#FFFFFF", fontSize: 20, fontWeight: "900" },
  content: { borderTopWidth: 1, borderTopColor: "#35273D", padding: 14, gap: 8 },
  row: { flexDirection: "row", gap: 8, alignItems: "center" },
  glyphInput: { width: 42, minHeight: 37, borderRadius: 9, borderWidth: 1, borderColor: "#3A313E", backgroundColor: "#121014", textAlign: "center", fontSize: 17 },
  input: { flex: 1, minHeight: 37, borderRadius: 9, borderWidth: 1, borderColor: "#3A313E", backgroundColor: "#121014", paddingHorizontal: 9, fontSize: 12 },
  saveButton: { minHeight: 42, borderRadius: 11, alignItems: "center", justifyContent: "center", marginTop: 4 },
  saveText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
});