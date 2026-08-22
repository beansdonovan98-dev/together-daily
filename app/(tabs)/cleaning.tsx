import { AppFrame } from "@/components/app-frame";
import { PrivateGate } from "@/components/together-access";
import { COLORS, asObject, prettyDate } from "@/lib/together";
import { PARTNERS, type PartnerId, useLocalJournal } from "@/lib/local-journal";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type CleaningTask = { id: string; text: string; createdBy: PartnerId; completed: boolean; completedBy?: PartnerId };

function weekStartKey() {
  const now = new Date();
  const sunday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  sunday.setDate(sunday.getDate() - sunday.getDay());
  const year = sunday.getFullYear();
  const month = String(sunday.getMonth() + 1).padStart(2, "0");
  const day = String(sunday.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function CleaningScreen() {
  return <PrivateGate>{({ userId }) => <CleaningContent userId={userId} />}</PrivateGate>;
}

function CleaningContent({ userId }: { userId: PartnerId }) {
  const weekStart = weekStartKey();
  const { ready, getDay, ensureDay, updateDay, theme, cleaningTemplates, saveCleaningTemplate } = useLocalJournal();
  const [draft, setDraft] = useState("");
  const [templateName, setTemplateName] = useState("");

  useEffect(() => { if (ready) ensureDay(weekStart); }, [weekStart, ensureDay, ready]);
  const day = asObject(getDay(weekStart));
  const cleaning = asObject(day.cleaning);
  const tasks = (Array.isArray(cleaning.tasks) ? cleaning.tasks : []) as CleaningTask[];
  const completed = tasks.filter((task) => task.completed).length;
  const beansCount = tasks.filter((task) => task.completedBy === "beans").length;
  const princessCount = tasks.filter((task) => task.completedBy === "princess").length;
  const activePartner = PARTNERS[userId];
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  const saveTasks = (next: CleaningTask[]) => updateDay(weekStart, { cleaning: { tasks: next, weekStart } });
  const addTask = () => {
    const text = draft.trim();
    if (!text) return;
    saveTasks([...tasks, { id: `clean-${Date.now()}-${Math.random().toString(16).slice(2)}`, text, createdBy: userId, completed: false }]);
    setDraft("");
  };
  const toggleTask = (taskId: string) => saveTasks(tasks.map((task) => task.id === taskId ? { ...task, completed: !task.completed, completedBy: task.completed ? undefined : userId } : task));
  const removeTask = (taskId: string) => saveTasks(tasks.filter((task) => task.id !== taskId));
  const saveTemplate = () => { const name = templateName.trim(); if (!name || !tasks.length) return; saveCleaningTemplate({ name, tasks: tasks.map((task) => task.text) }); setTemplateName(""); };
  const addTemplateToWeek = (templateTasks: string[]) => { const existing = new Set(tasks.map((task) => task.text.trim().toLowerCase())); const additions = templateTasks.filter((text) => !existing.has(text.trim().toLowerCase())).map((text) => ({ id: `clean-${Date.now()}-${Math.random().toString(16).slice(2)}`, text, createdBy: userId, completed: false })); if (additions.length) saveTasks([...tasks, ...additions]); };

  const message = useMemo(() => !tasks.length ? "Add the first task whenever you are ready." : completed === tasks.length ? "Everything on this week’s list is done." : "Little by little, your shared space comes together.", [completed, tasks.length]);
  if (!ready) return <AppFrame><View style={styles.loading}><Text style={styles.muted}>Opening your cleaning list…</Text></View></AppFrame>;

  return <AppFrame><ScrollView contentContainerStyle={[styles.page, { backgroundColor: theme.backgroundColor ?? COLORS.blush }]} showsVerticalScrollIndicator={false}>
    <View style={styles.hero}><Text style={styles.eyebrow}>SHARED HOME CARE · RESETS SUNDAY</Text><Text style={styles.title}>Cleaning</Text><Text style={styles.copy}>Week of {prettyDate(weekStart)} · {message}</Text></View>

    <View style={styles.progressCard}><View style={styles.progressTop}><View><Text style={styles.progressKicker}>THIS WEEK’S PROGRESS</Text><Text style={styles.progressNumber}>{completed}<Text style={styles.progressTotal}> / {tasks.length}</Text></Text></View><Text style={styles.progressPercent}>{progress}%</Text></View><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: activePartner.color }]} /></View><View style={styles.partnerCounts}><Text style={[styles.partnerCount, { color: PARTNERS.beans.color }]}>♛ Beans · {beansCount}</Text><Text style={[styles.partnerCount, { color: PARTNERS.princess.color }]}>♥ Princess · {princessCount}</Text></View></View>

    <View style={styles.composer}><Text style={styles.composerTitle}>Add a cleaning task</Text><View style={styles.addRow}><TextInput value={draft} onChangeText={setDraft} onSubmitEditing={addTask} returnKeyType="done" placeholder="e.g. Wipe down the counters" placeholderTextColor="#7F7582" style={styles.input}/><TouchableOpacity accessibilityRole="button" onPress={addTask} style={[styles.addButton, { backgroundColor: activePartner.color }]}><Text style={styles.addButtonText}>Add</Text></TouchableOpacity></View></View>
    <View style={styles.templatesCard}><Text style={styles.templatesKicker}>REUSABLE WEEKLY LISTS</Text><Text style={styles.templatesTitle}>Cleaning templates</Text><Text style={styles.templatesCopy}>Save your current chores as a template, then add a saved list to any week without duplicating tasks.</Text><View style={styles.templateSaveRow}><TextInput value={templateName} onChangeText={setTemplateName} placeholder="Name this list" placeholderTextColor="#7F7582" maxLength={28} style={styles.templateInput}/><TouchableOpacity accessibilityRole="button" disabled={!templateName.trim() || !tasks.length} onPress={saveTemplate} style={[styles.templateSaveButton, (!templateName.trim() || !tasks.length) && styles.disabledButton]}><Text style={styles.templateSaveText}>Save list</Text></TouchableOpacity></View>{cleaningTemplates.length ? <View style={styles.templateList}>{cleaningTemplates.map((template) => { const creator = PARTNERS[template.createdBy]; return <View key={template.id} style={styles.templateRow}><View style={styles.templateBody}><Text style={styles.templateName}>{template.name}</Text><Text style={[styles.templateMeta,{color:creator.color}]}>{template.tasks.length} chores · {creator.name} created</Text></View><TouchableOpacity accessibilityRole="button" onPress={() => addTemplateToWeek(template.tasks)} style={[styles.useTemplateButton,{borderColor:creator.color}]}><Text style={[styles.useTemplateText,{color:creator.color}]}>Add to week</Text></TouchableOpacity></View>; })}</View> : <Text style={styles.noTemplates}>No saved lists yet.</Text>}</View>

    <View style={styles.list}>{tasks.map((task) => { const creator = PARTNERS[task.createdBy]; const completer = task.completedBy ? PARTNERS[task.completedBy] : null; return <View key={task.id} style={[styles.taskCard, task.completed && styles.taskCardDone]}><TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: task.completed }} accessibilityLabel={`Mark ${task.text} ${task.completed ? "incomplete" : "complete"}`} onPress={() => toggleTask(task.id)} style={[styles.checkCircle, task.completed && { backgroundColor: completer?.color ?? COLORS.sage, borderColor: completer?.color ?? COLORS.sage }]}><Text style={styles.checkText}>{task.completed ? "✓" : ""}</Text></TouchableOpacity><View style={styles.taskBody}><Text style={[styles.taskText, task.completed && styles.taskTextDone]}>{task.text}</Text><Text style={[styles.taskMeta, { color: task.completed ? completer?.color : creator.color }]}>{task.completed ? `${completer?.name} completed` : `${creator.name} added`}</Text></View><TouchableOpacity accessibilityRole="button" accessibilityLabel={`Delete ${task.text}`} onPress={() => removeTask(task.id)} style={styles.deleteButton}><Text style={styles.deleteText}>×</Text></TouchableOpacity></View>; })}</View>
    {!tasks.length ? <View style={styles.empty}><Text style={styles.emptyTitle}>A fresh, clear start.</Text><Text style={styles.emptyCopy}>This list is yours to build together. Add only the cleaning tasks that matter this week.</Text></View> : null}
  </ScrollView></AppFrame>;
}

const styles = StyleSheet.create({
  page: { padding: 18, paddingBottom: 42, gap: 14, flexGrow: 1, backgroundColor: COLORS.blush },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.blush },
  muted: { color: COLORS.slate, fontSize: 14 },
  hero: { gap: 4, paddingTop: 4 },
  eyebrow: { color: COLORS.gold, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  title: { color: COLORS.plum, fontSize: 34, fontWeight: "900", fontStyle: "italic" },
  copy: { color: COLORS.slate, fontFamily: "monospace", fontSize: 12, lineHeight: 19 },
  progressCard: { borderRadius: 20, borderWidth: 1, borderColor: "#35494B", backgroundColor: "#11191A", padding: 17, gap: 12 },
  progressTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  progressKicker: { color: COLORS.sage, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  progressNumber: { color: COLORS.plum, fontSize: 30, fontWeight: "900", fontStyle: "italic", marginTop: 2 },
  progressTotal: { color: COLORS.slate, fontSize: 17 },
  progressPercent: { color: COLORS.gold, fontSize: 16, fontWeight: "900" },
  progressTrack: { height: 9, overflow: "hidden", borderRadius: 5, backgroundColor: "#283033" },
  progressFill: { height: "100%", borderRadius: 5 },
  partnerCounts: { flexDirection: "row", gap: 14 },
  partnerCount: { fontSize: 11, fontWeight: "900" },
  composer: { borderRadius: 18, borderWidth: 1, borderColor: "#3C4E4D", backgroundColor: COLORS.ink, padding: 14, gap: 10 },
  composerTitle: { color: COLORS.plum, fontSize: 17, fontWeight: "900", fontStyle: "italic" },
  addRow: { flexDirection: "row", gap: 8 },
  input: { flex: 1, minHeight: 43, borderRadius: 11, borderWidth: 1, borderColor: "#3A4443", backgroundColor: "#121415", color: COLORS.plum, paddingHorizontal: 11, fontSize: 13 },
  addButton: { minWidth: 58, borderRadius: 11, justifyContent: "center", alignItems: "center" },
  addButtonText: { color: COLORS.white, fontSize: 12, fontWeight: "900" },
  templatesCard: { borderRadius: 18, borderWidth: 1, borderColor: "#48505F", backgroundColor: "#151821", padding: 14, gap: 8 },
  templatesKicker: { color: "#66B7DD", fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  templatesTitle: { color: COLORS.plum, fontSize: 18, fontWeight: "900", fontStyle: "italic" },
  templatesCopy: { color: COLORS.slate, fontFamily: "monospace", fontSize: 10, lineHeight: 16 },
  templateSaveRow: { flexDirection: "row", gap: 8, marginTop: 3 },
  templateInput: { flex: 1, minHeight: 40, borderRadius: 10, borderWidth: 1, borderColor: "#3C4656", backgroundColor: "#101219", color: COLORS.plum, paddingHorizontal: 10, fontSize: 12 },
  templateSaveButton: { minHeight: 40, borderRadius: 10, backgroundColor: COLORS.gold, alignItems: "center", justifyContent: "center", paddingHorizontal: 10 },
  templateSaveText: { color: COLORS.ink, fontSize: 10, fontWeight: "900" },
  disabledButton: { opacity: .42 },
  templateList: { gap: 7, marginTop: 3 },
  templateRow: { flexDirection: "row", gap: 8, alignItems: "center", borderRadius: 10, borderWidth: 1, borderColor: "#363D49", backgroundColor: "#11131A", padding: 10 },
  templateBody: { flex: 1 },
  templateName: { color: COLORS.plum, fontSize: 13, fontWeight: "900" },
  templateMeta: { fontFamily: "monospace", fontSize: 9, fontWeight: "800", marginTop: 2 },
  useTemplateButton: { minHeight: 31, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  useTemplateText: { fontSize: 9, fontWeight: "900" },
  noTemplates: { color: COLORS.slate, fontFamily: "monospace", fontSize: 10, marginTop: 2 },
  list: { gap: 9 },
  taskCard: { borderRadius: 15, borderWidth: 1, borderColor: "#353D3D", backgroundColor: COLORS.ink, padding: 12, flexDirection: "row", alignItems: "center", gap: 10 },
  taskCardDone: { backgroundColor: "#14201B", borderColor: "#365845" },
  checkCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: "#66736D", alignItems: "center", justifyContent: "center" },
  checkText: { color: COLORS.white, fontWeight: "900" },
  taskBody: { flex: 1, gap: 3 },
  taskText: { color: COLORS.plum, fontSize: 14, fontWeight: "800" },
  taskTextDone: { color: COLORS.slate, textDecorationLine: "line-through" },
  taskMeta: { fontSize: 10, fontFamily: "monospace", fontWeight: "800" },
  deleteButton: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  deleteText: { color: "#8E7682", fontSize: 22, lineHeight: 24 },
  empty: { borderRadius: 18, borderWidth: 1, borderColor: "#35494B", backgroundColor: COLORS.ink, padding: 20, alignItems: "center" },
  emptyTitle: { color: COLORS.plum, fontSize: 19, fontWeight: "900", fontStyle: "italic" },
  emptyCopy: { color: COLORS.slate, fontSize: 12, fontFamily: "monospace", lineHeight: 18, textAlign: "center", marginTop: 5 },
});
