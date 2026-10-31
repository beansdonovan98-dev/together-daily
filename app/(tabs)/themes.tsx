import { AppFrame } from "@/components/app-frame";
import { PrivateGate } from "@/components/together-access";
import { TabManager } from "@/components/tab-manager";
import { useLocalJournal } from "@/lib/local-journal";
import { FONT_OPTIONS, FONT_COLOR_OPTIONS, BORDER_COLOR_OPTIONS, fontFamilyFor } from "@/lib/typography";
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
});