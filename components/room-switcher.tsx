import { useEffect, useMemo, useState } from "react";
import { StyleSheet } from "react-native";

import { PARTNERS, ROOM_MEMBER_IDS, type PartnerId, useLocalJournal } from "@/lib/local-journal";
import { COLORS } from "@/lib/together";
import { normalizeGlobalBorderColor, normalizeGlobalTextColor } from "@/lib/typography";
import { VisualText as Text, VisualTextInput as TextInput, VisualTouchableOpacity as TouchableOpacity, VisualView as View } from "@/components/visual-primitives";

export function RoomSwitcher() {
  const { roomCode, memberId, savedRooms, switchRoom, joinRoom, theme } = useLocalJournal();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [identity, setIdentity] = useState<PartnerId>(memberId ?? "beans");
  const [working, setWorking] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const textColor = normalizeGlobalTextColor(theme.fontColor);
  const borderColor = normalizeGlobalBorderColor(theme.borderColor);
  const accentColor = theme.accentColor ?? COLORS.orchid;

  useEffect(() => {
    if (!open) {
      setCode("");
      setIdentity(memberId ?? "beans");
      setMessage("");
    }
  }, [open, memberId]);

  const rooms = useMemo(
    () => savedRooms.filter((room, index, list) => list.findIndex((candidate) => candidate.roomCode === room.roomCode && candidate.memberId === room.memberId) === index),
    [savedRooms],
  );

  const switchTo = async (roomCodeToSwitch: string, roomMember: PartnerId) => {
    if (roomCodeToSwitch === roomCode && roomMember === memberId) return;
    setWorking(roomCodeToSwitch);
    setMessage("");
    try {
      await switchRoom({ roomCode: roomCodeToSwitch, memberId: roomMember });
      setMessage("Room switched.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not switch rooms.");
    } finally {
      setWorking(null);
    }
  };

  const addRoom = async () => {
    const nextCode = code.trim().toUpperCase();
    if (!nextCode) return;
    setWorking("join");
    setMessage("");
    try {
      await joinRoom(nextCode, identity);
      setMessage("Room added and opened.");
      setCode("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not add that room.");
    } finally {
      setWorking(null);
    }
  };

  return <View style={[styles.card, { borderColor }]}> 
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Toggle room switcher" accessibilityState={{ expanded: open }} onPress={() => setOpen((value) => !value)} style={styles.toggle}>
      <View><Text style={[styles.kicker, { color: textColor }]}>SAVED ROOMS</Text><Text style={[styles.title, { color: textColor }]}>Switch your shared space</Text></View>
      <Text style={[styles.chevron, { color: textColor }]}>{open ? "⌃" : "⌄"}</Text>
    </TouchableOpacity>
    {open ? <View style={[styles.content, { borderTopColor: borderColor }]}> 
      <Text style={[styles.copy, { color: textColor }]}>This phone can keep your Princess room and a separate shared room. Switching preserves both rooms; it never deletes the other room.</Text>
      <View style={styles.savedList}>{rooms.map((room) => {
        const person = PARTNERS[room.memberId];
        const active = room.roomCode === roomCode && room.memberId === memberId;
        return <TouchableOpacity key={`${room.roomCode}-${room.memberId}`} accessibilityRole="button" disabled={active || working !== null} onPress={() => void switchTo(room.roomCode, room.memberId)} style={[styles.roomRow, { borderColor }, active && { borderColor: accentColor, backgroundColor: `${accentColor}24` }]}>
          <View style={[styles.memberDot, { backgroundColor: person.color }]} />
          <View style={styles.roomText}><Text style={[styles.roomTitle, { color: textColor }]}>{person.avatar} {person.name}’s room</Text><Text style={[styles.roomCode, { color: textColor }]}>{room.roomCode}</Text></View>
          <Text style={[styles.roomState, { color: textColor }]}>{active ? "Open" : working === room.roomCode ? "Opening…" : "Open"}</Text>
        </TouchableOpacity>;
      })}</View>
      <Text style={[styles.sectionLabel, { color: textColor }]}>ADD ANOTHER ROOM</Text>
      <Text style={[styles.copy, { color: textColor }]}>Enter the room code, then choose who this phone is in that room. For the three-person room, choose RaRa on RaRa’s device.</Text>
      <TextInput value={code} onChangeText={(value) => setCode(value.toUpperCase())} placeholder="ROOM CODE" placeholderTextColor={`${textColor}99`} autoCapitalize="characters" maxLength={16} style={[styles.codeInput, { borderColor, color: textColor }]} />
      <View style={styles.identityRow}>{ROOM_MEMBER_IDS.map((id) => <TouchableOpacity key={id} accessibilityRole="button" accessibilityState={{ selected: identity === id }} onPress={() => setIdentity(id)} style={[styles.identityChoice, { borderColor }, identity === id && { borderColor: PARTNERS[id].color, backgroundColor: PARTNERS[id].soft }]}><Text style={[styles.identityText, { color: textColor }]}>{PARTNERS[id].avatar} {PARTNERS[id].name}</Text></TouchableOpacity>)}</View>
      <TouchableOpacity accessibilityRole="button" disabled={working !== null || !code.trim()} onPress={() => void addRoom()} style={[styles.addButton, { backgroundColor: accentColor, borderColor }, (working !== null || !code.trim()) && styles.disabled]}><Text style={[styles.addText, { color: textColor }]}>{working === "join" ? "Joining…" : "Add & open room"}</Text></TouchableOpacity>
      {message ? <Text accessibilityLiveRegion="polite" style={[styles.message, { color: textColor }]}>{message}</Text> : null}
    </View> : null}
  </View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, borderWidth: 1, backgroundColor: "transparent", overflow: "hidden" },
  toggle: { minHeight: 62, paddingHorizontal: 15, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  kicker: { fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  title: { fontSize: 17, fontWeight: "900", fontStyle: "italic", marginTop: 3 },
  chevron: { fontSize: 20, fontWeight: "900" },
  content: { padding: 14, borderTopWidth: 1, gap: 10 },
  copy: { fontFamily: "monospace", fontSize: 10, lineHeight: 15 },
  savedList: { gap: 7 },
  roomRow: { minHeight: 55, borderWidth: 1, borderRadius: 11, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 8 },
  memberDot: { width: 10, height: 10, borderRadius: 5 },
  roomText: { flex: 1, gap: 2 },
  roomTitle: { fontSize: 12, fontWeight: "900" },
  roomCode: { fontFamily: "monospace", fontSize: 10, letterSpacing: 1, opacity: 0.8 },
  roomState: { fontSize: 10, fontWeight: "900" },
  sectionLabel: { fontSize: 10, fontWeight: "900", letterSpacing: 1, marginTop: 3 },
  codeInput: { minHeight: 42, borderWidth: 1, borderRadius: 10, paddingHorizontal: 11, fontSize: 13, fontWeight: "900", letterSpacing: 1.5, backgroundColor: "rgba(9,7,14,0.2)" },
  identityRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  identityChoice: { minHeight: 33, borderWidth: 1, borderRadius: 17, paddingHorizontal: 9, alignItems: "center", justifyContent: "center" },
  identityText: { fontSize: 10, fontWeight: "900" },
  addButton: { minHeight: 42, borderWidth: 1, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  addText: { fontSize: 12, fontWeight: "900" },
  message: { fontSize: 10, lineHeight: 14 },
  disabled: { opacity: 0.55 },
});
