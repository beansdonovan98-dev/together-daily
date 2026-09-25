import { AppFrame } from "@/components/app-frame";
import { CompletionCelebration } from "@/components/completion-celebration";
import { PrivateGate } from "@/components/together-access";
import { WeightTrackerSections } from "@/components/weight-tracker-sections";
import { COLORS, TAB_CARD_PALETTES, asObject, localDateKey } from "@/lib/together";
import { cancelMedicineReminder, scheduleMedicineReminder } from "@/lib/medicine-reminders";
import { PARTNERS, type PartnerId, useLocalJournal } from "@/lib/local-journal";
import {
  ScrollView,
  Alert,
  StyleSheet,
} from "react-native";
import { useEffect, useMemo, useState } from "react";
import { VisualText as Text, VisualTextInput as TextInput, VisualTouchableOpacity as TouchableOpacity, VisualView as View } from "@/components/visual-primitives";

type HealthItem = {
  id: string;
  text: string;
  time?: string;
  addedBy?: PartnerId;
  done?: Partial<Record<PartnerId, boolean>>;
  reminder?: boolean;
  reminderTime?: string;
};
const HEALTH_MEALS = [
  { key: "breakfast", emoji: "☀", label: "Breakfast" },
  { key: "lunch", emoji: "☕", label: "Lunch" },
  { key: "dinner", emoji: "🌙", label: "Dinner" },
] as const;
function currentTimeLabel() {
  return new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}
function timeOrder(value: string | undefined) {
  const match = String(value ?? "")
    .trim()
    .match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return Number.MAX_SAFE_INTEGER;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 1 || hour > 12 || minute > 59) return Number.MAX_SAFE_INTEGER;
  if (match[3].toUpperCase() === "PM" && hour !== 12) hour += 12;
  if (match[3].toUpperCase() === "AM" && hour === 12) hour = 0;
  return hour * 60 + minute;
}

export default function HealthScreen() {
  return (
    <PrivateGate>
      {({ userId }) => <HealthContent userId={userId} />}
    </PrivateGate>
  );
}
function HealthContent({ userId }: { userId: PartnerId }) {
  const today = localDateKey();
  const { ready, ensureDay, getDay, updateDay, allDays, healthPeriodVisible, setHealthPeriodVisible } =
    useLocalJournal();
  const [taskDraft, setTaskDraft] = useState("");
  const [medicineDraft, setMedicineDraft] = useState("");
  const [medicineTimeDraft, setMedicineTimeDraft] =
    useState(currentTimeLabel());
  const [editingMedicine, setEditingMedicine] = useState<string | null>(null);
  const [medicineEditDraft, setMedicineEditDraft] = useState("");
  const [medicineEditTime, setMedicineEditTime] = useState("");
  const [editingReminderTime, setEditingReminderTime] = useState<string | null>(null);
  const [reminderTimeDraft, setReminderTimeDraft] = useState("");
  const [medicineReminderFeedback, setMedicineReminderFeedback] = useState("");
  const [snackDraft, setSnackDraft] = useState("");
  const [snackTimeDraft, setSnackTimeDraft] = useState(currentTimeLabel());
  const [editingMealKey, setEditingMealKey] = useState<string | null>(null);
  const [mealEmojiDraft, setMealEmojiDraft] = useState("");
  const [mealLabelDraft, setMealLabelDraft] = useState("");
  useEffect(() => {
    if (ready) ensureDay(today);
  }, [ready, today, ensureDay]);
  const day = asObject(getDay(today));
  const health = asObject(day.health);
  const tasks = (
    Array.isArray(health.tasks) ? health.tasks : []
  ) as HealthItem[];
  const medicines = (
    Array.isArray(health.medicines) ? health.medicines : []
  ) as HealthItem[];
  const snacks = (
    Array.isArray(health.snacks) ? health.snacks : []
  ) as HealthItem[];
  const meals = asObject(day.meals);
  const mealMeta = asObject(day.mealMeta);
  const period = asObject(health.period);
  const water = asObject(day.water);
  const fresh = water.resetDate === today;
  const contributions = fresh ? asObject(water.contributions) : {};
  const waterFor = (id: PartnerId) =>
    Math.max(0, Math.min(8, Number(contributions[id] ?? 0)));
  const healthComplete =
    tasks.length > 0 &&
    tasks.every((item) => item.done?.beans && item.done?.princess);
  const healthWeek = useMemo(() => {
    const dayMap = new Map(
      allDays.map((entry) => [String(entry.date), asObject(entry)]),
    );
    return Array.from({ length: 7 }, (_, index) => {
      const cursor = new Date(`${today}T12:00:00`);
      cursor.setDate(cursor.getDate() - 6 + index);
      const key = cursor.toISOString().slice(0, 10);
      const dailyTasks = Array.isArray(asObject(dayMap.get(key)?.health).tasks)
        ? (asObject(dayMap.get(key)?.health).tasks as HealthItem[])
        : [];
      return {
        key,
        label: cursor.toLocaleDateString("en-US", { weekday: "narrow" }),
        complete:
          dailyTasks.length > 0 &&
          dailyTasks.every((item) => item.done?.beans && item.done?.princess),
      };
    });
  }, [allDays, today]);
  const waterWeek = useMemo(() => {
    const dayMap = new Map(
      allDays.map((entry) => [String(entry.date), asObject(entry)]),
    );
    return Array.from({ length: 7 }, (_, index) => {
      const cursor = new Date(`${today}T12:00:00`);
      cursor.setDate(cursor.getDate() - 6 + index);
      const key = cursor.toISOString().slice(0, 10);
      const dayWater = asObject(dayMap.get(key)?.water);
      const values =
        dayWater.resetDate === key ? asObject(dayWater.contributions) : {};
      const total = Math.min(
        16,
        Number(values.beans ?? 0) + Number(values.princess ?? 0),
      );
      return {
        key,
        label: cursor.toLocaleDateString("en-US", { weekday: "narrow" }),
        total,
        complete: total >= 16,
      };
    });
  }, [allDays, today]);
  const save = (patch: Record<string, unknown>) =>
    updateDay(today, { health: { ...health, ...patch } });
  const add = (
    kind: "tasks" | "medicines",
    text: string,
    clear: () => void,
  ) => {
    const value = text.trim();
    if (!value) return;
    const items = kind === "tasks" ? tasks : medicines;
    const time = kind === "medicines" ? medicineTimeDraft.trim() : undefined;
    if (kind === "medicines" && timeOrder(time) === Number.MAX_SAFE_INTEGER)
      return;
    save({
      [kind]: [
        ...items,
        kind === "tasks"
          ? { id: `${kind}-${Date.now()}`, text: value, done: {} }
          : { id: `${kind}-${Date.now()}`, text: value, time, addedBy: userId, reminder: false },
      ],
    });
    clear();
    if (kind === "medicines") setMedicineTimeDraft(currentTimeLabel());
  };
  const toggle = (kind: "tasks", id: string) => {
    const items = tasks;
    save({
      [kind]: items.map((item) =>
        item.id === id
          ? { ...item, done: { ...item.done, [userId]: !item.done?.[userId] } }
          : item,
      ),
    });
  };
  const remove = (kind: "tasks" | "medicines" | "snacks", id: string) => {
    const items = kind === "tasks" ? tasks : kind === "medicines" ? medicines : snacks;
    if (kind === "medicines") void cancelMedicineReminder(id);
    save({ [kind]: items.filter((item) => item.id !== id) });
  };
  const addSnack = () => {
    const value = snackDraft.trim();
    const time = snackTimeDraft.trim();
    if (!value || timeOrder(time) === Number.MAX_SAFE_INTEGER) return;
    save({ snacks: [...snacks, { id: `snack-${Date.now()}`, text: value, time }] });
    setSnackDraft("");
    setSnackTimeDraft(currentTimeLabel());
  };
  const startMedicineEdit = (item: HealthItem) => {
    setEditingMedicine(item.id);
    setMedicineEditDraft(item.text);
    setMedicineEditTime(item.time || currentTimeLabel());
  };
  const saveMedicineEdit = async () => {
    const value = medicineEditDraft.trim();
    const time = medicineEditTime.trim();
    if (
      !editingMedicine ||
      !value ||
      timeOrder(time) === Number.MAX_SAFE_INTEGER
    )
      return;
    const updated = medicines.map((item) =>
      item.id === editingMedicine ? { ...item, text: value, time } : item,
    );
    const edited = updated.find((item) => item.id === editingMedicine);
    if (edited?.reminder) await scheduleMedicineReminder(edited, false);
    save({ medicines: updated });
    setEditingMedicine(null);
    setMedicineEditDraft("");
    setMedicineEditTime("");
  };
  const toggleMedicineReminder = async (item: HealthItem) => {
    if (item.reminder) {
      await cancelMedicineReminder(item.id);
      save({ medicines: medicines.map((medicine) => medicine.id === item.id ? { ...medicine, reminder: false } : medicine) });
      setMedicineReminderFeedback(`Reminder off for ${item.text}.`);
      return;
    }
    setEditingReminderTime(item.id);
    setReminderTimeDraft(item.reminderTime || item.time || currentTimeLabel());
  };
  const saveMedicineReminder = async (item: HealthItem) => {
    const reminderTime = reminderTimeDraft.trim();
    if (timeOrder(reminderTime) === Number.MAX_SAFE_INTEGER) return;
    const scheduled = await scheduleMedicineReminder({ id: item.id, text: item.text, time: item.time, reminderTime, reminder: true });
    if (!scheduled) {
      Alert.alert("Reminder not set", "Allow Together Daily notifications in your phone settings, then try again.");
      return;
    }
    save({ medicines: medicines.map((medicine) => medicine.id === item.id ? { ...medicine, reminder: true, reminderTime } : medicine) });
    setEditingReminderTime(null);
    setReminderTimeDraft("");
    setMedicineReminderFeedback(`Daily reminder set for ${reminderTime}.`);
  };
  const adjustWater = (delta: number) => {
    const mine = waterFor(userId);
    const next = Math.max(0, Math.min(8, mine + delta));
    if (next === mine) return;
    updateDay(today, {
      water: {
        ...water,
        resetDate: today,
        dailyGoalGlasses: 8,
        contributions: { ...contributions, [userId]: next },
        glassesLogged: waterFor("beans") + waterFor("princess") - mine + next,
      },
    });
  };
  const saveMealEdit = (key: string) => {
    const emoji = mealEmojiDraft.trim();
    const label = mealLabelDraft.trim();
    if (!emoji || !label) return;
    updateDay(today, { mealMeta: { ...mealMeta, [key]: { emoji, label } } });
    setEditingMealKey(null);
  };
  const periodSymptoms = Array.isArray(period.symptoms)
    ? period.symptoms.map(String)
    : [];
  const togglePeriodSymptom = (symptom: string) => {
    const nextSymptoms = periodSymptoms.includes(symptom)
      ? periodSymptoms.filter((value) => value !== symptom)
      : [...periodSymptoms, symptom];
    save({ period: { ...period, symptoms: nextSymptoms } });
  };
  if (!ready)
    return (
      <AppFrame>
        <View style={styles.loading}>
          <Text>Opening Health…</Text>
        </View>
      </AppFrame>
    );
  const list = (
    title: string,
    kind: "tasks" | "medicines",
    items: HealthItem[],
    draft: string,
    setDraft: (text: string) => void,
  ) => (
    <View style={[styles.card, { backgroundColor: "transparent", borderColor: "#000000" }]}>
      <Text style={styles.kicker}>
        {kind === "tasks" ? "DAILY HEALTH" : "MEDICINE"}
      </Text>
      <Text style={styles.title}>{title}</Text>
      {(kind === "medicines"
        ? [...items].sort((a, b) => timeOrder(a.time) - timeOrder(b.time))
        : items
      ).map((item) =>
        editingMedicine === item.id ? (
          <View key={item.id} style={styles.editRow}>
            <TextInput
              value={medicineEditDraft}
              onChangeText={setMedicineEditDraft}
              style={styles.input}
            />
            <TextInput
              value={medicineEditTime}
              onChangeText={setMedicineEditTime}
              placeholder="8:30 AM"
              placeholderTextColor="#7F7582"
              style={styles.timeInput}
            />
            <TouchableOpacity
              onPress={() => { void saveMedicineEdit(); }}
              style={[styles.add, { backgroundColor: PARTNERS[userId].color }]}
            >
              <Text style={styles.addText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEditingMedicine(null)}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View key={item.id} style={styles.medicineItem}>
          <View style={styles.row}>
            {kind === "tasks" ? <TouchableOpacity
              onPress={() => toggle("tasks", item.id)}
              style={[
                styles.check,
                item.done?.[userId] && {
                  backgroundColor: PARTNERS[userId].color,
                },
              ]}
            >
              <Text style={styles.checkText}>
                {item.done?.[userId] ? "✓" : ""}
              </Text>
            </TouchableOpacity> : null}
            <View style={styles.item}>
              <Text
                style={[styles.itemText, item.done?.[userId] && styles.done]}
              >
                {item.text}
              </Text>
              {kind === "medicines" ? (
                <>
                  <Text style={styles.timeText}>{item.time || "No time"}</Text>
                  <Text style={[styles.medicineAddedBy, { color: PARTNERS[item.addedBy ?? "beans"].color }]}>{PARTNERS[item.addedBy ?? "beans"].avatar} Added by {PARTNERS[item.addedBy ?? "beans"].name}</Text>
                </>
              ) : null}
            </View>
            {kind === "medicines" ? <><TouchableOpacity onPress={() => { void toggleMedicineReminder(item); }}><Text style={styles.reminderLink}>{item.reminder ? `Reminder ${item.reminderTime || item.time || "on"}` : "Set reminder time"}</Text></TouchableOpacity><TouchableOpacity onPress={() => startMedicineEdit(item)}><Text style={styles.edit}>Edit log</Text></TouchableOpacity></> : null}
            <TouchableOpacity onPress={() => remove(kind, item.id)}>
              <Text style={styles.delete}>×</Text>
            </TouchableOpacity>
          </View>
          {kind === "medicines" && editingReminderTime === item.id ? <View style={styles.reminderTimeRow}><Text style={styles.reminderTimeLabel}>REMIND ME AT</Text><TextInput value={reminderTimeDraft} onChangeText={setReminderTimeDraft} placeholder="8:30 AM" placeholderTextColor="#7F7582" style={styles.timeInput}/><TouchableOpacity onPress={() => { void saveMedicineReminder(item); }} style={[styles.add, { backgroundColor: PARTNERS[userId].color }]}><Text style={styles.addText}>Save reminder</Text></TouchableOpacity><TouchableOpacity onPress={() => { setEditingReminderTime(null); setReminderTimeDraft(""); }}><Text style={styles.cancel}>Cancel</Text></TouchableOpacity></View> : null}
          </View>
        ),
      )}
      <View style={styles.addRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={() => add(kind, draft, () => setDraft(""))}
          placeholder={
            kind === "tasks" ? "Add daily health task" : "Add medicine"
          }
          placeholderTextColor="#7F7582"
          style={styles.input}
        />
        {kind === "medicines" ? (
          <TextInput
            value={medicineTimeDraft}
            onChangeText={setMedicineTimeDraft}
            placeholder="8:30 AM"
            placeholderTextColor="#7F7582"
            style={styles.timeInput}
          />
        ) : null}
        <TouchableOpacity
          onPress={() => add(kind, draft, () => setDraft(""))}
          style={[styles.add, { backgroundColor: PARTNERS[userId].color }]}
        >
          <Text style={styles.addText}>Add</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  const medicineLog = list(
    "Medicine log",
    "medicines",
    medicines,
    medicineDraft,
    setMedicineDraft,
  );
  const medicineNotifications = <Text style={styles.reminderFeedback}>{medicineReminderFeedback || "Tap Set reminder beside a medicine to receive a private daily notification on this phone."}</Text>;
  const periodTracker = <View style={[styles.card, { backgroundColor: "transparent", borderColor: "#000000" }]}>
    <Text style={styles.kicker}>PERIOD TRACKER</Text>
    <Text style={styles.title}>Cycle check-in</Text>
    <Text style={styles.copy}>Track cycle details privately in your shared Health page.</Text>
    <Text style={styles.periodLabel}>CYCLE STATUS</Text>
    <View style={styles.optionRow}>{["Not on period", "Started", "On period", "Ended", "Spotting"].map((option) => <TouchableOpacity key={option} onPress={() => save({ period: { ...period, status: option } })} style={[styles.optionChip, period.status === option && styles.optionChipActive]}><Text style={styles.optionText}>{option}</Text></TouchableOpacity>)}</View>
    <Text style={styles.periodLabel}>FLOW</Text>
    <View style={styles.optionRow}>{["None", "Light", "Medium", "Heavy"].map((option) => <TouchableOpacity key={option} onPress={() => save({ period: { ...period, flow: option } })} style={[styles.optionChip, period.flow === option && styles.optionChipActive]}><Text style={styles.optionText}>{option}</Text></TouchableOpacity>)}</View>
    <Text style={styles.periodLabel}>MOOD</Text>
    <View style={styles.optionRow}>{["🙂 Good", "😌 Calm", "🥺 Sensitive", "😣 Low", "😤 Irritable"].map((option) => <TouchableOpacity key={option} onPress={() => save({ period: { ...period, mood: option } })} style={[styles.optionChip, period.mood === option && styles.optionChipActive]}><Text style={styles.optionText}>{option}</Text></TouchableOpacity>)}</View>
    <Text style={styles.periodLabel}>SYMPTOMS · TAP ALL THAT APPLY</Text>
    <View style={styles.optionRow}>{["Cramps", "Headache", "Bloating", "Fatigue", "Back ache", "Nausea"].map((symptom) => <TouchableOpacity key={symptom} onPress={() => togglePeriodSymptom(symptom)} style={[styles.optionChip, periodSymptoms.includes(symptom) && styles.optionChipActive]}><Text style={styles.optionText}>{symptom}</Text></TouchableOpacity>)}</View>
    <Text style={styles.periodLabel}>PAIN LEVEL</Text>
    <View style={styles.optionRow}>{[0, 1, 2, 3, 4, 5].map((level) => <TouchableOpacity key={level} onPress={() => save({ period: { ...period, painLevel: level } })} style={[styles.levelChip, Number(period.painLevel ?? 0) === level && styles.optionChipActive]}><Text style={styles.optionText}>{level}</Text></TouchableOpacity>)}</View>
    <TextInput value={String(period.startDate ?? "")} onChangeText={(value) => save({ period: { ...period, startDate: value } })} placeholder="Start date (YYYY-MM-DD)" placeholderTextColor="#7F7582" style={styles.mealInput}/>
    <TextInput value={String(period.endDate ?? "")} onChangeText={(value) => save({ period: { ...period, endDate: value } })} placeholder="End date (YYYY-MM-DD)" placeholderTextColor="#7F7582" style={styles.mealInput}/>
    <TextInput value={String(period.notes ?? "")} onChangeText={(value) => save({ period: { ...period, notes: value } })} multiline placeholder="Symptoms, flow, or notes…" placeholderTextColor="#7F7582" style={styles.mealInput}/>
  </View>;
  return (
    <AppFrame>
      <ScrollView
        contentContainerStyle={[
          styles.page,
          { backgroundColor: "transparent" },
        ]}
      >
        {
          <View>
            <Text style={styles.eyebrow}>SHARED DAILY CARE</Text>
            <Text style={styles.hero}>Health</Text>
            <Text style={styles.copy}>
              Your health list carries forward each day. Each partner marks their
              own care items fresh for the new day.
            </Text>
          </View>
        }
        {healthComplete ? <CompletionCelebration title="Daily Health complete!" detail="You both finished every care task for today." /> : null}
        {list("Daily health list", "tasks", tasks, taskDraft, setTaskDraft)}
        <View style={styles.week}>
          <Text style={styles.weekLabel}>SEVEN-DAY HEALTH</Text>
          <View style={styles.weekRow}>
            {healthWeek.map((entry) => (
              <View
                key={entry.key}
                style={[
                  styles.weekDay,
                  entry.complete && styles.weekDayComplete,
                ]}
              >
                <Text style={styles.weekName}>{entry.label}</Text>
                <Text style={styles.weekTotal}>
                  {entry.complete ? "✓" : "·"}
                </Text>
              </View>
            ))}
          </View>
        </View>
        {medicineLog}
        {medicineNotifications}
        <View style={[styles.card, { backgroundColor: "transparent", borderColor: "#000000" }]}>
          <Text style={styles.kicker}>MEAL PLANNER</Text>
          <Text style={styles.title}>Meals</Text>
          {HEALTH_MEALS.map((item) => {
            const override = asObject(mealMeta[item.key]);
            const emoji = String(override.emoji ?? item.emoji);
            const label = String(override.label ?? item.label);
            const doneKey = `${item.key}Done`;
            const editing = editingMealKey === item.key;
            return (
              <View key={item.key} style={styles.mealBlock}>
                <View style={styles.mealRow}>
                  <Text style={styles.mealEmoji}>{emoji}</Text>
                  <View style={styles.item}>
                    <Text style={styles.itemText}>{label}</Text>
                    <TextInput
                      value={String(meals[item.key] ?? "")}
                      onChangeText={(value) =>
                        updateDay(today, {
                          meals: { ...meals, [item.key]: value },
                        })
                      }
                      placeholder={`Plan ${label.toLowerCase()}…`}
                      placeholderTextColor="#7F7582"
                      style={styles.mealInput}
                    />
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      updateDay(today, {
                        meals: { ...meals, [doneKey]: !meals[doneKey] },
                      })
                    }
                    style={styles.mealDone}
                  >
                    <Text style={styles.edit}>
                      {meals[doneKey] ? "✓" : "Done"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setEditingMealKey(item.key);
                      setMealEmojiDraft(emoji);
                      setMealLabelDraft(label);
                    }}
                  >
                    <Text style={styles.edit}>Edit</Text>
                  </TouchableOpacity>
                </View>
                {editing ? (
                  <View style={styles.editRow}>
                    <TextInput
                      value={mealEmojiDraft}
                      onChangeText={setMealEmojiDraft}
                      style={styles.timeInput}
                    />
                    <TextInput
                      value={mealLabelDraft}
                      onChangeText={setMealLabelDraft}
                      style={styles.input}
                    />
                    <TouchableOpacity
                      onPress={() => saveMealEdit(item.key)}
                      style={[
                        styles.add,
                        { backgroundColor: PARTNERS[userId].color },
                      ]}
                    >
                      <Text style={styles.addText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
        <View style={[styles.card, { backgroundColor: "transparent", borderColor: "#000000" }]}>
          <Text style={styles.kicker}>SNACK LOG</Text>
          <Text style={styles.title}>Snack tracker</Text>
          <Text style={styles.copy}>Log what you ate and the time you had it.</Text>
          {[...snacks].sort((a, b) => timeOrder(a.time) - timeOrder(b.time)).map((snack) => (
            <View key={snack.id} style={styles.row}>
              <View style={styles.item}>
                <Text style={styles.itemText}>{snack.text}</Text>
                <Text style={styles.timeText}>{snack.time || "No time"}</Text>
              </View>
              <TouchableOpacity onPress={() => remove("snacks", snack.id)}>
                <Text style={styles.delete}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
          <View style={styles.addRow}>
            <TextInput value={snackDraft} onChangeText={setSnackDraft} onSubmitEditing={addSnack} placeholder="What did you have?" placeholderTextColor="#7F7582" style={styles.input}/>
            <TextInput value={snackTimeDraft} onChangeText={setSnackTimeDraft} placeholder="8:30 AM" placeholderTextColor="#7F7582" style={styles.timeInput}/>
            <TouchableOpacity onPress={addSnack} style={[styles.add, { backgroundColor: PARTNERS[userId].color }]}><Text style={styles.addText}>Add</Text></TouchableOpacity>
          </View>
        </View>
        <View style={[styles.card, { backgroundColor: "transparent", borderColor: "#000000" }]}>
          <Text style={styles.kicker}>DAILY WATER</Text>
          <Text style={styles.title}>Water tracker</Text>
          <Text style={styles.copy}>Eight glasses each, reset daily.</Text>
          {(["beans", "princess"] as PartnerId[]).map((id) => (
            <View key={id} style={styles.waterRow}>
              <Text style={{ color: PARTNERS[id].color, fontWeight: "900" }}>
                {PARTNERS[id].avatar} {PARTNERS[id].name}
              </Text>
              <View style={styles.controls}>
                <TouchableOpacity
                  disabled={id !== userId || waterFor(id) === 0}
                  onPress={() => adjustWater(-1)}
                  style={styles.waterButton}
                >
                  <Text style={styles.waterButtonText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.count}>{waterFor(id)}/8</Text>
                <TouchableOpacity
                  disabled={id !== userId || waterFor(id) === 8}
                  onPress={() => adjustWater(1)}
                  style={styles.waterButton}
                >
                  <Text style={styles.waterButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <View style={styles.week}>
            <Text style={styles.weekLabel}>WEEKLY WATER</Text>
            <View style={styles.weekRow}>
              {waterWeek.map((entry) => (
                <View
                  key={entry.key}
                  style={[
                    styles.weekDay,
                    entry.complete && styles.weekDayComplete,
                  ]}
                >
                  <Text style={styles.weekName}>{entry.label}</Text>
                  <Text style={styles.weekTotal}>{entry.total}/16</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
        <WeightTrackerSections userId={userId} today={today} day={day} allDays={allDays} updateDay={updateDay} />
        <View style={[styles.card, { backgroundColor: "transparent", borderColor: "#000000" }]}>
          <Text style={styles.kicker}>OPTIONAL SECTION</Text>
          <Text style={styles.title}>Period tracker</Text>
          <Text style={styles.copy}>Keep this private section visible only when it is useful.</Text>
          <TouchableOpacity accessibilityRole="button" onPress={() => setHealthPeriodVisible(!healthPeriodVisible)} style={styles.add}>
            <Text style={styles.addText}>{healthPeriodVisible ? "Hide period tracker" : "Show period tracker"}</Text>
          </TouchableOpacity>
        </View>
        {healthPeriodVisible ? periodTracker : null}
      </ScrollView>
    </AppFrame>
  );
}
const styles = StyleSheet.create({
  page: { padding: 18, paddingBottom: 36, gap: 14 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  eyebrow: {
    color: COLORS.gold,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  hero: {
    color: COLORS.plum,
    fontSize: 32,
    fontWeight: "900",
    fontStyle: "italic",
  },
  copy: {
    color: COLORS.slate,
    fontFamily: "monospace",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },
  celebrate: {
    backgroundColor: "rgba(198,160,76,.13)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.gold,
    padding: 12,
    alignItems: "center",
  },
  celebrateTitle: { color: COLORS.gold, fontWeight: "900", fontSize: 14 },
  celebrateCopy: {
    color: COLORS.slate,
    fontFamily: "monospace",
    fontSize: 10,
    marginTop: 3,
  },
  card: {
    backgroundColor: TAB_CARD_PALETTES.health.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: TAB_CARD_PALETTES.health.border,
    padding: 14,
    gap: 9,
  },
  kicker: {
    color: "#66B7DD",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  title: {
    color: COLORS.plum,
    fontSize: 20,
    fontWeight: "900",
    fontStyle: "italic",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#363D49",
    backgroundColor: "#11131A",
    padding: 9,
  },
  medicineItem: { gap: 7 },
  editRow: { flexDirection: "row", gap: 7, alignItems: "center" },
  check: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#64739A",
    alignItems: "center",
    justifyContent: "center",
  },
  checkText: { color: "#fff", fontWeight: "900" },
  item: { flex: 1 },
  itemText: { color: COLORS.plum, fontSize: 13, fontWeight: "700" },
  timeText: {
    color: "#8FC8EF",
    fontSize: 10,
    fontFamily: "monospace",
    marginTop: 2,
  },
  medicineAddedBy: { fontSize: 9, fontWeight: "900", marginTop: 3 },
  done: { color: COLORS.slate, textDecorationLine: "line-through" },
  delete: { color: "#E98393", fontSize: 20 },
  edit: { color: "#A9CDEC", fontSize: 9, fontWeight: "900" },
  cancel: { color: COLORS.slate, fontSize: 9, fontWeight: "900" },
  reminderLink: { color: COLORS.gold, fontSize: 9, fontWeight: "900", textAlign: "right" },
  reminderTimeRow: { flexDirection: "row", flexWrap: "wrap", gap: 7, alignItems: "center", paddingHorizontal: 8, paddingBottom: 2 },
  reminderTimeLabel: { color: "#8FC8EF", fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  reminderFeedback: { color: COLORS.slate, fontFamily: "monospace", fontSize: 10, lineHeight: 15, marginTop: -9 },
  notificationButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#4A6687",
  },
  reminderText: { color: "#8FC8EF", fontSize: 8, fontWeight: "900" },
  addRow: { flexDirection: "row", gap: 8 },
  input: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#39455B",
    backgroundColor: "#101219",
    color: COLORS.plum,
    paddingHorizontal: 10,
  },
  timeInput: {
    width: 76,
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#465B78",
    backgroundColor: "#101219",
    color: COLORS.plum,
    paddingHorizontal: 8,
    fontSize: 10,
  },
  mealInput: {
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#365F82",
    backgroundColor: "#101923",
    color: COLORS.plum,
    paddingHorizontal: 10,
  },
  mealBlock: {
    gap: 7,
    borderTopWidth: 1,
    borderTopColor: "#304354",
    paddingTop: 9,
  },
  mealRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  mealEmoji: { fontSize: 20 },
  mealDone: {
    borderWidth: 1,
    borderColor: "#54738D",
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 5,
  },
  add: {
    minWidth: 54,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  addText: { color: "#fff", fontWeight: "900", fontSize: 11 },
  waterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#101923",
    padding: 10,
  },
  controls: { flexDirection: "row", alignItems: "center", gap: 10 },
  waterButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#54738D",
    alignItems: "center",
    justifyContent: "center",
  },
  waterButtonText: { color: COLORS.plum, fontSize: 18, fontWeight: "900" },
  count: {
    color: COLORS.plum,
    fontWeight: "900",
    minWidth: 34,
    textAlign: "center",
  },
  week: { borderTopWidth: 1, borderTopColor: "#31516D", paddingTop: 9 },
  weekLabel: {
    color: "#66B7DD",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  weekRow: { flexDirection: "row", gap: 4, marginTop: 7 },
  weekDay: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#101923",
    borderRadius: 7,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#2C465E",
  },
  weekDayComplete: {
    backgroundColor: "rgba(99,200,163,.13)",
    borderColor: "#63C8A3",
  },
  weekName: { color: COLORS.slate, fontSize: 8, fontWeight: "900" },
  weekTotal: {
    color: COLORS.plum,
    fontSize: 9,
    fontWeight: "900",
    marginTop: 2,
  },
  periodLabel: { color: "#D38BA8", fontSize: 9, fontWeight: "900", letterSpacing: 0.9, marginTop: 4 },
  optionRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  optionChip: { backgroundColor: "#14131A", borderRadius: 14, paddingHorizontal: 9, paddingVertical: 6 },
  levelChip: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#14131A", alignItems: "center", justifyContent: "center" },
  optionChipActive: { backgroundColor: "#8D5BA6" },
  optionText: { color: COLORS.plum, fontSize: 9, fontWeight: "900" },
});
