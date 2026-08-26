import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { COLORS } from "@/lib/together";
import { DEFAULT_PARTNER_COLORS, PARTNERS, useLocalJournal } from "@/lib/local-journal";
import { PASTEL_THEMES, SAVED_THEMES } from "@/lib/ready-made-themes";

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

const PROFILE_SWATCHES = ["#A421FF", "#3B82F6", "#00C781", "#FFD400", "#FF4D00", "#FF2D95", "#F700FF", "#00A6FB", "#FFCA3A"];
const FONT_OPTIONS = [
  { id: "handwritten", label: "Handwritten" },
  { id: "script", label: "Script" },
  { id: "classic", label: "Classic" },
  { id: "serif", label: "Serif" },
  { id: "comicSans", label: "Comic Sans" },
] as const;

export function getSubheading(customSubheadings: Record<string, string>, key: keyof typeof SUBHEADING_DEFAULTS) {
  return customSubheadings[key]?.trim() || SUBHEADING_DEFAULTS[key];
}

function Section({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return <View style={styles.card}><TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded: open }} accessibilityLabel={`Toggle ${title}`} onPress={() => setOpen((value) => !value)} style={styles.toggle}><View><Text style={styles.kicker}>{eyebrow}</Text><Text style={styles.title}>{title}</Text></View><Text style={styles.chevron}>{open ? "⌃" : "⌄"}</Text></TouchableOpacity>{open ? <View style={styles.body}>{children}</View> : null}</View>;
}

export function PersonalizationEditor() {
  const { theme, setTheme, customSubheadings, setCustomSubheading, resetPersonalization } = useLocalJournal();
  const selectedFont = customSubheadings.globalFont ?? "handwritten";
  return <Section eyebrow="THEME COLLECTION" title="Gradients & fonts">
    <Text style={styles.helper}>Choose a ready-made gradient to apply across the app. Cards inherit this overall background automatically.</Text>
    <Text style={styles.sectionLabel}>VIVID GRADIENTS</Text><ThemeGrid themes={SAVED_THEMES} onApply={(accentColor, backgroundColor, backgroundGradient) => setTheme({ accentColor, backgroundColor, backgroundGradient })} activeBackground={theme.backgroundColor} />
    <Text style={styles.sectionLabel}>PASTEL GRADIENTS</Text><ThemeGrid themes={PASTEL_THEMES} onApply={(accentColor, backgroundColor, backgroundGradient) => setTheme({ accentColor, backgroundColor, backgroundGradient })} activeBackground={theme.backgroundColor} />
    <Text style={styles.sectionLabel}>FONT</Text><Text style={styles.helper}>Swipe left or right to browse the cleaned font list.</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fontRow}>{FONT_OPTIONS.map((font) => <TouchableOpacity key={font.id} accessibilityRole="button" accessibilityState={{ selected: selectedFont === font.id }} onPress={() => setCustomSubheading("globalFont", font.id)} style={[styles.fontButton, selectedFont === font.id && styles.fontSelected]}><Text style={styles.fontText}>{font.label}</Text></TouchableOpacity>)}</ScrollView>
    <TouchableOpacity accessibilityRole="button" onPress={resetPersonalization} style={styles.resetButton}><Text style={styles.resetText}>Reset Themes to default</Text></TouchableOpacity>
  </Section>;
}

function ThemeGrid({ themes, onApply, activeBackground }: { themes: readonly { name: string; accent: string; background: string; gradient: readonly string[] }[]; onApply: (accent: string, background: string, gradient: string[]) => void; activeBackground?: string }) {
  return <View style={styles.themeGrid}>{themes.map((themeOption) => <TouchableOpacity key={themeOption.name} accessibilityRole="button" accessibilityState={{ selected: activeBackground === themeOption.background }} accessibilityLabel={`Apply ${themeOption.name} theme`} onPress={() => onApply(themeOption.accent, themeOption.background, [...themeOption.gradient])} style={[styles.themeButton, activeBackground === themeOption.background && { borderColor: themeOption.accent }]}><View style={styles.themeColors}>{themeOption.gradient.map((color) => <View key={color} style={[styles.themeColor, { backgroundColor: color }]} />)}</View><Text style={styles.themeName}>{themeOption.name}</Text></TouchableOpacity>)}</View>;
}

export function PartnerProfilesEditor() {
  const { partnerNames, partnerColors, partnerAvatars, setPartnerProfiles } = useLocalJournal();
  const [names, setNames] = useState(partnerNames);
  const [colors, setColors] = useState(partnerColors);
  const [avatars, setAvatars] = useState(partnerAvatars);
  useEffect(() => { setNames(partnerNames); setColors(partnerColors); setAvatars(partnerAvatars); }, [partnerAvatars, partnerColors, partnerNames]);
  const save = () => setPartnerProfiles({ names, colors, avatars });
  return <Section eyebrow="SHARED IDENTITY" title="Partner profiles">
    <Text style={styles.helper}>Change both names, icons, and profile colors here. These choices sync with your room.</Text>
    {(["beans", "princess"] as const).map((partnerId) => <View key={partnerId} style={styles.profile}><Text style={styles.profileTitle}>{avatars[partnerId]} {names[partnerId]}</Text><Text style={styles.label}>NAME</Text><TextInput value={names[partnerId]} onChangeText={(value) => setNames((current) => ({ ...current, [partnerId]: value }))} placeholder={PARTNERS[partnerId].name} maxLength={24} style={styles.input} /><Text style={styles.label}>PROFILE ICON</Text><TextInput value={avatars[partnerId]} onChangeText={(value) => setAvatars((current) => ({ ...current, [partnerId]: value }))} placeholder={PARTNERS[partnerId].avatar} maxLength={12} style={styles.input} /><Text style={styles.label}>PROFILE COLOR</Text><View style={styles.swatches}>{PROFILE_SWATCHES.map((color) => <TouchableOpacity key={`${partnerId}-${color}`} accessibilityRole="button" onPress={() => setColors((current) => ({ ...current, [partnerId]: color }))} style={[styles.swatch, { backgroundColor: color }, colors[partnerId] === color && styles.swatchSelected]} />)}</View><TextInput value={colors[partnerId]} onChangeText={(value) => setColors((current) => ({ ...current, [partnerId]: value }))} autoCapitalize="characters" maxLength={7} style={styles.input} /></View>)}
    <View style={styles.actions}><TouchableOpacity accessibilityRole="button" onPress={() => setColors(DEFAULT_PARTNER_COLORS)} style={styles.secondaryButton}><Text style={styles.buttonText}>Reset profile colors</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" onPress={save} style={styles.primaryButton}><Text style={styles.buttonText}>Save profiles</Text></TouchableOpacity></View>
  </Section>;
}

export function PageDescriptionsEditor() {
  const { customSubheadings, setCustomSubheading } = useLocalJournal();
  const [drafts, setDrafts] = useState<Record<string, string>>(customSubheadings);
  useEffect(() => setDrafts(customSubheadings), [customSubheadings]);
  const save = () => SUBHEADING_FIELDS.forEach((field) => setCustomSubheading(field.key, drafts[field.key] ?? ""));
  return <Section eyebrow="PAGE COPY" title="Page descriptions">
    <Text style={styles.helper}>Edit the small descriptions beneath page titles. Leave a field blank to restore the original words.</Text>
    {SUBHEADING_FIELDS.map((field) => <View key={field.key} style={styles.field}><Text style={styles.label}>{field.label}</Text><TextInput value={drafts[field.key] ?? ""} onChangeText={(value) => setDrafts((current) => ({ ...current, [field.key]: value }))} placeholder={SUBHEADING_DEFAULTS[field.key]} maxLength={80} style={styles.input} /></View>)}
    <TouchableOpacity accessibilityRole="button" onPress={save} style={styles.primaryButton}><Text style={styles.buttonText}>Save descriptions</Text></TouchableOpacity>
  </Section>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: "transparent", borderRadius: 18, borderWidth: 1, borderColor: "#FFFFFF55", overflow: "hidden" }, toggle: { minHeight: 62, paddingHorizontal: 15, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, body: { padding: 14, gap: 11, borderTopWidth: 1, borderTopColor: "#FFFFFF33" }, kicker: { fontSize: 9, fontWeight: "900", letterSpacing: 1 }, title: { fontSize: 17, fontWeight: "900", fontStyle: "italic", marginTop: 3 }, chevron: { fontSize: 20, fontWeight: "900" }, helper: { fontSize: 11, lineHeight: 16 }, sectionLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 1, marginTop: 2 }, themeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, themeButton: { minWidth: "30%", flexGrow: 1, borderRadius: 10, borderWidth: 1, borderColor: "#FFFFFF44", backgroundColor: "transparent", padding: 8, gap: 6 }, themeColors: { flexDirection: "row", gap: 4 }, themeColor: { height: 8, flex: 1, borderRadius: 4 }, themeName: { fontSize: 9, fontWeight: "900" }, fontRow: { gap: 8, paddingRight: 14 }, fontButton: { minHeight: 38, borderRadius: 10, borderWidth: 1, borderColor: "#FFFFFF55", paddingHorizontal: 12, justifyContent: "center" }, fontSelected: { backgroundColor: COLORS.orchid, borderColor: COLORS.orchid }, fontText: { fontSize: 11, fontWeight: "900" }, resetButton: { alignSelf: "flex-start", minHeight: 38, borderRadius: 10, borderWidth: 1, borderColor: "#FFFFFF66", paddingHorizontal: 12, justifyContent: "center" }, resetText: { fontSize: 11, fontWeight: "900" }, profile: { gap: 7, borderRadius: 12, borderWidth: 1, borderColor: "#FFFFFF44", backgroundColor: "transparent", padding: 11 }, profileTitle: { fontSize: 14, fontWeight: "900" }, label: { fontSize: 10, fontWeight: "900", letterSpacing: .6 }, input: { minHeight: 40, borderRadius: 10, borderWidth: 1, borderColor: "#FFFFFF55", backgroundColor: "transparent", paddingHorizontal: 10, fontSize: 13 }, swatches: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, swatch: { width: 27, height: 27, borderRadius: 14, borderWidth: 2, borderColor: "transparent" }, swatchSelected: { borderColor: "#FFFFFF" }, actions: { flexDirection: "row", gap: 8 }, primaryButton: { minHeight: 40, flex: 1, borderRadius: 10, backgroundColor: COLORS.orchid, alignItems: "center", justifyContent: "center", paddingHorizontal: 12 }, secondaryButton: { minHeight: 40, flex: 1, borderRadius: 10, borderWidth: 1, borderColor: "#FFFFFF66", alignItems: "center", justifyContent: "center", paddingHorizontal: 12 }, buttonText: { fontSize: 11, fontWeight: "900" }, field: { gap: 5 },
});
