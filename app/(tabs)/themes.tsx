import { AppFrame } from "@/components/app-frame";
import { PrivateGate } from "@/components/together-access";
import { GradientCreator } from "@/components/gradient-creator";
import { TabManager } from "@/components/tab-manager";

import { useLocalJournal } from "@/lib/local-journal";
import { FONT_OPTIONS, FONT_COLOR_OPTIONS, BORDER_COLOR_OPTIONS, fontFamilyFor } from "@/lib/typography";

const THEMES = [
  { name: "Midnight Purple", bg: "#1A0B2E", accent: "#A855F7", font: "#F3E8FF", border: "#7C3AED", gradient: ["#1A0B2E", "#2D1B4E", "#4C1D95", "#7C3AED"] },
  { name: "Deep Ocean", bg: "#0B1A2E", accent: "#3B82F6", font: "#E0F2FE", border: "#1E40AF", gradient: ["#0B1A2E", "#1E3A5F", "#2563EB", "#3B82F6"] },
  { name: "Forest Night", bg: "#0B2E1A", accent: "#22C55E", font: "#DCFCE7", border: "#166534", gradient: ["#0B2E1A", "#14532D", "#16A34A", "#22C55E"] },
  { name: "Rose Dark", bg: "#2E0B1A", accent: "#EC4899", font: "#FCE7F3", border: "#9D174D", gradient: ["#2E0B1A", "#831843", "#DB2777", "#EC4899"] },
  { name: "Warm Ember", bg: "#2E1A0B", accent: "#F97316", font: "#FFF7ED", border: "#9A3412", gradient: ["#2E1A0B", "#7C2D12", "#EA580C", "#F97316"] },
  { name: "Classic Dark", bg: "#120F14", accent: "#C6A04C", font: "#FFFFFF", border: "#3A313E", gradient: ["#120F14", "#1F1A24", "#3A313E", "#5A4A6A"] },
  { name: "Soft Lavender", bg: "#2D1B4E", accent: "#C084FC", font: "#F3E8FF", border: "#7C3AED", gradient: ["#2D1B4E", "#4C1D95", "#7C3AED", "#C084FC"] },
  { name: "Crimson Night", bg: "#2E0B0B", accent: "#EF4444", font: "#FEE2E2", border: "#991B1B", gradient: ["#2E0B0B", "#7F1D1D", "#DC2626", "#EF4444"] },
  { name: "Teal Depths", bg: "#0B2E2E", accent: "#14B8A6", font: "#CCFBF1", border: "#0F766E", gradient: ["#0B2E2E", "#134E4A", "#0D9488", "#14B8A6"] },
  { name: "Ice Blue", bg: "#0B1F2E", accent: "#0EA5E9", font: "#E0F2FE", border: "#0369A1", gradient: ["#0B1F2E", "#1E3A5F", "#0284C7", "#0EA5E9"] },
  { name: "Starfield", bg: "#0A0A1A", accent: "#FFD700", font: "#FFF8E1", border: "#FFA000", gradient: undefined, pattern: "stars", particles: false },
  { name: "Heart Rain", bg: "#2E0B1A", accent: "#FF69B4", font: "#FCE7F3", border: "#BE185D", gradient: undefined, pattern: "hearts", particles: false },
  { name: "Bubble Pop", bg: "#0B1A2E", accent: "#00D8FF", font: "#E0F7FA", border: "#00ACC1", gradient: undefined, pattern: "bubbles", particles: false },
  { name: "Dot Matrix", bg: "#1F2937", accent: "#A78BFA", font: "#F5F3FF", border: "#7C3AED", gradient: undefined, pattern: "dots", particles: false },
  { name: "Wave Lines", bg: "#0B2E2E", accent: "#2DD4BF", font: "#F0FDFA", border: "#0D9488", gradient: undefined, pattern: "waves", particles: false },
  { name: "Confetti Burst", bg: "#1A0B2E", accent: "#F472B6", font: "#FCE7F3", border: "#DB2777", gradient: undefined, pattern: "confetti", particles: false },
  { name: "Sparkle Dust", bg: "#0F0A1A", accent: "#E879F9", font: "#FAE8FF", border: "#A21CAF", gradient: undefined, pattern: "", particles: true },
  { name: "Firefly Glow", bg: "#0A1A0F", accent: "#84CC16", font: "#ECFCCB", border: "#3F6212", gradient: undefined, pattern: "", particles: true },
  { name: "Snow Drift", bg: "#1E293B", accent: "#94A3B8", font: "#F1F5F9", border: "#475569", gradient: undefined, pattern: "", particles: true },
  { name: "Stardust", bg: "#0A0A14", accent: "#FBBF24", font: "#FFFBEB", border: "#B45309", gradient: undefined, pattern: "", particles: true },
  { name: "Aurora Borealis", bg: "#0A1A1A", accent: "#2DD4BF", font: "#F0FDFA", border: "#0D9488", gradient: undefined, pattern: "", particles: true },
  { name: "Neon Rain", bg: "#0A0A0A", accent: "#22D3EE", font: "#ECFEFF", border: "#0891B2", gradient: undefined, pattern: "", particles: true },
];
import { ScrollView, StyleSheet } from "react-native";
import { VisualText as Text, VisualTouchableOpacity as TouchableOpacity, VisualView as View } from "@/components/visual-primitives";

export default function ThemesScreen() {
  return <PrivateGate>{() => <ThemesContent />}</PrivateGate>;
}

function ThemesContent() {
  const { theme, setTheme } = useLocalJournal();
  return (
    <AppFrame>
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.title}>Themes</Text>
        <View style={styles.row}>
          {FONT_OPTIONS.map(([id, label]) => (
            <TouchableOpacity key={id} onPress={() => setTheme({ fontId: id })} style={styles.chip}>
              <Text style={{ fontFamily: fontFamilyFor(id as any) }}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.section}>Theme</Text>
        <View style={styles.row}>
          {THEMES.map((t) => (
            <TouchableOpacity key={t.name} onPress={() => setTheme({ accentColor: t.accent, backgroundColor: t.bg, fontColor: t.font, borderColor: t.border, backgroundGradient: t.gradient, animatedGradient: !!t.gradient, dailyGradientRotation: false, pattern: t.pattern, particles: t.particles })} style={[styles.themeChip, { backgroundColor: t.bg, borderColor: theme.backgroundColor === t.bg ? t.accent : "#4C1D95" }]}>
              <Text style={[styles.themeChipText, { color: t.font }]}>{t.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.section}>Font Color</Text>
        <View style={styles.row}>
          {FONT_COLOR_OPTIONS.map(([color, label]) => (
            <TouchableOpacity key={color} onPress={() => setTheme({ fontColor: color })} style={[styles.colorChip, { borderColor: color }]}>
              <View style={[styles.swatch, { backgroundColor: color }]} />
              <Text style={styles.chipLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.section}>Border Color</Text>
        <View style={styles.row}>
          {BORDER_COLOR_OPTIONS.map(([color, label]) => (
            <TouchableOpacity key={color} onPress={() => setTheme({ borderColor: color })} style={[styles.colorChip, { borderColor: color }]}>
              <View style={[styles.swatch, { backgroundColor: color }]} />
              <Text style={styles.chipLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

      <GradientCreator />
      <TabManager />
      </ScrollView>
    </AppFrame>
  );
}

const styles = StyleSheet.create({
  page: { padding: 18, gap: 12 },
  title: { color: "#F3E8FF", fontSize: 24, fontWeight: "900" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderColor: "#6D28D9", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  section: { color: "#D8B4FE", fontSize: 12, fontWeight: "900", marginTop: 8 },
  colorChip: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6 },
  swatch: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: "#FFFFFF44" },
  chipLabel: { color: "#F3E8FF", fontSize: 10, fontWeight: "700" },
  themeChip: { borderWidth: 2, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, minWidth: 100 },
  themeChipText: { fontSize: 10, fontWeight: "900", fontStyle: "italic" },
});