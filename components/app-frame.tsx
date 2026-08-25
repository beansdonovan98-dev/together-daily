import { ScreenContainer } from "@/components/screen-container";
import { COLORS } from "@/lib/together";
import { PARTNERS, useLocalJournal } from "@/lib/local-journal";
import { router, usePathname } from "expo-router";
import * as Clipboard from "expo-clipboard";
import QRCode from "react-native-qrcode-svg";
import { cloneElement, isValidElement, type ReactElement, type ReactNode, useState } from "react";
import { Linking, Platform, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { registerForPartnerPushNotifications } from "@/lib/push-notifications";

const NAVIGATION = [
  { id: "today", href: "/", label: "Today", glyph: "✦" },
  { id: "log", href: "/log", label: "Daily Log", glyph: "☰" },
  { id: "habits", href: "/habits", label: "Habits", glyph: "✓" },
  { id: "steamy", href: "/steamy", label: "Steamy", glyph: "♥" },
  { id: "purchase", href: "/purchases", label: "Purchase", glyph: "▤" },
  { id: "cleaning", href: "/cleaning", label: "Cleaning", glyph: "✦" },
  { id: "themes", href: "/themes", label: "Themes", glyph: "◐" },
  { id: "pastDays", href: "/days", label: "Past Days", glyph: "▤" },
];
const PAGE_ACCENT_SWATCHES = ["#8D5BA6", "#D56B88", "#E6A267", "#C6A04C", "#90B99D", "#55A7A0", "#66B7DD", "#6289D8"];
const PAGE_BACKGROUND_SWATCHES = ["#0D0B0F", "#18101E", "#251316", "#21140F", "#102019", "#0C1E21", "#111827", "#20151D", "#FAF4F7", "#FFF7ED", "#F1F7F2", "#EEF6FF", "#F4F0FF"];
const PAGE_FONT_OPTIONS = [{ id: "classic", label: "Classic" }, { id: "serif", label: "Warm serif" }, { id: "mono", label: "Mono" }] as const;
const PAGE_CARD_OPTIONS = [{ id: "soft", label: "Soft" }, { id: "outlined", label: "Outline" }, { id: "minimal", label: "Minimal" }] as const;

export function AppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { roomCode, memberId, roomMembers, isSyncing, registerPushToken, theme, pageStyles, setPageStyle, resetPageStyle, tabLabels, tabGlyphs, tabOrder } = useLocalJournal();
  const [inviteFeedback, setInviteFeedback] = useState<string | null>(null);
  const [inviteToolsOpen, setInviteToolsOpen] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [pushStatus, setPushStatus] = useState<"idle" | "setting-up" | "enabled">("idle");
  const [pageEditorOpen, setPageEditorOpen] = useState(false);
  const member = memberId ? PARTNERS[memberId] : PARTNERS.beans;
  const partnerToInvite = memberId === "princess" ? PARTNERS.beans : PARTNERS.princess;
  const partnerConnected = roomMembers.includes(partnerToInvite.id);
  const isTodaySection = pathname === "/" || pathname === "/index";
  const roomInviteLink = roomCode ? `https://togdaily-agtvyn2n.manus.space/join?roomCode=${encodeURIComponent(roomCode)}&partner=${partnerToInvite.id}` : "";
  const orderedNavigation = [...tabOrder.filter((id) => NAVIGATION.some((item) => item.id === id)), ...NAVIGATION.map((item) => item.id).filter((id) => !tabOrder.includes(id))].map((id) => NAVIGATION.find((item) => item.id === id)!).filter(Boolean);
  const currentPage = NAVIGATION.find((item) => pathname === item.href || (item.href === "/" && pathname === "/index")) ?? NAVIGATION[0];
  const pageStyle = pageStyles[currentPage.id] ?? {};
  const accentColor = pageStyle.accentColor ?? theme.accentColor ?? COLORS.orchid;
  const backgroundColor = pageStyle.backgroundColor ?? theme.backgroundColor ?? COLORS.blush;
  const fontStyle = pageStyle.fontStyle ?? "classic";
  const cardStyle = pageStyle.cardStyle ?? "soft";
  const fontFamily = fontStyle === "serif" ? "serif" : fontStyle === "mono" ? "monospace" : undefined;
  const pageSurfaceStyle = cardStyle === "outlined" ? { marginHorizontal: 8, marginTop: 8, borderWidth: 1, borderColor: accentColor, borderRadius: 16, overflow: "hidden" as const } : cardStyle === "minimal" ? { marginTop: 0, borderRadius: 0 } : { marginHorizontal: 8, marginTop: 8, borderWidth: 1, borderColor: `${accentColor}55`, borderRadius: 20, overflow: "hidden" as const, shadowColor: accentColor, shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 3 };
  const child = isValidElement(children) ? children as ReactElement<{ contentContainerStyle?: unknown }> : null;
  const styledChildren = child ? cloneElement(child, { contentContainerStyle: [child.props.contentContainerStyle, { backgroundColor }] }) : children;

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

  const inviteMessage = roomCode ? `Join me in our private Together Daily room.\n\nOpen this link, choose ${partnerToInvite.name}, and tap Join our room:\n${roomInviteLink}\n\nRoom code: ${roomCode}` : "";

  const copyFullInvite = async () => {
    if (!roomCode) return;

    try {
      await Clipboard.setStringAsync(inviteMessage);
      showInviteFeedback("Full invite copied — paste it in a text");
    } catch {
      showInviteFeedback("Could not copy — try again");
    }
  };

  const textRoomInvite = async () => {
    if (!roomCode) return;

    if (Platform.OS === "web") {
      await copyFullInvite();
      return;
    }

    try {
      await Linking.openURL(`sms:?body=${encodeURIComponent(inviteMessage)}`);
      showInviteFeedback(`Choose ${partnerToInvite.name} in Messages, then send the invite`);
    } catch {
      await copyFullInvite();
    }
  };

  const shareRoomInvite = async () => {
    if (!roomCode) return;

    try {
      await Share.share({ message: inviteMessage, title: "Together Daily room invite" });
    } catch {
      await copyFullInvite();
    }
  };

  const enablePartnerAlerts = async () => {
    setPushStatus("setting-up");
    const result = await registerForPartnerPushNotifications();
    if (!result.ok) {
      setPushStatus("idle");
      showInviteFeedback(result.message);
      return;
    }

    try {
      await registerPushToken(result.token, result.platform);
      setPushStatus("enabled");
      showInviteFeedback("Partner alerts are on for this phone");
    } catch {
      setPushStatus("idle");
      showInviteFeedback("Could not save this phone for alerts — try again");
    }
  };

  const toggleInviteTools = () => {
    setInviteToolsOpen((open) => {
      if (open) setShowQr(false);
      return !open;
    });
  };

  return (
    <ScreenContainer containerClassName="bg-background" className="flex-1">
      <View style={[styles.frame, { backgroundColor }]}>
        <View style={styles.topbar}>
          <View style={styles.brandRow}>
            <Text style={styles.brandMark}>♥</Text>
            <View><Text style={[styles.brand, { fontFamily }]}>Together Daily</Text><Text style={[styles.brandSub, { fontFamily }]}>{PARTNERS.beans.avatar} {PARTNERS.beans.name.toUpperCase()} + {PARTNERS.princess.avatar} {PARTNERS.princess.name.toUpperCase()}</Text></View>
          </View>
          <View style={styles.liveStatus}><View style={[styles.liveDot, { backgroundColor: isSyncing ? COLORS.gold : COLORS.sage }]} /><Text style={styles.liveText}>{isSyncing ? "SYNCING" : "LIVE"}</Text></View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs} style={styles.tabScroller}>
          {orderedNavigation.map((item) => {
            const active = pathname === item.href || (item.href === "/" && pathname === "/index");
            return <TouchableOpacity key={item.href} style={[styles.tab, active && styles.tabActive, active && { backgroundColor: accentColor }]} onPress={() => router.replace(item.href as never)}><Text style={[styles.tabGlyph, active && styles.tabActiveText]}>{tabGlyphs[item.id]?.trim() || item.glyph}</Text><Text style={[styles.tabLabel, { fontFamily }, active && styles.tabActiveText]}>{tabLabels[item.id]?.trim() || item.label}</Text>{item.href === "/log" ? <View style={styles.badge}><Text style={styles.badgeText}>LIVE</Text></View> : null}</TouchableOpacity>;
          })}
        </ScrollView>
          <View style={styles.identityArea}>
            <View style={styles.identityStrip}>
            <View style={[styles.identityDot, { backgroundColor: PARTNERS.beans.color }]} />
            <Text style={[styles.identityName, { color: PARTNERS.beans.color, fontFamily }]}>{PARTNERS.beans.avatar} {PARTNERS.beans.name}</Text>
            <Text style={styles.identityDivider}>·</Text>
            <View style={[styles.identityDot, { backgroundColor: PARTNERS.princess.color }]} />
            <Text style={[styles.identityName, { color: PARTNERS.princess.color, fontFamily }]}>{PARTNERS.princess.avatar} {PARTNERS.princess.name}</Text>
            <Text style={styles.identityRoom}>{roomCode ? `ROOM ${roomCode}` : "PRIVATE ROOM"}</Text>
            <View style={[styles.currentChip, { borderColor: member.color }]}><Text style={[styles.currentChipText, { color: member.color }]}>{member.name.toUpperCase()}</Text></View>
          </View>
          {roomCode && isTodaySection ? (
            <View style={styles.inviteRow}>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Toggle invite tools" accessibilityState={{ expanded: inviteToolsOpen }} onPress={toggleInviteTools} style={styles.invitePanelHeader}>
                <View style={styles.invitePanelLead}>
                  <Text style={styles.invitePanelKicker}>INVITE TOOLS</Text>
                  <Text style={styles.invitePanelMeta}>Text {partnerToInvite.name} · Copy invite · QR</Text>
                </View>
                <Text style={styles.invitePanelChevron}>{inviteToolsOpen ? "⌃" : "⌄"}</Text>
              </TouchableOpacity>
              {inviteToolsOpen ? (
                <View style={styles.invitePanelBody}>
                  <View style={styles.roomCodeRow}>
                    <Text style={styles.roomCodeLabel}>ROOM CODE</Text>
                    <Text style={styles.roomCodeValue}>{roomCode}</Text>
                  </View>
                  <View style={styles.inviteActions}>
                    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Copy room code" onPress={copyRoomCode} style={styles.inviteAction}>
                      <Text style={styles.inviteActionText}>COPY CODE</Text>
                    </TouchableOpacity>
                    <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Text ${partnerToInvite.name} the room invite`} onPress={textRoomInvite} style={[styles.inviteAction, styles.shareAction]}>
                      <Text style={styles.shareActionText}>TEXT {partnerToInvite.name.toUpperCase()}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Copy complete room invitation" onPress={copyFullInvite} style={[styles.inviteAction, styles.copyInviteAction]}>
                      <Text style={styles.copyInviteText}>COPY INVITE</Text>
                    </TouchableOpacity>
                    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Share room invitation to another app" onPress={shareRoomInvite} style={styles.inviteAction}>
                      <Text style={styles.inviteActionText}>OTHER APPS</Text>
                    </TouchableOpacity>
                    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Show room QR code" onPress={() => setShowQr((visible) => !visible)} style={[styles.inviteAction, styles.qrAction]}>
                      <Text style={styles.qrActionText}>{showQr ? "HIDE QR" : "SHOW QR"}</Text>
                    </TouchableOpacity>
                  </View>
                  {showQr ? <View style={styles.qrPanel}><View style={styles.qrCodeWrap}><QRCode value={roomInviteLink} size={150} color={COLORS.ink} backgroundColor="#FFF9F6" /></View><View style={styles.qrCopy}><Text style={styles.qrTitle}>{partnerToInvite.name}, scan this code</Text><Text style={styles.qrText}>It opens Together Daily in her browser with your room code ready to join.</Text></View></View> : null}
                </View>
              ) : null}
              <View style={[styles.connectionStatus, partnerConnected && { borderColor: partnerToInvite.color, backgroundColor: `${partnerToInvite.color}22` }]}>
                <View style={[styles.connectionDot, { backgroundColor: partnerConnected ? partnerToInvite.color : COLORS.gold }]} />
                <Text style={[styles.connectionText, partnerConnected && { color: partnerToInvite.color }]}>{partnerConnected ? `${partnerToInvite.name.toUpperCase()} CONNECTED` : `WAITING FOR ${partnerToInvite.name.toUpperCase()}`}</Text>
              </View>
              <View style={styles.alertRow}>
                <TouchableOpacity accessibilityRole="button" accessibilityLabel="Enable partner alerts" disabled={pushStatus !== "idle"} onPress={enablePartnerAlerts} style={[styles.inviteAction, styles.alertAction, pushStatus !== "idle" && styles.disabledAction]}>
                  <Text style={styles.alertActionText}>{pushStatus === "setting-up" ? "CONNECTING…" : pushStatus === "enabled" ? "ALERTS ON" : "ENABLE ALERTS"}</Text>
                </TouchableOpacity>
              </View>
              {inviteFeedback ? <Text accessibilityLiveRegion="polite" style={styles.inviteFeedback}>{inviteFeedback}</Text> : null}
            </View>
          ) : null}
            <View style={styles.pageEditRow}>
              <View><Text style={styles.pageEditKicker}>{currentPage.label.toUpperCase()} STYLE</Text><Text style={styles.pageEditCopy}>Shared colors for this page</Text></View>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Edit ${currentPage.label} page style`} accessibilityState={{ expanded: pageEditorOpen }} onPress={() => setPageEditorOpen((open) => !open)} style={[styles.pageEditButton, { borderColor: accentColor }]}><Text style={[styles.pageEditButtonText, { color: accentColor }]}>{pageEditorOpen ? "DONE" : "EDIT PAGE"}</Text></TouchableOpacity>
            </View>
            {pageEditorOpen ? <View style={styles.pageEditorPanel}>
              <Text style={styles.pageEditorLabel}>ACCENT</Text><View style={styles.pageSwatches}>{PAGE_ACCENT_SWATCHES.map((color) => <TouchableOpacity key={`accent-${color}`} accessibilityRole="button" accessibilityLabel={`Set ${currentPage.label} accent to ${color}`} onPress={() => setPageStyle(currentPage.id, { accentColor: color })} style={[styles.pageSwatch, { backgroundColor: color }, accentColor === color && styles.pageSwatchActive]} />)}</View>
              <Text style={styles.pageEditorLabel}>BACKGROUND</Text><View style={styles.pageSwatches}>{PAGE_BACKGROUND_SWATCHES.map((color) => <TouchableOpacity key={`background-${color}`} accessibilityRole="button" accessibilityLabel={`Set ${currentPage.label} background to ${color}`} onPress={() => setPageStyle(currentPage.id, { backgroundColor: color })} style={[styles.pageSwatch, { backgroundColor: color }, backgroundColor === color && styles.pageSwatchActive]} />)}</View>
              <Text style={styles.pageEditorLabel}>FONT STYLE</Text><View style={styles.pageChoiceRow}>{PAGE_FONT_OPTIONS.map((option) => <TouchableOpacity key={option.id} accessibilityRole="button" accessibilityLabel={`Set ${currentPage.label} font to ${option.label}`} onPress={() => setPageStyle(currentPage.id, { fontStyle: option.id })} style={[styles.pageChoice, fontStyle === option.id && { borderColor: accentColor, backgroundColor: `${accentColor}22` }]}><Text style={[styles.pageChoiceText, { fontFamily }, fontStyle === option.id && { color: accentColor }]}>{option.label}</Text></TouchableOpacity>)}</View>
              <Text style={styles.pageEditorLabel}>CARD STYLE</Text><View style={styles.pageChoiceRow}>{PAGE_CARD_OPTIONS.map((option) => <TouchableOpacity key={option.id} accessibilityRole="button" accessibilityLabel={`Set ${currentPage.label} cards to ${option.label}`} onPress={() => setPageStyle(currentPage.id, { cardStyle: option.id })} style={[styles.pageChoice, cardStyle === option.id && { borderColor: accentColor, backgroundColor: `${accentColor}22` }]}><Text style={[styles.pageChoiceText, cardStyle === option.id && { color: accentColor }]}>{option.label}</Text></TouchableOpacity>)}</View>
              <TouchableOpacity accessibilityRole="button" onPress={() => resetPageStyle(currentPage.id)} style={styles.resetPageButton}><Text style={styles.resetPageText}>Use the main theme for this page</Text></TouchableOpacity>
            </View> : null}
        </View>
        <View style={[styles.content, pageSurfaceStyle]}>{styledChildren}</View>
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
  pageEditRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 10, gap: 10 },
  pageEditKicker: { color: COLORS.gold, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  pageEditCopy: { color: COLORS.slate, fontSize: 10, marginTop: 2 },
  pageEditButton: { borderWidth: 1, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 7 },
  pageEditButtonText: { fontSize: 9, fontWeight: "900", letterSpacing: .8 },
  pageEditorPanel: { borderTopWidth: 1, borderTopColor: "#2C2431", borderBottomWidth: 1, borderBottomColor: "#2C2431", backgroundColor: "#111014", paddingHorizontal: 20, paddingVertical: 12, gap: 7 },
  pageEditorLabel: { color: COLORS.gold, fontSize: 9, fontWeight: "900", letterSpacing: .9, marginTop: 2 },
  pageSwatches: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  pageSwatch: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: "transparent" },
  pageSwatchActive: { borderColor: COLORS.white },
  pageChoiceRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  pageChoice: { minHeight: 32, borderRadius: 8, borderWidth: 1, borderColor: "#3A313E", alignItems: "center", justifyContent: "center", paddingHorizontal: 9, backgroundColor: "#171218" },
  pageChoiceText: { color: COLORS.slate, fontSize: 10, fontWeight: "900" },
  resetPageButton: { alignSelf: "flex-start", paddingVertical: 6 },
  resetPageText: { color: COLORS.slate, fontSize: 10, fontWeight: "900" },
  inviteRow: { paddingHorizontal: 20, paddingBottom: 10, gap: 8 },
  invitePanelHeader: { borderRadius: 12, borderWidth: 1, borderColor: "#3D2E43", backgroundColor: "#171218", minHeight: 48, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  invitePanelLead: { gap: 2 },
  invitePanelKicker: { color: COLORS.gold, fontSize: 10, fontWeight: "900", letterSpacing: 1.1 },
  invitePanelMeta: { color: COLORS.slate, fontSize: 10, fontFamily: "monospace" },
  invitePanelChevron: { color: COLORS.plum, fontSize: 18, fontWeight: "900", paddingHorizontal: 4 },
  invitePanelBody: { borderRadius: 12, borderWidth: 1, borderColor: "#2F2535", backgroundColor: "#121014", padding: 10, gap: 9 },
  roomCodeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 9, backgroundColor: "#1B171D", paddingHorizontal: 10, paddingVertical: 8 },
  roomCodeLabel: { color: COLORS.slate, fontSize: 9, fontWeight: "900", letterSpacing: 0.9 },
  roomCodeValue: { color: COLORS.gold, fontSize: 12, fontWeight: "900", letterSpacing: 1.3 },
  connectionStatus: { alignSelf: "flex-start", borderWidth: 1, borderColor: "#6A5B43", backgroundColor: "rgba(198,160,76,0.10)", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5, flexDirection: "row", alignItems: "center", gap: 6 },
  connectionDot: { width: 7, height: 7, borderRadius: 4 },
  connectionText: { color: COLORS.gold, fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  inviteActions: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  alertRow: { flexDirection: "row", alignItems: "center" },
  inviteAction: { borderWidth: 1, borderColor: "#C6A04C", borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6 },
  inviteActionText: { color: COLORS.gold, fontSize: 9, fontWeight: "900", letterSpacing: 0.7 },
  shareAction: { borderColor: COLORS.orchid, backgroundColor: "rgba(141,91,166,0.15)" },
  shareActionText: { color: COLORS.plum, fontSize: 9, fontWeight: "900", letterSpacing: 0.7 },
  copyInviteAction: { borderColor: "#5A8092", backgroundColor: "rgba(102,183,221,0.10)" },
  copyInviteText: { color: "#9FD5F0", fontSize: 9, fontWeight: "900", letterSpacing: 0.7 },
  qrAction: { borderColor: PARTNERS.princess.color, backgroundColor: "rgba(213,107,136,0.12)" },
  qrActionText: { color: PARTNERS.princess.color, fontSize: 9, fontWeight: "900", letterSpacing: 0.7 },
  alertAction: { borderColor: COLORS.sage, backgroundColor: "rgba(144,185,157,0.10)" },
  alertActionText: { color: COLORS.sage, fontSize: 9, fontWeight: "900", letterSpacing: 0.7 },
  disabledAction: { opacity: 0.62 },
  qrPanel: { marginTop: 12, borderRadius: 14, padding: 12, backgroundColor: "#171218", borderWidth: 1, borderColor: "#3D2E43", flexDirection: "row", gap: 13, alignItems: "center" },
  qrCodeWrap: { borderRadius: 10, backgroundColor: "#FFF9F6", padding: 8 },
  qrCopy: { flex: 1 },
  qrTitle: { color: COLORS.plum, fontSize: 14, fontWeight: "900" },
  qrText: { color: COLORS.slate, fontSize: 10, lineHeight: 15, marginTop: 4, fontFamily: "monospace" },
  inviteFeedback: { color: COLORS.sage, fontSize: 10, fontWeight: "800", marginTop: 7 },
  content: { flex: 1, width: "100%", maxWidth: 920, alignSelf: "center" },
});
