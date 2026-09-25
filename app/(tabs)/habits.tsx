import { AppFrame } from "@/components/app-frame";
import { CompletionCelebration } from "@/components/completion-celebration";
import { getSubheading } from "@/components/personalization-editor";
import { PrivateGate } from "@/components/together-access";
import { DEFAULT_AFFECTION_GOALS, type AffectionGoalKey } from "@/lib/affection-goals";
import { COLORS as BASE_COLORS, TAB_CARD_PALETTES, asObject, localDateKey, prettyDate } from "@/lib/together";
import { PARTNERS, type PartnerId, useLocalJournal } from "@/lib/local-journal";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, ScrollView, StyleSheet } from "react-native";
import { VisualText as Text, VisualTextInput as TextInput, VisualTouchableOpacity as TouchableOpacity, VisualView as View } from "@/components/visual-primitives";

const COLORS = {
  ...BASE_COLORS,
  ink: TAB_CARD_PALETTES.habits.surface,
  surface: TAB_CARD_PALETTES.habits.surface,
};

function hasBothAffectionCompleted(day: Record<string, unknown> | undefined, goalKeys: AffectionGoalKey[]) {
  const affection = asObject(day?.affection);
  return (["beans", "princess"] as PartnerId[]).every((partnerId) => goalKeys.reduce((total, key) => {
    const contribution = asObject(asObject(affection.contributions)[key]);
    return total + Math.max(0, Number(contribution[partnerId] ?? 0));
  }, 0) >= 6);
}

export default function HabitsScreen() {
  return <PrivateGate>{({ userId }) => <HabitsContent userId={userId} />}</PrivateGate>;
}

function HabitsContent({ userId }: { userId: PartnerId }) {
  const today = localDateKey();
  const {
    ready,
    getDay,
    updateDay,
    allDays,
    ensureDay,
    customSubheadings,
    theme,
    affectionGoals,
    updateAffectionGoal,
  } = useLocalJournal();
  const [celebrating, setCelebrating] = useState<PartnerId | null>(null);
  const [editingGoalKey, setEditingGoalKey] = useState<AffectionGoalKey | null>(null);
  const [goalLabelDraft, setGoalLabelDraft] = useState("");
  const [goalEmojiDraft, setGoalEmojiDraft] = useState("");
  const celebrationProgress = useRef(new Animated.Value(0)).current;
  const goals = affectionGoals.length ? affectionGoals : DEFAULT_AFFECTION_GOALS;
  const goalKeys = useMemo(() => affectionGoals.length ? affectionGoals.map((goal) => goal.key) : DEFAULT_AFFECTION_GOALS.map((goal) => goal.key), [affectionGoals]);
  const content = asObject(getDay(today));
  const affection = asObject(content.affection);

  useEffect(() => {
    if (ready) ensureDay(today);
  }, [ensureDay, ready, today]);

  useEffect(() => {
    if (!celebrating) return;
    celebrationProgress.setValue(0);
    const animation = Animated.sequence([
      Animated.spring(celebrationProgress, { toValue: 1, useNativeDriver: true, damping: 11, stiffness: 180 }),
      Animated.delay(1850),
      Animated.timing(celebrationProgress, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]);
    animation.start(({ finished }) => {
      if (finished) setCelebrating(null);
    });
    return () => animation.stop();
  }, [celebrating, celebrationProgress]);

  const contributionFor = (key: AffectionGoalKey, partnerId: PartnerId, source = affection) =>
    Math.max(0, Number(asObject(asObject(source.contributions)[key])[partnerId] ?? 0));
  const dailyContributionTotal = (partnerId: PartnerId, source = affection) =>
    goalKeys.reduce((total, key) => total + contributionFor(key, partnerId, source), 0);
  const startGoalEdit = (key: AffectionGoalKey) => {
    const goal = goals.find((item) => item.key === key);
    if (!goal) return;
    setEditingGoalKey(key);
    setGoalLabelDraft(goal.label);
    setGoalEmojiDraft(goal.emoji);
  };
  const saveGoalEdit = () => {
    if (!editingGoalKey) return;
    updateAffectionGoal(editingGoalKey, { label: goalLabelDraft, emoji: goalEmojiDraft });
    setEditingGoalKey(null);
    setGoalLabelDraft("");
    setGoalEmojiDraft("");
  };
  const adjustAffection = (key: AffectionGoalKey, delta: number) => {
    const total = Math.max(0, Math.min(6, Number(affection[key] ?? 0)));
    const contributions = asObject(affection.contributions);
    const current = asObject(contributions[key]);
    const mine = Math.max(0, Number(current[userId] ?? 0));
    if ((delta < 0 && mine === 0) || (delta > 0 && total >= 6)) return;
    const nextTotal = Math.max(0, Math.min(6, total + delta));
    const nextAffection = {
      ...affection,
      [key]: nextTotal,
      contributions: { ...contributions, [key]: { ...current, [userId]: Math.max(0, mine + delta) } },
    };
    const celebrations = asObject(content.affectionCelebrations);
    const shouldCelebrate = delta > 0 && dailyContributionTotal(userId, nextAffection) >= 6 && !celebrations[userId];
    updateDay(today, {
      affection: nextAffection,
      affectionCelebrations: shouldCelebrate ? { ...celebrations, [userId]: true } : celebrations,
    });
    if (shouldCelebrate) setCelebrating(userId);
  };
  const sharedAffectionStreak = useMemo(() => {
    const dayMap = new Map(allDays.map((day) => [String(day.date), asObject(day)]));
    const cursor = new Date(`${today}T12:00:00`);
    if (!hasBothAffectionCompleted(dayMap.get(today), goalKeys)) cursor.setDate(cursor.getDate() - 1);
    let count = 0;
    while (true) {
      const key = cursor.toISOString().slice(0, 10);
      if (!hasBothAffectionCompleted(dayMap.get(key), goalKeys)) break;
      count += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }, [allDays, goalKeys, today]);
  const weekDays = useMemo(() => {
    const dayMap = new Map(allDays.map((day) => [String(day.date), asObject(day)]));
    return Array.from({ length: 7 }, (_, index) => {
      const cursor = new Date(`${today}T12:00:00`);
      cursor.setDate(cursor.getDate() - 6 + index);
      const dateKey = cursor.toISOString().slice(0, 10);
      return {
        dateKey,
        label: cursor.toLocaleDateString("en-US", { weekday: "narrow" }),
        number: cursor.getDate(),
        isToday: dateKey === today,
        complete: hasBothAffectionCompleted(dayMap.get(dateKey), goalKeys),
      };
    });
  }, [allDays, goalKeys, today]);
  const sixLittleThingsComplete = hasBothAffectionCompleted(content, goalKeys);

  return <AppFrame><ScrollView contentContainerStyle={[styles.page, { backgroundColor: theme.backgroundColor ?? COLORS.blush }]} showsVerticalScrollIndicator={false}>
    {sixLittleThingsComplete ? <CompletionCelebration title="Six little things complete!" detail="You both finished your shared little things for today." /> : null}
    <Text style={styles.eyebrow}>GOOD HABITS</Text>
    <Text style={styles.title}>Little things, often.</Text>
    <Text style={styles.copy}>{prettyDate(today)} · {getSubheading(customSubheadings, "goodHabits")}</Text>

    <View style={styles.affectionCard}>
      <View style={styles.affectionHeader}>
        <View><Text style={styles.affectionKicker}>SHARED DAILY AFFECTION</Text><Text style={styles.affectionTitle}>Six little things</Text></View>
        <Text style={styles.affectionGoal}>6 EACH</Text>
      </View>
      <Text style={styles.affectionCopy}>Add to the shared count whenever the moment happens. Tap Edit to personalize each little thing for both of you.</Text>
      {celebrating ? <Animated.View style={[styles.celebrationBanner, { opacity: celebrationProgress, transform: [{ scale: celebrationProgress.interpolate({ inputRange: [0, 1], outputRange: [.82, 1] }) }] }]}>
        <Text style={styles.celebrationSparkles}>✦ ✦ ✦</Text>
        <Text style={[styles.celebrationTitle, { color: PARTNERS[celebrating].color }]}>{PARTNERS[celebrating].name} completed six little things!</Text>
        <Text style={styles.celebrationCopy}>A loving daily win, saved just for today.</Text>
      </Animated.View> : null}
      <View style={styles.affectionList}>{goals.map((goal) => {
        const count = Math.max(0, Math.min(6, Number(affection[goal.key] ?? 0)));
        const beansCount = contributionFor(goal.key, "beans");
        const princessCount = contributionFor(goal.key, "princess");
        const mine = contributionFor(goal.key, userId);
        const editing = editingGoalKey === goal.key;
        return <View key={goal.key} style={styles.affectionRow}>
          {editing ? <View style={styles.goalEditBody}>
            <View style={styles.goalEditInputs}>
              <TextInput value={goalEmojiDraft} onChangeText={setGoalEmojiDraft} maxLength={12} placeholder="✨" placeholderTextColor="#7F7582" style={styles.goalEmojiInput} />
              <TextInput value={goalLabelDraft} onChangeText={setGoalLabelDraft} maxLength={40} placeholder="Little thing" placeholderTextColor="#7F7582" style={styles.goalLabelInput} />
            </View>
            <View style={styles.goalEditActions}>
              <TouchableOpacity accessibilityRole="button" onPress={saveGoalEdit} style={[styles.goalSaveButton, { backgroundColor: PARTNERS[userId].color }]}><Text style={styles.goalSaveText}>Save</Text></TouchableOpacity>
              <TouchableOpacity accessibilityRole="button" onPress={() => setEditingGoalKey(null)} style={styles.goalEditLink}><Text style={styles.goalEditLinkText}>Cancel</Text></TouchableOpacity>
            </View>
          </View> : <>
            <Text style={styles.affectionEmoji}>{goal.emoji}</Text>
            <View style={styles.affectionMain}>
              <View style={styles.affectionTop}><Text style={styles.affectionLabel}>{goal.label}</Text><Text style={styles.affectionCount}>{count} / 6</Text></View>
              <View style={styles.dotRow}>{[1, 2, 3, 4, 5, 6].map((step) => <View key={step} style={[styles.goalDot, step <= count && styles.goalDotDone]} />)}</View>
              <View style={styles.contributionRow}>
                <View style={styles.contribution}><Text style={[styles.contributionName, { color: PARTNERS.beans.color }]}>{PARTNERS.beans.avatar} {PARTNERS.beans.name.toUpperCase()}</Text><Text style={[styles.contributionCount, { color: PARTNERS.beans.color }]}>{beansCount}</Text></View>
                <View style={styles.contribution}><Text style={[styles.contributionName, { color: PARTNERS.princess.color }]}>{PARTNERS.princess.avatar} {PARTNERS.princess.name.toUpperCase()}</Text><Text style={[styles.contributionCount, { color: PARTNERS.princess.color }]}>{princessCount}</Text></View>
              </View>
            </View>
            <View style={styles.goalActions}>
              <TouchableOpacity accessibilityRole="button" onPress={() => startGoalEdit(goal.key)} style={styles.goalEditLink}><Text style={styles.goalEditLinkText}>Edit</Text></TouchableOpacity>
              <View style={styles.counterRow}>
                <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Decrease ${goal.label}`} style={styles.counterButton} onPress={() => adjustAffection(goal.key, -1)} disabled={mine === 0}><Text style={[styles.counterText, mine === 0 && styles.counterDisabled]}>−</Text></TouchableOpacity>
                <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Increase ${goal.label}`} style={styles.counterButton} onPress={() => adjustAffection(goal.key, 1)} disabled={count === 6}><Text style={[styles.counterText, count === 6 && styles.counterDisabled]}>+</Text></TouchableOpacity>
              </View>
            </View>
          </>}
        </View>;
      })}</View>
      <View style={styles.dailyContributionSummary}>
        <View><Text style={[styles.dailyContributionName, { color: PARTNERS.beans.color }]}>{PARTNERS.beans.avatar} {PARTNERS.beans.name} today</Text><Text style={styles.dailyContributionValue}>{dailyContributionTotal("beans")} / 6</Text></View>
        <View style={styles.dailyContributionDivider} />
        <View><Text style={[styles.dailyContributionName, { color: PARTNERS.princess.color }]}>{PARTNERS.princess.avatar} {PARTNERS.princess.name} today</Text><Text style={styles.dailyContributionValue}>{dailyContributionTotal("princess")} / 6</Text></View>
      </View>
      <View style={styles.sharedStreakCard}><View><Text style={styles.sharedStreakKicker}>OUR SHARED STREAK</Text><Text style={styles.sharedStreakCopy}>Days where you both reached six.</Text></View><View style={styles.sharedStreakCount}><Text style={styles.sharedStreakNumber}>{sharedAffectionStreak}</Text><Text style={styles.sharedStreakUnit}>{sharedAffectionStreak === 1 ? "DAY" : "DAYS"}</Text></View></View>
    </View>
    <View style={styles.weekCard}><View style={styles.weekHeader}><View><Text style={styles.weekKicker}>SEVEN DAYS OF US</Text><Text style={styles.weekTitle}>Shared affection week</Text></View><Text style={styles.weekMeta}>{sharedAffectionStreak} day streak</Text></View><View style={styles.weekRow}>{weekDays.map((day) => <View key={day.dateKey} style={[styles.weekDay, day.complete && styles.weekDayComplete, day.isToday && styles.weekDayToday]}><Text style={[styles.weekDayLabel, day.complete && styles.weekDayLabelComplete]}>{day.label}</Text><Text style={[styles.weekDayNumber, day.complete && styles.weekDayNumberComplete]}>{day.number}</Text><Text style={[styles.weekDayMark, day.complete && styles.weekDayMarkComplete]}>{day.complete ? "♥" : "·"}</Text></View>)}</View><Text style={styles.weekCaption}>A heart marks a day where you both completed all six little things.</Text></View>
  </ScrollView></AppFrame>;
}

const styles = StyleSheet.create({
  page: { padding: 18, paddingBottom: 36, gap: 14, backgroundColor: COLORS.blush },
  eyebrow: { color: COLORS.gold, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  title: { color: COLORS.plum, fontSize: 32, fontWeight: "900", fontStyle: "italic", marginTop: -7 },
  copy: { color: COLORS.slate, fontFamily: "monospace", fontSize: 12, lineHeight: 19 },
  affectionCard: { backgroundColor: COLORS.ink, borderRadius: 20, borderWidth: 1, borderColor: TAB_CARD_PALETTES.habits.border, padding: 16 },
  affectionHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  affectionKicker: { color: COLORS.gold, fontSize: 9, fontWeight: "900", letterSpacing: 1.1 },
  affectionTitle: { color: COLORS.plum, fontSize: 22, fontWeight: "900", fontStyle: "italic", marginTop: 3 },
  affectionGoal: { color: COLORS.gold, fontFamily: "monospace", fontSize: 10, fontWeight: "900", paddingTop: 4 },
  affectionCopy: { color: COLORS.slate, fontFamily: "monospace", fontSize: 11, lineHeight: 17, marginTop: 5 },
  celebrationBanner: { marginTop: 14, borderRadius: 14, borderWidth: 1, borderColor: "#C6A04C", backgroundColor: "#18121C", padding: 14, alignItems: "center" },
  celebrationSparkles: { color: COLORS.gold, fontSize: 17, letterSpacing: 5 },
  celebrationTitle: { fontSize: 16, fontWeight: "900", marginTop: 5, textAlign: "center" },
  celebrationCopy: { color: COLORS.slate, fontFamily: "monospace", fontSize: 10, textAlign: "center", marginTop: 4 },
  affectionList: { gap: 10, marginTop: 15 },
  affectionRow: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: COLORS.surface, borderRadius: 13, borderWidth: 1, borderColor: "#413349", padding: 10 },
  affectionEmoji: { fontSize: 19 },
  affectionMain: { flex: 1 },
  affectionTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  affectionLabel: { color: COLORS.plum, fontSize: 14, fontWeight: "800", flex: 1 },
  affectionCount: { color: COLORS.gold, fontFamily: "monospace", fontSize: 11, fontWeight: "900" },
  dotRow: { flexDirection: "row", gap: 4, marginTop: 7 },
  goalDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#4C3B55" },
  goalDotDone: { backgroundColor: COLORS.rose },
  contributionRow: { flexDirection: "row", gap: 9, marginTop: 8 },
  contribution: { flexDirection: "row", alignItems: "center", gap: 4 },
  contributionName: { fontSize: 8, fontWeight: "900", letterSpacing: .4 },
  contributionCount: { fontFamily: "monospace", fontSize: 10, fontWeight: "900" },
  goalActions: { alignItems: "flex-end", gap: 5 },
  counterRow: { flexDirection: "row", gap: 5 },
  counterButton: { width: 30, height: 30, borderRadius: 9, borderWidth: 1, borderColor: "#604A6B", alignItems: "center", justifyContent: "center", backgroundColor: "#19151C" },
  counterText: { color: COLORS.plum, fontSize: 19, fontWeight: "900", lineHeight: 20 },
  counterDisabled: { color: "#514755" },
  goalEditLink: { minHeight: 26, justifyContent: "center", paddingHorizontal: 4 },
  goalEditLinkText: { color: "#A9CDEC", fontSize: 9, fontWeight: "900" },
  goalEditBody: { flex: 1, gap: 8 },
  goalEditInputs: { flexDirection: "row", gap: 7 },
  goalEmojiInput: { width: 48, minHeight: 38, borderRadius: 9, borderWidth: 1, borderColor: "#4A3B50", backgroundColor: "#121014", color: COLORS.plum, textAlign: "center", fontSize: 18 },
  goalLabelInput: { flex: 1, minHeight: 38, borderRadius: 9, borderWidth: 1, borderColor: "#4A3B50", backgroundColor: "#121014", color: COLORS.plum, paddingHorizontal: 10, fontSize: 13 },
  goalEditActions: { flexDirection: "row", alignItems: "center", gap: 7 },
  goalSaveButton: { minHeight: 30, borderRadius: 8, paddingHorizontal: 11, justifyContent: "center" },
  goalSaveText: { color: COLORS.white, fontSize: 9, fontWeight: "900" },
  dailyContributionSummary: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#4D3B58" },
  dailyContributionName: { fontSize: 10, fontWeight: "900", textAlign: "center" },
  dailyContributionValue: { color: COLORS.plum, fontSize: 20, fontWeight: "900", textAlign: "center", marginTop: 3 },
  dailyContributionDivider: { height: 31, width: 1, backgroundColor: "#5A4862" },
  sharedStreakCard: { marginTop: 12, padding: 12, borderRadius: 13, borderWidth: 1, borderColor: "#C6A04C", backgroundColor: "rgba(198,160,76,0.10)", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sharedStreakKicker: { color: COLORS.gold, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  sharedStreakCopy: { color: COLORS.slate, fontFamily: "monospace", fontSize: 10, marginTop: 3 },
  sharedStreakCount: { alignItems: "center", minWidth: 48 },
  sharedStreakNumber: { color: COLORS.plum, fontSize: 25, fontWeight: "900", lineHeight: 27 },
  sharedStreakUnit: { color: COLORS.gold, fontSize: 8, fontWeight: "900", letterSpacing: .8 },
  weekCard: { backgroundColor: COLORS.ink, borderRadius: 18, borderWidth: 1, borderColor: "#4D3C54", padding: 14 },
  weekHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  weekKicker: { color: COLORS.gold, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  weekTitle: { color: COLORS.plum, fontSize: 17, fontWeight: "900", fontStyle: "italic", marginTop: 3 },
  weekMeta: { color: COLORS.sage, fontFamily: "monospace", fontSize: 10, fontWeight: "900" },
  weekRow: { flexDirection: "row", justifyContent: "space-between", gap: 4, marginTop: 14 },
  weekDay: { flex: 1, minHeight: 66, borderRadius: 10, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: "#39303E", alignItems: "center", justifyContent: "center" },
  weekDayComplete: { backgroundColor: "rgba(144,185,157,0.18)", borderColor: COLORS.sage },
  weekDayToday: { borderColor: COLORS.gold, borderWidth: 1.5 },
  weekDayLabel: { color: COLORS.slate, fontSize: 9, fontWeight: "900" },
  weekDayLabelComplete: { color: COLORS.sage },
  weekDayNumber: { color: COLORS.plum, fontSize: 13, fontWeight: "900", marginTop: 2 },
  weekDayNumberComplete: { color: COLORS.plum },
  weekDayMark: { color: "#665C69", fontSize: 14, lineHeight: 15 },
  weekDayMarkComplete: { color: COLORS.rose },
  weekCaption: { color: COLORS.slate, fontFamily: "monospace", fontSize: 10, lineHeight: 15, marginTop: 10 },
});
