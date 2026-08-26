import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { useLocalJournal } from "@/lib/local-journal";

const HEX = /^#[0-9A-Fa-f]{6}$/;

export function GradientCreator() {
  const { setTheme, setPageStyles } = useLocalJournal();
  const [open, setOpen] = useState(false);
  const [colors, setColors] = useState(["#FF4D9D", "#A421FF", "#236BFF"]);
  const valid = colors.every((color) => HEX.test(color));
  const apply = () => {
    if (!valid) return;
    const normalized = colors.map((color) => color.toUpperCase());
    setTheme({ accentColor: normalized[0], backgroundColor: normalized[1], backgroundGradient: normalized });
    setPageStyles({});
  };
  return <View style={styles.card}><TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen((value) => !value)} style={styles.header}><View><Text style={styles.kicker}>MAKE YOUR OWN</Text><Text style={styles.title}>Gradient creator</Text></View><Text style={styles.chevron}>{open ? "⌃" : "⌄"}</Text></TouchableOpacity>{open ? <View style={styles.body}><Text style={styles.helper}>Enter three hex colors to create one shared gradient. It previews here, then applies across all pages.</Text><View style={styles.preview}>{colors.map((color, index) => <View key={`${color}-${index}`} style={[styles.previewStrip, { backgroundColor: HEX.test(color) ? color : "#202026" }]} />)}</View>{colors.map((color, index) => <View key={index} style={styles.field}><Text style={styles.label}>{["START", "MIDDLE", "END"][index]}</Text><TextInput value={color} onChangeText={(value) => setColors((current) => current.map((entry, entryIndex) => entryIndex === index ? value.toUpperCase() : entry))} autoCapitalize="characters" maxLength={7} placeholder="#FF4D9D" style={styles.input} /></View>)}{!valid ? <Text style={styles.error}>Use six-digit colors such as #FF4D9D.</Text> : null}<TouchableOpacity accessibilityRole="button" onPress={apply} disabled={!valid} style={[styles.apply, !valid && styles.disabled]}><Text style={styles.applyText}>Apply custom gradient to all pages</Text></TouchableOpacity></View> : null}</View>;
}

const styles = StyleSheet.create({ card: { borderRadius: 18, borderWidth: 1, borderColor: "#FFFFFF55", backgroundColor: "transparent", overflow: "hidden" }, header: { minHeight: 62, paddingHorizontal: 15, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, body: { padding: 14, gap: 10, borderTopWidth: 1, borderTopColor: "#FFFFFF33" }, kicker: { fontSize: 9, fontWeight: "900", letterSpacing: 1 }, title: { fontSize: 17, fontWeight: "900", fontStyle: "italic", marginTop: 3 }, chevron: { fontSize: 20, fontWeight: "900" }, helper: { fontSize: 11, lineHeight: 16 }, preview: { height: 30, borderRadius: 10, overflow: "hidden", flexDirection: "row" }, previewStrip: { flex: 1 }, field: { gap: 5 }, label: { fontSize: 9, fontWeight: "900", letterSpacing: 1 }, input: { minHeight: 40, borderRadius: 10, borderWidth: 1, borderColor: "#FFFFFF55", backgroundColor: "transparent", paddingHorizontal: 10, fontSize: 13 }, error: { fontSize: 10, fontWeight: "800" }, apply: { minHeight: 42, borderRadius: 11, backgroundColor: "#FFFFFF33", borderWidth: 1, borderColor: "#FFFFFF", alignItems: "center", justifyContent: "center", paddingHorizontal: 12 }, disabled: { opacity: .45 }, applyText: { fontSize: 11, fontWeight: "900" } });
