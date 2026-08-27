import { AppFrame } from "@/components/app-frame";
import { PrivateGate } from "@/components/together-access";
import { COLORS, TAB_CARD_PALETTES, asObject, localDateKey, prettyDate } from "@/lib/together";
import { PARTNERS, type PartnerId, useLocalJournal } from "@/lib/local-journal";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  const today = localDateKey();
  const { ready, getDay, ensureDay, updateDay, customSubheadings, setCustomSubheading, cleaningTemplates, saveCleaningTemplate, updateCleaningTemplate, deleteCleaningTemplate } = useLocalJournal();
  const [draft, setDraft] = useState("");
  const [dailyDraft, setDailyDraft] = useState("");
  const [defaultDailyDraft, setDefaultDailyDraft] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingTasks, setEditingTasks] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskText, setEditingTaskText] = useState("");

  useEffect(() => { if (ready) { ensureDay(weekStart); ensureDay(today); } }, [weekStart, today, ensureDay, ready]);
  const day = asObject(getDay(weekStart));
  const cleaning = asObject(day.cleaning);
  const tasks = (Array.isArray(cleaning.tasks) ? cleaning.tasks : []) as CleaningTask[];
  const completed = tasks.filter((task) => task.completed).length;
  const beansCount = tasks.filter((task) => task.completedBy === "beans").length;
  const princessCount = tasks.filter((task) => task.completedBy === "princess").length;
  const activePartner = PARTNERS[userId];
  const dailyCleaning = asObject(asObject(getDay(today)).dailyCleaning);
  const dailyTasks = (Array.isArray(dailyCleaning.tasks) ? dailyCleaning.tasks : []) as CleaningTask[];
  const dailyCompleted = dailyTasks.filter((task) => task.completed).length;
  const dailyProgress = dailyTasks.length ? Math.round((dailyCompleted / dailyTasks.length) * 100) : 0;
  const dailyComplete = dailyTasks.length > 0 && dailyCompleted === dailyTasks.length;
  const weeklyComplete = tasks.length > 0 && completed === tasks.length;
  const defaultDailyTasks = useMemo(() => { try { const parsed = JSON.parse(customSubheadings.dailyCleaningDefaults || "[]"); return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string" && Boolean(item.trim())) : []; } catch { return []; } }, [customSubheadings.dailyCleaningDefaults]);
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  const saveTasks = (next: CleaningTask[]) => updateDay(weekStart, { cleaning: { tasks: next, weekStart } });
  const saveDailyTasks = useCallback((next: CleaningTask[]) => updateDay(today, { dailyCleaning: { tasks: next, date: today } }), [today, updateDay]);
  const addDailyTask = () => { const text = dailyDraft.trim(); if (!text) return; saveDailyTasks([...dailyTasks, { id: `daily-clean-${Date.now()}`, text, createdBy: userId, completed: false }]); setDailyDraft(""); };
  const toggleDailyTask = (id: string) => saveDailyTasks(dailyTasks.map((task) => task.id === id ? { ...task, completed: !task.completed, completedBy: task.completed ? undefined : userId } : task));
  const deleteDailyTask = (id: string) => saveDailyTasks(dailyTasks.filter((task) => task.id !== id));
  const saveDefaultDailyTasks = (next: string[]) => setCustomSubheading("dailyCleaningDefaults", JSON.stringify(next));
  const addDefaultDailyTask = () => { const text = defaultDailyDraft.trim(); if (!text || defaultDailyTasks.some((task) => task.toLowerCase() === text.toLowerCase())) return; saveDefaultDailyTasks([...defaultDailyTasks, text]); setDefaultDailyDraft(""); };
  const deleteDefaultDailyTask = (text: string) => saveDefaultDailyTasks(defaultDailyTasks.filter((task) => task !== text));
  useEffect(() => { if (!ready || !defaultDailyTasks.length || dailyTasks.length) return; saveDailyTasks(defaultDailyTasks.map((text, index) => ({ id: `daily-default-${today}-${index}`, text, createdBy: userId, completed: false }))); }, [ready, today, defaultDailyTasks, dailyTasks.length, saveDailyTasks, userId]);
  const addTask = () => {
    const text = draft.trim();
    if (!text) return;
    saveTasks([...tasks, { id: `clean-${Date.now()}-${Math.random().toString(16).slice(2)}`, text, createdBy: userId, completed: false }]);
    setDraft("");
  };
  const toggleTask = (taskId: string) => saveTasks(tasks.map((task) => task.id === taskId ? { ...task, completed: !task.completed, completedBy: task.completed ? undefined : userId } : task));
  const removeTask = (taskId: string) => saveTasks(tasks.filter((task) => task.id !== taskId));
  const startTaskEdit = (task: CleaningTask) => { setEditingTaskId(task.id); setEditingTaskText(task.text); };
  const saveTaskEdit = () => { const text = editingTaskText.trim(); if (!editingTaskId || !text) return; saveTasks(tasks.map((task) => task.id === editingTaskId ? { ...task, text } : task)); setEditingTaskId(null); setEditingTaskText(""); };
  const saveTemplate = () => { const name = templateName.trim(); if (!name || !tasks.length) return; saveCleaningTemplate({ name, tasks: tasks.map((task) => task.text) }); setTemplateName(""); };
  const addTemplateToWeek = (templateTasks: string[]) => { const existing = new Set(tasks.map((task) => task.text.trim().toLowerCase())); const additions = templateTasks.filter((text) => !existing.has(text.trim().toLowerCase())).map((text) => ({ id: `clean-${Date.now()}-${Math.random().toString(16).slice(2)}`, text, createdBy: userId, completed: false })); if (additions.length) saveTasks([...tasks, ...additions]); };
  const startTemplateEdit = (id: string, name: string, templateTasks: string[]) => { setEditingTemplateId(id); setEditingName(name); setEditingTasks(templateTasks.join("\n")); setConfirmDeleteId(null); };
  const saveTemplateEdit = () => { const name = editingName.trim(); const templateTasks = editingTasks.split("\n").map((task) => task.trim()).filter(Boolean); if (!editingTemplateId || !name || !templateTasks.length) return; updateCleaningTemplate(editingTemplateId, { name, tasks: templateTasks }); setEditingTemplateId(null); setEditingName(""); setEditingTasks(""); };

  const message = useMemo(() => !tasks.length ? "Add the first task whenever you are ready." : completed === tasks.length ? "Everything on this week’s list is done." : "Little by little, your shared space comes together.", [completed, tasks.length]);
  if (!ready) return <AppFrame><View style={styles.loading}><Text style={styles.muted}>Opening your cleaning list…</Text></View></AppFrame>;

  return <AppFrame><ScrollView contentContainerStyle={[styles.page, { backgroundColor: "transparent" }]} showsVerticalScrollIndicator={false}>
    <View style={styles.hero}><Text style={styles.eyebrow}>SHARED HOME CARE · RESETS SUNDAY</Text><Text style={styles.title}>Cleaning</Text><Text style={styles.copy}>Week of {prettyDate(weekStart)} · {message}</Text></View>

    <View style={[styles.dailyCard, { backgroundColor: "transparent", borderColor: "#000000" }]}><View style={styles.dailyHeader}><View><Text style={styles.dailyKicker}>TODAY ONLY</Text><Text style={styles.dailyTitle}>Daily cleaning</Text></View><Text style={styles.dailyCount}>{dailyCompleted}/{dailyTasks.length}</Text></View>{dailyTasks.length ? <View style={styles.dailyList}>{dailyTasks.map((task) => <View key={task.id} style={styles.dailyRow}><TouchableOpacity onPress={() => toggleDailyTask(task.id)} style={[styles.dailyCheck, task.completed && { backgroundColor: activePartner.color, borderColor: activePartner.color }]}><Text style={styles.dailyCheckText}>{task.completed ? "✓" : ""}</Text></TouchableOpacity><Text style={[styles.dailyText, task.completed && styles.dailyTextDone]}>{task.text}</Text><TouchableOpacity onPress={() => deleteDailyTask(task.id)} style={styles.dailyDelete}><Text style={styles.dailyDeleteText}>×</Text></TouchableOpacity></View>)}</View> : <Text style={styles.dailyEmpty}>Add quick chores that clear with tomorrow’s daily page.</Text>}<View style={styles.dailyProgressTrack}><View style={[styles.dailyProgressFill,{width:`${dailyProgress}%`,backgroundColor:activePartner.color}]}/></View><Text style={styles.dailyProgressLabel}>{dailyProgress}% complete today</Text>{dailyComplete ? <View style={styles.completeBanner}><Text style={styles.completeTitle}>✦ Daily cleaning complete! ✦</Text></View> : null}<View style={styles.addRow}><TextInput value={dailyDraft} onChangeText={setDailyDraft} onSubmitEditing={addDailyTask} returnKeyType="done" placeholder="e.g. Make the bed" placeholderTextColor="#7F7582" style={styles.input}/><TouchableOpacity onPress={addDailyTask} style={[styles.addButton,{backgroundColor:activePartner.color}]}><Text style={styles.addButtonText}>Add</Text></TouchableOpacity></View><View style={styles.defaultDailyPanel}><Text style={styles.defaultDailyTitle}>Default daily tasks</Text><Text style={styles.defaultDailyCopy}>Saved here tasks automatically appear on each new daily page.</Text>{defaultDailyTasks.map((task) => <View key={task} style={styles.defaultDailyRow}><Text style={styles.defaultDailyText}>• {task}</Text><TouchableOpacity onPress={() => deleteDefaultDailyTask(task)}><Text style={styles.defaultDailyDelete}>×</Text></TouchableOpacity></View>)}<View style={styles.addRow}><TextInput value={defaultDailyDraft} onChangeText={setDefaultDailyDraft} onSubmitEditing={addDefaultDailyTask} returnKeyType="done" placeholder="Add a default task" placeholderTextColor="#7F7582" style={styles.input}/><TouchableOpacity onPress={addDefaultDailyTask} style={[styles.addButton,{backgroundColor:activePartner.color}]}><Text style={styles.addButtonText}>Save</Text></TouchableOpacity></View></View></View>

    <View style={[styles.progressCard, { backgroundColor: "transparent", borderColor: "#000000" }]}><View style={styles.progressTop}><View><Text style={styles.progressKicker}>THIS WEEK’S PROGRESS</Text><Text style={styles.progressNumber}>{completed}<Text style={styles.progressTotal}> / {tasks.length}</Text></Text></View><Text style={styles.progressPercent}>{progress}%</Text></View><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: activePartner.color }]} /></View><View style={styles.partnerCounts}><Text style={[styles.partnerCount, { color: PARTNERS.beans.color }]}>{PARTNERS.beans.avatar} {PARTNERS.beans.name} · {beansCount}</Text><Text style={[styles.partnerCount, { color: PARTNERS.princess.color }]}>{PARTNERS.princess.avatar} {PARTNERS.princess.name} · {princessCount}</Text></View>{weeklyComplete ? <View style={styles.completeBanner}><Text style={styles.completeTitle}>✦ Weekly cleaning complete! ✦</Text></View> : null}</View>

    <View style={[styles.composer, { backgroundColor: "transparent", borderColor: "#000000" }]}><Text style={styles.composerTitle}>Weekly cleaning list</Text><View style={styles.addRow}><TextInput value={draft} onChangeText={setDraft} onSubmitEditing={addTask} returnKeyType="done" placeholder="e.g. Wipe down the counters" placeholderTextColor="#7F7582" style={styles.input}/><TouchableOpacity accessibilityRole="button" onPress={addTask} style={[styles.addButton, { backgroundColor: activePartner.color }]}><Text style={styles.addButtonText}>Add</Text></TouchableOpacity></View></View>
    <View style={styles.templatesCard}><Text style={styles.templatesKicker}>REUSABLE WEEKLY LISTS</Text><Text style={styles.templatesTitle}>Cleaning templates</Text><Text style={styles.templatesCopy}>Save your current chores as a template, then add a saved list to any week without duplicating tasks.</Text><View style={styles.templateSaveRow}><TextInput value={templateName} onChangeText={setTemplateName} placeholder="Name this list" placeholderTextColor="#7F7582" maxLength={28} style={styles.templateInput}/><TouchableOpacity accessibilityRole="button" disabled={!templateName.trim() || !tasks.length} onPress={saveTemplate} style={[styles.templateSaveButton, (!templateName.trim() || !tasks.length) && styles.disabledButton]}><Text style={styles.templateSaveText}>Save list</Text></TouchableOpacity></View>{cleaningTemplates.length ? <View style={styles.templateList}>{cleaningTemplates.map((template) => { const creator = PARTNERS[template.createdBy]; const editing = editingTemplateId === template.id; const confirmingDelete = confirmDeleteId === template.id; return <View key={template.id} style={styles.templateRow}><View style={styles.templateBody}>{editing ? <View style={styles.templateEditForm}><TextInput value={editingName} onChangeText={setEditingName} placeholderTextColor="#7F7582" maxLength={28} style={styles.templateEditName}/><TextInput value={editingTasks} onChangeText={setEditingTasks} placeholder="One task per line" placeholderTextColor="#7F7582" multiline textAlignVertical="top" style={styles.templateEditTasks}/><View style={styles.templateEditActions}><TouchableOpacity accessibilityRole="button" onPress={saveTemplateEdit} style={styles.templateEditSave}><Text style={styles.templateEditSaveText}>Save changes</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" onPress={() => setEditingTemplateId(null)} style={styles.templateTextAction}><Text style={styles.templateTextActionLabel}>Cancel</Text></TouchableOpacity></View></View> : <><Text style={styles.templateName}>{template.name}</Text><Text style={[styles.templateMeta,{color:creator.color}]}>{template.tasks.length} chores · {creator.name} created</Text>{confirmingDelete ? <View style={styles.templateDeleteConfirm}><Text style={styles.templateDeleteCopy}>Delete “{template.name}”?</Text><TouchableOpacity accessibilityRole="button" onPress={() => { deleteCleaningTemplate(template.id); setConfirmDeleteId(null); }} style={styles.templateDeleteButton}><Text style={styles.templateDeleteText}>Delete</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" onPress={() => setConfirmDeleteId(null)} style={styles.templateTextAction}><Text style={styles.templateTextActionLabel}>Keep</Text></TouchableOpacity></View> : <View style={styles.templateManageActions}><TouchableOpacity accessibilityRole="button" onPress={() => startTemplateEdit(template.id, template.name, template.tasks)} style={styles.templateTextAction}><Text style={styles.templateTextActionLabel}>Edit</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" onPress={() => setConfirmDeleteId(template.id)} style={styles.templateDeleteLink}><Text style={styles.templateDeleteLinkText}>Delete</Text></TouchableOpacity></View>}</>}</View>{!editing ? <TouchableOpacity accessibilityRole="button" onPress={() => addTemplateToWeek(template.tasks)} style={[styles.useTemplateButton,{borderColor:creator.color}]}><Text style={[styles.useTemplateText,{color:creator.color}]}>Add to week</Text></TouchableOpacity> : null}</View>; })}</View> : <Text style={styles.noTemplates}>No saved lists yet.</Text>}</View>

    <View style={styles.list}>{tasks.map((task) => { const creator = PARTNERS[task.createdBy]; const completer = task.completedBy ? PARTNERS[task.completedBy] : null; const editing = editingTaskId === task.id; return <View key={task.id} style={[styles.taskCard, task.completed && styles.taskCardDone, { backgroundColor: "transparent", borderColor: "#000000" }]}>{editing ? <View style={styles.taskEditBody}><TextInput value={editingTaskText} onChangeText={setEditingTaskText} placeholder="Cleaning task" placeholderTextColor="#7F7582" style={styles.taskEditInput}/><View style={styles.taskEditActions}><TouchableOpacity onPress={saveTaskEdit} style={[styles.taskEditSave,{backgroundColor:activePartner.color}]}><Text style={styles.taskEditSaveText}>Save</Text></TouchableOpacity><TouchableOpacity onPress={() => { setEditingTaskId(null); setEditingTaskText(""); }} style={styles.templateTextAction}><Text style={styles.templateTextActionLabel}>Cancel</Text></TouchableOpacity></View></View> : <><TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: task.completed }} accessibilityLabel={`Mark ${task.text} ${task.completed ? "incomplete" : "complete"}`} onPress={() => toggleTask(task.id)} style={[styles.checkCircle, task.completed && { backgroundColor: completer?.color ?? COLORS.sage, borderColor: completer?.color ?? COLORS.sage }]}><Text style={styles.checkText}>{task.completed ? "✓" : ""}</Text></TouchableOpacity><View style={styles.taskBody}><Text style={[styles.taskText, task.completed && styles.taskTextDone]}>{task.text}</Text><Text style={[styles.taskMeta, { color: task.completed ? completer?.color : creator.color }]}>{task.completed ? `${completer?.name} completed` : `${creator.name} added`}</Text></View><TouchableOpacity accessibilityRole="button" accessibilityLabel={`Edit ${task.text}`} onPress={() => startTaskEdit(task)} style={styles.taskEditButton}><Text style={styles.taskEditButtonText}>Edit</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" accessibilityLabel={`Delete ${task.text}`} onPress={() => removeTask(task.id)} style={styles.deleteButton}><Text style={styles.deleteText}>×</Text></TouchableOpacity></>}</View>; })}</View>
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
  progressCard: { borderRadius: 20, borderWidth: 1, borderColor: TAB_CARD_PALETTES.cleaning.border, backgroundColor: TAB_CARD_PALETTES.cleaning.surface, padding: 17, gap: 12 },
  progressTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  progressKicker: { color: COLORS.sage, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  progressNumber: { color: COLORS.plum, fontSize: 30, fontWeight: "900", fontStyle: "italic", marginTop: 2 },
  progressTotal: { color: COLORS.slate, fontSize: 17 },
  progressPercent: { color: COLORS.gold, fontSize: 16, fontWeight: "900" },
  progressTrack: { height: 9, overflow: "hidden", borderRadius: 5, backgroundColor: "#283033" },
  progressFill: { height: "100%", borderRadius: 5 },
  partnerCounts: { flexDirection: "row", gap: 14 },
  partnerCount: { fontSize: 11, fontWeight: "900" },
  composer: { borderRadius: 18, borderWidth: 1, borderColor: TAB_CARD_PALETTES.cleaning.border, backgroundColor: TAB_CARD_PALETTES.cleaning.surface, padding: 14, gap: 10 },
  composerTitle: { color: COLORS.plum, fontSize: 17, fontWeight: "900", fontStyle: "italic" },
  addRow: { flexDirection: "row", gap: 8 },
  input: { flex: 1, minHeight: 43, borderRadius: 11, borderWidth: 1, borderColor: "#3A4443", backgroundColor: "#121415", color: COLORS.plum, paddingHorizontal: 11, fontSize: 13 },
  addButton: { minWidth: 58, borderRadius: 11, justifyContent: "center", alignItems: "center" },
  addButtonText: { color: COLORS.white, fontSize: 12, fontWeight: "900" },
  dailyCard: { borderRadius: 18, borderWidth: 1, borderColor: TAB_CARD_PALETTES.cleaning.border, backgroundColor: TAB_CARD_PALETTES.cleaning.surface, padding: 14, gap: 10 },
  dailyHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  dailyKicker: { color: "#9BA6EE", fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  dailyTitle: { color: COLORS.plum, fontSize: 19, fontWeight: "900", fontStyle: "italic", marginTop: 3 },
  dailyCount: { color: "#A7B0EF", fontSize: 18, fontWeight: "900" },
  dailyList: { gap: 7 },
  dailyRow: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, borderColor: "#394155", backgroundColor: "#11131C", padding: 9 },
  dailyCheck: { width: 25, height: 25, borderRadius: 8, borderWidth: 1, borderColor: "#637098", alignItems: "center", justifyContent: "center" },
  dailyCheckText: { color: COLORS.white, fontSize: 14, fontWeight: "900" },
  dailyText: { flex: 1, color: COLORS.plum, fontSize: 13, fontWeight: "700" },
  dailyTextDone: { color: COLORS.slate, textDecorationLine: "line-through" },
  dailyDelete: { width: 24, height: 24, alignItems: "center", justifyContent: "center" },
  dailyDeleteText: { color: "#E98393", fontSize: 19, lineHeight: 20 },
  dailyEmpty: { color: COLORS.slate, fontFamily: "monospace", fontSize: 11, lineHeight: 16 },
  dailyProgressTrack: { height: 7, borderRadius: 4, backgroundColor: "#283149", overflow: "hidden" },
  dailyProgressFill: { height: "100%", borderRadius: 4 },
  dailyProgressLabel: { color: "#A7B0EF", fontSize: 10, fontFamily: "monospace", fontWeight: "900", textAlign: "right", marginTop: -5 },
  completeBanner: { marginTop: 4, padding: 9, borderRadius: 10, alignItems: "center", borderWidth: 1, borderColor: COLORS.gold, backgroundColor: "rgba(198,160,76,.12)" },
  completeTitle: { color: COLORS.gold, fontSize: 11, fontWeight: "900" },
  defaultDailyPanel: { marginTop: 4, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#3C465E", gap: 7 },
  defaultDailyTitle: { color: "#A7B0EF", fontSize: 11, fontWeight: "900", letterSpacing: .6 },
  defaultDailyCopy: { color: COLORS.slate, fontFamily: "monospace", fontSize: 10, lineHeight: 15 },
  defaultDailyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  defaultDailyText: { color: COLORS.plum, flex: 1, fontSize: 11, fontWeight: "700" },
  defaultDailyDelete: { color: "#E98393", fontSize: 18, lineHeight: 20 },
  templatesCard: { display: "none" },
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
  templateManageActions: { flexDirection: "row", gap: 11, marginTop: 7 },
  templateTextAction: { minHeight: 23, justifyContent: "center" },
  templateTextActionLabel: { color: COLORS.slate, fontSize: 10, fontWeight: "900" },
  templateDeleteLink: { minHeight: 23, justifyContent: "center" },
  templateDeleteLinkText: { color: "#E98393", fontSize: 10, fontWeight: "900" },
  templateEditForm: { gap: 7 },
  templateEditName: { minHeight: 37, borderRadius: 8, borderWidth: 1, borderColor: "#46546A", backgroundColor: "#101219", color: COLORS.plum, paddingHorizontal: 9, fontSize: 12, fontWeight: "900" },
  templateEditTasks: { minHeight: 76, borderRadius: 8, borderWidth: 1, borderColor: "#46546A", backgroundColor: "#101219", color: COLORS.plum, padding: 9, fontSize: 11 },
  templateEditActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  templateEditSave: { minHeight: 32, borderRadius: 8, paddingHorizontal: 10, justifyContent: "center", backgroundColor: COLORS.orchid },
  templateEditSaveText: { color: COLORS.white, fontSize: 10, fontWeight: "900" },
  templateDeleteConfirm: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 8 },
  templateDeleteCopy: { color: COLORS.slate, fontSize: 10, fontFamily: "monospace" },
  templateDeleteButton: { minHeight: 28, borderRadius: 7, paddingHorizontal: 8, justifyContent: "center", backgroundColor: "#A43E50" },
  templateDeleteText: { color: COLORS.white, fontSize: 9, fontWeight: "900" },
  useTemplateButton: { minHeight: 31, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  useTemplateText: { fontSize: 9, fontWeight: "900" },
  noTemplates: { color: COLORS.slate, fontFamily: "monospace", fontSize: 10, marginTop: 2 },
  list: { gap: 9 },
  taskCard: { borderRadius: 15, borderWidth: 1, borderColor: TAB_CARD_PALETTES.cleaning.border, backgroundColor: TAB_CARD_PALETTES.cleaning.surface, padding: 12, flexDirection: "row", alignItems: "center", gap: 10 },
  taskCardDone: { backgroundColor: TAB_CARD_PALETTES.cleaning.surface, borderColor: "#365845" },
  checkCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: "#66736D", alignItems: "center", justifyContent: "center" },
  checkText: { color: COLORS.white, fontWeight: "900" },
  taskBody: { flex: 1, gap: 3 },
  taskText: { color: COLORS.plum, fontSize: 14, fontWeight: "800" },
  taskTextDone: { color: COLORS.slate, textDecorationLine: "line-through" },
  taskMeta: { fontSize: 10, fontFamily: "monospace", fontWeight: "800" },
  taskEditBody: { flex: 1, gap: 7 },
  taskEditInput: { minHeight: 38, borderRadius: 8, borderWidth: 1, borderColor: "#46546A", backgroundColor: "#101219", color: COLORS.plum, paddingHorizontal: 9, fontSize: 13 },
  taskEditActions: { flexDirection: "row", gap: 8, alignItems: "center" },
  taskEditSave: { minHeight: 31, borderRadius: 8, paddingHorizontal: 10, justifyContent: "center" },
  taskEditSaveText: { color: COLORS.white, fontSize: 9, fontWeight: "900" },
  taskEditButton: { minHeight: 27, paddingHorizontal: 4, justifyContent: "center" },
  taskEditButtonText: { color: "#A9CDEC", fontSize: 9, fontWeight: "900" },
  deleteButton: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  deleteText: { color: "#8E7682", fontSize: 22, lineHeight: 24 },
  empty: { borderRadius: 18, borderWidth: 1, borderColor: TAB_CARD_PALETTES.cleaning.border, backgroundColor: TAB_CARD_PALETTES.cleaning.surface, padding: 20, alignItems: "center" },
  emptyTitle: { color: COLORS.plum, fontSize: 19, fontWeight: "900", fontStyle: "italic" },
  emptyCopy: { color: COLORS.slate, fontSize: 12, fontFamily: "monospace", lineHeight: 18, textAlign: "center", marginTop: 5 },
});
