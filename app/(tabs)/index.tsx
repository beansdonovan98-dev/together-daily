import { PrivateGate } from "@/components/together-access";
import { AppFrame } from "@/components/app-frame";
import { COLORS, asObject, localDateKey, prettyDate } from "@/lib/together";
import { trpc } from "@/lib/trpc";
import { File } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const MOODS = [
  { key: "loved", emoji: "🥰", label: "Loved" },
  { key: "calm", emoji: "😌", label: "Calm" },
  { key: "cozy", emoji: "🫶", label: "Cozy" },
  { key: "tired", emoji: "😮‍💨", label: "Tired" },
  { key: "stretched", emoji: "🫤", label: "Stretched" },
];

function normalizeMimeType(value?: string | null): "image/jpeg" | "image/png" | "image/webp" {
  if (value === "image/png" || value === "image/webp") return value;
  return "image/jpeg";
}

export default function TodayScreen() {
  return (
    <PrivateGate>
      {({ userId, memberName, coupleName, inviteCode, memberCount }) => <TodayContent userId={userId} memberName={memberName} coupleName={coupleName} inviteCode={inviteCode} memberCount={memberCount} />}
    </PrivateGate>
  );
}

function TodayContent({ userId, memberName, coupleName, inviteCode, memberCount }: { userId: number; memberName: string; coupleName: string; inviteCode: string; memberCount: number }) {
  const date = localDateKey();
  const daily = trpc.daily.get.useQuery({ date }, { refetchInterval: 5_000 });
  const update = trpc.daily.update.useMutation({ onSuccess: () => daily.refetch() });
  const upload = trpc.media.upload.useMutation({ onSuccess: () => daily.refetch() });
  const [todoText, setTodoText] = useState("");
  const [answer, setAnswer] = useState("");

  const content = asObject(daily.data?.content);
  const checkIns = asObject(content.checkIns);
  const ownCheckIn = asObject(checkIns[String(userId)]);
  const todos = Array.isArray(content.todos) ? content.todos : [];
  const cover = asObject(content.coverPhoto);

  const save = (patch: Record<string, unknown>) => update.mutate({ date, content: patch });
  const setMood = (mood: string) => save({ checkIns: { ...checkIns, [userId]: { ...ownCheckIn, mood } } });
  const setEnergy = (energyLevel: number) => save({ checkIns: { ...checkIns, [userId]: { ...ownCheckIn, energyLevel } } });
  const saveAnswer = () => {
    if (!answer.trim()) return;
    save({ checkIns: { ...checkIns, [userId]: { ...ownCheckIn, questionAnswer: answer.trim() } } });
    setAnswer("");
  };
  const addTodo = () => {
    if (!todoText.trim()) return;
    save({ todos: [...todos, { id: `todo-${Date.now()}`, text: todoText.trim(), completed: false, assignedTo: "both" }] });
    setTodoText("");
  };
  const selectCover = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [16, 9], quality: 0.82 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const file = new File(asset.uri);
    const base64 = await file.base64();
    const saved = await upload.mutateAsync({ date, kind: "cover", fileName: asset.fileName ?? `cover-${Date}.jpg`, mimeType: normalizeMimeType(asset.mimeType), base64, caption: "" });
    save({ coverPhoto: { id: saved.id, url: saved.url, storageKey: saved.storageKey, fileName: saved.fileName, mimeType: saved.mimeType, uploadedAt: saved.createdAt } });
  };

  if (daily.isLoading) return <AppFrame><View style={styles.loading}><Text style={styles.muted}>Preparing today’s space…</Text></View></AppFrame>;
  if (daily.isError) return <AppFrame><View style={styles.loading}><Text style={styles.muted}>We could not load today’s check-in.</Text></View></AppFrame>;

  const completedTodos = todos.filter((item: any) => item.completed).length;
  return (
    <AppFrame>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <View><Text style={styles.eyebrow}>{prettyDate(date).toUpperCase()}</Text><Text style={styles.title}>{coupleName}</Text></View>
          <View style={styles.avatar}><Text style={styles.avatarText}>{memberName.slice(0, 1).toUpperCase()}</Text></View>
        </View>

        <TouchableOpacity style={styles.coverCard} onPress={selectCover} disabled={upload.isPending}>
          {cover.url ? <Image source={{ uri: cover.url }} style={StyleSheet.absoluteFillObject} /> : null}
          <View style={[StyleSheet.absoluteFillObject, styles.coverShade]} />
          <View style={styles.coverContent}><Text style={styles.coverKicker}>{upload.isPending ? "UPLOADING PHOTO" : "DAILY COVER"}</Text><Text style={styles.coverTitle}>{cover.url ? "Change cover photo" : "Add a cover photo"}</Text><Text style={styles.coverCopy}>A visual little memory for today.</Text></View>
          <View style={styles.coverAdd}><Text style={styles.coverAddText}>+</Text></View>
        </TouchableOpacity>

        {memberCount < 2 ? <View style={styles.inviteCard}><Text style={styles.inviteTitle}>Invite your partner</Text><Text style={styles.inviteCopy}>Share this private code directly: <Text style={styles.inviteCode}>{inviteCode}</Text></Text></View> : null}

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: COLORS.lavender }]}><Text style={styles.statNumber}>{Object.keys(checkIns).length}/2</Text><Text style={styles.statLabel}>check-ins</Text></View>
          <View style={[styles.statCard, { backgroundColor: "#FCEEF2" }]}><Text style={styles.statNumber}>{completedTodos}/{todos.length}</Text><Text style={styles.statLabel}>tasks done</Text></View>
          <View style={[styles.statCard, { backgroundColor: "#F1F6EF" }]}><Text style={styles.statNumber}>{content.water?.glassesLogged ?? 0}</Text><Text style={styles.statLabel}>glasses</Text></View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>How are you arriving today?</Text>
          <View style={styles.moodRow}>{MOODS.map((mood) => <TouchableOpacity key={mood.key} style={[styles.mood, ownCheckIn.mood === mood.key && styles.moodActive]} onPress={() => setMood(mood.key)}><Text style={styles.moodEmoji}>{mood.emoji}</Text><Text style={[styles.moodLabel, ownCheckIn.mood === mood.key && styles.moodLabelActive]}>{mood.label}</Text></TouchableOpacity>)}</View>
          <Text style={styles.subtleLabel}>Energy</Text>
          <View style={styles.energyRow}>{[1, 2, 3, 4, 5].map((level) => <TouchableOpacity key={level} onPress={() => setEnergy(level)} style={[styles.energyDot, ownCheckIn.energyLevel >= level && styles.energyDotActive]}><Text style={styles.energyText}>{level}</Text></TouchableOpacity>)}</View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardKicker}>TODAY’S APPRECIATION QUESTION</Text>
          <Text style={styles.question}>{String(content.questionText ?? "What are you appreciating about each other today?")}</Text>
          {ownCheckIn.questionAnswer ? <View style={styles.answerSaved}><Text style={styles.answerSavedLabel}>YOUR ANSWER</Text><Text style={styles.answerSavedText}>{String(ownCheckIn.questionAnswer)}</Text></View> : <><TextInput value={answer} onChangeText={setAnswer} placeholder="Write a few honest words…" placeholderTextColor="#A399AA" multiline style={styles.textArea} /><TouchableOpacity style={styles.smallPrimary} onPress={saveAnswer}><Text style={styles.smallPrimaryText}>Save my answer</Text></TouchableOpacity></>}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}><Text style={styles.cardTitle}>Shared to-dos</Text><Text style={styles.cardMeta}>{completedTodos}/{todos.length}</Text></View>
          {todos.slice(0, 3).map((item: any) => <View key={item.id} style={styles.todoRow}><View style={[styles.todoCircle, item.completed && styles.todoCircleDone]}>{item.completed ? <Text style={styles.check}>✓</Text> : null}</View><Text style={[styles.todoText, item.completed && styles.todoDone]} numberOfLines={1}>{item.text}</Text></View>)}
          <View style={styles.addRow}><TextInput value={todoText} onChangeText={setTodoText} onSubmitEditing={addTodo} returnKeyType="done" placeholder="Add something for today" placeholderTextColor="#A399AA" style={styles.addInput} /><TouchableOpacity style={styles.addButton} onPress={addTodo}><Text style={styles.addButtonText}>Add</Text></TouchableOpacity></View>
        </View>
      </ScrollView>
    </AppFrame>
  );
}

const styles = StyleSheet.create({
  page: { padding: 20, paddingBottom: 36, gap: 16, backgroundColor: COLORS.blush },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.blush }, muted: { color: COLORS.slate, fontSize: 15 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 }, eyebrow: { color: COLORS.orchid, fontSize: 11, letterSpacing: 1.2, fontWeight: "800", marginBottom: 4 }, title: { color: COLORS.plum, fontSize: 28, fontWeight: "800" },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.orchid, alignItems: "center", justifyContent: "center" }, avatarText: { color: COLORS.white, fontWeight: "800", fontSize: 17 },
  coverCard: { height: 190, borderRadius: 24, overflow: "hidden", backgroundColor: COLORS.plum, padding: 20, justifyContent: "flex-end" }, coverShade: { backgroundColor: "rgba(40,28,50,0.32)" }, coverContent: { zIndex: 2 }, coverKicker: { color: "#F9DCE5", fontWeight: "800", fontSize: 10, letterSpacing: 1.2, marginBottom: 6 }, coverTitle: { color: COLORS.white, fontSize: 25, fontWeight: "800", marginBottom: 3 }, coverCopy: { color: "#F6EDF8", fontSize: 14 }, coverAdd: { position: "absolute", top: 16, right: 16, zIndex: 3, width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.92)", alignItems: "center", justifyContent: "center" }, coverAddText: { color: COLORS.plum, fontSize: 24, lineHeight: 27 },
  inviteCard: { borderRadius: 17, padding: 16, backgroundColor: "#FFF8E3", borderWidth: 1, borderColor: "#F2D898" }, inviteTitle: { color: "#84642C", fontSize: 15, fontWeight: "800", marginBottom: 4 }, inviteCopy: { color: "#84642C", fontSize: 14, lineHeight: 20 }, inviteCode: { fontWeight: "900", letterSpacing: 1.3 },
  statsRow: { flexDirection: "row", gap: 10 }, statCard: { flex: 1, paddingVertical: 13, borderRadius: 18, alignItems: "center" }, statNumber: { color: COLORS.plum, fontSize: 20, fontWeight: "800" }, statLabel: { color: COLORS.slate, fontSize: 11, fontWeight: "700", marginTop: 2 },
  card: { backgroundColor: COLORS.white, borderRadius: 22, padding: 18, borderWidth: 1, borderColor: "#F0E8F1" }, cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }, cardTitle: { color: COLORS.plum, fontSize: 18, fontWeight: "800" }, cardMeta: { color: COLORS.orchid, fontWeight: "800", fontSize: 13 }, cardKicker: { color: COLORS.orchid, fontSize: 10, letterSpacing: 1.1, fontWeight: "800", marginBottom: 8 },
  moodRow: { flexDirection: "row", justifyContent: "space-between", gap: 4, marginTop: 14 }, mood: { flex: 1, alignItems: "center", borderRadius: 14, paddingVertical: 9, borderWidth: 1, borderColor: "transparent" }, moodActive: { backgroundColor: COLORS.lavender, borderColor: "#D7C7E2" }, moodEmoji: { fontSize: 23 }, moodLabel: { color: COLORS.slate, fontSize: 9, fontWeight: "700", marginTop: 4 }, moodLabelActive: { color: COLORS.orchid },
  subtleLabel: { color: COLORS.slate, fontSize: 12, fontWeight: "700", marginTop: 14, marginBottom: 8 }, energyRow: { flexDirection: "row", gap: 8 }, energyDot: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "#F3EFF4" }, energyDotActive: { backgroundColor: COLORS.rose }, energyText: { color: COLORS.plum, fontSize: 13, fontWeight: "800" },
  question: { color: COLORS.plum, fontSize: 18, fontWeight: "700", lineHeight: 25 }, textArea: { minHeight: 88, borderColor: COLORS.border, borderWidth: 1, borderRadius: 14, padding: 12, marginTop: 14, color: COLORS.plum, textAlignVertical: "top", fontSize: 15 }, smallPrimary: { alignSelf: "flex-start", backgroundColor: COLORS.orchid, paddingVertical: 11, paddingHorizontal: 15, borderRadius: 13, marginTop: 10 }, smallPrimaryText: { color: COLORS.white, fontSize: 13, fontWeight: "800" }, answerSaved: { marginTop: 14, padding: 12, borderRadius: 14, backgroundColor: COLORS.lavender }, answerSavedLabel: { color: COLORS.orchid, fontSize: 10, fontWeight: "800", letterSpacing: 0.9, marginBottom: 3 }, answerSavedText: { color: COLORS.plum, fontSize: 14, lineHeight: 20 },
  todoRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#F5F1F6" }, todoCircle: { width: 20, height: 20, borderRadius: 10, borderColor: "#D7CADB", borderWidth: 1, alignItems: "center", justifyContent: "center" }, todoCircleDone: { backgroundColor: COLORS.sage, borderColor: COLORS.sage }, check: { color: COLORS.white, fontWeight: "900", fontSize: 13 }, todoText: { color: COLORS.plum, fontSize: 14, flex: 1 }, todoDone: { color: COLORS.slate, textDecorationLine: "line-through" }, addRow: { flexDirection: "row", gap: 8, marginTop: 12 }, addInput: { flex: 1, minHeight: 42, paddingHorizontal: 12, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, color: COLORS.plum }, addButton: { backgroundColor: COLORS.lavender, borderRadius: 12, paddingHorizontal: 14, justifyContent: "center" }, addButtonText: { color: COLORS.orchid, fontSize: 13, fontWeight: "800" },
});
