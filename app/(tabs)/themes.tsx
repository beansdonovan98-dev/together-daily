import { AppFrame } from "@/components/app-frame";
import { TabManager } from "@/components/tab-manager";
import { PrivateGate } from "@/components/together-access";
import { COLORS } from "@/lib/together";
import { useLocalJournal } from "@/lib/local-journal";
import { BORDER_COLOR_OPTIONS, FONT_COLOR_OPTIONS, FONT_OPTIONS, fontFamilyFor, normalizeGlobalBorderColor, normalizeGlobalTextColor } from "@/lib/typography";
import { ScrollView, StyleSheet } from "react-native";
import { VisualText as Text, VisualTouchableOpacity as TouchableOpacity, VisualView as View } from "@/components/visual-primitives";

const THEMES = [
  { name: "Midnight Purple", bg: "#1A0B2E", accent: "#A855F7", font: "#F3E8FF", border: "#7C3AED", gradient: ["#1A0B2E", "#2D1B4E", "#4C1D95", "#7C3AED"] },
  { name: "Deep Ocean", bg: "#0B1A2E", accent: "#3B82F6", font: "#E0F2FE", border: "#1E40AF", gradient: ["#0B1A2E", "#1E3A5F", "#2563EB", "#3B82F6"] },
  { name: "Forest Night", bg: "#0B2E1A", accent: "#22C55E", font: "#DCFCE7", border: "#166534", gradient: ["#0B2E1A", "#14532D", "#16A34A", "#22C55E"] },
  { name: "Rose Dark", bg: "#2E0B1A", accent: "#EC4899", font: "#FCE7F3", border: "#9D174D", gradient: ["#2E0B1A", "#831843", "#DB2777", "#EC4899"] },
  { name: "Warm Ember", bg: "#2E1A0B", accent: "#F97316", font: "#FFF7ED", border: "#9A3412", gradient: ["#2E1A0B", "#7C2D12", "#EA580C", "#F97316"] },
  { name: "Slate Gray", bg: "#1F2937", accent: "#9CA3AF", font: "#F9FAFB", border: "#374151", gradient: ["#1F2937", "#374151", "#6B7280", "#9CA3AF"] },
  { name: "Classic Dark", bg: "#120F14", accent: "#C6A04C", font: "#FFFFFF", border: "#3A313E", gradient: ["#120F14", "#1F1A24", "#3A313E", "#5A4A6A"] },
  { name: "Soft Lavender", bg: "#2D1B4E", accent: "#C084FC", font: "#F3E8FF", border: "#7C3AED", gradient: ["#2D1B4E", "#4C1D95", "#7C3AED", "#C084FC"] },
  { name: "Crimson Night", bg: "#2E0B0B", accent: "#EF4444", font: "#FEE2E2", border: "#991B1B", gradient: ["#2E0B0B", "#7F1D1D", "#DC2626", "#EF4444"] },
  { name: "Teal Depths", bg: "#0B2E2E", accent: "#14B8A6", font: "#CCFBF1", border: "#0F766E", gradient: ["#0B2E2E", "#134E4A", "#0D9488", "#14B8A6"] },
  { name: "Golden Hour", bg: "#2E2A0B", accent: "#EAB308", font: "#FEF9C3", border: "#854D0E", gradient: ["#2E2A0B", "#713F12", "#CA8A04", "#EAB308"] },
  { name: "Ice Blue", bg: "#0B1F2E", accent: "#0EA5E9", font: "#E0F2FE", border: "#0369A1", gradient: ["#0B1F2E", "#1E3A5F", "#0284C7", "#0EA5E9"] },
  { name: "Magenta Dusk", bg: "#2E0B2E", accent: "#D946EF", font: "#FAE8FF", border: "#86198F", gradient: ["#2E0B2E", "#701A75", "#C026D3", "#D946EF"] },
  { name: "Earth Brown", bg: "#2E1F0B", accent: "#D97706", font: "#FEF3C7", border: "#92400E", gradient: ["#2E1F0B", "#78350F", "#B45309", "#D97706"] },
  { name: "Mint Fresh", bg: "#0B2E1F", accent: "#10B981", font: "#D1FAE5", border: "#065F46", gradient: ["#0B2E1F", "#064E3B", "#059669", "#10B981"] },
  { name: "Steel Blue", bg: "#0F172A", accent: "#64748B", font: "#F1F5F9", border: "#334155", gradient: ["#0F172A", "#1E293B", "#475569", "#64748B"] },
  { name: "Cherry Blossom", bg: "#2E0B1F", accent: "#F472B6", font: "#FCE7F3", border: "#BE185D", gradient: ["#2E0B1F", "#831843", "#DB2777", "#F472B6"] },
  { name: "Amber Glow", bg: "#2E230B", accent: "#FBBF24", font: "#FFFBEB", border: "#B45309", gradient: ["#2E230B", "#78350F", "#D97706", "#FBBF24"] },
  { name: "Arctic White", bg: "#1E293B", accent: "#38BDF8", font: "#F0F9FF", border: "#0284C7", gradient: ["#1E293B", "#0C4A6E", "#0284C7", "#38BDF8"] },
  { name: "Volcanic", bg: "#1C0A00", accent: "#FF4500", font: "#FFF7ED", border: "#9A3412", gradient: ["#1C0A00", "#7C2D12", "#C2410C", "#FF4500"] },
];

export default function ThemesScreen() {
  return <PrivateGate>{() => <ThemesContent />}</PrivateGate>;
}

function ThemesContent() {
  const { theme, setTheme } = useLocalJournal();
  const activeFont = theme.fontId ?? "handwritten";
  const activeFontColor = normalizeGlobalTextColor(theme.fontColor);
  const activeBorderColor = normalizeGlobalBorderColor(theme.borderColor);

  return (
    <AppFrame>
      <ScrollView contentContainerStyle={[styles.page, { backgroundColor: "transparent" }]} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>ONE SHARED LOOK</Text>
          <Text style={styles.title}>Themes</Text>
          <Text style={styles.copy}>Pick a shared theme, font, and colors. Changes apply for both of you instantly.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>THEME</Text>
          <View style={styles.themeGrid}>
            {THEMES.map((t) => (
              <TouchableOpacity
                key={t.name}
                accessibilityRole="button"
                onPress={() => setTheme({ accentColor: t.accent, backgroundColor: t.bg, fontColor: t.font, borderColor: t.border, backgroundGradient: t.gradient, animatedGradient: true, dailyGradientRotation: false })}
                style={[styles.themeCard, { backgroundColor: t.bg, borderColor: theme.backgroundColor === t.bg ? t.accent : "#4C1D95" }]}
              >
                <Text style={[styles.themeName, { color: t.font }]}>{t.name}</Text>
                <View style={[styles.themeAccent, { backgroundColor: t.accent }]} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>FONT</Text>
          <View style={styles.fontRow}>
            {FONT_OPTIONS.map(([id, label]) => (
              <TouchableOpacity
                key={id}
                accessibilityRole="button"
                onPress={() => setTheme({ fontId: id })}
                style={[styles.chip, activeFont === id && styles.chipSelected]}
              >
                <Text style={[styles.chipText, { fontFamily: fontFamilyFor(id as any) }]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>FONT COLOR</Text>
          <View style={styles.colorRow}>
            {FONT_COLOR_OPTIONS.map(([color, label]) => (
              <TouchableOpacity
                key={color}
                accessibilityRole="button"
                onPress={() => setTheme({ fontColor: color })}
                style={[styles.colorChip, activeFontColor === color && styles.colorChipSelected]}
              >
                <View style={[styles.colorSwatch, { backgroundColor: color }]} />
                <Text style={styles.colorChipLabel}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>BORDER COLOR</Text>
          <View style={styles.colorRow}>
            {BORDER_COLOR_OPTIONS.map(([color, label]) => (
              <TouchableOpacity
                key={color}
                accessibilityRole="button"
                onPress={() => setTheme({ borderColor: color })}
                style={[styles.colorChip, activeBorderColor === color && styles.colorChipSelected]}
              >
                <View style={[styles.colorSwatch, { backgroundColor: color }]} />
                <Text style={styles.colorChipLabel}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TabManager />
      </ScrollView>
    </AppFrame>
  );
}

const styles = StyleSheet.create({
  page: { padding: 18, paddingBottom: 40, gap: 16, backgroundColor: "transparent", flexGrow: 1 },
  hero: { gap: 4, paddingTop: 4 },
  eyebrow: { color: "#A855F7", fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  title: { color: "#F3E8FF", fontSize: 34, fontWeight: "900", fontStyle: "italic" },
  copy: { color: "#D8B4FE", fontFamily: "monospace", fontSize: 12, lineHeight: 19, maxWidth: 560 },
  card: { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 18, borderWidth: 1, borderColor: "#4C1D95", padding: 14, gap: 10 },
  sectionLabel: { color: "#D8B4FE", fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  fontRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderColor: "#6D28D9", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  chipSelected: { backgroundColor: "#A855F7", borderColor: "#A855F7" },
  chipText: { color: "#F3E8FF", fontSize: 12, fontWeight: "700" },
  colorRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  colorChip: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: "#6D28D9", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6 },
  colorChipSelected: { borderColor: "#A855F7", backgroundColor: "rgba(168,85,247,0.15)" },
  colorSwatch: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: "#FFFFFF44" },
  colorChipLabel: { color: "#F3E8FF", fontSize: 10, fontWeight: "700" },
  themeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  themeCard: { width: "47%", borderRadius: 12, borderWidth: 2, padding: 14, gap: 6, minHeight: 60, justifyContent: "center" },
  themeName: { fontSize: 12, fontWeight: "900", fontStyle: "italic" },
  themeAccent: { width: 24, height: 4, borderRadius: 2 },
});