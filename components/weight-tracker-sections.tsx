import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { WeightHistoryGraph, type WeightPoint } from "@/components/weight-history-graph";
import { PARTNERS, type PartnerId } from "@/lib/local-journal";
import { COLORS, asObject, prettyDate } from "@/lib/together";

type WeightEntry = { value: string; recordedAt: string };

type WeightTrackerSectionsProps = {
  userId: PartnerId;
  today: string;
  day: Record<string, any>;
  allDays: Record<string, any>[];
  updateDay: (date: string, patch: Record<string, unknown>) => void;
};

function calendarDaysBetween(fromDate: string, toDate: string) {
  const [fromYear, fromMonth, fromDay] = fromDate.split("-").map(Number);
  const [toYear, toMonth, toDay] = toDate.split("-").map(Number);
  return Math.max(0, Math.floor((Date.UTC(toYear, toMonth - 1, toDay) - Date.UTC(fromYear, fromMonth - 1, fromDay)) / 86_400_000));
}

export function WeightTrackerSections({ userId, today, day, allDays, updateDay }: WeightTrackerSectionsProps) {
  const [weightDraft, setWeightDraft] = useState("");
  const weightInfoFor = (partnerId: PartnerId) => {
    const latest = [...allDays]
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
      .map((entry) => ({ date: String(entry.date), entry: asObject(entry.weightCheckIns)[partnerId] as WeightEntry | undefined }))
      .find((item) => item.entry?.value);
    const daysSince = latest ? calendarDaysBetween(latest.date, today) : null;
    return {
      entry: latest?.entry,
      date: latest?.date,
      ready: daysSince === null || daysSince >= 3,
      daysUntil: daysSince === null ? 0 : Math.max(0, 3 - daysSince),
    };
  };
  const weightHistoryFor = (partnerId: PartnerId): WeightPoint[] => [...allDays]
    .map((entry) => {
      const weight = asObject(entry.weightCheckIns)[partnerId] as WeightEntry | undefined;
      return { date: String(entry.date), value: Number(weight?.value) };
    })
    .filter((point) => Number.isFinite(point.value) && point.value > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
  const saveWeight = () => {
    const parsed = Number(weightDraft.trim());
    const ownInfo = weightInfoFor(userId);
    if (!Number.isFinite(parsed) || parsed <= 0 || !ownInfo.ready) return;
    const currentEntries = asObject(day.weightCheckIns);
    updateDay(today, { weightCheckIns: { ...currentEntries, [userId]: { value: String(parsed), recordedAt: new Date().toISOString() } } });
    setWeightDraft("");
  };

  return <>
    <View style={styles.weightCard}><View style={styles.weightHeader}><View><Text style={styles.weightKicker}>PERSONAL CHECK-INS</Text><Text style={styles.weightTitle}>Weight tracker</Text></View><Text style={styles.weightCadence}>EVERY 3 DAYS · LBS</Text></View><Text style={styles.weightCopy}>Each partner can record their own weight in pounds once every three days. Entries are saved to that day’s history.</Text><View style={styles.weightGrid}>{(["beans", "princess"] as PartnerId[]).map((id) => { const person = PARTNERS[id]; const info = weightInfoFor(id); const mine = id === userId; const status = info.ready ? (info.entry ? "Ready for a new check-in" : "Ready for first check-in") : `Next check-in in ${info.daysUntil} ${info.daysUntil === 1 ? "day" : "days"}`; return <View key={id} style={[styles.weightPersonCard, { borderColor: `${person.color}88` }]}><Text style={[styles.weightPartner, { color: person.color }]}>{person.avatar} {person.name}</Text><Text style={styles.weightValue}>{info.entry?.value ? `${info.entry.value} lb` : "—"}</Text><Text style={styles.weightMeta}>{info.entry && info.date ? `Last: ${prettyDate(info.date)}` : "No check-in yet"}</Text>{mine && info.ready ? <View style={styles.weightInputRow}><TextInput value={weightDraft} onChangeText={setWeightDraft} onSubmitEditing={saveWeight} returnKeyType="done" placeholder="Weight (lb)" placeholderTextColor="#7F7582" keyboardType="decimal-pad" style={styles.weightInput}/><TouchableOpacity accessibilityRole="button" onPress={saveWeight} style={[styles.weightSaveButton, { backgroundColor: person.color }]}><Text style={styles.weightSaveText}>Save</Text></TouchableOpacity></View> : <Text style={[styles.weightStatus, { color: info.ready ? person.color : COLORS.slate }]}>{status}</Text>}</View>; })}</View></View>
    <View style={styles.weightHistoryCard}><Text style={styles.weightHistoryKicker}>WEIGHT HISTORY</Text><Text style={styles.weightHistoryTitle}>Every check-in, in lbs</Text><Text style={styles.weightHistoryCopy}>Each line keeps a separate history for {PARTNERS.beans.name} and {PARTNERS.princess.name}.</Text><WeightHistoryGraph partnerId="beans" points={weightHistoryFor("beans")}/><WeightHistoryGraph partnerId="princess" points={weightHistoryFor("princess")}/></View>
  </>;
}

const styles = StyleSheet.create({
  weightCard:{backgroundColor:"#141922",borderRadius:18,borderWidth:1,borderColor:"#35425A",padding:14},weightHeader:{flexDirection:"row",justifyContent:"space-between",alignItems:"flex-start"},weightKicker:{color:"#66B7DD",fontSize:9,fontWeight:"900",letterSpacing:1},weightTitle:{color:COLORS.plum,fontSize:19,fontWeight:"900",fontStyle:"italic",marginTop:3},weightCadence:{color:"#66B7DD",fontSize:9,fontWeight:"900",fontFamily:"monospace",paddingTop:4},weightCopy:{color:COLORS.slate,fontFamily:"monospace",fontSize:10,lineHeight:16,marginTop:5},weightGrid:{flexDirection:"row",gap:9,marginTop:13},weightPersonCard:{flex:1,borderRadius:13,borderWidth:1,backgroundColor:"#11141B",padding:11},weightPartner:{fontSize:11,fontWeight:"900"},weightValue:{color:COLORS.plum,fontSize:23,fontWeight:"900",fontStyle:"italic",marginTop:7},weightMeta:{color:COLORS.slate,fontFamily:"monospace",fontSize:9,marginTop:2},weightStatus:{fontFamily:"monospace",fontSize:9,fontWeight:"900",marginTop:10,lineHeight:13},weightInputRow:{flexDirection:"row",gap:5,marginTop:9,alignItems:"center"},weightInput:{flex:1,minHeight:35,borderRadius:8,borderWidth:1,borderColor:"#3A465D",backgroundColor:"#0E1118",color:COLORS.plum,paddingHorizontal:7,fontSize:11},weightSaveButton:{minHeight:35,borderRadius:8,alignItems:"center",justifyContent:"center",paddingHorizontal:7},weightSaveText:{color:COLORS.white,fontSize:9,fontWeight:"900"},weightHistoryCard:{backgroundColor:"#111720",borderRadius:18,borderWidth:1,borderColor:"#344A65",padding:14,gap:9},weightHistoryKicker:{color:"#66B7DD",fontSize:9,fontWeight:"900",letterSpacing:1},weightHistoryTitle:{color:COLORS.plum,fontSize:19,fontWeight:"900",fontStyle:"italic"},weightHistoryCopy:{color:COLORS.slate,fontFamily:"monospace",fontSize:10,lineHeight:16},
});
