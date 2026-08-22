import { AppFrame } from "@/components/app-frame";
import { PersonalizationEditor } from "@/components/personalization-editor";
import { PrivateGate } from "@/components/together-access";
import { COLORS } from "@/lib/together";
import { useLocalJournal } from "@/lib/local-journal";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function ThemesScreen() {
  return <PrivateGate>{() => <ThemesContent />}</PrivateGate>;
}

function ThemesContent() {
  const { theme } = useLocalJournal();
  return <AppFrame><ScrollView contentContainerStyle={[styles.page, { backgroundColor: theme.backgroundColor ?? COLORS.blush }]} showsVerticalScrollIndicator={false}>
    <View style={styles.hero}><Text style={styles.eyebrow}>SHARED PERSONALIZATION</Text><Text style={styles.title}>Themes</Text><Text style={styles.copy}>Choose colors, save named looks, and make the little descriptions across Together Daily feel like yours.</Text></View>
    <PersonalizationEditor />
  </ScrollView></AppFrame>;
}

const styles = StyleSheet.create({
  page: { padding: 18, paddingBottom: 40, gap: 16, backgroundColor: COLORS.blush, flexGrow: 1 },
  hero: { gap: 4, paddingTop: 4 },
  eyebrow: { color: COLORS.gold, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  title: { color: COLORS.plum, fontSize: 34, fontWeight: "900", fontStyle: "italic" },
  copy: { color: COLORS.slate, fontFamily: "monospace", fontSize: 12, lineHeight: 19, maxWidth: 560 },
});
