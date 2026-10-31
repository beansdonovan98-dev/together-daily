import { AppFrame } from "@/components/app-frame";
import { PrivateGate } from "@/components/together-access";
import { useLocalJournal } from "@/lib/local-journal";
import { FONT_OPTIONS, fontFamilyFor } from "@/lib/typography";
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
      </ScrollView>
    </AppFrame>
  );
}

const styles = StyleSheet.create({
  page: { padding: 18, gap: 12 },
  title: { color: "#F3E8FF", fontSize: 24, fontWeight: "900" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderColor: "#6D28D9", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
});