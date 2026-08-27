import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { useLocalJournal } from "@/lib/local-journal";
import { TAB_CARD_IDS, tabCardColorDrafts, tabCardColorStylePatches, type TabCardId } from "@/lib/tab-card-colors";
import { COLORS, TAB_CARD_PALETTES } from "@/lib/together";

const TAB_DETAILS: Record<TabCardId, { label: string; glyph: string }> = {
  today: { label: "Today", glyph: "✦" },
  log: { label: "Daily Log", glyph: "☰" },
  habits: { label: "Habits", glyph: "✓" },
  health: { label: "Health", glyph: "✚" },
  steamy: { label: "Steamy", glyph: "♥" },
  purchase: { label: "Purchase", glyph: "▤" },
  cleaning: { label: "Cleaning", glyph: "✦" },
  themes: { label: "Themes", glyph: "◐" },
  pastDays: { label: "Past Days", glyph: "▤" },
};

const TAB_SWATCHES = [
  "#240038", "#3B0756", "#4A0838", "#5A0A2B", "#5A1800", "#4C2A00",
  "#164000", "#00452B", "#004254", "#003E70", "#102A72", "#2D176F",
  "#6B164B", "#7A1430", "#863300", "#765600", "#007A45", "#00747C",
  "#0066A8", "#354FC7", "#6D38C9", "#A32378", "#B72F50", "#C45100",
];
export function TabCardColorEditor() {
  const { pageStyles, setPageStyles, theme } = useLocalJournal();
  const [open, setOpen] = useState(false);
  const [drafts, setDrafts] = useState(() => tabCardColorDrafts(pageStyles));
  const themesCardColor = pageStyles.themes?.cardBackgroundColor ?? TAB_CARD_PALETTES.themes.surface;
  const accentColor = theme.accentColor ?? COLORS.orchid;
  const controlBackground = `${accentColor}26`;

  useEffect(() => {
    if (!open) setDrafts(tabCardColorDrafts(pageStyles));
  }, [open, pageStyles]);

  const save = () => {
    setPageStyles(tabCardColorStylePatches(drafts));
    setOpen(false);
  };
  const reset = () => {
    setPageStyles(Object.fromEntries(TAB_CARD_IDS.map((tabId) => [tabId, { cardBackgroundColor: undefined }])));
    setDrafts(tabCardColorDrafts({}));
  };

  return <View style={[styles.card, { backgroundColor: themesCardColor, borderColor: accentColor }]}>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Toggle tab card colors" accessibilityState={{ expanded: open }} style={styles.toggle} onPress={() => setOpen((value) => !value)}><View><Text style={styles.kicker}>SHARED TAB APPEARANCE</Text><Text style={styles.title}>Tab card colors</Text></View><Text style={styles.chevron}>{open ? "⌃" : "⌄"}</Text></TouchableOpacity>
    {open ? <View style={[styles.content, { borderTopColor: accentColor }]}><Text style={styles.copy}>Choose one vivid shared card color for every tab. Tap a swatch or enter any six-digit hex color.</Text><View style={styles.list}>{TAB_CARD_IDS.map((tabId) => { const detail = TAB_DETAILS[tabId]; const selected = drafts[tabId]; return <View key={tabId} style={[styles.tabCard, { borderColor: accentColor }]}><Text style={styles.tabTitle}>{detail.glyph} {detail.label}</Text><View style={styles.swatches}>{TAB_SWATCHES.map((color) => <TouchableOpacity key={`${tabId}-${color}`} accessibilityRole="button" accessibilityLabel={`Choose ${color} for ${detail.label} cards`} onPress={() => setDrafts((current) => ({ ...current, [tabId]: color }))} style={[styles.swatch, { backgroundColor: color }, selected === color && styles.swatchActive]}/>)}</View><TextInput value={selected} onChangeText={(value) => setDrafts((current) => ({ ...current, [tabId]: value }))} placeholder={TAB_CARD_PALETTES[tabId].surface} placeholderTextColor="#FFFFFF" autoCapitalize="characters" maxLength={7} style={[styles.input, { borderColor: accentColor, backgroundColor: controlBackground }]}/></View>; })}</View><View style={styles.actions}><TouchableOpacity accessibilityRole="button" onPress={reset} style={[styles.resetButton, { borderColor: accentColor }]}><Text style={styles.resetText}>Reset tab colors</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" onPress={save} style={[styles.saveButton, { backgroundColor: accentColor }]}><Text style={styles.saveText}>Save tab colors</Text></TouchableOpacity></View></View> : null}
  </View>;
}

const styles = StyleSheet.create({
  card:{backgroundColor:TAB_CARD_PALETTES.themes.surface,borderRadius:18,borderWidth:1,borderColor:TAB_CARD_PALETTES.themes.border,overflow:"hidden"},toggle:{minHeight:62,paddingHorizontal:15,flexDirection:"row",justifyContent:"space-between",alignItems:"center"},kicker:{color:"#FFC83D",fontSize:9,fontWeight:"900",letterSpacing:1},title:{color:COLORS.plum,fontSize:17,fontWeight:"900",fontStyle:"italic",marginTop:3},chevron:{color:"#C75CFF",fontSize:20,fontWeight:"900"},content:{borderTopWidth:1,borderTopColor:"#563066",padding:14,gap:11},copy:{color:COLORS.slate,fontFamily:"monospace",fontSize:10,lineHeight:15},list:{gap:10},tabCard:{gap:8,padding:11,borderRadius:12,borderWidth:1,backgroundColor:"#21102E"},tabTitle:{color:COLORS.plum,fontSize:12,fontWeight:"900"},swatches:{flexDirection:"row",flexWrap:"wrap",gap:7},swatch:{width:27,height:27,borderRadius:14,borderWidth:2,borderColor:"transparent"},swatchActive:{borderColor:"#FFFFFF",transform:[{scale:1.08}]},input:{minHeight:38,borderRadius:9,borderWidth:1,borderColor:"#67377A",backgroundColor:"#16091E",color:COLORS.plum,paddingHorizontal:10,fontFamily:"monospace",fontSize:11},actions:{flexDirection:"row",gap:9},resetButton:{flex:1,minHeight:42,borderRadius:11,borderWidth:1,borderColor:"#7C3D8D",alignItems:"center",justifyContent:"center"},resetText:{color:"#E1B4F4",fontSize:11,fontWeight:"900"},saveButton:{flex:1,minHeight:42,borderRadius:11,backgroundColor:"#A421FF",alignItems:"center",justifyContent:"center"},saveText:{color:"#FFFFFF",fontSize:12,fontWeight:"900"},
});
