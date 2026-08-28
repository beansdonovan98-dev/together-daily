import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { VisualText as Text, VisualTextInput as TextInput, VisualTouchableOpacity as TouchableOpacity, VisualView as View } from "@/components/visual-primitives";

import { DEFAULT_PARTNER_COLORS, PARTNERS, useLocalJournal } from "@/lib/local-journal";

const SWATCHES = ["#A421FF", "#3B82F6", "#00D1FF", "#00C781", "#76D900", "#FFD400", "#FF7A00", "#FF406C", "#FF2D95", "#F700FF"];

export function PartnerProfilesEditor() {
  const { partnerNames, partnerColors, partnerAvatars, setPartnerProfiles } = useLocalJournal();
  const [open, setOpen] = useState(false);
  const [names, setNames] = useState(partnerNames);
  const [colors, setColors] = useState(partnerColors);
  const [avatars, setAvatars] = useState(partnerAvatars);
  useEffect(() => { if (!open) { setNames(partnerNames); setColors(partnerColors); setAvatars(partnerAvatars); } }, [open, partnerAvatars, partnerColors, partnerNames]);
  const save = () => { setPartnerProfiles({ names, colors, avatars }); setOpen(false); };
  return <View style={styles.card}>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Toggle partner profiles" accessibilityState={{ expanded: open }} onPress={() => setOpen((value) => !value)} style={styles.toggle}>
      <View><Text style={styles.kicker}>SHARED IDENTITIES</Text><Text style={styles.title}>Partner Profiles</Text></View><Text style={styles.chevron}>{open ? "⌃" : "⌄"}</Text>
    </TouchableOpacity>
    {open ? <View style={styles.body}>{(["beans", "princess"] as const).map((id) => <View key={id} style={styles.profile}><Text style={styles.name}>{avatars[id]} {names[id]}</Text><View style={styles.row}><TextInput value={names[id]} onChangeText={(value) => setNames((current) => ({ ...current, [id]: value }))} placeholder={PARTNERS[id].name} placeholderTextColor="#FFFFFF99" style={styles.nameInput}/><TextInput value={avatars[id]} onChangeText={(value) => setAvatars((current) => ({ ...current, [id]: value }))} maxLength={12} placeholder={PARTNERS[id].avatar} placeholderTextColor="#FFFFFF99" style={styles.avatarInput}/></View><View style={styles.swatches}>{SWATCHES.map((color) => <TouchableOpacity key={`${id}-${color}`} accessibilityRole="button" accessibilityLabel={`Choose ${color} for ${names[id]}`} onPress={() => setColors((current) => ({ ...current, [id]: color }))} style={[styles.swatch, { backgroundColor: color }, colors[id] === color && styles.selected]}/>)}</View></View>)}<View style={styles.actions}><TouchableOpacity accessibilityRole="button" onPress={() => setColors(DEFAULT_PARTNER_COLORS)} style={styles.secondary}><Text style={styles.secondaryText}>Reset colors</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" onPress={save} style={styles.save}><Text style={styles.saveText}>Save profiles</Text></TouchableOpacity></View></View> : null}
  </View>;
}

const styles = StyleSheet.create({ card: { borderRadius: 18, borderWidth: 1, borderColor: "#000000", backgroundColor: "transparent", overflow: "hidden" }, toggle: { minHeight: 62, paddingHorizontal: 15, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, kicker: { color: "#FFFFFF", fontSize: 9, fontWeight: "900", letterSpacing: 1 }, title: { color: "#FFFFFF", fontSize: 17, fontWeight: "900", fontStyle: "italic", marginTop: 3 }, chevron: { color: "#FFFFFF", fontSize: 20, fontWeight: "900" }, body: { borderTopWidth: 1, borderTopColor: "#000000", padding: 14, gap: 12 }, profile: { gap: 8 }, name: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" }, row: { flexDirection: "row", gap: 8 }, nameInput: { flex: 1, minHeight: 40, borderRadius: 10, borderWidth: 1, borderColor: "#000000", backgroundColor: "rgba(9,7,14,0.72)", color: "#FFFFFF", paddingHorizontal: 10 }, avatarInput: { width: 58, minHeight: 40, borderRadius: 10, borderWidth: 1, borderColor: "#000000", backgroundColor: "rgba(9,7,14,0.72)", color: "#FFFFFF", textAlign: "center", fontSize: 18 }, swatches: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, swatch: { width: 25, height: 25, borderRadius: 13, borderWidth: 2, borderColor: "transparent" }, selected: { borderColor: "#FFFFFF" }, actions: { flexDirection: "row", gap: 8 }, secondary: { minHeight: 40, borderRadius: 10, borderWidth: 1, borderColor: "#000000", paddingHorizontal: 12, alignItems: "center", justifyContent: "center" }, secondaryText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900" }, save: { flex: 1, minHeight: 40, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.19)", borderWidth: 1, borderColor: "#000000", alignItems: "center", justifyContent: "center" }, saveText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900" } });
