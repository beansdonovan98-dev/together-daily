import { AppFrame } from "@/components/app-frame";
import { PrivateGate } from "@/components/together-access";
import { COLORS, asObject, dateTimeLabel, localDateKey, prettyDate } from "@/lib/together";
import { PARTNERS, type PartnerId, useLocalJournal } from "@/lib/local-journal";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type EventStyle = { id: string; label: string; emoji: string; color: string };
type TimelineEntry = { id: string; text: string; type: string; emoji?: string; color?: string; authorId: PartnerId; createdAt: string };

const EVENT_STYLES: EventStyle[] = [
  { id: "together", label: "Together", emoji: "♥", color: COLORS.rose },
  { id: "plan", label: "Plan", emoji: "✦", color: COLORS.gold },
  { id: "feeling", label: "Feeling", emoji: "☁", color: "#92B9D8" },
  { id: "memory", label: "Memory", emoji: "❋", color: COLORS.sage },
  { id: "shower", label: "Shower / Freshen Up", emoji: "🚿", color: "#66B7DD" },
  { id: "meal", label: "Meal", emoji: "🍽", color: "#E6A267" },
  { id: "rest", label: "Rest", emoji: "🌙", color: "#B69AE8" },
];

const CUSTOM_COLORS = [
  { name: "Rose", value: COLORS.rose },
  { name: "Gold", value: COLORS.gold },
  { name: "Sky", value: "#66B7DD" },
  { name: "Sage", value: COLORS.sage },
  { name: "Orchid", value: COLORS.orchid },
  { name: "Peach", value: "#E6A267" },
];

function getEventStyle(entry: TimelineEntry): EventStyle {
  const saved = EVENT_STYLES.find((style) => style.label === entry.type);
  return {
    id: saved?.id ?? "saved",
    label: entry.type || "Moment",
    emoji: entry.emoji || saved?.emoji || "✦",
    color: entry.color || saved?.color || COLORS.orchid,
  };
}

export default function SharedLogScreen() {
  return <PrivateGate>{({ userId }) => <TimelineScreen userId={userId} />}</PrivateGate>;
}

function TimelineScreen({ userId }: { userId: PartnerId }) {
  const params = useLocalSearchParams<{ date?: string }>();
  const today = localDateKey();
  const date = typeof params.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : today;
  const { getDay, updateDay, roomCode, isSyncing, ensureDay } = useLocalJournal();
  const [draft, setDraft] = useState("");
  const [selectedStyleId, setSelectedStyleId] = useState("together");
  const [customLabel, setCustomLabel] = useState("Custom moment");
  const [customEmoji, setCustomEmoji] = useState("✦");
  const [customColor, setCustomColor] = useState(COLORS.orchid);

  useEffect(() => { ensureDay(date); }, [date, ensureDay]);

  const content = asObject(getDay(date));
  const entries = useMemo(
    () => (Array.isArray(content.timelineEvents) ? [...content.timelineEvents] : []).sort((a: TimelineEntry, b: TimelineEntry) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) as TimelineEntry[],
    [content.timelineEvents],
  );
  const me = PARTNERS[userId];
  const activeStyle = selectedStyleId === "custom"
    ? { id: "custom", label: customLabel.trim() || "Custom moment", emoji: customEmoji.trim() || "✦", color: customColor }
    : EVENT_STYLES.find((style) => style.id === selectedStyleId) ?? EVENT_STYLES[0];

  const addEvent = () => {
    const text = draft.trim();
    if (!text) return;
    const current = Array.isArray(content.timelineEvents) ? content.timelineEvents : [];
    updateDay(date, {
      timelineEvents: [...current, {
        id: `timeline-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        text,
        type: activeStyle.label,
        emoji: activeStyle.emoji,
        color: activeStyle.color,
        authorId: userId,
        createdAt: new Date().toISOString(),
      }],
    }, "daily-log");
    setDraft("");
  };

  return <AppFrame><ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
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
      <View style={styles.quickLine}><Text style={styles.quickDot}>●</Text><Text style={styles.quickText}>Choose an event style, or make your own emoji and color for the moment.</Text></View>
    </View>

    <View style={styles.stream}>
      <View style={styles.streamTop}><View style={styles.sectionLead}><View style={[styles.sectionIcon, { backgroundColor: "#21142B" }]}><Text style={[styles.sectionIconText, { color: COLORS.orchid }]}>◷</Text></View><View style={styles.sectionLeadText}><Text style={styles.sectionTitle}>Log</Text><Text style={styles.sectionSub}>Timeline stream · add as often as you want</Text></View></View><View style={styles.liveTag}><View style={styles.liveDot}/><Text style={styles.liveText}>LIVE</Text></View></View>

      <View style={[styles.composer, { borderColor: me.color }]}>
        <View style={styles.composerHeader}><View style={[styles.authorBadge, { backgroundColor: me.soft }]}><Text style={[styles.authorBadgeText, { color: me.color }]}>{userId === "beans" ? "♛ Beans" : "♥ Princess"}</Text></View><Text style={styles.composerTime}>NOW</Text></View>
        <TextInput value={draft} onChangeText={setDraft} placeholder="What’s happening right now?" placeholderTextColor="#7F7582" multiline style={styles.input}/>
        <View style={styles.composerFooter}>
          <Text style={styles.stylePrompt}>CHOOSE THE MOMENT’S LOOK</Text>
          <View style={styles.typeRow}>{EVENT_STYLES.map((style) => <EventStyleButton key={style.id} styleOption={style} selected={selectedStyleId === style.id} onPress={() => setSelectedStyleId(style.id)} />)}<EventStyleButton styleOption={{ id: "custom", label: "Custom", emoji: customEmoji || "✦", color: customColor }} selected={selectedStyleId === "custom"} onPress={() => setSelectedStyleId("custom")} /></View>
          {selectedStyleId === "custom" ? <View style={styles.customPanel}>
            <Text style={styles.customTitle}>Make this event yours</Text>
            <View style={styles.customInputRow}>
              <TextInput value={customEmoji} onChangeText={(value) => setCustomEmoji(value.slice(0, 4))} placeholder="✦" placeholderTextColor="#7F7582" style={styles.emojiInput} maxLength={4} accessibilityLabel="Custom event emoji" />
              <TextInput value={customLabel} onChangeText={setCustomLabel} placeholder="Name this event" placeholderTextColor="#7F7582" style={styles.labelInput} maxLength={28} accessibilityLabel="Custom event label" />
            </View>
            <Text style={styles.colorPrompt}>PICK A COLOR</Text>
            <View style={styles.colorRow}>{CUSTOM_COLORS.map((option) => <TouchableOpacity key={option.name} accessibilityRole="button" accessibilityLabel={`${option.name} color`} onPress={() => setCustomColor(option.value)} style={[styles.colorSwatch, { backgroundColor: option.value }, customColor === option.value && styles.colorSwatchActive]}><Text style={styles.colorSwatchLabel}>{customColor === option.value ? "✓" : ""}</Text></TouchableOpacity>)}</View>
          </View> : null}
          <TouchableOpacity onPress={addEvent} style={[styles.addButton, { backgroundColor: me.color }]}><Text style={styles.addButtonText}>+ Add {activeStyle.emoji} Event</Text></TouchableOpacity>
        </View>
      </View>

      {entries.length ? <View style={styles.entries}>{entries.map((entry) => {
        const author = PARTNERS[entry.authorId];
        const style = getEventStyle(entry);
        return <View key={entry.id} style={[styles.entry, { borderColor: style.color, borderLeftColor: author.color }]}>
          <View style={styles.entryMeta}><Text style={[styles.timePill, { color: author.color }]}>{dateTimeLabel(entry.createdAt)}</Text><View style={[styles.category, { backgroundColor: `${style.color}20`, borderColor: style.color }]}><Text style={[styles.categoryText, { color: style.color }]}>{style.emoji} {style.label}</Text></View><View style={[styles.partnerPill, { backgroundColor: author.soft }]}><Text style={[styles.partnerPillText, { color: author.color }]}>{entry.authorId === "beans" ? "♛ Beans" : "♥ Princess"}</Text></View></View>
          <Text style={[styles.entryTitle, { color: author.color }]}>{entry.text}</Text>
        </View>;
      })}</View> : <View style={styles.empty}><Text style={styles.emptyMark}>+</Text><Text style={styles.emptyTitle}>Start the stream.</Text><Text style={styles.emptyCopy}>A moment, a plan, a feeling, a shower, or a little memory can go here whenever it happens.</Text></View>}
    </View>
  </ScrollView></AppFrame>;
}

function EventStyleButton({ styleOption, selected, onPress }: { styleOption: EventStyle; selected: boolean; onPress: () => void }) {
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${styleOption.label} event style`} onPress={onPress} style={[styles.typePill, selected && { borderColor: styleOption.color, backgroundColor: `${styleOption.color}24` }]}><Text style={[styles.typeText, selected && { color: styleOption.color }]}>{styleOption.emoji} {styleOption.label}</Text></TouchableOpacity>;
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
  typeText: { color: COLORS.slate, fontSize: 11, fontWeight: "800" },
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
  empty: { paddingVertical: 30, paddingHorizontal: 22, alignItems: "center", borderTopWidth: 1, borderTopColor: "#2B252F", marginTop: 15 },
  emptyMark: { color: COLORS.orchid, fontSize: 27, lineHeight: 29 },
  emptyTitle: { color: COLORS.plum, fontWeight: "800", fontSize: 18, marginTop: 6 },
  emptyCopy: { color: COLORS.slate, fontSize: 13, lineHeight: 19, textAlign: "center", marginTop: 5, maxWidth: 340 },
});
