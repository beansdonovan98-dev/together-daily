import { AppFrame } from "@/components/app-frame";
import { PrivateGate } from "@/components/together-access";
import { COLORS, asObject, dateTimeLabel, localDateKey, prettyDate } from "@/lib/together";
import { PARTNERS, type PartnerId, useLocalJournal } from "@/lib/local-journal";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const ENTRY_TYPES = ["Moment", "Plan", "Feeling", "Memory"] as const;
type EntryType = (typeof ENTRY_TYPES)[number];
type TimelineEntry = { id: string; text: string; type: EntryType; authorId: PartnerId; createdAt: string };

export default function SharedLogScreen() {
  return <PrivateGate>{({ userId }) => <TimelineContent userId={userId} />}</PrivateGate>;
}

function TimelineContent({ userId }: { userId: PartnerId }) {
  const date = localDateKey();
  const { getDay, updateDay, roomCode, isSyncing } = useLocalJournal();
  const [entry, setEntry] = useState("");
  const [entryType, setEntryType] = useState<EntryType>("Moment");
  const content = asObject(getDay(date));
  const timeline = useMemo(() => {
    const events = Array.isArray(content.timelineEvents) ? content.timelineEvents as TimelineEntry[] : [];
    return [...events].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [content.timelineEvents]);
  const partner = PARTNERS[userId];
  const otherPartner = PARTNERS[userId === "beans" ? "princess" : "beans"];

  const addEntry = () => {
    const text = entry.trim();
    if (!text) return;
    const current = Array.isArray(content.timelineEvents) ? content.timelineEvents : [];
    const event: TimelineEntry = { id: `timeline-${Date.now()}-${Math.random().toString(16).slice(2)}`, text, type: entryType, authorId: userId, createdAt: new Date().toISOString() };
    updateDay(date, { timelineEvents: [...current, event] });
    setEntry("");
  };

  return (
    <AppFrame>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.eyebrow, { color: partner.color }]}>SHARED TIMELINE · {prettyDate(date).toUpperCase()}</Text>
            <Text style={styles.title}>The day, as it happens.</Text>
          </View>
          <View style={[styles.livePill, { backgroundColor: partner.soft }]}>
            <View style={[styles.liveDot, { backgroundColor: isSyncing ? COLORS.gold : partner.color }]} />
            <Text style={[styles.liveText, { color: partner.color }]}>{roomCode ? (isSyncing ? "Syncing" : "Live") : "Local"}</Text>
          </View>
        </View>

        <View style={[styles.composerCard, { borderColor: partner.color }]}>
          <View style={styles.composerHeading}>
            <View style={[styles.partnerMark, { backgroundColor: partner.color }]}><Text style={styles.partnerMarkText}>{partner.avatar}</Text></View>
            <View><Text style={styles.composerTitle}>Add to the timeline</Text><Text style={styles.composerCopy}>{partner.name} · saved with the current time</Text></View>
          </View>
          <TextInput value={entry} onChangeText={setEntry} placeholder="What’s happening right now?" placeholderTextColor="#A399AA" multiline style={styles.textArea} />
          <View style={styles.composerFooter}>
            <View style={styles.typeRow}>{ENTRY_TYPES.map((type) => <TouchableOpacity key={type} style={[styles.typePill, entryType === type && { backgroundColor: partner.soft, borderColor: partner.color }]} onPress={() => setEntryType(type)}><Text style={[styles.typeText, entryType === type && { color: partner.color }]}>{type}</Text></TouchableOpacity>)}</View>
            <TouchableOpacity style={[styles.postButton, { backgroundColor: partner.color }]} onPress={addEntry}><Text style={styles.postButtonText}>Add update</Text></TouchableOpacity>
          </View>
        </View>

        <View style={styles.streamCard}>
          <View style={styles.streamHeading}><Text style={styles.streamTitle}>Today’s stream</Text><Text style={styles.streamCount}>{timeline.length} {timeline.length === 1 ? "update" : "updates"}</Text></View>
          {timeline.length ? <View style={styles.timeline}>{timeline.map((item, index) => {
            const author = PARTNERS[item.authorId] ?? otherPartner;
            return <View key={item.id} style={styles.entryRow}>
              <View style={styles.rail}><View style={[styles.entryDot, { backgroundColor: author.color }]} />{index !== timeline.length - 1 ? <View style={styles.railLine} /> : null}</View>
              <View style={styles.entryContent}>
                <View style={styles.entryMeta}><View style={[styles.authorChip, { backgroundColor: author.soft }]}><View style={[styles.authorChipDot, { backgroundColor: author.color }]} /><Text style={[styles.authorName, { color: author.color }]}>{author.name}</Text></View><Text style={styles.time}>{dateTimeLabel(item.createdAt)}</Text></View>
                <Text style={styles.entryText}>{item.text}</Text>
                <Text style={[styles.entryType, { color: author.color }]}>{item.type}</Text>
              </View>
            </View>;
          })}</View> : <View style={styles.emptyState}><View style={[styles.emptyDot, { backgroundColor: partner.soft }]}><Text style={[styles.emptyDotText, { color: partner.color }]}>+</Text></View><Text style={styles.emptyTitle}>Your day starts here.</Text><Text style={styles.emptyCopy}>Add a quick moment whenever something worth remembering, planning, or sharing happens.</Text></View>}
        </View>
      </ScrollView>
    </AppFrame>
  );
}

const styles = StyleSheet.create({
  page: { padding: 20, paddingBottom: 38, gap: 16, backgroundColor: COLORS.blush },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  eyebrow: { fontWeight: "800", fontSize: 10, letterSpacing: 1.1, marginBottom: 5 },
  title: { color: COLORS.plum, fontWeight: "800", fontSize: 28, lineHeight: 34 },
  livePill: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 16, flexDirection: "row", alignItems: "center", gap: 6 },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  liveText: { fontSize: 12, fontWeight: "800" },
  composerCard: { backgroundColor: COLORS.white, borderRadius: 24, padding: 18, borderWidth: 1.5, shadowColor: COLORS.plum, shadowOpacity: 0.04, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  composerHeading: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 13 },
  partnerMark: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  partnerMarkText: { color: COLORS.white, fontSize: 14, fontWeight: "900" },
  composerTitle: { color: COLORS.plum, fontWeight: "800", fontSize: 17 },
  composerCopy: { color: COLORS.slate, fontSize: 12, marginTop: 2 },
  textArea: { minHeight: 80, borderColor: COLORS.border, borderWidth: 1, borderRadius: 14, padding: 12, color: COLORS.plum, textAlignVertical: "top", fontSize: 15, backgroundColor: "#FFFDFF" },
  composerFooter: { gap: 12, marginTop: 12 },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  typePill: { paddingVertical: 7, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: "#E8DEE9", backgroundColor: "#FFF" },
  typeText: { color: COLORS.slate, fontSize: 12, fontWeight: "800" },
  postButton: { minHeight: 43, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  postButtonText: { color: COLORS.white, fontSize: 14, fontWeight: "800" },
  streamCard: { backgroundColor: COLORS.white, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: "#F0E8F1" },
  streamHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: "#F3EDF5" },
  streamTitle: { color: COLORS.plum, fontWeight: "800", fontSize: 19 },
  streamCount: { color: COLORS.slate, fontSize: 12, fontWeight: "700" },
  timeline: { paddingTop: 18 },
  entryRow: { flexDirection: "row", minHeight: 95 },
  rail: { width: 25, alignItems: "center" },
  entryDot: { width: 12, height: 12, borderRadius: 6, marginTop: 6, zIndex: 2, borderWidth: 2, borderColor: COLORS.white },
  railLine: { width: 2, backgroundColor: "#E9E0EC", flex: 1, marginTop: -1 },
  entryContent: { flex: 1, paddingLeft: 5, paddingBottom: 20 },
  entryMeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  authorChip: { borderRadius: 11, paddingVertical: 4, paddingHorizontal: 8, flexDirection: "row", alignItems: "center", gap: 5 },
  authorChipDot: { width: 6, height: 6, borderRadius: 3 },
  authorName: { fontSize: 11, fontWeight: "900" },
  time: { color: COLORS.slate, fontSize: 12, fontWeight: "700" },
  entryText: { color: COLORS.plum, fontSize: 15, lineHeight: 22, marginTop: 8 },
  entryType: { fontSize: 11, fontWeight: "800", marginTop: 7 },
  emptyState: { alignItems: "center", paddingVertical: 34, paddingHorizontal: 22 },
  emptyDot: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  emptyDotText: { fontSize: 26, lineHeight: 29 },
  emptyTitle: { color: COLORS.plum, fontSize: 18, fontWeight: "800" },
  emptyCopy: { color: COLORS.slate, fontSize: 14, lineHeight: 20, textAlign: "center", marginTop: 6, maxWidth: 340 },
});
