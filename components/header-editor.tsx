import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { COLORS } from "@/lib/together";
import { useLocalJournal } from "@/lib/local-journal";

export const HEADER_DEFAULTS = {
  relationshipTracker: "Relationship Tracker",
  loveNotes: "Love Notes",
  mealPlanner: "Meal Planner",
  sharedTodos: "Shared to-dos",
  dailyLog: "Our Daily Log",
  goodHabits: "Good Habits",
  pastDays: "Past Days",
} as const;

const HEADER_FIELDS = [
  { key: "relationshipTracker", label: "Relationship tracker" },
  { key: "loveNotes", label: "Love notes" },
  { key: "mealPlanner", label: "Meal planner" },
  { key: "sharedTodos", label: "Shared to-dos" },
  { key: "dailyLog", label: "Daily Log" },
  { key: "goodHabits", label: "Good Habits" },
  { key: "pastDays", label: "Past Days" },
] as const;

export function getHeader(customHeaders: Record<string, string>, key: keyof typeof HEADER_DEFAULTS) {
  return customHeaders[key]?.trim() || HEADER_DEFAULTS[key];
}

export function HeaderEditor() {
  const { customHeaders, setCustomHeader } = useLocalJournal();
  const [open, setOpen] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>(customHeaders);

  useEffect(() => { if (!open) setDrafts(customHeaders); }, [customHeaders, open]);

  const saveAll = () => {
    HEADER_FIELDS.forEach((field) => setCustomHeader(field.key, drafts[field.key] ?? ""));
    setOpen(false);
  };

  return <View style={styles.card}>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Toggle header editor" accessibilityState={{ expanded: open }} style={styles.toggle} onPress={() => setOpen((value) => !value)}>
      <View><Text style={styles.kicker}>PERSONALIZE TOGETHER DAILY</Text><Text style={styles.title}>Edit your section headers</Text></View>
      <Text style={styles.chevron}>{open ? "⌃" : "⌄"}</Text>
    </TouchableOpacity>
    {open ? <View style={styles.editor}>
      <Text style={styles.helper}>Change any title below. Leave it blank to use the original title again. These names are shared with your room.</Text>
      {HEADER_FIELDS.map((field) => <View key={field.key} style={styles.field}><Text style={styles.label}>{field.label}</Text><TextInput value={drafts[field.key] ?? ""} onChangeText={(value) => setDrafts((current) => ({ ...current, [field.key]: value }))} placeholder={HEADER_DEFAULTS[field.key]} placeholderTextColor="#7F7582" maxLength={36} style={styles.input} /></View>)}
      <TouchableOpacity accessibilityRole="button" style={styles.saveButton} onPress={saveAll}><Text style={styles.saveText}>Save header names</Text></TouchableOpacity>
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
  saveButton: { minHeight: 42, borderRadius: 11, backgroundColor: COLORS.orchid, alignItems: "center", justifyContent: "center", marginTop: 3 },
  saveText: { color: COLORS.white, fontSize: 13, fontWeight: "900" },
});
