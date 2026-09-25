import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { VisualText as Text, VisualTextInput as TextInput, VisualTouchableOpacity as TouchableOpacity, VisualView as View } from "@/components/visual-primitives";

import { PARTNERS, useLocalJournal } from "@/lib/local-journal";

export function PartnerProfilesEditor() {
  const { partnerNames, partnerColors, partnerAvatars, setPartnerProfiles } = useLocalJournal();
  const [open, setOpen] = useState(false);
  const [names, setNames] = useState(partnerNames);

  useEffect(() => {
    if (!open) setNames(partnerNames);
  }, [open, partnerNames]);

  const save = () => {
    setPartnerProfiles({ names, colors: partnerColors, avatars: partnerAvatars });
    setOpen(false);
  };

  return <View style={styles.card}>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Toggle partner profiles" accessibilityState={{ expanded: open }} onPress={() => setOpen((value) => !value)} style={styles.toggle}>
      <View><Text style={styles.kicker}>SHARED IDENTITIES</Text><Text style={styles.title}>Partner Profiles</Text></View><Text style={styles.chevron}>{open ? "⌃" : "⌄"}</Text>
    </TouchableOpacity>
    {open ? <View style={styles.body}>
      <Text style={styles.copy}>Rename the two profiles here. Choose the profile emoji under Gradients & Fonts.</Text>
      {(["beans", "princess"] as const).map((id) => <View key={id} style={styles.profile}>
        <Text style={styles.name}>{partnerAvatars[id]} {names[id]}</Text>
        <TextInput value={names[id]} onChangeText={(value) => setNames((current) => ({ ...current, [id]: value }))} placeholder={PARTNERS[id].name} placeholderTextColor="#FFFFFF99" style={styles.nameInput}/>
      </View>)}
      <TouchableOpacity accessibilityRole="button" onPress={save} style={styles.save}><Text style={styles.saveText}>Save profiles</Text></TouchableOpacity>
    </View> : null}
  </View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, borderWidth: 1, borderColor: "#000000", backgroundColor: "transparent", overflow: "hidden" },
  toggle: { minHeight: 62, paddingHorizontal: 15, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  kicker: { color: "#FFFFFF", fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  title: { color: "#FFFFFF", fontSize: 17, fontWeight: "900", fontStyle: "italic", marginTop: 3 },
  chevron: { color: "#FFFFFF", fontSize: 20, fontWeight: "900" },
  body: { borderTopWidth: 1, borderTopColor: "#000000", padding: 14, gap: 12 },
  copy: { color: "#FFFFFF", fontSize: 11, lineHeight: 16 },
  profile: { gap: 8 },
  name: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  nameInput: { minHeight: 40, borderRadius: 10, borderWidth: 1, borderColor: "#000000", backgroundColor: "rgba(9,7,14,0.72)", color: "#FFFFFF", paddingHorizontal: 10 },
  save: { minHeight: 40, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.19)", borderWidth: 1, borderColor: "#000000", alignItems: "center", justifyContent: "center" },
  saveText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900" },
});
