import { Alert, StyleSheet } from "react-native";

import { VisualText as Text, VisualTouchableOpacity as TouchableOpacity, VisualView as View } from "@/components/visual-primitives";
import { useLocalJournal } from "@/lib/local-journal";
import { PAGE_CLEAR_LABELS, RESETTABLE_PAGE_IDS, type ResettablePageId } from "@/lib/page-content-reset";
import { localDateKey } from "@/lib/together";

function weekStartKey(date: string) {
  const local = new Date(`${date}T12:00:00`);
  local.setDate(local.getDate() - local.getDay());
  return `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, "0")}-${String(local.getDate()).padStart(2, "0")}`;
}

export function PageContentReset({ pageId }: { pageId: string }) {
  const { clearPageContent } = useLocalJournal();
  if (!RESETTABLE_PAGE_IDS.includes(pageId as ResettablePageId)) return null;

  const resettablePage = pageId as ResettablePageId;
  const label = PAGE_CLEAR_LABELS[resettablePage];
  const date = localDateKey();

  const confirmClear = () => Alert.alert(
    `Clear ${label}?`,
    `This removes content added on ${label}. It does not change your Theme, saved Moment Types, templates, or other pages. This cannot be undone.`,
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear page",
        style: "destructive",
        onPress: () => clearPageContent(resettablePage, date, weekStartKey(date)),
      },
    ],
  );

  return <View style={styles.card}>
    <Text style={styles.kicker}>PAGE CONTENT</Text>
    <Text style={styles.title}>Clear this page</Text>
    <Text style={styles.copy}>Remove only this page’s added content from the current room. Your shared Theme and other pages stay unchanged.</Text>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Clear ${label}`} onPress={confirmClear} style={styles.button}>
      <Text style={styles.buttonText}>Clear {label}</Text>
    </TouchableOpacity>
  </View>;
}

const styles = StyleSheet.create({
  card: { marginTop: 16, marginBottom: 22, borderRadius: 18, borderWidth: 1, borderColor: "#000000", padding: 15, gap: 7, backgroundColor: "transparent" },
  kicker: { color: "#FFFFFF", fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  title: { color: "#FFFFFF", fontSize: 17, fontWeight: "900", fontStyle: "italic" },
  copy: { color: "#FFFFFF", fontSize: 10, lineHeight: 15 },
  button: { alignSelf: "flex-start", minHeight: 39, borderRadius: 10, borderWidth: 1, borderColor: "#000000", paddingHorizontal: 12, justifyContent: "center", marginTop: 3, backgroundColor: "rgba(255,255,255,0.10)" },
  buttonText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900" },
});
