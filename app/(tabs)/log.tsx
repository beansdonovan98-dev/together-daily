import { AppFrame } from "@/components/app-frame";
import DateTimePicker from "@react-native-community/datetimepicker";
import { getSubheading } from "@/components/personalization-editor";
import { PrivateGate } from "@/components/together-access";
import { COLORS, asObject, dateTimeLabel, localDateKey, prettyDate } from "@/lib/together";
import { sortTimelineEntriesOldestFirst } from "@/lib/timeline-utils";
import { timestampForEditedTime } from "@/lib/timeline-time";
import { PARTNERS, type PartnerId, type SavedLogStyle, useLocalJournal } from "@/lib/local-journal";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type EventStyle = { id: string; label: string; emoji: string; color: string };
type TimelineEntry = { id: string; text: string; type: string; emoji?: string; color?: string; authorId: PartnerId; createdAt: string };

function formatEditableTime(timestamp: string) {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(timestamp));
}

const LEGACY_LOG_STYLES: Record<string, Pick<EventStyle, "emoji" | "color">> = {
  Together: { emoji: "♥", color: COLORS.rose },
  Plan: { emoji: "✦", color: COLORS.gold },
  Feeling: { emoji: "☁", color: "#92B9D8" },
  Memory: { emoji: "❋", color: COLORS.sage },
};

const CUSTOM_COLORS = [
  { name: "Rose", value: COLORS.rose },
  { name: "Gold", value: COLORS.gold },
  { name: "Sky", value: "#66B7DD" },
  { name: "Sage", value: COLORS.sage },
  { name: "Orchid", value: COLORS.orchid },
  { name: "Peach", value: "#E6A267" },
];

function getEventStyle(entry: TimelineEntry): EventStyle {
  const legacy = LEGACY_LOG_STYLES[entry.type];
  return {
    id: "saved",
    label: entry.type || "Moment",
    emoji: entry.emoji || legacy?.emoji || "✦",
    color: entry.color || legacy?.color || COLORS.orchid,
  };
}

export default function SharedLogScreen() {
  return <PrivateGate>{({ userId }) => <TimelineScreen userId={userId} />}</PrivateGate>;
}

function TimelineScreen({ userId }: { userId: PartnerId }) {
  const params = useLocalSearchParams<{ date?: string }>();
  const today = localDateKey();
  const date = typeof params.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : today;
  const { getDay, updateDay, roomCode, isSyncing, ensureDay, savedLogStyles, addDailyLogEvent, updateDailyLogEvent, deleteDailyLogEvent, deleteLogStyle, customSubheadings, theme } = useLocalJournal();
  const [draft, setDraft] = useState("");
  const [customLabel, setCustomLabel] = useState("");
  const [customEmoji, setCustomEmoji] = useState("✦");
  const [customColor, setCustomColor] = useState(COLORS.orchid);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editLabel, setEditLabel] = useState("");
  const [editEmoji, setEditEmoji] = useState("✦");
  const [editColor, setEditColor] = useState(COLORS.orchid);
  const [editTime, setEditTime] = useState("");
  const [editTimeValue, setEditTimeValue] = useState(new Date());
  const [showNativeTimePicker, setShowNativeTimePicker] = useState(false);

  const content = asObject(getDay(date));
  const storedDebrief = String(content.sharedNotes ?? "");
  const [debriefDraft, setDebriefDraft] = useState(storedDebrief);
  useEffect(() => { ensureDay(date); }, [date, ensureDay]);
  useEffect(() => { setDebriefDraft(storedDebrief); }, [date, storedDebrief]);

  const entries = useMemo(
    () => sortTimelineEntriesOldestFirst(Array.isArray(content.timelineEvents) ? content.timelineEvents as TimelineEntry[] : []),
    [content.timelineEvents],
  );
  const me = PARTNERS[userId];
  const activeStyle = { id: "custom", label: customLabel.trim() || "Custom moment", emoji: customEmoji.trim() || "✦", color: customColor };

  const addEvent = () => {
    const text = draft.trim();
    if (!text) return;
    addDailyLogEvent(date, { id: `timeline-${Date.now()}-${Math.random().toString(16).slice(2)}`, text, authorId: userId, createdAt: new Date().toISOString() }, activeStyle);
    setDraft("");
  };

  const saveDebrief = () => {
    updateDay(date, { sharedNotes: debriefDraft.trim() });
  };

  const beginEdit = (entry: TimelineEntry) => {
    const style = getEventStyle(entry);
    setEditingId(entry.id);
    setEditText(entry.text);
    setEditLabel(style.label);
    setEditEmoji(style.emoji);
    setEditColor(style.color);
    setEditTime(formatEditableTime(entry.createdAt));
    setEditTimeValue(new Date(entry.createdAt));
    setShowNativeTimePicker(false);
  };

  const saveEdit = (entry: TimelineEntry) => {
    const text = editText.trim();
    if (!text) return;
    const createdAt = timestampForEditedTime(date, editTime);
    if (!createdAt) { Alert.alert("Enter a valid time", "Use a time such as 8:30 AM, 3:15 PM, or 15:15."); return; }
    updateDailyLogEvent(date, entry.id, { text, type: editLabel.trim() || "Custom moment", emoji: editEmoji.trim() || "✦", color: editColor, createdAt });
    setEditingId(null);
    setShowNativeTimePicker(false);
  };

  const confirmDelete = (entry: TimelineEntry) => {
    Alert.alert("Delete this event?", "This removes the event from today’s shared timeline for both of you.", [
      { text: "Keep", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteDailyLogEvent(date, entry.id) },
    ]);
  };

  const confirmDeleteSavedType = (style: SavedLogStyle) => {
    Alert.alert("Delete saved event type?", `“${style.emoji} ${style.label}” will be removed from Saved Types. Existing log events will keep their current label and color.`, [
      { text: "Keep", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteLogStyle(style.id) },
    ]);
  };

  const pickNativeTime = (_event: unknown, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowNativeTimePicker(false);
    if (!selectedDate) return;
    setEditTimeValue(selectedDate);
    setEditTime(formatEditableTime(selectedDate.toISOString()));
  };

  return <AppFrame><ScrollView contentContainerStyle={[styles.page,{backgroundColor:theme.backgroundColor??COLORS.blush}]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
    <View style={styles.hero}>
      <Text style={styles.heroMark}>♥</Text>
      <View style={styles.heroCopy}>
        <Text style={styles.heroEyebrow}>{prettyDate(date).toUpperCase()}</Text>
        <Text style={styles.heroTitle}>Our Daily Log</Text>
        <Text style={styles.heroSub}>{roomCode ? `Shared room · ${isSyncing ? "syncing" : "live"}` : "A private timeline for the two of you"}</Text>
      </View>
    </View>

    <View style={styles.dayNav}>
      <TouchableOpacity style={styles.dayNavButton} onPress={() => { const previous = new Date(`${date}T12:00:00`); previous.setDate(previous.getDate() - 1); router.replace({ pathname: "/log", params: { date: previous.toISOString().slice(0, 10) } } as never); }}>
        <Text style={styles.dayNavText}>← Previous</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.dayNavButton, date === today && styles.dayNavDisabled]} disabled={date === today} onPress={() => { const next = new Date(`${date}T12:00:00`); next.setDate(next.getDate() + 1); router.replace({ pathname: "/log", params: { date: next.toISOString().slice(0, 10) } } as never); }}>
        <Text style={styles.dayNavText}>{date === today ? "Today" : "Next →"}</Text>
      </TouchableOpacity>
    </View>

    <View style={styles.debrief}>
      <View style={styles.sectionLead}><View style={[styles.sectionIcon, { backgroundColor: COLORS.lavender }]}><Text style={[styles.sectionIconText, { color: COLORS.orchid }]}>✎</Text></View><View style={styles.sectionLeadText}><Text style={styles.sectionTitle}>Notes & Debrief</Text><Text style={styles.sectionSub}>Keep adding the small things as your day unfolds.</Text></View></View>
      <View style={styles.quickLine}><Text style={styles.quickDot}>●</Text><Text style={styles.quickText}>Create your own emoji and color type once, then reuse it whenever it fits.</Text></View>
      <TextInput value={debriefDraft} onChangeText={setDebriefDraft} editable multiline placeholder="Write notes, reflections, or a debrief for today…" placeholderTextColor="#7F7582" textAlignVertical="top" style={styles.debriefInput}/><TouchableOpacity accessibilityRole="button" onPress={saveDebrief} style={[styles.debriefSaveButton,{backgroundColor:me.color}]}><Text style={styles.debriefSaveText}>Save notes & debrief</Text></TouchableOpacity>
    </View>

    <View style={styles.stream}>
      <View style={styles.streamTop}><View style={styles.sectionLead}><View style={[styles.sectionIcon, { backgroundColor: "#21142B" }]}><Text style={[styles.sectionIconText, { color: COLORS.orchid }]}>◷</Text></View><View style={styles.sectionLeadText}><Text style={styles.sectionTitle}>Log</Text><Text style={styles.sectionSub}>{getSubheading(customSubheadings,"dailyLog")}</Text></View></View><View style={styles.liveTag}><View style={styles.liveDot}/><Text style={styles.liveText}>LIVE</Text></View></View>

      <View style={[styles.composer, { borderColor: me.color }]}>
        <View style={styles.composerHeader}><View style={[styles.authorBadge, { backgroundColor: me.soft }]}><Text style={[styles.authorBadgeText, { color: me.color }]}>{me.avatar} {me.name}</Text></View><Text style={styles.composerTime}>NOW</Text></View>
        <TextInput value={draft} onChangeText={setDraft} placeholder="What’s happening right now?" placeholderTextColor="#7F7582" multiline style={styles.input}/>
        <View style={styles.composerFooter}>
          <Text style={styles.stylePrompt}>CREATE A MOMENT TYPE</Text>
          <View style={styles.customPanel}>
            <Text style={styles.customTitle}>Make this event yours</Text>
            <View style={styles.customInputRow}>
              <TextInput value={customEmoji} onChangeText={(value) => setCustomEmoji(value.slice(0, 4))} placeholder="✦" placeholderTextColor="#7F7582" style={styles.emojiInput} maxLength={4} accessibilityLabel="Custom event emoji" />
              <TextInput value={customLabel} onChangeText={setCustomLabel} placeholder="Name this event" placeholderTextColor="#7F7582" style={styles.labelInput} maxLength={28} accessibilityLabel="Custom event label" />
            </View>
            <Text style={styles.colorPrompt}>PICK A COLOR</Text>
            <View style={styles.colorRow}>{CUSTOM_COLORS.map((option) => <TouchableOpacity key={option.name} accessibilityRole="button" accessibilityLabel={`${option.name} color`} onPress={() => setCustomColor(option.value)} style={[styles.colorSwatch, { backgroundColor: option.value }, customColor === option.value && styles.colorSwatchActive]}><Text style={styles.colorSwatchLabel}>{customColor === option.value ? "✓" : ""}</Text></TouchableOpacity>)}</View>
          </View>
          <Text style={styles.stylePrompt}>SAVED TYPES</Text>
          {savedLogStyles.length ? <View style={styles.typeRow}>{savedLogStyles.map((style) => <SavedStyleButton key={style.id} styleOption={style} onPress={() => { setCustomLabel(style.label); setCustomEmoji(style.emoji); setCustomColor(style.color); }} onDelete={() => confirmDeleteSavedType(style)} />)}</View> : <Text style={styles.noSavedTypes}>Your types will appear here after you add your first event.</Text>}
          <TouchableOpacity onPress={addEvent} style={[styles.addButton, { backgroundColor: me.color }]}><Text style={styles.addButtonText}>+ Add {activeStyle.emoji} Event</Text></TouchableOpacity>
        </View>
      </View>

      {entries.length ? <View style={styles.entries}>{entries.map((entry) => {
        const author = PARTNERS[entry.authorId];
        const style = getEventStyle(entry);
        const editing = editingId === entry.id;
        return <View key={entry.id} style={[styles.entry, { borderColor: style.color, borderLeftColor: author.color }]}>
          <View style={styles.entryMeta}><Text style={[styles.timePill, { color: author.color }]}>{dateTimeLabel(entry.createdAt)}</Text><View style={[styles.category, { backgroundColor: `${style.color}20`, borderColor: style.color }]}><Text style={[styles.categoryText, { color: style.color }]}>{style.emoji} {style.label}</Text></View><View style={[styles.partnerPill, { backgroundColor: author.soft }]}><Text style={[styles.partnerPillText, { color: author.color }]}>{author.avatar} {author.name}</Text></View></View>
          {editing ? <View style={styles.editPanel}><View style={styles.editTimeRow}><Text style={styles.editTimeLabel}>WHEN DID THIS HAPPEN?</Text><TextInput value={editTime} onChangeText={setEditTime} placeholder="8:30 AM" placeholderTextColor="#7F7582" keyboardType="numbers-and-punctuation" maxLength={8} style={styles.editTimeInput}/>{Platform.OS !== "web" ? <TouchableOpacity accessibilityRole="button" accessibilityLabel="Pick event time" onPress={() => setShowNativeTimePicker(true)} style={styles.pickTimeButton}><Text style={styles.pickTimeText}>PICK TIME</Text></TouchableOpacity> : null}</View>{showNativeTimePicker ? <View style={styles.nativePickerWrap}><DateTimePicker value={editTimeValue} mode="time" display={Platform.OS === "ios" ? "spinner" : "default"} onChange={pickNativeTime}/>{Platform.OS === "ios" ? <TouchableOpacity accessibilityRole="button" onPress={() => setShowNativeTimePicker(false)} style={styles.nativePickerDone}><Text style={styles.nativePickerDoneText}>Done</Text></TouchableOpacity> : null}</View> : null}<TextInput value={editText} onChangeText={setEditText} placeholder="What happened?" placeholderTextColor="#7F7582" multiline style={styles.editTextInput}/><View style={styles.editStyleRow}><TextInput value={editEmoji} onChangeText={(value) => setEditEmoji(value.slice(0, 4))} placeholder="✦" placeholderTextColor="#7F7582" maxLength={4} style={styles.editEmojiInput}/><TextInput value={editLabel} onChangeText={setEditLabel} placeholder="Event type" placeholderTextColor="#7F7582" maxLength={28} style={styles.editLabelInput}/></View><View style={styles.editColorRow}>{CUSTOM_COLORS.map((option) => <TouchableOpacity key={option.name} accessibilityRole="button" accessibilityLabel={`Use ${option.name} color for this event`} onPress={() => setEditColor(option.value)} style={[styles.editColorSwatch, { backgroundColor: option.value }, editColor === option.value && styles.colorSwatchActive]}><Text style={styles.colorSwatchLabel}>{editColor === option.value ? "✓" : ""}</Text></TouchableOpacity>)}</View><View style={styles.editActions}><TouchableOpacity accessibilityRole="button" onPress={() => { setEditingId(null); setShowNativeTimePicker(false); }} style={styles.cancelEditButton}><Text style={styles.cancelEditText}>Cancel</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" onPress={() => saveEdit(entry)} style={[styles.saveEditButton, { backgroundColor: author.color }]}><Text style={styles.saveEditText}>Save changes</Text></TouchableOpacity></View></View> : <><Text style={[styles.entryTitle, { color: author.color }]}>{entry.text}</Text><View style={styles.entryActions}><TouchableOpacity accessibilityRole="button" accessibilityLabel={`Edit ${entry.text}`} onPress={() => beginEdit(entry)} style={styles.editAction}><Text style={styles.editActionText}>EDIT</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" accessibilityLabel={`Delete ${entry.text}`} onPress={() => confirmDelete(entry)} style={styles.deleteAction}><Text style={styles.deleteActionText}>DELETE</Text></TouchableOpacity></View></>}
        </View>;
      })}</View> : <View style={styles.empty}><Text style={styles.emptyMark}>+</Text><Text style={styles.emptyTitle}>Start the stream.</Text><Text style={styles.emptyCopy}>A moment, a plan, a feeling, a shower, or a little memory can go here whenever it happens.</Text></View>}
    </View>
  </ScrollView></AppFrame>;
}

function SavedStyleButton({ styleOption, onPress, onDelete }: { styleOption: SavedLogStyle; onPress: () => void; onDelete: () => void }) {
  return <View style={[styles.savedType, { borderColor: styleOption.color, backgroundColor: `${styleOption.color}18` }]}><TouchableOpacity accessibilityRole="button" accessibilityLabel={`Use ${styleOption.label} style`} onPress={onPress} style={styles.savedTypeUse}><Text style={[styles.typeText, { color: styleOption.color }]}>{styleOption.emoji} {styleOption.label}</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" accessibilityLabel={`Delete saved ${styleOption.label} type`} onPress={onDelete} style={styles.savedTypeDelete}><Text style={[styles.savedTypeDeleteText, { color: styleOption.color }]}>×</Text></TouchableOpacity></View>;
}

const styles = StyleSheet.create({
  page: { padding: 18, paddingBottom: 38, gap: 16, backgroundColor: COLORS.blush },
  hero: { paddingTop: 12, paddingBottom: 5, flexDirection: "row", alignItems: "center", gap: 13 },
  heroMark: { color: COLORS.rose, fontSize: 38, lineHeight: 40 },
  heroCopy: { flex: 1 },
  heroEyebrow: { color: COLORS.gold, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  heroTitle: { color: COLORS.plum, fontSize: 31, fontWeight: "900", lineHeight: 35, letterSpacing: -.5 },
  heroSub: { color: COLORS.slate, fontSize: 12, marginTop: 2 },
  dayNav: { flexDirection: "row", gap: 8 },
  dayNavButton: { flex: 1, minHeight: 40, borderRadius: 11, borderWidth: 1, borderColor: "#3A313E", backgroundColor: COLORS.ink, justifyContent: "center", alignItems: "center" },
  dayNavDisabled: { opacity: .55 },
  dayNavText: { color: COLORS.gold, fontSize: 12, fontWeight: "900" },
  debrief: { backgroundColor: COLORS.ink, borderWidth: 1, borderColor: "#432759", borderRadius: 20, padding: 17, gap: 16 },
  debriefInput: { minHeight: 104, borderWidth: 1, borderColor: "#3A313E", borderRadius: 12, backgroundColor: "#120F14", color: COLORS.plum, padding: 12, fontSize: 14, lineHeight: 20 },
  debriefSaveButton: { minHeight: 42, borderRadius: 11, alignItems: "center", justifyContent: "center", paddingHorizontal: 14, alignSelf: "flex-start" },
  debriefSaveText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  sectionLead: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  sectionIcon: { height: 38, width: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  sectionIconText: { fontSize: 20, fontWeight: "900" },
  sectionLeadText: { flex: 1 },
  sectionTitle: { color: COLORS.plum, fontSize: 20, fontWeight: "800", fontStyle: "italic" },
  sectionSub: { color: COLORS.slate, fontSize: 12, lineHeight: 17, marginTop: 2, fontFamily: "monospace" },
  quickLine: { borderRadius: 13, backgroundColor: COLORS.white, padding: 13, flexDirection: "row", gap: 9, alignItems: "center" },
  quickDot: { color: COLORS.orchid, fontSize: 10 },
  quickText: { color: COLORS.slate, fontSize: 13, flex: 1, fontStyle: "italic" },
  stream: { backgroundColor: COLORS.ink, borderWidth: 1, borderColor: "#432759", borderRadius: 20, padding: 17 },
  streamTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 16 },
  liveTag: { backgroundColor: "#201629", paddingHorizontal: 9, paddingVertical: 6, borderRadius: 10, flexDirection: "row", alignItems: "center", gap: 5 },
  liveDot: { height: 6, width: 6, borderRadius: 3, backgroundColor: COLORS.sage },
  liveText: { color: COLORS.orchid, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  composer: { backgroundColor: COLORS.surface, borderWidth: 1.5, borderRadius: 16, padding: 13 },
  composerHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  authorBadge: { borderRadius: 9, paddingHorizontal: 9, paddingVertical: 5 },
  authorBadgeText: { fontSize: 11, fontWeight: "900" },
  composerTime: { color: COLORS.slate, fontSize: 10, fontFamily: "monospace", letterSpacing: .7 },
  input: { minHeight: 64, borderRadius: 12, borderWidth: 1, borderColor: "#342C38", backgroundColor: "#121014", padding: 12, color: COLORS.plum, textAlignVertical: "top", fontSize: 15 },
  composerFooter: { marginTop: 10, gap: 10 },
  stylePrompt: { color: COLORS.slate, fontSize: 9, fontWeight: "900", letterSpacing: .9 },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  typePill: { borderWidth: 1, borderColor: "#3A313E", borderRadius: 9, paddingHorizontal: 8, paddingVertical: 6, backgroundColor: "#151217" },
  savedType: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 9, overflow: "hidden" },
  savedTypeUse: { paddingLeft: 8, paddingRight: 5, paddingVertical: 6 },
  savedTypeDelete: { width: 25, alignItems: "center", justifyContent: "center", alignSelf: "stretch", borderLeftWidth: 1, borderLeftColor: "rgba(255,255,255,0.16)" },
  savedTypeDeleteText: { fontSize: 17, fontWeight: "700", lineHeight: 18 },
  typeText: { color: COLORS.slate, fontSize: 11, fontWeight: "800" },
  noSavedTypes: { color: COLORS.slate, fontFamily: "monospace", fontSize: 10, fontStyle: "italic" },
  customPanel: { borderRadius: 12, backgroundColor: "#161219", borderWidth: 1, borderColor: "#3D2E43", padding: 11, gap: 9 },
  customTitle: { color: COLORS.plum, fontSize: 13, fontWeight: "900" },
  customInputRow: { flexDirection: "row", gap: 8 },
  emojiInput: { width: 53, borderWidth: 1, borderColor: "#3A313E", backgroundColor: "#100E12", borderRadius: 9, color: COLORS.plum, fontSize: 18, textAlign: "center", paddingHorizontal: 7, paddingVertical: 7 },
  labelInput: { flex: 1, borderWidth: 1, borderColor: "#3A313E", backgroundColor: "#100E12", borderRadius: 9, color: COLORS.plum, fontSize: 13, paddingHorizontal: 10, paddingVertical: 7 },
  colorPrompt: { color: COLORS.slate, fontSize: 9, fontWeight: "900", letterSpacing: .9 },
  colorRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  colorSwatch: { width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "transparent" },
  colorSwatchActive: { borderColor: COLORS.white },
  colorSwatchLabel: { color: COLORS.white, fontSize: 13, fontWeight: "900" },
  addButton: { minHeight: 42, borderRadius: 11, justifyContent: "center", alignItems: "center" },
  addButtonText: { color: COLORS.white, fontSize: 14, fontWeight: "900" },
  entries: { gap: 10, marginTop: 15 },
  entry: { backgroundColor: COLORS.white, borderRadius: 15, padding: 14, borderWidth: 1, borderLeftWidth: 4 },
  entryMeta: { flexDirection: "row", alignItems: "center", gap: 7, flexWrap: "wrap" },
  timePill: { fontFamily: "monospace", fontSize: 11, fontWeight: "900" },
  category: { borderWidth: 1, borderRadius: 7, paddingVertical: 4, paddingHorizontal: 7 },
  categoryText: { fontSize: 9, fontWeight: "900", letterSpacing: .5, textTransform: "uppercase" },
  partnerPill: { borderRadius: 7, paddingVertical: 4, paddingHorizontal: 7, marginLeft: "auto" },
  partnerPillText: { fontSize: 9, fontWeight: "900" },
  entryTitle: { fontSize: 16, fontWeight: "800", lineHeight: 23, marginTop: 10 },
  entryActions: { flexDirection: "row", gap: 8, marginTop: 12 },
  editAction: { borderRadius: 8, borderWidth: 1, borderColor: "#687B92", paddingHorizontal: 10, paddingVertical: 6 },
  editActionText: { color: "#A9CDEC", fontSize: 9, fontWeight: "900", letterSpacing: .8 },
  deleteAction: { borderRadius: 8, borderWidth: 1, borderColor: "#864B59", paddingHorizontal: 10, paddingVertical: 6 },
  deleteActionText: { color: "#E69AAA", fontSize: 9, fontWeight: "900", letterSpacing: .8 },
  editPanel: { gap: 9, marginTop: 11 },
  editTimeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, borderRadius: 10, backgroundColor: "#161219", padding: 9 },
  editTimeLabel: { color: COLORS.slate, fontSize: 9, fontWeight: "900", letterSpacing: .7, flex: 1 },
  editTimeInput: { width: 80, borderWidth: 1, borderColor: "#3A313E", backgroundColor: "#121014", borderRadius: 8, color: COLORS.plum, fontSize: 13, paddingHorizontal: 7, paddingVertical: 6, textAlign: "center" },
  pickTimeButton: { borderRadius: 8, borderWidth: 1, borderColor: "#6B5A82", backgroundColor: "#21182A", paddingHorizontal: 8, paddingVertical: 8 },
  pickTimeText: { color: "#D7BCEB", fontSize: 9, fontWeight: "900", letterSpacing: .6 },
  nativePickerWrap: { borderRadius: 10, overflow: "hidden", backgroundColor: "#18131B", borderWidth: 1, borderColor: "#3A313E" },
  nativePickerDone: { alignSelf: "flex-end", margin: 8, borderRadius: 8, backgroundColor: "#342743", paddingHorizontal: 13, paddingVertical: 8 },
  nativePickerDoneText: { color: COLORS.plum, fontSize: 11, fontWeight: "900" },
  editTextInput: { minHeight: 66, borderRadius: 10, borderWidth: 1, borderColor: "#3A313E", backgroundColor: "#121014", padding: 10, color: COLORS.plum, textAlignVertical: "top", fontSize: 14 },
  editStyleRow: { flexDirection: "row", gap: 8 },
  editEmojiInput: { width: 48, borderWidth: 1, borderColor: "#3A313E", backgroundColor: "#121014", borderRadius: 9, color: COLORS.plum, fontSize: 18, textAlign: "center", paddingHorizontal: 5, paddingVertical: 6 },
  editLabelInput: { flex: 1, borderWidth: 1, borderColor: "#3A313E", backgroundColor: "#121014", borderRadius: 9, color: COLORS.plum, fontSize: 13, paddingHorizontal: 10, paddingVertical: 6 },
  editColorRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  editColorSwatch: { width: 25, height: 25, borderRadius: 13, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "transparent" },
  editActions: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  cancelEditButton: { borderRadius: 9, borderWidth: 1, borderColor: "#584E5C", paddingHorizontal: 12, paddingVertical: 8 },
  cancelEditText: { color: COLORS.slate, fontSize: 11, fontWeight: "900" },
  saveEditButton: { borderRadius: 9, paddingHorizontal: 12, paddingVertical: 8 },
  saveEditText: { color: COLORS.white, fontSize: 11, fontWeight: "900" },
  empty: { paddingVertical: 30, paddingHorizontal: 22, alignItems: "center", borderTopWidth: 1, borderTopColor: "#2B252F", marginTop: 15 },
  emptyMark: { color: COLORS.orchid, fontSize: 27, lineHeight: 29 },
  emptyTitle: { color: COLORS.plum, fontWeight: "800", fontSize: 18, marginTop: 6 },
  emptyCopy: { color: COLORS.slate, fontSize: 13, lineHeight: 19, textAlign: "center", marginTop: 5, maxWidth: 340 },
});
