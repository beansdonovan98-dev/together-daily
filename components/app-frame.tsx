import { ScreenContainer } from "@/components/screen-container";
import { COLORS } from "@/lib/together";
import { PARTNERS, useLocalJournal } from "@/lib/local-journal";
import { router, usePathname } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { type ReactNode, useState } from "react";
import { Platform, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const NAVIGATION = [
  { href: "/", label: "Today", glyph: "✦" },
  { href: "/log", label: "Daily Log", glyph: "☰" },
  { href: "/days", label: "Pages", glyph: "▤" },
  { href: "/habits", label: "Habits", glyph: "✓" },
  { href: "/steamy", label: "Steamy", glyph: "♥" },
  { href: "/memories", label: "Photos", glyph: "▧" },
];

export function AppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { roomCode, memberId, isSyncing } = useLocalJournal();
  const [inviteFeedback, setInviteFeedback] = useState<string | null>(null);
  const member = memberId ? PARTNERS[memberId] : PARTNERS.beans;
  const partnerToInvite = memberId === "princess" ? "Beans" : "Princess";

  const showInviteFeedback = (message: string) => {
    setInviteFeedback(message);
    setTimeout(() => setInviteFeedback(null), 2200);
  };

  const copyRoomCode = async () => {
    if (!roomCode) return;

    try {
      await Clipboard.setStringAsync(roomCode);
      showInviteFeedback("Code copied");
    } catch {
      showInviteFeedback("Could not copy — try again");
    }
  };

  const shareRoomCode = async () => {
    if (!roomCode) return;

    const installInstruction = Platform.OS === "web"
      ? "Open Together Daily, choose \"I have a room code\", select Princess, and enter the code below."
      : "Install or open the same Together Daily APK, choose \"I have a room code\", select Princess, and enter the code below.";
    const message = `Join me in our private Together Daily room.\n\n${installInstruction}\n\nRoom code: ${roomCode}`;

    try {
      await Share.share({ message, title: "Together Daily room invite" });
    } catch {
      try {
        await Clipboard.setStringAsync(message);
        showInviteFeedback("Invite copied — paste it in a message");
      } catch {
        showInviteFeedback("Could not open sharing — try again");
      }
    }
  };

  return (
    <ScreenContainer containerClassName="bg-background" className="flex-1">
      <View style={styles.frame}>
        <View style={styles.topbar}>
          <View style={styles.brandRow}>
            <Text style={styles.brandMark}>♥</Text>
            <View><Text style={styles.brand}>Together Daily</Text><Text style={styles.brandSub}>BEANS + PRINCESS</Text></View>
          </View>
          <View style={styles.liveStatus}><View style={[styles.liveDot, { backgroundColor: isSyncing ? COLORS.gold : COLORS.sage }]} /><Text style={styles.liveText}>{isSyncing ? "SYNCING" : "LIVE"}</Text></View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs} style={styles.tabScroller}>
          {NAVIGATION.map((item) => {
            const active = pathname === item.href || (item.href === "/" && pathname === "/index");
            return <TouchableOpacity key={item.href} style={[styles.tab, active && styles.tabActive]} onPress={() => router.replace(item.href as never)}><Text style={[styles.tabGlyph, active && styles.tabActiveText]}>{item.glyph}</Text><Text style={[styles.tabLabel, active && styles.tabActiveText]}>{item.label}</Text>{item.href === "/log" ? <View style={styles.badge}><Text style={styles.badgeText}>LIVE</Text></View> : null}</TouchableOpacity>;
          })}
        </ScrollView>
        <View style={styles.identityArea}>
          <View style={styles.identityStrip}>
            <View style={[styles.identityDot, { backgroundColor: PARTNERS.beans.color }]} />
            <Text style={[styles.identityName, { color: PARTNERS.beans.color }]}>♛ Beans</Text>
            <Text style={styles.identityDivider}>·</Text>
            <View style={[styles.identityDot, { backgroundColor: PARTNERS.princess.color }]} />
            <Text style={[styles.identityName, { color: PARTNERS.princess.color }]}>♥ Princess</Text>
            <Text style={styles.identityRoom}>{roomCode ? `ROOM ${roomCode}` : "PRIVATE ROOM"}</Text>
            <View style={[styles.currentChip, { borderColor: member.color }]}><Text style={[styles.currentChipText, { color: member.color }]}>{member.name.toUpperCase()}</Text></View>
          </View>
          {roomCode ? (
            <View style={styles.inviteRow}>
              <Text style={styles.inviteHint}>To add {partnerToInvite}: install the same APK → choose “I have a room code” → enter <Text style={styles.inviteCode}>{roomCode}</Text>.</Text>
              <View style={styles.inviteActions}>
                <TouchableOpacity accessibilityRole="button" accessibilityLabel="Copy room code" onPress={copyRoomCode} style={styles.inviteAction}>
                  <Text style={styles.inviteActionText}>COPY CODE</Text>
                </TouchableOpacity>
                <TouchableOpacity accessibilityRole="button" accessibilityLabel="Share room invite" onPress={shareRoomCode} style={[styles.inviteAction, styles.shareAction]}>
                  <Text style={styles.shareActionText}>SHARE INVITE</Text>
                </TouchableOpacity>
              </View>
              {inviteFeedback ? <Text accessibilityLiveRegion="polite" style={styles.inviteFeedback}>{inviteFeedback}</Text> : null}
            </View>
          ) : null}
        </View>
        <View style={styles.content}>{children}</View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1, backgroundColor: COLORS.blush },
  topbar: { paddingHorizontal: 20, paddingTop: 15, paddingBottom: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#211C24", backgroundColor: "#0C0A0E" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  brandMark: { color: COLORS.rose, fontSize: 25, lineHeight: 26 },
  brand: { color: COLORS.plum, fontSize: 18, fontWeight: "900", letterSpacing: -0.2 },
  brandSub: { color: COLORS.slate, fontSize: 9, fontWeight: "800", letterSpacing: 1.3, marginTop: 1 },
  liveStatus: { borderRadius: 11, backgroundColor: "#16131A", paddingVertical: 6, paddingHorizontal: 9, flexDirection: "row", alignItems: "center", gap: 5 },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { color: COLORS.slate, fontSize: 9, letterSpacing: 1, fontWeight: "900" },
  tabScroller: { flexGrow: 0, backgroundColor: "#0C0A0E", borderBottomWidth: 1, borderBottomColor: "#211C24" },
  tabs: { gap: 7, paddingHorizontal: 16, paddingVertical: 11 },
  tab: { height: 43, paddingHorizontal: 13, borderRadius: 16, flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "transparent" },
  tabActive: { backgroundColor: COLORS.orchid },
  tabGlyph: { color: COLORS.slate, fontSize: 16 },
  tabLabel: { color: COLORS.plum, fontSize: 14, fontWeight: "800" },
  tabActiveText: { color: COLORS.white },
  badge: { backgroundColor: "rgba(255,255,255,0.17)", borderRadius: 7, paddingHorizontal: 5, paddingVertical: 2 },
  badgeText: { color: COLORS.white, fontSize: 8, fontWeight: "900", letterSpacing: 0.6 },
  identityArea: { borderBottomWidth: 1, borderBottomColor: "#211C24", backgroundColor: "#0C0A0E" },
  identityStrip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 7 },
  identityDot: { width: 7, height: 7, borderRadius: 4 },
  identityName: { fontSize: 11, fontWeight: "900" },
  identityDivider: { color: "#554C58", marginHorizontal: 1 },
  identityRoom: { color: COLORS.slate, marginLeft: "auto", fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },
  currentChip: { marginLeft: 4, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 7 },
  currentChipText: { fontSize: 8, fontWeight: "900", letterSpacing: 0.6 },
  inviteRow: { paddingHorizontal: 20, paddingBottom: 10 },
  inviteHint: { color: "#B8ABB9", fontFamily: "monospace", fontSize: 10, lineHeight: 15 },
  inviteCode: { color: COLORS.gold, fontWeight: "900", letterSpacing: 1.1 },
  inviteActions: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  inviteAction: { borderWidth: 1, borderColor: "#C6A04C", borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6 },
  inviteActionText: { color: COLORS.gold, fontSize: 9, fontWeight: "900", letterSpacing: 0.7 },
  shareAction: { borderColor: COLORS.orchid, backgroundColor: "rgba(141,91,166,0.15)" },
  shareActionText: { color: COLORS.plum, fontSize: 9, fontWeight: "900", letterSpacing: 0.7 },
  inviteFeedback: { color: COLORS.sage, fontSize: 10, fontWeight: "800", marginTop: 7 },
  content: { flex: 1, width: "100%", maxWidth: 920, alignSelf: "center" },
});
