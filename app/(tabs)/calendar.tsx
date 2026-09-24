import { getApiBaseUrl } from "@/constants/oauth";
import { AppFrame } from "@/components/app-frame";
import { PrivateGate } from "@/components/together-access";
import { imageMimeFromAsset, maxBase64LengthForMedia } from "@/lib/media-upload-policy";
import { preparePickedImageForUpload } from "@/lib/media-base64";
import { PARTNERS, useLocalJournal } from "@/lib/local-journal";
import { monthCells, monthLabel, shiftMonth } from "@/lib/shared-calendar";
import { COLORS, prettyDate } from "@/lib/together";
import { Image as ExpoImage } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet } from "react-native";
import { VisualText as Text, VisualTextInput as TextInput, VisualTouchableOpacity as TouchableOpacity, VisualView as View } from "@/components/visual-primitives";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarScreen() {
  return <PrivateGate>{() => <CalendarContent />}</PrivateGate>;
}

function CalendarContent() {
  const now = new Date();
  const {
    calendarEntries,
    addCalendarEntry,
    updateCalendarEntry,
    deleteCalendarEntry,
    calendarBackground,
    uploadCalendarBackground,
    deleteCalendarBackground,
  } = useLocalJournal();
  const [year, setYear] = useState(now.getFullYear());
  const [monthIndex, setMonthIndex] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(() => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [backgroundBusy, setBackgroundBusy] = useState(false);
  const [backgroundError, setBackgroundError] = useState("");
  const cells = useMemo(() => monthCells(year, monthIndex), [year, monthIndex]);
  const selectedEntries = calendarEntries.filter((entry) => entry.date === selectedDate).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const mediaUrl = (url: string) => url.startsWith("/") ? `${getApiBaseUrl()}${url}` : url;

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
  const chooseBackground = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, quality: 1, base64: true });
    if (result.canceled || !result.assets[0]) return;
    setBackgroundBusy(true);
    setBackgroundError("");
    try {
      const asset = result.assets[0];
      const mimeType = imageMimeFromAsset(asset.mimeType, asset.fileName, asset.uri);
      const prepared = await preparePickedImageForUpload({ uri: asset.uri, base64: asset.base64, mimeType });
      if (prepared.base64.length > maxBase64LengthForMedia(prepared.mimeType, "cover")) throw new Error("Choose a smaller Calendar photo or GIF.");
      await uploadCalendarBackground({
        fileName: asset.fileName ?? `calendar-background.${prepared.mimeType === "image/gif" ? "gif" : "jpg"}`,
        mimeType: prepared.mimeType,
        base64: prepared.base64,
      });
    } catch (error) {
      setBackgroundError(error instanceof Error ? error.message : "The Calendar background could not be saved.");
    } finally {
      setBackgroundBusy(false);
    }
  };
  const removeBackground = () => Alert.alert(
    "Remove Calendar background?",
    "The Calendar will return to the shared Theme gradient.",
    [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => { void deleteCalendarBackground(); } },
    ],
  );

  return <AppFrame><View style={styles.pageShell}>
    {calendarBackground?.url ? <ExpoImage source={mediaUrl(calendarBackground.url)} contentFit="cover" transition={180} style={styles.backgroundImage} /> : null}
    {calendarBackground?.url ? <View pointerEvents="none" style={styles.backgroundShade} /> : null}
    <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
      <Text style={styles.eyebrow}>SHARED LONG-TERM PLANNER</Text>
      <Text style={styles.hero}>Calendar</Text>
      <Text style={styles.copy}>Save future plans, anniversaries, appointments, and other things you both want to remember. Every monthly ninth is marked with a heart for the two of you.</Text>

      <View style={styles.card}>
        <Text style={styles.kicker}>CALENDAR BACKGROUND</Text>
        <Text style={styles.copy}>Choose a photo from either phone. It saves as the shared background for this Calendar only.</Text>
        <View style={styles.backgroundActions}>
          <TouchableOpacity accessibilityRole="button" disabled={backgroundBusy} onPress={() => { void chooseBackground(); }} style={styles.backgroundButton}>
            <Text style={styles.backgroundButtonText}>{backgroundBusy ? "Saving…" : calendarBackground ? "Change photo" : "Choose photo"}</Text>
          </TouchableOpacity>
          {calendarBackground ? <TouchableOpacity accessibilityRole="button" disabled={backgroundBusy} onPress={removeBackground}><Text style={styles.removeBackground}>Remove</Text></TouchableOpacity> : null}
        </View>
        {backgroundError ? <Text style={styles.backgroundError}>{backgroundError}</Text> : null}
      </View>

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
        <TextInput value={draft} onChangeText={setDraft} onSubmitEditing={saveNew} placeholder="Add something to remember…" placeholderTextColor="#FFFFFF99" style={styles.input} />
        <TouchableOpacity accessibilityRole="button" onPress={saveNew} style={styles.addButton}><Text style={styles.addText}>Add to calendar</Text></TouchableOpacity>
        <View style={styles.entries}>{selectedEntries.length ? selectedEntries.map((entry) => {
          const owner = PARTNERS[entry.createdBy];
          const editing = editingId === entry.id;
          return <View key={entry.id} style={styles.entry}>{editing ? <><TextInput value={editingText} onChangeText={setEditingText} style={styles.input} /><View style={styles.entryActions}><TouchableOpacity onPress={() => { updateCalendarEntry(entry.id, editingText); setEditingId(null); }}><Text style={styles.action}>Save</Text></TouchableOpacity><TouchableOpacity onPress={() => setEditingId(null)}><Text style={styles.action}>Cancel</Text></TouchableOpacity></View></> : <><Text style={styles.entryText}>{entry.text}</Text><Text style={[styles.entryMeta, { color: owner.color }]}>{owner.avatar} {owner.name}</Text><View style={styles.entryActions}><TouchableOpacity onPress={() => { setEditingId(entry.id); setEditingText(entry.text); }}><Text style={styles.action}>Edit</Text></TouchableOpacity><TouchableOpacity onPress={() => deleteCalendarEntry(entry.id)}><Text style={styles.delete}>Remove</Text></TouchableOpacity></View></>}</View>;
        }) : <Text style={styles.empty}>Nothing saved for this date yet.</Text>}</View>
      </View>
    </ScrollView>
  </View></AppFrame>;
}

const styles = StyleSheet.create({
  pageShell: { flex: 1, position: "relative" },
  backgroundImage: { ...StyleSheet.absoluteFillObject, opacity: 0.48 },
  backgroundShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(8,5,12,0.36)" },
  page: { padding: 18, paddingBottom: 42, gap: 14, flexGrow: 1, backgroundColor: "transparent" },
  eyebrow: { color: COLORS.gold, fontSize: 10, fontWeight: "900", letterSpacing: 1.1 },
  hero: { color: COLORS.plum, fontSize: 34, fontWeight: "900", fontStyle: "italic", marginTop: -7 },
  copy: { color: COLORS.slate, fontSize: 12, lineHeight: 19 },
  card: { backgroundColor: "rgba(12,8,18,0.20)", borderRadius: 18, borderWidth: 1, borderColor: "#000000", padding: 14, gap: 11 },
  monthBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  monthTitle: { color: COLORS.plum, fontSize: 20, fontWeight: "900", fontStyle: "italic" },
  monthButton: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#000000", borderRadius: 10 },
  monthButtonText: { color: COLORS.gold, fontSize: 20, fontWeight: "900" },
  weekHeader: { flexDirection: "row" },
  weekLabel: { flex: 1, color: COLORS.slate, textAlign: "center", fontSize: 9, fontWeight: "900" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: { width: "14.2857%", aspectRatio: 1, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "transparent", position: "relative" },
  dayCellSelected: { borderColor: "#000000", backgroundColor: "rgba(255,255,255,0.16)", borderRadius: 10 },
  heartCell: { backgroundColor: "rgba(238,67,184,0.14)", borderRadius: 10 },
  dayNumber: { color: COLORS.plum, fontSize: 14, fontWeight: "900" },
  heartNumber: { color: COLORS.rose, fontSize: 18 },
  entryDot: { position: "absolute", width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.gold, bottom: 5 },
  kicker: { color: COLORS.gold, fontSize: 9, fontWeight: "900", letterSpacing: 1.1 },
  selectedTitle: { color: COLORS.plum, fontSize: 19, fontWeight: "900", fontStyle: "italic", marginTop: -4 },
  input: { minHeight: 44, borderRadius: 11, borderWidth: 1, borderColor: "#000000", backgroundColor: "rgba(8,6,12,0.34)", color: COLORS.plum, paddingHorizontal: 11, fontSize: 13 },
  addButton: { alignSelf: "flex-start", backgroundColor: COLORS.orchid, paddingVertical: 10, paddingHorizontal: 13, borderRadius: 10 },
  addText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  entries: { gap: 8 },
  entry: { padding: 11, borderRadius: 11, borderWidth: 1, borderColor: "#000000", gap: 5 },
  entryText: { color: COLORS.plum, fontSize: 14, lineHeight: 20 },
  entryMeta: { fontSize: 10, fontWeight: "900" },
  entryActions: { flexDirection: "row", gap: 14 },
  action: { color: COLORS.gold, fontSize: 10, fontWeight: "900" },
  delete: { color: COLORS.rose, fontSize: 10, fontWeight: "900" },
  empty: { color: COLORS.slate, fontFamily: "monospace", fontSize: 11, fontStyle: "italic" },
  backgroundActions: { flexDirection: "row", alignItems: "center", gap: 13 },
  backgroundButton: { backgroundColor: "rgba(255,255,255,0.20)", borderRadius: 10, borderWidth: 1, borderColor: "#000000", paddingHorizontal: 12, paddingVertical: 9 },
  backgroundButtonText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900" },
  removeBackground: { color: COLORS.rose, fontSize: 11, fontWeight: "900" },
  backgroundError: { color: COLORS.rose, fontSize: 10, lineHeight: 14 },
});
