import { AppFrame } from "@/components/app-frame";
import { PrivateGate } from "@/components/together-access";
import { COLORS, TAB_CARD_PALETTES } from "@/lib/together";
import { PARTNERS, type PartnerId, type PurchaseCategory, useLocalJournal } from "@/lib/local-journal";
import { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { VisualText as Text, VisualTextInput as TextInput, VisualTouchableOpacity as TouchableOpacity, VisualView as View } from "@/components/visual-primitives";

const CATEGORIES: { key: PurchaseCategory; title: string; kicker: string; emoji: string; color: string; placeholder: string }[] = [
  { key: "groceries", title: "Groceries", kicker: "KITCHEN & FOOD", emoji: "🛒", color: "#8CBF8C", placeholder: "Add a grocery item" },
  { key: "house", title: "For the House", kicker: "HOME & CARE", emoji: "⌂", color: "#74B6D8", placeholder: "Add something for the house" },
  { key: "misc", title: "Misc.", kicker: "ANYTHING ELSE", emoji: "✦", color: "#C29BDF", placeholder: "Add a miscellaneous item" },
];

export default function PurchasesScreen() { return <PrivateGate>{({ userId }) => <PurchasesContent userId={userId} />}</PrivateGate>; }

function PurchasesContent({ userId }: { userId: PartnerId }) {
  const { purchaseItems, addPurchaseItem, togglePurchaseItem, deletePurchaseItem } = useLocalJournal();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const add = (category: PurchaseCategory) => { const text = drafts[category] ?? ""; if (!text.trim()) return; addPurchaseItem(category, text); setDrafts((current) => ({ ...current, [category]: "" })); };
  const remaining = purchaseItems.filter((item) => !item.purchased).length;

  return <AppFrame><ScrollView contentContainerStyle={[styles.page, { backgroundColor: "transparent" }]} showsVerticalScrollIndicator={false}>
    <View style={styles.hero}><Text style={styles.eyebrow}>SHARED SHOPPING LIST</Text><Text style={styles.title}>Purchase</Text><Text style={styles.copy}>{remaining ? `${remaining} thing${remaining === 1 ? "" : "s"} still to pick up.` : "Your list is clear for now."}</Text></View>
  {CATEGORIES.map((category) => { const items = purchaseItems.filter((item) => item.category === category.key); const active = items.filter((item) => !item.purchased); return <View key={category.key} style={[styles.category, { backgroundColor: "transparent", borderColor: "#000000" }]}><View style={styles.categoryHeader}><View style={styles.categoryTitleRow}><Text style={styles.categoryEmoji}>{category.emoji}</Text><View><Text style={[styles.categoryKicker, { color: category.color }]}>{category.kicker}</Text><Text style={styles.categoryTitle}>{category.title}</Text></View></View><Text style={[styles.categoryCount, { color: category.color }]}>{active.length} LEFT</Text></View><View style={styles.addRow}><TextInput value={drafts[category.key] ?? ""} onChangeText={(value) => setDrafts((current) => ({ ...current, [category.key]: value }))} onSubmitEditing={() => add(category.key)} returnKeyType="done" placeholder={category.placeholder} placeholderTextColor="#7F7582" style={styles.input}/><TouchableOpacity accessibilityRole="button" onPress={() => add(category.key)} style={[styles.addButton, { backgroundColor: category.color }]}><Text style={styles.addText}>Add</Text></TouchableOpacity></View><View style={styles.itemList}>{items.map((item) => { const addedBy = PARTNERS[item.addedBy]; const purchasedBy = item.purchasedBy ? PARTNERS[item.purchasedBy] : null; return <View key={item.id} style={[styles.itemRow, item.purchased && styles.itemRowPurchased, { backgroundColor: "transparent", borderColor: "#000000" }]}><TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: item.purchased }} accessibilityLabel={`Mark ${item.text} ${item.purchased ? "not purchased" : "purchased"}`} onPress={() => togglePurchaseItem(item.id)} style={[styles.check, item.purchased && { backgroundColor: purchasedBy?.color ?? category.color, borderColor: purchasedBy?.color ?? category.color }]}><Text style={styles.checkText}>{item.purchased ? "✓" : ""}</Text></TouchableOpacity><View style={styles.itemBody}><Text style={[styles.itemText, item.purchased && styles.itemTextPurchased]}>{item.text}</Text><Text style={[styles.itemMeta, { color: item.purchased ? purchasedBy?.color : addedBy.color }]}>{item.purchased ? `${purchasedBy?.name} picked it up` : `${addedBy.name} added it`}</Text></View><TouchableOpacity accessibilityRole="button" accessibilityLabel={`Delete ${item.text}`} onPress={() => deletePurchaseItem(item.id)} style={styles.deleteButton}><Text style={styles.deleteText}>×</Text></TouchableOpacity></View>; })}</View>{!items.length ? <Text style={styles.empty}>Nothing here yet—add what you need.</Text> : null}</View>; })}
  </ScrollView></AppFrame>;
}

const styles = StyleSheet.create({
  page: { padding: 18, paddingBottom: 42, gap: 14, flexGrow: 1, backgroundColor: COLORS.blush },
  hero: { gap: 4, paddingTop: 4 },
  eyebrow: { color: COLORS.gold, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  title: { color: COLORS.plum, fontSize: 34, fontWeight: "900", fontStyle: "italic" },
  copy: { color: COLORS.slate, fontFamily: "monospace", fontSize: 12, lineHeight: 19 },
  category: { borderRadius: 19, borderWidth: 1, borderColor: TAB_CARD_PALETTES.purchase.border, backgroundColor: TAB_CARD_PALETTES.purchase.surface, padding: 14, gap: 10 },
  categoryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  categoryTitleRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  categoryEmoji: { fontSize: 20 },
  categoryKicker: { fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  categoryTitle: { color: COLORS.plum, fontSize: 19, fontWeight: "900", fontStyle: "italic", marginTop: 2 },
  categoryCount: { fontFamily: "monospace", fontSize: 10, fontWeight: "900" },
  addRow: { flexDirection: "row", gap: 8 },
  input: { flex: 1, minHeight: 42, borderRadius: 11, borderWidth: 1, borderColor: "#3A313E", backgroundColor: "#121014", color: COLORS.plum, paddingHorizontal: 11, fontSize: 13 },
  addButton: { minWidth: 55, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  addText: { color: COLORS.ink, fontSize: 12, fontWeight: "900" },
  itemList: { gap: 7 },
  itemRow: { flexDirection: "row", alignItems: "center", gap: 9, borderRadius: 11, backgroundColor: TAB_CARD_PALETTES.purchase.surface, borderWidth: 1, borderColor: TAB_CARD_PALETTES.purchase.border, padding: 10 },
  itemRowPurchased: { backgroundColor: TAB_CARD_PALETTES.purchase.surface, borderColor: "#375745" },
  check: { width: 23, height: 23, borderRadius: 12, borderWidth: 1, borderColor: "#69706B", alignItems: "center", justifyContent: "center" },
  checkText: { color: COLORS.white, fontWeight: "900" },
  itemBody: { flex: 1, gap: 2 },
  itemText: { color: COLORS.plum, fontSize: 13, fontWeight: "800" },
  itemTextPurchased: { color: COLORS.slate, textDecorationLine: "line-through" },
  itemMeta: { fontFamily: "monospace", fontSize: 9, fontWeight: "800" },
  deleteButton: { width: 27, height: 27, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  deleteText: { color: "#9C7882", fontSize: 21, lineHeight: 22 },
  empty: { color: COLORS.slate, fontFamily: "monospace", fontSize: 10, paddingTop: 2 },
});
