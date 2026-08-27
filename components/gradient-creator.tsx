import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useLocalJournal } from "@/lib/local-journal";

const HEX = /^#[0-9A-Fa-f]{6}$/;

export function GradientCreator() {
  const { theme, setTheme } = useLocalJournal();
  const [open, setOpen] = useState(false);
  const [first, setFirst] = useState(theme.backgroundColor ?? "#17113A");
  const [second, setSecond] = useState(theme.accentColor ?? "#FF3D9A");
  const canApply = HEX.test(first) && HEX.test(second);
  const apply = () => {
    if (!canApply) return;
    setTheme({ accentColor: second, backgroundColor: first, backgroundGradient: [first, second] });
    setOpen(false);
  };
  return <View style={styles.card}>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Toggle gradient creator" accessibilityState={{ expanded: open }} onPress={() => setOpen((value) => !value)} style={styles.toggle}>
      <View><Text style={styles.kicker}>MAKE ONE TOGETHER</Text><Text style={styles.title}>Gradient Creator</Text></View><Text style={styles.chevron}>{open ? "⌃" : "⌄"}</Text>
    </TouchableOpacity>
    {open ? <View style={styles.body}>
      <Text style={styles.copy}>Choose two colors, preview the blend, then apply it across the app.</Text>
      <LinearGradient colors={[first, second]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.preview}><Text style={styles.previewText}>Your gradient</Text></LinearGradient>
      <View style={styles.inputs}><View style={styles.field}><Text style={styles.label}>FIRST COLOR</Text><TextInput value={first} onChangeText={setFirst} autoCapitalize="characters" maxLength={7} placeholder="#17113A" placeholderTextColor="#FFFFFF99" style={styles.input}/></View><View style={styles.field}><Text style={styles.label}>SECOND COLOR</Text><TextInput value={second} onChangeText={setSecond} autoCapitalize="characters" maxLength={7} placeholder="#FF3D9A" placeholderTextColor="#FFFFFF99" style={styles.input}/></View></View>
      <TouchableOpacity accessibilityRole="button" disabled={!canApply} onPress={apply} style={[styles.apply, !canApply && styles.disabled]}><Text style={styles.applyText}>Apply gradient</Text></TouchableOpacity>
    </View> : null}
  </View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, borderWidth: 1, borderColor: "rgba(255,255,255,0.34)", backgroundColor: "rgba(20,12,30,0.42)", overflow: "hidden" }, toggle: { minHeight: 62, paddingHorizontal: 15, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, kicker: { color: "#FFFFFF", fontSize: 9, fontWeight: "900", letterSpacing: 1 }, title: { color: "#FFFFFF", fontSize: 17, fontWeight: "900", fontStyle: "italic", marginTop: 3 }, chevron: { color: "#FFFFFF", fontSize: 20, fontWeight: "900" }, body: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.24)", padding: 14, gap: 11 }, copy: { color: "#FFFFFF", fontSize: 11, lineHeight: 16 }, preview: { height: 86, borderRadius: 13, justifyContent: "flex-end", padding: 12 }, previewText: { color: "#FFFFFF", fontSize: 18, fontWeight: "900", fontStyle: "italic" }, inputs: { flexDirection: "row", gap: 9 }, field: { flex: 1, gap: 5 }, label: { color: "#FFFFFF", fontSize: 9, fontWeight: "900", letterSpacing: 0.8 }, input: { minHeight: 42, borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.5)", backgroundColor: "rgba(9,7,14,0.72)", color: "#FFFFFF", paddingHorizontal: 10, fontFamily: "monospace", fontSize: 12 }, apply: { minHeight: 42, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.19)", borderWidth: 1, borderColor: "rgba(255,255,255,0.6)" }, applyText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" }, disabled: { opacity: 0.45 },
});
