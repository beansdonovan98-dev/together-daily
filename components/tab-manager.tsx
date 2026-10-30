const TABS = [
  { id: "today", label: "Today", glyph: "🏠" },
  { id: "log", label: "Daily Log", glyph: "📋" },
  { id: "health", label: "Health", glyph: "❤️" },
  { id: "nba", label: "NBA", glyph: "🏀" },
  { id: "halloweenEditor", label: "Halloween Editor", glyph: "🎃" },
  { id: "crashReports", label: "Crash Reports", glyph: "🐛" },
  { id: "steamy", label: "Steamy", glyph: "♥️" },
  { id: "purchase", label: "Purchase", glyph: "🛒" },
  { id: "cleaning", label: "Cleaning", glyph: "🧹" },
  { id: "calendar", label: "Calendar", glyph: "📅" },
  { id: "themes", label: "Themes", glyph: "🎨" },
  { id: "pastDays", label: "Past Days", glyph: "📖" },
];
export function TabManager() {
  const { tabLabels, tabGlyphs, setTabCustomizations, tabOrder, theme } = useLocalJournal();
  const accentColor = theme.accentColor ?? COLORS.orchid;
  const textColor = normalizeGlobalTextColor(theme.fontColor);
  const borderColor = normalizeGlobalBorderColor(theme.borderColor);
  const controlBackground = `${accentColor}26`;
  const [open, setOpen] = useState(false);
  const [order, setOrder] = useState<string[]>([]);
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [glyphs, setGlyphs] = useState<Record<string, string>>({});
  const sorted = [...order].map((id) => TABS.find((tab) => tab.id === id)!).filter(Boolean);

  useEffect(() => { if (open) { const stored = tabOrder; setOrder([...stored.filter((id) => TABS.some((tab) => tab.id === id)), ...TABS.map((tab) => tab.id).filter((id) => !stored.includes(id))]); setLabels({ ...tabLabels }); setGlyphs({ ...tabGlyphs }); } }, [open]);
  const move = (id: string, direction: -1 | 1) => { const index = order.indexOf(id); const target = index + direction; if (target < 0 || target >= order.length) return; const next = [...order]; [next[index], next[target]] = [next[target], next[index]]; setOrder(next); };
  const save = () => { setTabCustomizations({ labels, glyphs, order }); setOpen(false); };

  return <View style={[styles.card, { backgroundColor: "transparent", borderColor }]}>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Toggle tab manager" accessibilityState={{ expanded: open }} style={styles.toggle} onPress={() => setOpen((value) => !value)}><View><Text style={[styles.kicker, { color: textColor }]}>SHARED NAVIGATION</Text><Text style={[styles.title, { color: textColor }]}>Rename & sort tabs</Text></View><Text style={[styles.chevron, { color: textColor }]}>{open ? "⌃" : "⌄"}</Text></TouchableOpacity>
    {open ? <View style={[styles.content, { borderTopColor: borderColor }]}><Text style={[styles.copy, { color: textColor }]}>Choose each tab’s emoji and name, then use the arrows to sort the top navigation. These changes update for both Daddy and Princess.</Text>{sorted.map((tab, index) => <View key={tab.id} style={styles.row}><TextInput value={glyphs[tab.id] ?? ""} onChangeText={(value) => setGlyphs((current) => ({ ...current, [tab.id]: value }))} placeholder={tab.glyph} placeholderTextColor={textColor} maxLength={12} style={[styles.glyphInput, { borderColor, backgroundColor: controlBackground, color: textColor }]}/><TextInput value={labels[tab.id] ?? ""} onChangeText={(value) => setLabels((current) => ({ ...current, [tab.id]: value }))} placeholder={tab.label} placeholderTextColor={textColor} maxLength={18} style={[styles.input, { borderColor, backgroundColor: controlBackground, color: textColor }]}/><View style={styles.arrows}><TouchableOpacity accessibilityRole="button" accessibilityLabel={`Move ${tab.label} earlier`} disabled={index === 0} onPress={() => move(tab.id, -1)} style={[styles.arrowButton, { borderColor }, index === 0 && styles.disabled]}><Text style={[styles.arrow, { color: textColor }]}>↑</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" accessibilityLabel={`Move ${tab.label} later`} disabled={index === sorted.length - 1} onPress={() => move(tab.id, 1)} style={[styles.arrowButton, { borderColor }, index === sorted.length - 1 && styles.disabled]}><Text style={[styles.arrow, { color: textColor }]}>↓</Text></TouchableOpacity></View></View>)}<TouchableOpacity accessibilityRole="button" onPress={save} style={[styles.saveButton, { backgroundColor: accentColor, borderColor, borderWidth: 1 }]}><Text style={[styles.saveText, { color: textColor }]}>Save tab layout</Text></TouchableOpacity></View> : null}
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: "transparent", borderRadius: 18, borderWidth: 1, borderColor: "#000000", overflow: "hidden" },
  toggle: { minHeight: 62, paddingHorizontal: 15, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  kicker: { color: COLORS.gold, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  title: { color: COLORS.plum, fontSize: 17, fontWeight: "900", fontStyle: "italic", marginTop: 3 },
  chevron: { color: COLORS.orchid, fontSize: 20, fontWeight: "900" },
  content: { borderTopWidth: 1, borderTopColor: "#35273D", padding: 14, gap: 8 },
  copy: { color: COLORS.slate, fontFamily: "monospace", fontSize: 10, lineHeight: 15, marginBottom: 2 },
  row: { flexDirection: "row", gap: 8, alignItems: "center" },
  glyphInput: { width: 42, minHeight: 37, borderRadius: 9, borderWidth: 1, borderColor: "#3A313E", backgroundColor: "#121014", color: COLORS.plum, textAlign: "center", fontSize: 17 },
  input: { flex: 1, minHeight: 37, borderRadius: 9, borderWidth: 1, borderColor: "#3A313E", backgroundColor: "#121014", color: COLORS.plum, paddingHorizontal: 9, fontSize: 12 },
  arrows: { flexDirection: "row", gap: 4 },
  arrowButton: { width: 31, height: 31, borderRadius: 8, borderWidth: 1, borderColor: "#4A3B50", alignItems: "center", justifyContent: "center" },
  arrow: { color: COLORS.plum, fontSize: 15, fontWeight: "900" },
  disabled: { opacity: .32 },
  saveButton: { minHeight: 42, borderRadius: 11, backgroundColor: COLORS.orchid, alignItems: "center", justifyContent: "center", marginTop: 4 },
  saveText: { color: COLORS.white, fontSize: 13, fontWeight: "900" },
});
