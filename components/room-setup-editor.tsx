import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";

import { COLORS } from "@/lib/together";
import {
  ROOM_PAGE_IDS,
  setDailyRelationshipSection,
  setRoomMode,
  setRoomPageVisibility,
  type DailyRelationshipSection,
  type RoomMode,
} from "@/lib/room-settings";
import { useLocalJournal } from "@/lib/local-journal";
import { normalizeGlobalBorderColor, normalizeGlobalTextColor } from "@/lib/typography";
import { VisualText as Text, VisualTouchableOpacity as TouchableOpacity, VisualView as View } from "@/components/visual-primitives";

const PAGE_COPY: Record<(typeof ROOM_PAGE_IDS)[number], { label: string; note: string }> = {
  today: { label: "Today", note: "Daily cards, covers, and prompts" },
  log: { label: "Daily Log", note: "Moments and checklist" },
  puzzles: { label: "Puzzles", note: "Daily brain games" },
  habits: { label: "Habits", note: "Shared habit lists" },
  health: { label: "Health", note: "Health, medicine, and trackers" },
  steamy: { label: "Steamy", note: "Private adult-only area" },
  purchase: { label: "Purchase", note: "Shopping lists" },
  cleaning: { label: "Cleaning", note: "Daily and weekly cleaning" },
  calendar: { label: "Calendar", note: "Long-term reminders" },
  pastDays: { label: "Past Days", note: "Saved history" },
};

const DAILY_RELATIONSHIP_COPY: Record<DailyRelationshipSection, { label: string; note: string }> = {
  relationshipTracker: { label: "Relationship tracker", note: "Together-since counter" },
  loveNotes: { label: "Love Notes", note: "Two-person notes on Today" },
};

export function RoomSetupEditor() {
  const { roomSettings, setRoomSettings, theme } = useLocalJournal();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<RoomMode>(roomSettings.mode);
  const [settings, setSettings] = useState(roomSettings);
  const textColor = normalizeGlobalTextColor(theme.fontColor);
  const borderColor = normalizeGlobalBorderColor(theme.borderColor);
  const accentColor = theme.accentColor ?? COLORS.orchid;

  useEffect(() => {
    if (!open) {
      setSettings(roomSettings);
      setMode(roomSettings.mode);
    }
  }, [open, roomSettings]);

  const chooseMode = (nextMode: RoomMode) => {
    const nextSettings = setRoomMode(settings, nextMode);
    setMode(nextMode);
    setSettings(nextSettings);
    setRoomSettings(nextSettings);
  };

  const save = () => {
    setRoomSettings(settings);
    setOpen(false);
  };

  return <View style={[styles.card, { borderColor }]}> 
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Toggle room setup" accessibilityState={{ expanded: open }} onPress={() => setOpen((value) => !value)} style={styles.toggle}>
      <View><Text style={[styles.kicker, { color: textColor }]}>SHARED ROOM SETUP</Text><Text style={[styles.title, { color: textColor }]}>Room type & visible pages</Text></View>
      <Text style={[styles.chevron, { color: textColor }]}>{open ? "⌃" : "⌄"}</Text>
    </TouchableOpacity>
    {open ? <View style={[styles.content, { borderTopColor: borderColor }]}> 
      <Text style={[styles.copy, { color: textColor }]}>Choose a couple room or a friends room. Your choices are shared with everyone in this room; hidden pages and Daily sections keep their saved data and can be turned back on later.</Text>
      <View style={styles.modeRow}>{(["couple", "friends"] as RoomMode[]).map((item) => <TouchableOpacity key={item} accessibilityRole="button" accessibilityState={{ selected: mode === item }} onPress={() => chooseMode(item)} style={[styles.modeCard, { borderColor }, mode === item && { backgroundColor: `${accentColor}2E`, borderColor: accentColor }]}><Text style={[styles.modeTitle, { color: textColor }]}>{item === "couple" ? "Couple room" : "Friends room"}</Text><Text style={[styles.modeCopy, { color: textColor }]}>{item === "couple" ? "Shows relationship and adult-only options." : "Starts without relationship or adult-only options."}</Text></TouchableOpacity>)}</View>
      <Text style={[styles.sectionLabel, { color: textColor }]}>PAGES TO SHOW</Text>
      <Text style={[styles.copy, { color: textColor }]}>Themes stays available so you can always change this setup.</Text>
      <View style={styles.list}>{ROOM_PAGE_IDS.map((pageId) => <ToggleRow key={pageId} label={PAGE_COPY[pageId].label} note={PAGE_COPY[pageId].note} selected={settings.visibleTabs[pageId]} color={textColor} borderColor={borderColor} onPress={() => setSettings((current) => setRoomPageVisibility(current, pageId, !current.visibleTabs[pageId]))} />)}</View>
      <Text style={[styles.sectionLabel, { color: textColor }]}>TODAY’S RELATIONSHIP SECTIONS</Text>
      <View style={styles.list}>{(Object.keys(DAILY_RELATIONSHIP_COPY) as DailyRelationshipSection[]).map((section) => <ToggleRow key={section} label={DAILY_RELATIONSHIP_COPY[section].label} note={DAILY_RELATIONSHIP_COPY[section].note} selected={settings.dailyRelationshipSections[section]} color={textColor} borderColor={borderColor} onPress={() => setSettings((current) => setDailyRelationshipSection(current, section, !current.dailyRelationshipSections[section]))} />)}</View>
      <TouchableOpacity accessibilityRole="button" onPress={save} style={[styles.save, { backgroundColor: accentColor, borderColor }]}><Text style={[styles.saveText, { color: textColor }]}>Save room setup</Text></TouchableOpacity>
    </View> : null}
  </View>;
}

function ToggleRow({ label, note, selected, color, borderColor, onPress }: { label: string; note: string; selected: boolean; color: string; borderColor: string; onPress: () => void }) {
  return <TouchableOpacity accessibilityRole="switch" accessibilityState={{ checked: selected }} onPress={onPress} style={[styles.toggleRow, { borderColor }]}> 
    <View style={styles.toggleCopy}><Text style={[styles.toggleTitle, { color }]}>{label}</Text><Text style={[styles.toggleNote, { color }]}>{note}</Text></View>
    <View style={[styles.switch, { borderColor }, selected && styles.switchOn]}><View style={[styles.switchDot, selected && styles.switchDotOn]} /><Text style={[styles.switchText, { color }]}>{selected ? "Shown" : "Hidden"}</Text></View>
  </TouchableOpacity>;
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, borderWidth: 1, backgroundColor: "transparent", overflow: "hidden" },
  toggle: { minHeight: 62, paddingHorizontal: 15, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  kicker: { fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  title: { fontSize: 17, fontWeight: "900", fontStyle: "italic", marginTop: 3 },
  chevron: { fontSize: 20, fontWeight: "900" },
  content: { borderTopWidth: 1, padding: 14, gap: 10 },
  copy: { fontFamily: "monospace", fontSize: 10, lineHeight: 15 },
  modeRow: { flexDirection: "row", gap: 8 },
  modeCard: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 10, gap: 4 },
  modeTitle: { fontWeight: "900", fontSize: 12 },
  modeCopy: { fontSize: 10, lineHeight: 14 },
  sectionLabel: { fontSize: 10, fontWeight: "900", letterSpacing: 1, marginTop: 2 },
  list: { gap: 7 },
  toggleRow: { minHeight: 58, borderWidth: 1, borderRadius: 11, padding: 10, flexDirection: "row", alignItems: "center", gap: 8 },
  toggleCopy: { flex: 1, gap: 2 },
  toggleTitle: { fontSize: 12, fontWeight: "900" },
  toggleNote: { fontSize: 9, lineHeight: 13, opacity: 0.8 },
  switch: { minWidth: 66, borderRadius: 14, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 5, alignItems: "center", gap: 2 },
  switchOn: { backgroundColor: "rgba(255,255,255,0.16)" },
  switchDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#887B88" },
  switchDotOn: { backgroundColor: "#72D9A3" },
  switchText: { fontSize: 9, fontWeight: "900" },
  save: { minHeight: 44, borderRadius: 11, borderWidth: 1, alignItems: "center", justifyContent: "center", marginTop: 4 },
  saveText: { fontSize: 13, fontWeight: "900" },
});
