import { AppFrame } from "@/components/app-frame";
import { PrivateGate } from "@/components/together-access";
import { COLORS, asObject, localDateKey, prettyDate } from "@/lib/together";
import { PARTNERS, useLocalJournal } from "@/lib/local-journal";
import { useEffect, useMemo, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const AFFECTION = [
  { key: "hugs", icon: "🤗", label: "Hugs" },
  { key: "kisses", icon: "💋", label: "Kisses" },
  { key: "loveYew", icon: "♥", label: "I love yew" },
] as const;

type ArchiveDay = Record<string, any> & { date: string };

export default function PastDaysScreen() {
  return <PrivateGate>{() => <PastDaysContent />}</PrivateGate>;
}

function PastDaysContent() {
  const today = localDateKey();
  const { ready, allDays, ensureDay, media } = useLocalJournal();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    if (ready) ensureDay(today);
  }, [ensureDay, ready, today]);

  const pages = useMemo(() => [...allDays].sort((a, b) => String(b.date).localeCompare(String(a.date))) as ArchiveDay[], [allDays]);
  const pastDays = pages.filter((day) => day.date !== today);
  const selectedDay = pages.find((day) => day.date === selectedDate);

  if (selectedDay) {
    return <ArchivedDayDetail day={selectedDay} media={media.filter((item) => item.dailyDate === selectedDay.date && item.kind !== "private")} onBack={() => setSelectedDate(null)} />;
  }

  return <AppFrame><ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
    <Text style={styles.eyebrow}>OUR ARCHIVE</Text>
    <Text style={styles.title}>Past Days</Text>
    <Text style={styles.copy}>Open any previous date to revisit its log, love notes, meals, to-dos, habits, and photos. Nothing is cleared from your history.</Text>

    <View style={styles.todayCard}>
      <View><Text style={styles.todayKicker}>TODAY IS A FRESH PAGE</Text><Text style={styles.todayText}>{prettyDate(today)}</Text></View>
      <Text style={styles.todayMark}>✦</Text>
    </View>

    <Text style={styles.sectionLabel}>PAST DAYS</Text>
    {pastDays.length ? <View style={styles.list}>{pastDays.map((day) => <PastDayCard key={day.date} day={day} onPress={() => setSelectedDate(day.date)} />)}</View> : <View style={styles.empty}><Text style={styles.emptyMark}>⌛</Text><Text style={styles.emptyTitle}>Your archive will grow here.</Text><Text style={styles.emptyText}>When tomorrow starts, today’s page will be saved here automatically.</Text></View>}
  </ScrollView></AppFrame>;
}

function PastDayCard({ day, onPress }: { day: ArchiveDay; onPress: () => void }) {
  const timeline = Array.isArray(day.timelineEvents) ? day.timelineEvents : [];
  const loveNotes = Object.values(asObject(day.loveNotes)).filter(Boolean).length;
  const todos = Array.isArray(day.todos) ? day.todos : [];
  const completed = todos.filter((item: any) => item?.completed).length;
  const photos = Array.isArray(day.photos) ? day.photos.length : 0;
  const date = new Date(`${day.date}T12:00:00`);

  return <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Open ${prettyDate(day.date)}`} onPress={onPress} style={styles.dayCard}>
    <View style={styles.dayDate}><Text style={styles.dayMonth}>{date.toLocaleDateString("en-US", { month: "short" }).toUpperCase()}</Text><Text style={styles.dayNumber}>{date.getDate()}</Text></View>
    <View style={styles.dayCopy}><Text style={styles.dayTitle}>{prettyDate(day.date)}</Text><Text style={styles.dayMeta}>{timeline.length} log {timeline.length === 1 ? "entry" : "entries"} · {loveNotes}/2 notes</Text><Text style={styles.daySubMeta}>{completed}/{todos.length} to-dos · {photos} photos</Text></View>
    <Text style={styles.dayArrow}>›</Text>
  </TouchableOpacity>;
}

function ArchivedDayDetail({ day, media, onBack }: { day: ArchiveDay; media: ReturnType<typeof useLocalJournal>["media"]; onBack: () => void }) {
  const timeline = Array.isArray(day.timelineEvents) ? [...day.timelineEvents] : [];
  const loveNotes = asObject(day.loveNotes);
  const meals = asObject(day.meals);
  const todos = Array.isArray(day.todos) ? day.todos : [];
  const affection = asObject(day.affection);
  const habits = asObject(day.habits);
  const habitChecks = asObject(habits.checks);
  const habitList = Array.isArray(habits.list) ? habits.list as string[] : [];
  const cover = asObject(day.coverPhoto);
  const questionResponses = asObject(day.checkIns);
  const sharedNotes = String(day.sharedNotes ?? "").trim();
  const sharedHighlight = String(day.sharedHighlight ?? "").trim();

  return <AppFrame><ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Back to Past Days" style={styles.backButton} onPress={onBack}><Text style={styles.backText}>← PAST DAYS</Text></TouchableOpacity>
    <Text style={styles.eyebrow}>SAVED DAY</Text>
    <Text style={styles.detailTitle}>{prettyDate(day.date)}</Text>
    <Text style={styles.copy}>A complete read-only snapshot of this day together.</Text>

    {cover.url ? <Image source={{ uri: String(cover.url) }} style={styles.coverImage} /> : null}

    {sharedHighlight ? <ArchiveCard title="Shared Highlight" accent={COLORS.gold}><Text style={styles.highlightText}>{sharedHighlight}</Text></ArchiveCard> : null}

    <ArchiveCard title="Daily Log" meta={`${timeline.length} entries`}>
      {timeline.length ? <View style={styles.timelineList}>{timeline.map((entry: any) => { const author = entry?.authorId === "princess" ? PARTNERS.princess : PARTNERS.beans; return <View key={String(entry?.id ?? `${entry?.createdAt}-${entry?.text}`)} style={styles.timelineEntry}><View style={styles.entryHeader}><Text style={[styles.entryAuthor, { color: author.color }]}>{entry?.authorId === "princess" ? "♥ Princess" : "♛ Beans"}</Text><Text style={styles.entryType}>{String(entry?.type ?? "Moment").toUpperCase()}</Text></View><Text style={styles.entryText}>{String(entry?.text ?? "")}</Text></View>; })}</View> : <EmptyArchiveText text="No timeline entries were saved on this day." />}
    </ArchiveCard>

    <ArchiveCard title="Love Notes" meta={`${Object.values(loveNotes).filter(Boolean).length}/2 saved`}>
      <View style={styles.noteGrid}>{(["beans", "princess"] as const).map((partnerId) => { const partner = PARTNERS[partnerId]; const note = String(loveNotes[partnerId] ?? ""); return <View key={partnerId} style={[styles.noteCard, { borderColor: partner.color }]}><Text style={[styles.noteAuthor, { color: partner.color }]}>{partnerId === "beans" ? "♛ BEANS" : "♥ PRINCESS"}</Text><Text style={styles.noteText}>{note || "No note saved."}</Text></View>; })}</View>
    </ArchiveCard>

    <ArchiveCard title="Meals">
      <View style={styles.mealList}>{(["breakfast", "lunch", "dinner"] as const).map((meal) => { const label = meal.slice(0, 1).toUpperCase() + meal.slice(1); const done = Boolean(meals[`${meal}Done`]); return <View key={meal} style={styles.mealRow}><Text style={styles.mealLabel}>{label}</Text><Text style={[styles.mealValue, !meals[meal] && styles.mutedValue]}>{String(meals[meal] || "Not planned")}</Text><Text style={[styles.mealDone, done && styles.mealDoneActive]}>{done ? "✓" : "—"}</Text></View>; })}</View>
    </ArchiveCard>

    <ArchiveCard title="Shared To-Dos" meta={`${todos.filter((item: any) => item?.completed).length}/${todos.length} complete`}>
      {todos.length ? <View style={styles.todoList}>{todos.map((todo: any) => <View key={String(todo?.id ?? todo?.text)} style={styles.todoRow}><Text style={[styles.todoCheck, todo?.completed && styles.todoCheckDone]}>{todo?.completed ? "✓" : "○"}</Text><Text style={[styles.todoText, todo?.completed && styles.todoTextDone]}>{String(todo?.text ?? "")}</Text></View>)}</View> : <EmptyArchiveText text="No shared to-dos were saved on this day." />}
    </ArchiveCard>

    <ArchiveCard title="Good Habits & Affection">
      <View style={styles.affectionGrid}>{AFFECTION.map((goal) => <View key={goal.key} style={styles.affectionStat}><Text style={styles.affectionIcon}>{goal.icon}</Text><Text style={styles.affectionCount}>{Math.max(0, Math.min(6, Number(affection[goal.key] ?? 0)))}/6</Text><Text style={styles.affectionLabel}>{goal.label}</Text></View>)}</View>
      {habitList.length ? <View style={styles.habitList}>{habitList.map((habit) => { const check = asObject(habitChecks[habit]); return <View key={habit} style={styles.habitRow}><Text style={styles.habitText}>{habit}</Text><Text style={[styles.habitPartner, { color: PARTNERS.beans.color }]}>{check.beans ? "B ✓" : "B —"}</Text><Text style={[styles.habitPartner, { color: PARTNERS.princess.color }]}>{check.princess ? "P ✓" : "P —"}</Text></View>; })}</View> : null}
    </ArchiveCard>

    {sharedNotes || Object.keys(questionResponses).length ? <ArchiveCard title="Shared Reflections"><Text style={styles.reflectionText}>{sharedNotes || "Saved answers are available for this day."}</Text></ArchiveCard> : null}

    <ArchiveCard title="Photos" meta={`${media.length} saved`}>
      {media.length ? <View style={styles.photoGrid}>{media.map((item) => <View key={item.id} style={styles.photoWrap}><Image source={{ uri: item.url }} style={styles.photo} /><Text numberOfLines={1} style={styles.photoCaption}>{item.caption || "Memory"}</Text></View>)}</View> : <EmptyArchiveText text="No photos were saved on this day." />}
    </ArchiveCard>
  </ScrollView></AppFrame>;
}

function ArchiveCard({ title, meta, accent, children }: { title: string; meta?: string; accent?: string; children: React.ReactNode }) {
  return <View style={[styles.archiveCard, accent && { borderColor: accent }]}><View style={styles.cardHeader}><Text style={styles.cardTitle}>{title}</Text>{meta ? <Text style={styles.cardMeta}>{meta}</Text> : null}</View>{children}</View>;
}

function EmptyArchiveText({ text }: { text: string }) {
  return <Text style={styles.emptyArchiveText}>{text}</Text>;
}

const styles = StyleSheet.create({
  page: { padding: 18, paddingBottom: 42, gap: 14, backgroundColor: COLORS.blush },
  eyebrow: { color: COLORS.gold, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  title: { color: COLORS.plum, fontSize: 32, fontWeight: "900", fontStyle: "italic", marginTop: -7 },
  detailTitle: { color: COLORS.plum, fontSize: 30, fontWeight: "900", fontStyle: "italic", marginTop: -7 },
  copy: { color: COLORS.slate, fontFamily: "monospace", fontSize: 12, lineHeight: 19, maxWidth: 540 },
  todayCard: { backgroundColor: "#21142B", borderRadius: 19, borderWidth: 1, borderColor: "#67417E", padding: 17, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  todayKicker: { color: COLORS.gold, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  todayText: { color: COLORS.plum, fontSize: 20, fontWeight: "800", fontStyle: "italic", marginTop: 4 },
  todayMark: { color: COLORS.orchid, fontSize: 25 },
  sectionLabel: { color: COLORS.slate, fontFamily: "monospace", fontSize: 10, fontWeight: "900", letterSpacing: 1.1, marginTop: 5 },
  list: { gap: 9 },
  dayCard: { backgroundColor: COLORS.ink, borderRadius: 16, borderWidth: 1, borderColor: "#35273D", padding: 13, flexDirection: "row", alignItems: "center", gap: 12 },
  dayDate: { width: 49, height: 49, borderRadius: 12, backgroundColor: COLORS.surface, alignItems: "center", justifyContent: "center" },
  dayMonth: { color: COLORS.gold, fontSize: 9, fontWeight: "900", letterSpacing: .8 },
  dayNumber: { color: COLORS.plum, fontSize: 20, fontWeight: "900", lineHeight: 22 },
  dayCopy: { flex: 1 },
  dayTitle: { color: COLORS.plum, fontSize: 16, fontWeight: "800", fontStyle: "italic" },
  dayMeta: { color: COLORS.slate, fontFamily: "monospace", fontSize: 10, marginTop: 4 },
  daySubMeta: { color: "#827888", fontFamily: "monospace", fontSize: 9, marginTop: 2 },
  dayArrow: { color: COLORS.orchid, fontSize: 27 },
  empty: { backgroundColor: COLORS.ink, borderRadius: 16, padding: 22, borderWidth: 1, borderColor: "#35273D", alignItems: "center" },
  emptyMark: { color: COLORS.orchid, fontSize: 25 },
  emptyTitle: { color: COLORS.plum, fontSize: 17, fontWeight: "900", marginTop: 5 },
  emptyText: { color: COLORS.slate, fontFamily: "monospace", fontSize: 11, lineHeight: 17, textAlign: "center", marginTop: 5 },
  backButton: { alignSelf: "flex-start", borderWidth: 1, borderColor: "#4B3D55", borderRadius: 9, paddingHorizontal: 10, paddingVertical: 7 },
  backText: { color: COLORS.gold, fontSize: 10, fontWeight: "900", letterSpacing: .8 },
  coverImage: { width: "100%", height: 180, borderRadius: 18, backgroundColor: COLORS.surface },
  archiveCard: { backgroundColor: COLORS.ink, borderRadius: 18, borderWidth: 1, borderColor: "#35273D", padding: 14, gap: 11 },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  cardTitle: { color: COLORS.plum, fontSize: 18, fontWeight: "900", fontStyle: "italic" },
  cardMeta: { color: COLORS.gold, fontFamily: "monospace", fontSize: 9, fontWeight: "900" },
  highlightText: { color: COLORS.plum, fontSize: 15, lineHeight: 22, fontStyle: "italic" },
  timelineList: { gap: 9 },
  timelineEntry: { padding: 11, backgroundColor: "#151217", borderRadius: 11, borderWidth: 1, borderColor: "#2F2734" },
  entryHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  entryAuthor: { fontSize: 10, fontWeight: "900" },
  entryType: { color: COLORS.slate, fontSize: 8, letterSpacing: .8, fontWeight: "900" },
  entryText: { color: COLORS.plum, fontSize: 14, lineHeight: 20, marginTop: 6 },
  noteGrid: { gap: 8 },
  noteCard: { borderRadius: 11, borderWidth: 1, backgroundColor: "#151217", padding: 11 },
  noteAuthor: { fontSize: 9, fontWeight: "900", letterSpacing: .8 },
  noteText: { color: COLORS.plum, fontSize: 14, lineHeight: 20, marginTop: 5 },
  mealList: { gap: 8 },
  mealRow: { flexDirection: "row", alignItems: "center", gap: 9, paddingVertical: 4 },
  mealLabel: { color: COLORS.slate, fontSize: 12, width: 76, fontWeight: "800" },
  mealValue: { color: COLORS.plum, flex: 1, fontSize: 13 },
  mutedValue: { color: "#807685", fontStyle: "italic" },
  mealDone: { color: "#6F6572", fontSize: 15, fontWeight: "900" },
  mealDoneActive: { color: COLORS.sage },
  todoList: { gap: 8 },
  todoRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  todoCheck: { color: "#817785", fontSize: 16, width: 18 },
  todoCheckDone: { color: COLORS.sage },
  todoText: { color: COLORS.plum, flex: 1, fontSize: 14 },
  todoTextDone: { color: COLORS.slate, textDecorationLine: "line-through" },
  affectionGrid: { flexDirection: "row", gap: 7 },
  affectionStat: { flex: 1, borderRadius: 11, backgroundColor: "#151217", padding: 9, alignItems: "center" },
  affectionIcon: { fontSize: 18 },
  affectionCount: { color: COLORS.plum, fontSize: 15, fontWeight: "900", marginTop: 3 },
  affectionLabel: { color: COLORS.slate, fontSize: 9, marginTop: 1, textAlign: "center" },
  habitList: { gap: 7, borderTopWidth: 1, borderTopColor: "#2E2733", paddingTop: 11 },
  habitRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  habitText: { color: COLORS.plum, fontSize: 12, flex: 1 },
  habitPartner: { fontSize: 10, fontWeight: "900" },
  reflectionText: { color: COLORS.plum, fontSize: 14, lineHeight: 20 },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  photoWrap: { width: "31%", gap: 4 },
  photo: { width: "100%", aspectRatio: 1, borderRadius: 9, backgroundColor: COLORS.surface },
  photoCaption: { color: COLORS.slate, fontSize: 9 },
  emptyArchiveText: { color: COLORS.slate, fontFamily: "monospace", fontSize: 11, fontStyle: "italic" },
});
