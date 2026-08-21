import { AppFrame } from "@/components/app-frame";
import { PrivateGate } from "@/components/together-access";
import { COLORS, asObject, localDateKey } from "@/lib/together";
import { PARTNERS, type PartnerId, useLocalJournal } from "@/lib/local-journal";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const PROMPTS = [
  "What would help you feel wanted and relaxed this week?",
  "What kind of affectionate surprise would feel fun to receive?",
  "What is one thing you would love more of—emotionally or physically—when we have quiet time?",
  "What helps you feel safe, heard, and connected before we get playful?",
];

export default function SteamyScreen() { return <PrivateGate>{({ userId }) => <SteamyContent userId={userId} />}</PrivateGate>; }

function SteamyContent({ userId }: { userId: PartnerId }) {
  const date = localDateKey();
  const { getDay, updateDay, records, addRecord } = useLocalJournal();
  const [revealed, setRevealed] = useState(false);
  const [note, setNote] = useState("");
  const [preference, setPreference] = useState("");
  const [promptIndex, setPromptIndex] = useState(0);
  const content = asObject(getDay(date));
  const steamy = asObject(content.steamy);
  const preferences = asObject(steamy.preferences);
  const partner = PARTNERS[userId];
  const privateNotes = records.filter((record) => record.recordType === "intimacy").slice(-4).reverse();
  const currentPreference = String(preferences[userId] ?? "");
  const savePreference = () => { if (!preference.trim()) return; updateDay(date, { steamy: { ...steamy, preferences: { ...preferences, [userId]: preference.trim() } } }); setPreference(""); };
  const addPrivateNote = () => { if (!note.trim()) return; addRecord("intimacy", { text: note.trim(), prompt: PROMPTS[promptIndex], date, label: "private note" }); setNote(""); };
  if (!revealed) return <AppFrame><ScrollView contentContainerStyle={styles.page}><View style={styles.safeCard}><Text style={styles.safeMark}>♥</Text><Text style={styles.eyebrow}>PRIVATE · BEANS + PRINCESS</Text><Text style={styles.safeTitle}>Steamy</Text><Text style={styles.safeCopy}>This optional space is just for the two of you. Start with comfort, consent, and a shared yes.</Text><TouchableOpacity style={styles.revealButton} onPress={() => setRevealed(true)}><Text style={styles.revealButtonText}>Tap to reveal</Text></TouchableOpacity><Text style={styles.safeHint}>Safe mode is on. Nothing private is shown until you choose.</Text></View></ScrollView></AppFrame>;
  return <AppFrame><ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><View><Text style={styles.eyebrow}>PRIVATE · BEANS + PRINCESS</Text><Text style={styles.title}>Steamy</Text><Text style={styles.subtitle}>A shared, opt-in space for closeness and playful connection.</Text></View><TouchableOpacity style={styles.safeToggle} onPress={() => setRevealed(false)}><Text style={styles.safeToggleText}>Safe mode on</Text></TouchableOpacity></View>
    <View style={styles.consent}><Text style={styles.consentIcon}>✓</Text><Text style={styles.consentText}>Only add what you are both comfortable sharing. A clear “not today” is always welcome.</Text></View>
    <View style={styles.card}><Text style={styles.cardKicker}>OPT-IN PROMPT</Text><Text style={styles.prompt}>{PROMPTS[promptIndex]}</Text><TouchableOpacity style={styles.outline} onPress={() => setPromptIndex((promptIndex + 1) % PROMPTS.length)}><Text style={styles.outlineText}>Another prompt</Text></TouchableOpacity></View>
    <View style={[styles.card, { borderColor: partner.color }]}><View style={styles.cardHeading}><View style={[styles.partnerBadge, { backgroundColor: partner.soft }]}><Text style={[styles.partnerBadgeText, { color: partner.color }]}>{userId === "beans" ? "♛ Beans" : "♥ Princess"}</Text></View><Text style={styles.privateLabel}>YOUR PREFERENCE</Text></View>{currentPreference ? <Text style={styles.savedPreference}>{currentPreference}</Text> : <><TextInput value={preference} onChangeText={setPreference} placeholder="Share a comfort, boundary, or something you would enjoy…" placeholderTextColor="#7F7582" multiline style={styles.textArea} /><TouchableOpacity style={[styles.partnerButton, { backgroundColor: partner.color }]} onPress={savePreference}><Text style={styles.partnerButtonText}>Save my preference</Text></TouchableOpacity></>}</View>
    <View style={styles.card}><Text style={styles.cardTitle}>Shared private notes</Text><Text style={styles.copy}>Leave a little message for your partner. These stay in your shared private room.</Text><TextInput value={note} onChangeText={setNote} placeholder="A private thought for us…" placeholderTextColor="#7F7582" multiline style={styles.textArea} /><TouchableOpacity style={styles.goldButton} onPress={addPrivateNote}><Text style={styles.goldButtonText}>Leave a private note</Text></TouchableOpacity>{privateNotes.length ? <View style={styles.noteList}>{privateNotes.map((record) => { const author = PARTNERS[record.authorId as PartnerId]; return <View key={record.id} style={styles.note}><View style={styles.noteHeader}><Text style={[styles.noteAuthor, { color: author.color }]}>{record.authorId === "beans" ? "♛ Beans" : "♥ Princess"}</Text><Text style={styles.notePrivate}>PRIVATE</Text></View><Text style={styles.noteText}>{String(record.content.text ?? "")}</Text></View>; })}</View> : <View style={styles.emptyNote}><Text style={styles.emptyNoteText}>Your first private note will appear here.</Text></View>}</View>
  </ScrollView></AppFrame>;
}

const styles = StyleSheet.create({
  page: { padding: 18, paddingBottom: 36, gap: 16, backgroundColor: COLORS.blush, flexGrow: 1 },
  safeCard: { flex: 1, minHeight: 580, backgroundColor: "#160B10", borderRadius: 24, borderWidth: 1, borderColor: "#60243D", padding: 28, alignItems: "center", justifyContent: "center" },
  safeMark: { color: COLORS.rose, fontSize: 44, marginBottom: 10 }, eyebrow: { color: COLORS.rose, fontSize: 10, letterSpacing: 1.3, fontWeight: "900" },
  safeTitle: { color: COLORS.plum, fontSize: 42, fontWeight: "900", fontStyle: "italic", marginTop: 4 }, safeCopy: { color: COLORS.slate, fontFamily: "monospace", fontSize: 14, lineHeight: 22, textAlign: "center", maxWidth: 350, marginTop: 10 },
  revealButton: { backgroundColor: COLORS.rose, marginTop: 24, paddingVertical: 13, paddingHorizontal: 20, borderRadius: 12 }, revealButtonText: { color: "#FFFFFF", fontWeight: "900", fontSize: 15 }, safeHint: { color: "#B39BA7", fontSize: 11, fontFamily: "monospace", marginTop: 16, textAlign: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginTop: 4 }, title: { color: COLORS.plum, fontSize: 34, fontWeight: "900", fontStyle: "italic", marginTop: -2 }, subtitle: { color: COLORS.slate, fontFamily: "monospace", fontSize: 12, lineHeight: 18, marginTop: 2, maxWidth: 270 },
  safeToggle: { paddingVertical: 9, paddingHorizontal: 11, borderRadius: 10, borderWidth: 1, borderColor: "#6B2D45", backgroundColor: "#210F17" }, safeToggleText: { color: "#F08AA9", fontSize: 11, fontWeight: "900" },
  consent: { backgroundColor: "#1A1418", borderWidth: 1, borderColor: "#49313B", borderRadius: 14, padding: 13, flexDirection: "row", gap: 9, alignItems: "flex-start" }, consentIcon: { color: COLORS.sage, fontSize: 16, fontWeight: "900" }, consentText: { color: "#C8BDC3", fontSize: 13, lineHeight: 19, flex: 1 },
  card: { backgroundColor: "#160B10", borderRadius: 20, borderWidth: 1, borderColor: "#59243A", padding: 18 }, cardKicker: { color: COLORS.rose, fontSize: 10, fontWeight: "900", letterSpacing: 1.1 }, prompt: { color: COLORS.plum, fontSize: 21, lineHeight: 30, fontWeight: "800", fontStyle: "italic", marginTop: 8 },
  outline: { alignSelf: "flex-start", marginTop: 14, borderWidth: 1, borderColor: "#6B4152", borderRadius: 10, paddingVertical: 9, paddingHorizontal: 12, backgroundColor: "#211218" }, outlineText: { color: "#F19AB6", fontSize: 13, fontWeight: "900" },
  cardHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }, partnerBadge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8 }, partnerBadgeText: { fontSize: 11, fontWeight: "900" }, privateLabel: { color: COLORS.slate, fontFamily: "monospace", fontSize: 9, letterSpacing: .8 },
  textArea: { minHeight: 84, marginTop: 13, backgroundColor: "#120B0F", borderWidth: 1, borderColor: "#49313B", borderRadius: 13, color: COLORS.plum, padding: 12, textAlignVertical: "top", fontSize: 14 }, partnerButton: { alignSelf: "flex-start", marginTop: 10, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14 }, partnerButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" }, savedPreference: { color: COLORS.plum, fontStyle: "italic", fontSize: 15, lineHeight: 22, marginTop: 13, backgroundColor: "#211218", borderRadius: 12, padding: 12 },
  cardTitle: { color: COLORS.plum, fontSize: 22, fontWeight: "800", fontStyle: "italic" }, copy: { color: COLORS.slate, fontFamily: "monospace", fontSize: 12, lineHeight: 18, marginTop: 4 }, goldButton: { alignSelf: "flex-start", backgroundColor: COLORS.gold, marginTop: 10, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14 }, goldButtonText: { color: "#1C1014", fontSize: 13, fontWeight: "900" },
  noteList: { gap: 9, marginTop: 14 }, note: { backgroundColor: "#211218", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#49313B" }, noteHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }, noteAuthor: { fontSize: 11, fontWeight: "900" }, notePrivate: { color: "#A89AA1", fontFamily: "monospace", fontSize: 9, letterSpacing: .8 }, noteText: { color: COLORS.plum, fontSize: 14, fontStyle: "italic", lineHeight: 20 }, emptyNote: { backgroundColor: "#211218", borderRadius: 12, padding: 13, marginTop: 14 }, emptyNoteText: { color: COLORS.slate, fontFamily: "monospace", fontSize: 12, fontStyle: "italic" },
});
