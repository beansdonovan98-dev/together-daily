import { AppFrame } from "@/components/app-frame";
import { PrivateGate } from "@/components/together-access";
import { monthCells, monthLabel, shiftMonth } from "@/lib/shared-calendar";
import { COLORS, prettyDate } from "@/lib/together";
import { PARTNERS, useLocalJournal } from "@/lib/local-journal";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { VisualText as Text, VisualTextInput as TextInput, VisualTouchableOpacity as TouchableOpacity, VisualView as View } from "@/components/visual-primitives";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarScreen() {
  return <PrivateGate>{() => <CalendarContent />}</PrivateGate>;
}

function CalendarContent() {
  const now = new Date();
  const { calendarEntries, addCalendarEntry, updateCalendarEntry, deleteCalendarEntry, theme } = useLocalJournal();
  const [year, setYear] = useState(now.getFullYear());
  const [monthIndex, setMonthIndex] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(() => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const cells = useMemo(() => monthCells(year, monthIndex), [year, monthIndex]);
  const selectedEntries = calendarEntries.filter((entry) => entry.date === selectedDate).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const changeMonth = (delta: number) => {
    const next = shiftMonth(year, monthIndex, delta);
    setYear(next.year);
    setMonthIndex(next.monthIndex);
  };
  const chooseDate = (date: string) => {
    setSelectedDate(date);
    const next = new Date(`${date}T12:00:00`);
    setYear(next.getFullYear());
    setMonthIndex(next.getMonth());
  };
  const saveNew = () => {
    addCalendarEntry(selectedDate, draft);
    setDraft("");
  };

  return <AppFrame><ScrollView contentContainerStyle={[styles.page, { backgroundColor: theme.backgroundColor ?? COLORS.blush }]} showsVerticalScrollIndicator={false}>
    <Text style={styles.eyebrow}>SHARED LONG-TERM PLANNER</Text>
    <Text style={styles.hero}>Calendar</Text>
    <Text style={styles.copy}>Save future plans, anniversaries, appointments, and other things you both want to remember. Every monthly ninth is marked with a heart for the two of you.</Text>

    <View style={styles.card}>
      <View style={styles.monthBar}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => changeMonth(-1)} style={styles.monthButton}><Text style={styles.monthButtonText}>←</Text></TouchableOpacity>
        <Text style={styles.monthTitle}>{monthLabel(year, monthIndex)}</Text>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Next month" onPress={() => changeMonth(1)} style={styles.monthButton}><Text style={styles.monthButtonText}>→</Text></TouchableOpacity>
      </View>
      <View style={styles.weekHeader}>{WEEKDAYS.map((day) => <Text key={day} style={styles.weekLabel}>{day}</Text>)}</View>
      <View style={styles.grid}>{cells.map((cell, index) => cell ? <TouchableOpacity key={cell.date} accessibilityRole="button" accessibilityLabel={cell.isHeartDay ? `${prettyDate(cell.date)}, heart day` : prettyDate(cell.date)} onPress={() => chooseDate(cell.date)} style={[styles.dayCell, cell.date === selectedDate && styles.dayCellSelected, cell.isHeartDay && styles.heartCell]}><Text style={[styles.dayNumber, cell.isHeartDay && styles.heartNumber]}>{cell.isHeartDay ? "♥" : cell.day}</Text>{calendarEntries.some((entry) => entry.date === cell.date) ? <View style={styles.entryDot} /> : null}</TouchableOpacity> : <View key={`empty-${index}`} style={styles.dayCell} />)}</View>
    </View>

    <View style={styles.card}>
      <Text style={styles.kicker}>SELECTED DATE</Text>
      <Text style={styles.selectedTitle}>{prettyDate(selectedDate)}</Text>
      <TextInput value={draft} onChangeText={setDraft} onSubmitEditing={saveNew} placeholder="Add something to remember…" placeholderTextColor="#FFFFFF99" style={styles.input}/>
      <TouchableOpacity accessibilityRole="button" onPress={saveNew} style={styles.addButton}><Text style={styles.addText}>Add to calendar</Text></TouchableOpacity>
      <View style={styles.entries}>{selectedEntries.length ? selectedEntries.map((entry) => {
        const owner = PARTNERS[entry.createdBy];
        const editing = editingId === entry.id;
        return <View key={entry.id} style={styles.entry}>{editing ? <><TextInput value={editingText} onChangeText={setEditingText} style={styles.input}/><View style={styles.entryActions}><TouchableOpacity onPress={() => { updateCalendarEntry(entry.id, editingText); setEditingId(null); }}><Text style={styles.action}>Save</Text></TouchableOpacity><TouchableOpacity onPress={() => setEditingId(null)}><Text style={styles.action}>Cancel</Text></TouchableOpacity></View></> : <><Text style={styles.entryText}>{entry.text}</Text><Text style={[styles.entryMeta, { color: owner.color }]}>{owner.avatar} {owner.name}</Text><View style={styles.entryActions}><TouchableOpacity onPress={() => { setEditingId(entry.id); setEditingText(entry.text); }}><Text style={styles.action}>Edit</Text></TouchableOpacity><TouchableOpacity onPress={() => deleteCalendarEntry(entry.id)}><Text style={styles.delete}>Remove</Text></TouchableOpacity></View></>}</View>;
      }) : <Text style={styles.empty}>Nothing saved for this date yet.</Text>}</View>
    </View>
  </ScrollView></AppFrame>;
}

const styles = StyleSheet.create({
  page: { padding: 18, paddingBottom: 42, gap: 14, flexGrow: 1 }, eyebrow: { color: COLORS.gold, fontSize: 10, fontWeight: "900", letterSpacing: 1.1 }, hero: { color: COLORS.plum, fontSize: 34, fontWeight: "900", fontStyle: "italic", marginTop: -7 }, copy: { color: COLORS.slate, fontSize: 12, lineHeight: 19 }, card: { backgroundColor: "transparent", borderRadius: 18, borderWidth: 1, borderColor: "#000000", padding: 14, gap: 11 }, monthBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, monthTitle: { color: COLORS.plum, fontSize: 20, fontWeight: "900", fontStyle: "italic" }, monthButton: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#000000", borderRadius: 10 }, monthButtonText: { color: COLORS.gold, fontSize: 20, fontWeight: "900" }, weekHeader: { flexDirection: "row" }, weekLabel: { flex: 1, color: COLORS.slate, textAlign: "center", fontSize: 9, fontWeight: "900" }, grid: { flexDirection: "row", flexWrap: "wrap" }, dayCell: { width: "14.2857%", aspectRatio: 1, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "transparent", position: "relative" }, dayCellSelected: { borderColor: "#000000", backgroundColor: "rgba(255,255,255,0.16)", borderRadius: 10 }, heartCell: { backgroundColor: "rgba(238,67,184,0.14)", borderRadius: 10 }, dayNumber: { color: COLORS.plum, fontSize: 14, fontWeight: "900" }, heartNumber: { color: COLORS.rose, fontSize: 18 }, entryDot: { position: "absolute", width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.gold, bottom: 5 }, kicker: { color: COLORS.gold, fontSize: 9, fontWeight: "900", letterSpacing: 1.1 }, selectedTitle: { color: COLORS.plum, fontSize: 19, fontWeight: "900", fontStyle: "italic", marginTop: -4 }, input: { minHeight: 44, borderRadius: 11, borderWidth: 1, borderColor: "#000000", backgroundColor: "rgba(8,6,12,0.34)", color: COLORS.plum, paddingHorizontal: 11, fontSize: 13 }, addButton: { alignSelf: "flex-start", backgroundColor: COLORS.orchid, paddingVertical: 10, paddingHorizontal: 13, borderRadius: 10 }, addText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" }, entries: { gap: 8 }, entry: { padding: 11, borderRadius: 11, borderWidth: 1, borderColor: "#000000", gap: 5 }, entryText: { color: COLORS.plum, fontSize: 14, lineHeight: 20 }, entryMeta: { fontSize: 10, fontWeight: "900" }, entryActions: { flexDirection: "row", gap: 14 }, action: { color: COLORS.gold, fontSize: 10, fontWeight: "900" }, delete: { color: COLORS.rose, fontSize: 10, fontWeight: "900" }, empty: { color: COLORS.slate, fontFamily: "monospace", fontSize: 11, fontStyle: "italic" },
});
