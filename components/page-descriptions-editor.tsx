import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SUBHEADING_DEFAULTS } from "@/components/personalization-editor";
import { useLocalJournal } from "@/lib/local-journal";

const FIELDS = Object.entries(SUBHEADING_DEFAULTS) as [keyof typeof SUBHEADING_DEFAULTS, string][];

export function PageDescriptionsEditor() {
  const { customSubheadings, setCustomSubheading } = useLocalJournal();
  const [open, setOpen] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>(customSubheadings);
  useEffect(() => { if (!open) setDrafts(customSubheadings); }, [customSubheadings, open]);
  const save = () => { FIELDS.forEach(([key]) => setCustomSubheading(key, drafts[key] ?? "")); setOpen(false); };
  return <View style={styles.card}><TouchableOpacity accessibilityRole="button" accessibilityLabel="Toggle page descriptions" accessibilityState={{ expanded: open }} onPress={() => setOpen((value) => !value)} style={styles.toggle}><View><Text style={styles.kicker}>PAGE COPY</Text><Text style={styles.title}>Page Descriptions</Text></View><Text style={styles.chevron}>{open ? "⌃" : "⌄"}</Text></TouchableOpacity>{open ? <View style={styles.body}><Text style={styles.copy}>Edit the descriptive words under section titles. Leave a field empty to restore its original words.</Text>{FIELDS.map(([key, fallback]) => <View key={key} style={styles.field}><Text style={styles.label}>{key.replace(/([A-Z])/g, " $1")}</Text><TextInput value={drafts[key] ?? ""} onChangeText={(value) => setDrafts((current) => ({ ...current, [key]: value }))} placeholder={fallback} placeholderTextColor="#FFFFFF99" maxLength={80} style={styles.input}/></View>)}<TouchableOpacity accessibilityRole="button" onPress={save} style={styles.save}><Text style={styles.saveText}>Save descriptions</Text></TouchableOpacity></View> : null}</View>;
}

const styles = StyleSheet.create({ card: { borderRadius: 18, borderWidth: 1, borderColor: "rgba(255,255,255,0.34)", backgroundColor: "rgba(20,12,30,0.42)", overflow: "hidden" }, toggle: { minHeight: 62, paddingHorizontal: 15, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, kicker: { color: "#FFFFFF", fontSize: 9, fontWeight: "900", letterSpacing: 1 }, title: { color: "#FFFFFF", fontSize: 17, fontWeight: "900", fontStyle: "italic", marginTop: 3 }, chevron: { color: "#FFFFFF", fontSize: 20, fontWeight: "900" }, body: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.24)", padding: 14, gap: 10 }, copy: { color: "#FFFFFF", fontSize: 11, lineHeight: 16 }, field: { gap: 4 }, label: { color: "#FFFFFF", fontSize: 9, fontWeight: "900", letterSpacing: 0.7, textTransform: "uppercase" }, input: { minHeight: 40, borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.48)", backgroundColor: "rgba(9,7,14,0.72)", color: "#FFFFFF", paddingHorizontal: 10, fontSize: 12 }, save: { minHeight: 42, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.19)", borderWidth: 1, borderColor: "rgba(255,255,255,0.6)", marginTop: 2 }, saveText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" } });
