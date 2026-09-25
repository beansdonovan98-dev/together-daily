import { AppFrame } from "@/components/app-frame";
import { GradientCreator } from "@/components/gradient-creator";
import { PageDescriptionsEditor } from "@/components/page-descriptions-editor";
import { PageThemeEditor } from "@/components/page-theme-editor";
import { TabManager } from "@/components/tab-manager";
import { PrivateGate } from "@/components/together-access";
import { COLORS } from "@/lib/together";
import { ScrollView, StyleSheet } from "react-native";
import { VisualText as Text, VisualView as View } from "@/components/visual-primitives";

export default function ThemesScreen() {
  return <PrivateGate>{() => <ThemesContent />}</PrivateGate>;
}

function ThemesContent() {
  return <AppFrame><ScrollView contentContainerStyle={[styles.page, { backgroundColor: "transparent" }]} showsVerticalScrollIndicator={false}>
    <View style={styles.hero}><Text style={styles.eyebrow}>ONE SHARED LOOK</Text><Text style={styles.title}>Themes</Text><Text style={styles.copy}>Choose one shared gradient, font, font color, and borders. You can also animate the shared backdrop or rotate its gradient daily—both choices apply to both of your apps and every page.</Text></View>
    <PageThemeEditor />
    <GradientCreator />
    <TabManager />
    <PageDescriptionsEditor />
  </ScrollView></AppFrame>;
}

const styles = StyleSheet.create({
  page: { padding: 18, paddingBottom: 40, gap: 16, backgroundColor: COLORS.blush, flexGrow: 1 },
  hero: { gap: 4, paddingTop: 4 },
  eyebrow: { color: COLORS.gold, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  title: { color: COLORS.plum, fontSize: 34, fontWeight: "900", fontStyle: "italic" },
  copy: { color: COLORS.slate, fontFamily: "monospace", fontSize: 12, lineHeight: 19, maxWidth: 560 },
});
