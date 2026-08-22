import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { COLORS } from "@/lib/together";
import { useLocalJournal } from "@/lib/local-journal";

export const SUBHEADING_DEFAULTS = {
  relationshipTracker: "Every day, every hour, every little moment.",
  loveNotes: "A note for each other",
  mealPlanner: "What are we sharing today?",
  sharedTodos: "Little things, handled together.",
  dailyLog: "Timeline stream · add as often as you want",
  goodHabits: "Check off your own progress or cheer your partner on.",
  pastDays: "A complete keepsake of the days you have shared.",
} as const;

const SUBHEADING_FIELDS = [
  { key: "relationshipTracker", label: "Relationship tracker description" },
  { key: "loveNotes", label: "Love Notes description" },
  { key: "mealPlanner", label: "Meal Planner description" },
  { key: "sharedTodos", label: "Shared to-dos description" },
  { key: "dailyLog", label: "Daily Log description" },
  { key: "goodHabits", label: "Good Habits description" },
  { key: "pastDays", label: "Past Days description" },
] as const;

const ACCENT_SWATCHES = ["#8D5BA6", "#D56B88", "#C6A04C", "#90B99D", "#66B7DD", "#E6A267"];
const BACKGROUND_SWATCHES = ["#0D0B0F", "#18101E", "#16111A", "#102019", "#111827", "#251316"];
const HEX = /^#[0-9A-Fa-f]{6}$/;

export function getSubheading(customSubheadings: Record<string, string>, key: keyof typeof SUBHEADING_DEFAULTS) {
  return customSubheadings[key]?.trim() || SUBHEADING_DEFAULTS[key];
}

export function PersonalizationEditor() {
  const { customSubheadings, setCustomSubheading, theme, setTheme } = useLocalJournal();
  const [open, setOpen] = useState(false);
  const [subheadingDrafts, setSubheadingDrafts] = useState<Record<string, string>>(customSubheadings);
  const [accentDraft, setAccentDraft] = useState(theme.accentColor ?? COLORS.orchid);
  const [backgroundDraft, setBackgroundDraft] = useState(theme.backgroundColor ?? COLORS.blush);

  useEffect(() => { if (!open) { setSubheadingDrafts(customSubheadings); setAccentDraft(theme.accentColor ?? COLORS.orchid); setBackgroundDraft(theme.backgroundColor ?? COLORS.blush); } }, [customSubheadings, open, theme.accentColor, theme.backgroundColor]);

  const save = () => {
    SUBHEADING_FIELDS.forEach((field) => setCustomSubheading(field.key, subheadingDrafts[field.key] ?? ""));
    setTheme({ accentColor: HEX.test(accentDraft) ? accentDraft : COLORS.orchid, backgroundColor: HEX.test(backgroundDraft) ? backgroundDraft : COLORS.blush });
    setOpen(false);
  };

  return <View style={styles.card}>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Toggle personalization editor" accessibilityState={{ expanded: open }} style={styles.toggle} onPress={() => setOpen((value) => !value)}>
      <View><Text style={styles.kicker}>MAKE IT YOURS</Text><Text style={styles.title}>Descriptions & colors</Text></View><Text style={styles.chevron}>{open ? "⌃" : "⌄"}</Text>
    </TouchableOpacity>
    {open ? <View style={styles.editor}>
      <Text style={styles.helper}>Edit the descriptive words beneath the section titles. Leave one blank to restore its original words. Your color choices are shared with your room.</Text>
      {SUBHEADING_FIELDS.map((field) => <View key={field.key} style={styles.field}><Text style={styles.label}>{field.label}</Text><TextInput value={subheadingDrafts[field.key] ?? ""} onChangeText={(value) => setSubheadingDrafts((current) => ({ ...current, [field.key]: value }))} placeholder={SUBHEADING_DEFAULTS[field.key]} placeholderTextColor="#7F7582" maxLength={80} style={styles.input} /></View>)}
      <Text style={styles.sectionLabel}>ACCENT COLOR</Text><View style={styles.swatches}>{ACCENT_SWATCHES.map((color) => <TouchableOpacity key={color} onPress={() => setAccentDraft(color)} accessibilityLabel={`Choose ${color} accent`} style={[styles.swatch, { backgroundColor: color }, accentDraft === color && styles.swatchActive]} />)}</View><TextInput value={accentDraft} onChangeText={setAccentDraft} placeholder="#8D5BA6" autoCapitalize="characters" maxLength={7} placeholderTextColor="#7F7582" style={styles.hexInput} />
      <Text style={styles.sectionLabel}>BACKGROUND COLOR</Text><View style={styles.swatches}>{BACKGROUND_SWATCHES.map((color) => <TouchableOpacity key={color} onPress={() => setBackgroundDraft(color)} accessibilityLabel={`Choose ${color} background`} style={[styles.swatch, { backgroundColor: color }, backgroundDraft === color && styles.swatchActive]} />)}</View><TextInput value={backgroundDraft} onChangeText={setBackgroundDraft} placeholder="#0D0B0F" autoCapitalize="characters" maxLength={7} placeholderTextColor="#7F7582" style={styles.hexInput} />
      <TouchableOpacity accessibilityRole="button" style={styles.saveButton} onPress={save}><Text style={styles.saveText}>Save personalization</Text></TouchableOpacity>
    </View> : null}
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.ink, borderRadius: 18, borderWidth: 1, borderColor: "#473651", overflow: "hidden" },
  toggle: { minHeight: 62, paddingHorizontal: 15, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  kicker: { color: COLORS.gold, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  title: { color: COLORS.plum, fontSize: 17, fontWeight: "900", fontStyle: "italic", marginTop: 3 },
  chevron: { color: COLORS.orchid, fontSize: 20, fontWeight: "900" },
  editor: { borderTopWidth: 1, borderTopColor: "#35273D", padding: 14, gap: 10 },
  helper: { color: COLORS.slate, fontFamily: "monospace", fontSize: 10, lineHeight: 15, marginBottom: 2 },
  field: { gap: 5 },
  label: { color: COLORS.plum, fontSize: 11, fontWeight: "800" },
  input: { minHeight: 40, borderRadius: 10, borderWidth: 1, borderColor: "#3A313E", backgroundColor: "#121014", color: COLORS.plum, paddingHorizontal: 10, fontSize: 13 },
  sectionLabel: { color: COLORS.gold, fontSize: 9, fontWeight: "900", letterSpacing: .9, marginTop: 5 },
  swatches: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  swatch: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: "transparent" },
  swatchActive: { borderColor: COLORS.white },
  hexInput: { minHeight: 38, borderRadius: 10, borderWidth: 1, borderColor: "#3A313E", backgroundColor: "#121014", color: COLORS.plum, paddingHorizontal: 10, fontFamily: "monospace", fontSize: 12 },
  saveButton: { minHeight: 42, borderRadius: 11, backgroundColor: COLORS.orchid, alignItems: "center", justifyContent: "center", marginTop: 3 },
  saveText: { color: COLORS.white, fontSize: 13, fontWeight: "900" },
});
