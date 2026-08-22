import Svg, { Circle, Line, Path, Text as SvgText } from "react-native-svg";
import { StyleSheet, Text, View } from "react-native";

import { COLORS } from "@/lib/together";
import { PARTNERS, type PartnerId } from "@/lib/local-journal";

export type WeightPoint = { date: string; value: number };

export function WeightHistoryGraph({ partnerId, points }: { partnerId: PartnerId; points: WeightPoint[] }) {
  const person = PARTNERS[partnerId];
  const visible = points.slice(-8);
  if (!visible.length) return <View style={styles.empty}><Text style={styles.emptyText}>{person.name}’s graph will appear after the first lbs check-in.</Text></View>;

  const values = visible.map((point) => point.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const spread = Math.max(2, rawMax - rawMin);
  const min = rawMin - spread * .2;
  const max = rawMax + spread * .2;
  const left = 27; const right = 302; const top = 16; const bottom = 115;
  const coordinate = (point: WeightPoint, index: number) => ({ x: visible.length === 1 ? (left + right) / 2 : left + (index / (visible.length - 1)) * (right - left), y: bottom - ((point.value - min) / (max - min)) * (bottom - top) });
  const coordinates = visible.map(coordinate);
  const line = coordinates.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
  const format = (value: number) => value % 1 === 0 ? value.toFixed(0) : value.toFixed(1);

  return <View style={styles.card}><View style={styles.header}><Text style={[styles.partner, { color: person.color }]}>{partnerId === "beans" ? "♛ Beans" : "♥ Princess"}</Text><Text style={styles.unit}>LBS · {visible.length} CHECK-IN{visible.length === 1 ? "" : "S"}</Text></View><Svg width="100%" height={154} viewBox="0 0 320 154" accessibilityLabel={`${person.name} weight history in pounds`}><Line x1={left} x2={right} y1={top} y2={top} stroke="#334152" strokeWidth="1"/><Line x1={left} x2={right} y1={(top+bottom)/2} y2={(top+bottom)/2} stroke="#26313E" strokeWidth="1"/><Line x1={left} x2={right} y1={bottom} y2={bottom} stroke="#334152" strokeWidth="1"/><SvgText x="2" y={top+4} fill="#9CA7B7" fontSize="9">{format(max)}</SvgText><SvgText x="2" y={bottom+3} fill="#9CA7B7" fontSize="9">{format(min)}</SvgText><Path d={line} stroke={person.color} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>{coordinates.map((point,index) => <Circle key={`${visible[index].date}-${point.x}`} cx={point.x} cy={point.y} r="4.5" fill={person.color} stroke="#10131A" strokeWidth="2"/>)}{visible.map((point,index) => <SvgText key={`${point.date}-label`} x={coordinates[index].x} y="143" fill="#9CA7B7" fontSize="8" textAnchor="middle">{new Date(`${point.date}T12:00:00`).toLocaleDateString("en-US", { month:"numeric", day:"numeric" })}</SvgText>)}</Svg></View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: 13, borderWidth: 1, borderColor: "#2E394A", backgroundColor: "#0E1219", padding: 10, marginTop: 3 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  partner: { fontSize: 11, fontWeight: "900" },
  unit: { color: COLORS.slate, fontFamily: "monospace", fontSize: 8, fontWeight: "900" },
  empty: { borderRadius: 13, borderWidth: 1, borderColor: "#2E394A", backgroundColor: "#0E1219", padding: 15, marginTop: 3 },
  emptyText: { color: COLORS.slate, fontFamily: "monospace", fontSize: 10, lineHeight: 16, textAlign: "center" },
});
