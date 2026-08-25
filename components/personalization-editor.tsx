import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { COLORS, TAB_CARD_PALETTES } from "@/lib/together";
import { DEFAULT_PARTNER_COLORS, PARTNERS, useLocalJournal } from "@/lib/local-journal";
import { colorContrastRatio, contrastGuidance } from "@/lib/color-contrast";

export const SUBHEADING_DEFAULTS = {
  relationshipTracker: "Every day, every hour, every little moment.",
  loveNotes: "A note for each other",
  mealPlanner: "What are we sharing today?",
  sharedTodos: "Little things, handled together.",
  dailyLog: "Timeline stream · add as often as you want",
  goodHabits: "Check off your own progress or cheer your partner on.",
  pastDays: "A complete keepsake of the days you have shared.",
} as const;

const SUBHEADING_FIELDS = [
  { key: "relationshipTracker", label: "Relationship tracker description" },
  { key: "loveNotes", label: "Love Notes description" },
  { key: "mealPlanner", label: "Meal Planner description" },
  { key: "sharedTodos", label: "Shared to-dos description" },
  { key: "dailyLog", label: "Daily Log description" },
  { key: "goodHabits", label: "Good Habits description" },
  { key: "pastDays", label: "Past Days description" },
] as const;

const ACCENT_SWATCHES = ["#8D5BA6", "#B66BD4", "#D56B88", "#E7779A", "#C65A73", "#E6A267", "#C6A04C", "#DB8C3D", "#90B99D", "#55A7A0", "#66B7DD", "#6289D8", "#9A7B61", "#B692A6", "#D9D1C7", "#E6D6A1"];
const BACKGROUND_SWATCHES = ["#0D0B0F", "#18101E", "#16111A", "#251316", "#21140F", "#102019", "#0C1E21", "#111827", "#101522", "#101820", "#191515", "#20151D"];
const PROFILE_SWATCHES = ["#8D5BA6", "#B66BD4", "#D56B88", "#E7779A", "#C65A73", "#E6A267", "#DB8C3D", "#C6A04C", "#90B99D", "#719F78", "#55A7A0", "#66B7DD", "#6289D8", "#9A7B61", "#B692A6", "#D9D1C7"];
const SAVED_THEMES = [
  { name: "Together", accent: "#8D5BA6", background: "#0D0B0F" },
  { name: "Blush Twilight", accent: "#D56B88", background: "#251316" },
  { name: "Golden Keep", accent: "#C6A04C", background: "#18101E" },
  { name: "Sage Afterglow", accent: "#90B99D", background: "#102019" },
  { name: "Blue Hour", accent: "#66B7DD", background: "#111827" },
  { name: "Rosewood", accent: "#E7779A", background: "#20151D" },
  { name: "Desert Bloom", accent: "#E6A267", background: "#21140F" },
  { name: "Coastal Ink", accent: "#55A7A0", background: "#0C1E21" },
  { name: "Moss & Copper", accent: "#DB8C3D", background: "#102019" },
  { name: "Mulberry", accent: "#B66BD4", background: "#18101E" },
  { name: "Rainy Window", accent: "#6289D8", background: "#101820" },
  { name: "Candlelight", accent: "#E6D6A1", background: "#191515" },
  { name: "Lilac Fog", accent: "#C7A6E8", background: "#191525" },
  { name: "Cherry Noir", accent: "#F06A8E", background: "#260E18" },
  { name: "Emerald Hour", accent: "#5CC69A", background: "#0D201A" },
  { name: "Midnight Iris", accent: "#8F84F4", background: "#10122B" },
  { name: "Peach Tea", accent: "#F5A575", background: "#26170F" },
  { name: "Arctic Glass", accent: "#8CD9E8", background: "#0C1C27" },
  { name: "Berry Cream", accent: "#E88FB5", background: "#28151F" },
  { name: "Olive Paper", accent: "#B2BC6E", background: "#1B2111" },
] as const;
const TAB_COLOR_FIELDS = [
  { id: "today", label: "Today", glyph: "✦" },
  { id: "log", label: "Daily Log", glyph: "☰" },
  { id: "habits", label: "Habits", glyph: "✓" },
  { id: "health", label: "Health", glyph: "✚" },
  { id: "steamy", label: "Steamy", glyph: "♥" },
  { id: "purchase", label: "Purchase", glyph: "▤" },
  { id: "cleaning", label: "Cleaning", glyph: "✦" },
  { id: "themes", label: "Themes", glyph: "◐" },
  { id: "pastDays", label: "Past Days", glyph: "▤" },
] as const;
const HEX = /^#[0-9A-Fa-f]{6}$/;

function tabColorDrafts(pageStyles: Record<string, { cardBackgroundColor?: string } | undefined>) {
  return Object.fromEntries(
    TAB_COLOR_FIELDS.map((tab) => [
      tab.id,
      pageStyles[tab.id]?.cardBackgroundColor ?? TAB_CARD_PALETTES[tab.id].surface,
    ]),
  ) as Record<string, string>;
}

export function getSubheading(customSubheadings: Record<string, string>, key: keyof typeof SUBHEADING_DEFAULTS) {
  return customSubheadings[key]?.trim() || SUBHEADING_DEFAULTS[key];
}

function TabCardColorControls({ values, onChange, onSave, onReset }: { values: Record<string, string>; onChange: (tabId: string, color: string) => void; onSave: () => void; onReset: () => void }) {
  const themesColor = values.themes ?? TAB_CARD_PALETTES.themes.surface;
  return <View style={[styles.tabColorPanel,{backgroundColor:themesColor}]}><Text style={styles.sectionLabel}>TAB CARD COLORS</Text><Text style={styles.paletteHint}>Choose a shared card color for each tab. It will apply to every card within that tab for both partners.</Text><View style={styles.tabColorGrid}>{TAB_COLOR_FIELDS.map((tab) => { const selected = values[tab.id] ?? TAB_CARD_PALETTES[tab.id].surface; return <View key={tab.id} style={[styles.tabColorCard,{backgroundColor:themesColor,borderColor:selected}]}><Text style={styles.tabColorTitle}>{tab.glyph} {tab.label}</Text><View style={styles.profileSwatches}>{BACKGROUND_SWATCHES.map((color) => <TouchableOpacity key={`${tab.id}-${color}`} accessibilityRole="button" accessibilityLabel={`Choose ${color} for ${tab.label} cards`} onPress={() => onChange(tab.id, color)} style={[styles.profileSwatch,{backgroundColor:color},selected===color&&styles.swatchActive]}/>)}</View><TextInput value={selected} onChangeText={(value) => onChange(tab.id, value)} placeholder={TAB_CARD_PALETTES[tab.id].surface} autoCapitalize="characters" maxLength={7} placeholderTextColor="#7F7582" style={styles.hexInput}/></View>; })}</View><View style={styles.actions}><TouchableOpacity accessibilityRole="button" style={styles.profileResetButton} onPress={onReset}><Text style={styles.profileResetText}>Reset tab colors</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" style={styles.saveButton} onPress={onSave}><Text style={styles.saveText}>Save tab colors</Text></TouchableOpacity></View></View>;
}

export function PersonalizationEditor() {
  const { customSubheadings, setCustomSubheading, theme, setTheme, pageStyles, setPageStyle, partnerNames, partnerColors, partnerAvatars, setPartnerProfiles, resetPersonalization, namedColorThemes, saveNamedColorTheme, renameNamedColorTheme, deleteNamedColorTheme } = useLocalJournal();
  const [open, setOpen] = useState(false);
  const [subheadingDrafts, setSubheadingDrafts] = useState<Record<string, string>>(customSubheadings);
  const [accentDraft, setAccentDraft] = useState(theme.accentColor ?? COLORS.orchid);
  const [backgroundDraft, setBackgroundDraft] = useState(theme.backgroundColor ?? COLORS.blush);
  const [themeName, setThemeName] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [partnerNameDrafts, setPartnerNameDrafts] = useState(partnerNames);
  const [partnerColorDrafts, setPartnerColorDrafts] = useState(partnerColors);
  const [partnerAvatarDrafts, setPartnerAvatarDrafts] = useState(partnerAvatars);
  const [confirmProfileColorReset, setConfirmProfileColorReset] = useState(false);
  const [tabCardColorDrafts, setTabCardColorDrafts] = useState(() => tabColorDrafts(pageStyles));

  useEffect(() => { if (!open) { setSubheadingDrafts(customSubheadings); setAccentDraft(theme.accentColor ?? COLORS.orchid); setBackgroundDraft(theme.backgroundColor ?? COLORS.blush); setPartnerNameDrafts(partnerNames); setPartnerColorDrafts(partnerColors); setPartnerAvatarDrafts(partnerAvatars); setTabCardColorDrafts(tabColorDrafts(pageStyles)); } }, [customSubheadings, open, pageStyles, partnerAvatars, partnerColors, partnerNames, theme.accentColor, theme.backgroundColor]);

  const save = () => {
    SUBHEADING_FIELDS.forEach((field) => setCustomSubheading(field.key, subheadingDrafts[field.key] ?? ""));
    setTheme({ accentColor: HEX.test(accentDraft) ? accentDraft : COLORS.orchid, backgroundColor: HEX.test(backgroundDraft) ? backgroundDraft : COLORS.blush });
    TAB_COLOR_FIELDS.forEach((tab) => setPageStyle(tab.id, { cardBackgroundColor: HEX.test(tabCardColorDrafts[tab.id]) ? tabCardColorDrafts[tab.id] : TAB_CARD_PALETTES[tab.id].surface }));
    setPartnerProfiles({ names: partnerNameDrafts, colors: partnerColorDrafts, avatars: partnerAvatarDrafts });
    setOpen(false);
  };

  const reset = () => {
    resetPersonalization();
    setSubheadingDrafts({});
    setAccentDraft(COLORS.orchid);
    setBackgroundDraft(COLORS.blush);
    setTabCardColorDrafts(tabColorDrafts({}));
    setConfirmReset(false);
  };

  const resetProfileColors = () => {
    setPartnerColorDrafts(DEFAULT_PARTNER_COLORS);
    setPartnerProfiles({ names: partnerNameDrafts, colors: DEFAULT_PARTNER_COLORS, avatars: partnerAvatarDrafts });
    setConfirmProfileColorReset(false);
  };

  const resetTabCardColors = () => {
    TAB_COLOR_FIELDS.forEach((tab) => setPageStyle(tab.id, { cardBackgroundColor: undefined }));
    setTabCardColorDrafts(tabColorDrafts({}));
  };

  const saveTabCardColors = () => {
    TAB_COLOR_FIELDS.forEach((tab) => setPageStyle(tab.id, { cardBackgroundColor: HEX.test(tabCardColorDrafts[tab.id]) ? tabCardColorDrafts[tab.id] : TAB_CARD_PALETTES[tab.id].surface }));
  };

  const applyTheme = (accentColor: string, backgroundColor: string) => {
    setAccentDraft(accentColor);
    setBackgroundDraft(backgroundColor);
    setTheme({ accentColor, backgroundColor });
  };

  const saveNamedTheme = () => {
    const name = themeName.trim();
    if (!name || !HEX.test(accentDraft) || !HEX.test(backgroundDraft)) return;
    saveNamedColorTheme({ name, accentColor: accentDraft, backgroundColor: backgroundDraft });
    setThemeName("");
  };

  const startRename = (id: string, name: string) => { setEditingThemeId(id); setRenameDraft(name); setConfirmDeleteId(null); };
  const saveRename = (id: string) => { if (!renameDraft.trim()) return; renameNamedColorTheme(id, renameDraft); setEditingThemeId(null); setRenameDraft(""); };
  const removeTheme = (id: string) => { deleteNamedColorTheme(id); setConfirmDeleteId(null); if (editingThemeId === id) { setEditingThemeId(null); setRenameDraft(""); } };
  const previewAccent = HEX.test(accentDraft) ? accentDraft : COLORS.orchid;
  const previewBackground = HEX.test(backgroundDraft) ? backgroundDraft : COLORS.blush;
  const contrast = colorContrastRatio(previewAccent, previewBackground);
  const contrastNote = contrastGuidance(contrast);
  const themesCardColor = pageStyles.themes?.cardBackgroundColor ?? TAB_CARD_PALETTES.themes.surface;

  return <View style={[styles.card, { backgroundColor: themesCardColor }]}>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Toggle personalization editor" accessibilityState={{ expanded: open }} style={styles.toggle} onPress={() => setOpen((value) => !value)}>
      <View><Text style={styles.kicker}>MAKE IT YOURS</Text><Text style={styles.title}>Names, descriptions & colors</Text></View><Text style={styles.chevron}>{open ? "⌃" : "⌄"}</Text>
    </TouchableOpacity>
    <TabCardColorControls values={tabCardColorDrafts} onChange={(tabId, color) => setTabCardColorDrafts((current) => ({ ...current, [tabId]: color }))} onSave={saveTabCardColors} onReset={resetTabCardColors} />
    {open ? <View style={styles.editor}>
      <Text style={styles.helper}>Edit the descriptive words beneath the section titles. Leave one blank to restore its original words. Your color choices are shared with your room.</Text>
      <Text style={styles.sectionLabel}>PARTNER NAMES & ICONS</Text><View style={styles.partnerNameGrid}>{(["beans","princess"] as const).map((partnerId) => { const person = PARTNERS[partnerId]; return <View key={partnerId} style={styles.partnerNameCard}><Text style={[styles.partnerNameLabel,{color:partnerColorDrafts[partnerId]}]}>{partnerAvatarDrafts[partnerId]} {partnerNameDrafts[partnerId]}</Text><TextInput value={partnerNameDrafts[partnerId]} onChangeText={(value) => setPartnerNameDrafts((current) => ({ ...current, [partnerId]: value }))} placeholder={person.name} placeholderTextColor="#7F7582" maxLength={24} style={styles.input}/><Text style={styles.avatarInputLabel}>IDENTITY EMOJI</Text><TextInput value={partnerAvatarDrafts[partnerId]} onChangeText={(value) => setPartnerAvatarDrafts((current) => ({ ...current, [partnerId]: value }))} placeholder={person.avatar} placeholderTextColor="#7F7582" maxLength={12} style={styles.avatarInput} accessibilityLabel={`Identity emoji for ${partnerNameDrafts[partnerId]}`}/></View>; })}</View>
      <Text style={styles.sectionLabel}>PROFILE COLORS</Text><View style={styles.profileColorList}>{(["beans","princess"] as const).map((partnerId) => { const person = PARTNERS[partnerId]; return <View key={partnerId} style={styles.profileColorCard}><Text style={[styles.partnerNameLabel,{color:partnerColorDrafts[partnerId]}]}>{person.avatar} {partnerNameDrafts[partnerId]}</Text><View style={styles.profileSwatches}>{PROFILE_SWATCHES.map((color) => <TouchableOpacity key={`${partnerId}-${color}`} accessibilityRole="button" accessibilityLabel={`Choose ${color} for ${partnerNameDrafts[partnerId]}`} onPress={() => setPartnerColorDrafts((current) => ({ ...current, [partnerId]: color }))} style={[styles.profileSwatch,{backgroundColor:color},partnerColorDrafts[partnerId]===color&&styles.swatchActive]}/>)}</View><TextInput value={partnerColorDrafts[partnerId]} onChangeText={(value) => setPartnerColorDrafts((current) => ({ ...current, [partnerId]: value }))} placeholder={person.color} autoCapitalize="characters" maxLength={7} placeholderTextColor="#7F7582" style={styles.hexInput}/></View>; })}</View>{confirmProfileColorReset ? <View style={styles.confirmCard}><Text style={styles.confirmTitle}>Reset profile colors?</Text><Text style={styles.confirmCopy}>Daddy returns to purple and Princess returns to pink. Their names and icons will stay the same.</Text><View style={styles.actions}><TouchableOpacity accessibilityRole="button" style={styles.resetButton} onPress={() => setConfirmProfileColorReset(false)}><Text style={styles.resetText}>Keep colors</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" style={styles.confirmButton} onPress={resetProfileColors}><Text style={styles.confirmText}>Reset colors</Text></TouchableOpacity></View></View> : <TouchableOpacity accessibilityRole="button" style={styles.profileResetButton} onPress={() => setConfirmProfileColorReset(true)}><Text style={styles.profileResetText}>Reset profile colors to defaults</Text></TouchableOpacity>}
      {SUBHEADING_FIELDS.map((field) => <View key={field.key} style={styles.field}><Text style={styles.label}>{field.label}</Text><TextInput value={subheadingDrafts[field.key] ?? ""} onChangeText={(value) => setSubheadingDrafts((current) => ({ ...current, [field.key]: value }))} placeholder={SUBHEADING_DEFAULTS[field.key]} placeholderTextColor="#7F7582" maxLength={80} style={styles.input} /></View>)}
      <Text style={styles.sectionLabel}>LIVE THEME PREVIEW</Text><View style={[styles.previewCard,{backgroundColor:previewBackground,borderColor:previewAccent}]}><View style={styles.previewTop}><Text style={[styles.previewPartners,{color:previewAccent}]}>{partnerAvatarDrafts.beans} {partnerNameDrafts.beans}  ·  {partnerAvatarDrafts.princess} {partnerNameDrafts.princess}</Text><View style={[styles.previewDot,{backgroundColor:previewAccent}]}/></View><Text style={styles.previewTitle}>Our Daily Log</Text><Text style={styles.previewCopy}>A quiet shared space for the little moments.</Text><View style={[styles.previewButton,{backgroundColor:previewAccent}]}><Text style={[styles.previewButtonText,{color:previewBackground}]}>Shared today</Text></View></View><View style={[styles.contrastCard,contrastNote.tone === "strong" ? styles.contrastStrong : contrastNote.tone === "moderate" ? styles.contrastModerate : styles.contrastLow]}><Text style={styles.contrastTitle}>{contrastNote.label} · {contrast.toFixed(1)}:1</Text><Text style={styles.contrastCopy}>{contrastNote.detail}</Text></View>
      <Text style={styles.sectionLabel}>READY-MADE THEMES</Text><Text style={styles.paletteHint}>Tap a pair to preview a complete look, then save your favorite combination below.</Text><View style={styles.themeGrid}>{SAVED_THEMES.map((themeOption) => { const active = accentDraft === themeOption.accent && backgroundDraft === themeOption.background; return <TouchableOpacity key={themeOption.name} accessibilityRole="button" accessibilityLabel={`Apply ${themeOption.name} theme`} onPress={() => applyTheme(themeOption.accent, themeOption.background)} style={[styles.themeButton, active && { borderColor: themeOption.accent }]}><View style={styles.themeColors}><View style={[styles.themeColor,{backgroundColor:themeOption.accent}]}/><View style={[styles.themeColor,{backgroundColor:themeOption.background}]}/></View><Text style={[styles.themeName,active&&{color:themeOption.accent}]}>{themeOption.name}</Text></TouchableOpacity>; })}</View>
      <Text style={styles.sectionLabel}>FONT</Text><Text style={styles.paletteHint}>Choose one shared font for navigation, card content, and body text.</Text><View style={styles.actions}><TouchableOpacity accessibilityRole="button" onPress={() => setCustomSubheading("globalFont", "handwritten")} style={styles.confirmButton}><Text style={styles.confirmText}>Handwritten</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" onPress={() => setCustomSubheading("globalFont", "script")} style={styles.resetButton}><Text style={styles.resetText}>Script</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" onPress={() => setCustomSubheading("globalFont", "notebook")} style={styles.resetButton}><Text style={styles.resetText}>Notebook</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" onPress={() => setCustomSubheading("globalFont", "casual")} style={styles.resetButton}><Text style={styles.resetText}>Casual</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" onPress={() => setCustomSubheading("globalFont", "classic")} style={styles.resetButton}><Text style={styles.resetText}>Classic</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" onPress={() => setCustomSubheading("globalFont", "serif")} style={styles.resetButton}><Text style={styles.resetText}>Serif</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" onPress={() => setCustomSubheading("globalFont", "mono")} style={styles.resetButton}><Text style={styles.resetText}>Mono</Text></TouchableOpacity></View>
      <Text style={styles.sectionLabel}>ACCENT COLOR</Text><Text style={styles.paletteHint}>Choose the color used for highlights, buttons, and active states.</Text><View style={styles.swatches}>{ACCENT_SWATCHES.map((color) => <TouchableOpacity key={color} onPress={() => setAccentDraft(color)} accessibilityLabel={`Choose ${color} accent`} style={[styles.swatch, { backgroundColor: color }, accentDraft === color && styles.swatchActive]} />)}</View><TextInput value={accentDraft} onChangeText={setAccentDraft} placeholder="#8D5BA6" autoCapitalize="characters" maxLength={7} placeholderTextColor="#7F7582" style={styles.hexInput} />
      <Text style={styles.sectionLabel}>BACKGROUND COLOR</Text><Text style={styles.paletteHint}>Choose a deep backdrop that keeps the Daily Log comfortable to read.</Text><View style={styles.swatches}>{BACKGROUND_SWATCHES.map((color) => <TouchableOpacity key={color} onPress={() => setBackgroundDraft(color)} accessibilityLabel={`Choose ${color} background`} style={[styles.swatch, { backgroundColor: color }, backgroundDraft === color && styles.swatchActive]} />)}</View><TextInput value={backgroundDraft} onChangeText={setBackgroundDraft} placeholder="#0D0B0F" autoCapitalize="characters" maxLength={7} placeholderTextColor="#7F7582" style={styles.hexInput} />
      <Text style={styles.sectionLabel}>NAME THIS THEME</Text><View style={styles.themeSaveRow}><TextInput value={themeName} onChangeText={setThemeName} placeholder="e.g. Our Cozy Night" placeholderTextColor="#7F7582" maxLength={28} style={styles.themeNameInput}/><TouchableOpacity accessibilityRole="button" disabled={!themeName.trim() || !HEX.test(accentDraft) || !HEX.test(backgroundDraft)} onPress={saveNamedTheme} style={[styles.saveThemeButton,(!themeName.trim() || !HEX.test(accentDraft) || !HEX.test(backgroundDraft))&&styles.disabledButton]}><Text style={styles.saveThemeText}>Save theme</Text></TouchableOpacity></View>
      {namedColorThemes.length ? <><Text style={styles.sectionLabel}>YOUR SAVED THEMES</Text><View style={styles.savedThemeList}>{namedColorThemes.map((themeOption) => { const active = accentDraft === themeOption.accentColor && backgroundDraft === themeOption.backgroundColor; const editing = editingThemeId === themeOption.id; const confirmingDelete = confirmDeleteId === themeOption.id; const creator = PARTNERS[themeOption.createdBy]; return <View key={themeOption.id} style={[styles.savedThemeCard, active && { borderColor: themeOption.accentColor }]}><TouchableOpacity accessibilityRole="button" accessibilityLabel={`Apply ${themeOption.name} theme`} onPress={() => applyTheme(themeOption.accentColor, themeOption.backgroundColor)} style={styles.savedThemeMain}><View style={styles.themeColors}><View style={[styles.themeColor,{backgroundColor:themeOption.accentColor}]}/><View style={[styles.themeColor,{backgroundColor:themeOption.backgroundColor}]}/></View><Text style={[styles.themeName,active&&{color:themeOption.accentColor}]}>{themeOption.name}</Text><Text style={[styles.themeCreator,{color:creator.color}]}>{creator.avatar} {creator.name} created</Text></TouchableOpacity>{editing ? <View style={styles.renameRow}><TextInput value={renameDraft} onChangeText={setRenameDraft} maxLength={28} autoFocus placeholderTextColor="#7F7582" style={styles.renameInput}/><TouchableOpacity accessibilityRole="button" onPress={() => saveRename(themeOption.id)} style={styles.smallSaveButton}><Text style={styles.smallSaveText}>Save</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" onPress={() => { setEditingThemeId(null); setRenameDraft(""); }} style={styles.smallTextButton}><Text style={styles.smallText}>Cancel</Text></TouchableOpacity></View> : confirmingDelete ? <View style={styles.deleteConfirm}><Text style={styles.deleteCopy}>Delete “{themeOption.name}”?</Text><TouchableOpacity accessibilityRole="button" onPress={() => removeTheme(themeOption.id)} style={styles.deleteButton}><Text style={styles.deleteText}>Delete</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" onPress={() => setConfirmDeleteId(null)} style={styles.smallTextButton}><Text style={styles.smallText}>Keep</Text></TouchableOpacity></View> : <View style={styles.themeManageRow}><TouchableOpacity accessibilityRole="button" onPress={() => startRename(themeOption.id, themeOption.name)} style={styles.smallTextButton}><Text style={styles.smallText}>Rename</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" onPress={() => { setConfirmDeleteId(themeOption.id); setEditingThemeId(null); }} style={styles.smallDeleteButton}><Text style={styles.smallDeleteText}>Delete</Text></TouchableOpacity></View>}</View>; })}</View></> : null}
      {confirmReset ? <View style={styles.confirmCard}><Text style={styles.confirmTitle}>Reset all personalization?</Text><Text style={styles.confirmCopy}>Your custom descriptions, accent color, and background color will return to the original Together Daily look for both partners.</Text><View style={styles.actions}><TouchableOpacity accessibilityRole="button" style={styles.resetButton} onPress={() => setConfirmReset(false)}><Text style={styles.resetText}>Keep mine</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" style={styles.confirmButton} onPress={reset}><Text style={styles.confirmText}>Yes, reset</Text></TouchableOpacity></View></View> : <View style={styles.actions}><TouchableOpacity accessibilityRole="button" style={styles.resetButton} onPress={() => setConfirmReset(true)}><Text style={styles.resetText}>Reset to defaults</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" style={styles.saveButton} onPress={save}><Text style={styles.saveText}>Save personalization</Text></TouchableOpacity></View>}
    </View> : null}
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: TAB_CARD_PALETTES.themes.surface, borderRadius: 18, borderWidth: 1, borderColor: TAB_CARD_PALETTES.themes.border, overflow: "hidden" },
  toggle: { minHeight: 62, paddingHorizontal: 15, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  kicker: { color: COLORS.gold, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  title: { color: COLORS.plum, fontSize: 17, fontWeight: "900", fontStyle: "italic", marginTop: 3 },
  chevron: { color: COLORS.orchid, fontSize: 20, fontWeight: "900" },
  editor: { borderTopWidth: 1, borderTopColor: "#35273D", padding: 14, gap: 10 },
  partnerNameGrid: { flexDirection: "row", gap: 8 },
  partnerNameCard: { flex: 1, gap: 5 },
  partnerNameLabel: { fontSize: 11, fontWeight: "900" },
  avatarInputLabel: { color: COLORS.slate, fontSize: 9, fontWeight: "900", letterSpacing: .7, marginTop: 2 },
  avatarInput: { minHeight: 40, borderRadius: 10, borderWidth: 1, borderColor: "#3A313E", backgroundColor: "#121014", color: COLORS.plum, paddingHorizontal: 10, fontSize: 20, textAlign: "center" },
  profileColorList: { gap: 10 },
  profileColorCard: { gap: 6, padding: 10, borderRadius: 11, borderWidth: 1, borderColor: TAB_CARD_PALETTES.themes.border, backgroundColor: TAB_CARD_PALETTES.themes.surface },
  tabColorPanel: { borderTopWidth: 1, borderTopColor: "#35273D", padding: 14, gap: 10 },
  tabColorGrid: { gap: 9 },
  tabColorCard: { gap: 7, padding: 10, borderRadius: 11, borderWidth: 1, backgroundColor: TAB_CARD_PALETTES.themes.surface },
  tabColorTitle: { color: COLORS.plum, fontSize: 11, fontWeight: "900" },
  profileSwatches: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  profileSwatch: { width: 25, height: 25, borderRadius: 13, borderWidth: 2, borderColor: "transparent" },
  profileResetButton: { minHeight: 38, borderRadius: 10, borderWidth: 1, borderColor: "#5A455F", alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  profileResetText: { color: COLORS.slate, fontSize: 11, fontWeight: "900" },
  helper: { color: COLORS.slate, fontFamily: "monospace", fontSize: 10, lineHeight: 15, marginBottom: 2 },
  paletteHint: { color: COLORS.slate, fontSize: 11, lineHeight: 15, marginTop: -5 },
  previewCard: { borderWidth: 1, borderRadius: 14, padding: 13, gap: 8 },
  previewTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  previewPartners: { fontSize: 10, fontWeight: "900", flex: 1 },
  previewDot: { height: 11, width: 11, borderRadius: 6 },
  previewTitle: { color: "#F8F4F7", fontSize: 20, fontWeight: "900", fontStyle: "italic" },
  previewCopy: { color: "#D9D1D7", fontSize: 11, lineHeight: 16 },
  previewButton: { alignSelf: "flex-start", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  previewButtonText: { fontSize: 10, fontWeight: "900" },
  contrastCard: { borderRadius: 11, borderWidth: 1, padding: 11, gap: 3 },
  contrastStrong: { backgroundColor: "#10251E", borderColor: "#326A51" },
  contrastModerate: { backgroundColor: "#2B2413", borderColor: "#806B2E" },
  contrastLow: { backgroundColor: "#2B151A", borderColor: "#874150" },
  contrastTitle: { color: COLORS.plum, fontSize: 11, fontWeight: "900" },
  contrastCopy: { color: COLORS.slate, fontSize: 10, lineHeight: 14 },
  field: { gap: 5 },
  label: { color: COLORS.plum, fontSize: 11, fontWeight: "800" },
  input: { minHeight: 40, borderRadius: 10, borderWidth: 1, borderColor: "#3A313E", backgroundColor: "#121014", color: COLORS.plum, paddingHorizontal: 10, fontSize: 13 },
  sectionLabel: { color: COLORS.gold, fontSize: 9, fontWeight: "900", letterSpacing: .9, marginTop: 5 },
  themeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  themeButton: { minWidth: "30%", flexGrow: 1, borderRadius: 10, borderWidth: 1, borderColor: TAB_CARD_PALETTES.themes.border, backgroundColor: TAB_CARD_PALETTES.themes.surface, padding: 8, gap: 6 },
  themeColors: { flexDirection: "row", gap: 4 },
  themeColor: { height: 8, flex: 1, borderRadius: 4 },
  themeName: { color: COLORS.slate, fontSize: 9, fontWeight: "900" },
  themeCreator: { fontSize: 9, fontWeight: "900", letterSpacing: .2 },
  savedThemeList: { gap: 8 },
  savedThemeCard: { borderRadius: 11, borderWidth: 1, borderColor: TAB_CARD_PALETTES.themes.border, backgroundColor: TAB_CARD_PALETTES.themes.surface, padding: 9, gap: 8 },
  savedThemeMain: { gap: 6 },
  themeManageRow: { flexDirection: "row", gap: 9 },
  renameRow: { flexDirection: "row", gap: 7, alignItems: "center" },
  renameInput: { flex: 1, minHeight: 34, borderRadius: 8, borderWidth: 1, borderColor: "#4A3B50", color: COLORS.plum, paddingHorizontal: 8, fontSize: 11 },
  smallSaveButton: { minHeight: 34, borderRadius: 8, backgroundColor: COLORS.gold, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  smallSaveText: { color: COLORS.ink, fontSize: 10, fontWeight: "900" },
  smallTextButton: { minHeight: 30, justifyContent: "center", paddingHorizontal: 5 },
  smallText: { color: COLORS.slate, fontSize: 10, fontWeight: "900" },
  smallDeleteButton: { minHeight: 30, justifyContent: "center", paddingHorizontal: 5 },
  smallDeleteText: { color: COLORS.rose, fontSize: 10, fontWeight: "900" },
  deleteConfirm: { flexDirection: "row", gap: 7, alignItems: "center", flexWrap: "wrap" },
  deleteCopy: { color: COLORS.slate, fontSize: 10, fontFamily: "monospace", flexGrow: 1 },
  deleteButton: { minHeight: 32, borderRadius: 8, backgroundColor: COLORS.rose, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  deleteText: { color: COLORS.white, fontSize: 10, fontWeight: "900" },
  swatches: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  swatch: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: "transparent" },
  swatchActive: { borderColor: COLORS.white },
  hexInput: { minHeight: 38, borderRadius: 10, borderWidth: 1, borderColor: "#3A313E", backgroundColor: "#121014", color: COLORS.plum, paddingHorizontal: 10, fontFamily: "monospace", fontSize: 12 },
  themeSaveRow: { flexDirection: "row", gap: 8 },
  themeNameInput: { flex: 1, minHeight: 40, borderRadius: 10, borderWidth: 1, borderColor: "#3A313E", backgroundColor: "#121014", color: COLORS.plum, paddingHorizontal: 10, fontSize: 12 },
  saveThemeButton: { minHeight: 40, borderRadius: 10, backgroundColor: COLORS.gold, alignItems: "center", justifyContent: "center", paddingHorizontal: 10 },
  saveThemeText: { color: COLORS.ink, fontSize: 10, fontWeight: "900" },
  disabledButton: { opacity: .45 },
  actions: { flexDirection: "row", gap: 8, marginTop: 3 },
  resetButton: { minHeight: 42, borderRadius: 11, borderWidth: 1, borderColor: "#684C5E", alignItems: "center", justifyContent: "center", paddingHorizontal: 11 },
  resetText: { color: COLORS.slate, fontSize: 11, fontWeight: "900" },
  saveButton: { flex: 1, minHeight: 42, borderRadius: 11, backgroundColor: COLORS.orchid, alignItems: "center", justifyContent: "center" },
  saveText: { color: COLORS.white, fontSize: 13, fontWeight: "900" },
  confirmCard: { gap: 8, borderRadius: 12, borderWidth: 1, borderColor: TAB_CARD_PALETTES.themes.border, backgroundColor: TAB_CARD_PALETTES.themes.surface, padding: 12 },
  confirmTitle: { color: COLORS.plum, fontSize: 14, fontWeight: "900" },
  confirmCopy: { color: COLORS.slate, fontFamily: "monospace", fontSize: 10, lineHeight: 15 },
  confirmButton: { flex: 1, minHeight: 42, borderRadius: 11, backgroundColor: COLORS.rose, alignItems: "center", justifyContent: "center" },
  confirmText: { color: COLORS.white, fontSize: 12, fontWeight: "900" },
});
