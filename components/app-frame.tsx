import { ScreenContainer } from "@/components/screen-container";
import { COLORS, localDateKey } from "@/lib/together";
import { PARTNERS, useLocalJournal } from "@/lib/local-journal";
import { router, usePathname } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import QRCode from "react-native-qrcode-svg";
import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Easing,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { registerForPartnerPushNotifications } from "@/lib/push-notifications";
import { resolveThemeBackdrop } from "@/lib/theme-gradients";
import { DYNAMIC_GRADIENT_MOTION, dynamicThemeForDate, isAnimatedTheme } from "@/lib/dynamic-theme";
import { type FontPlatform, fontFamilyFor, normalizeGlobalBorderColor, normalizeGlobalFont, normalizeGlobalTextColor, setActiveGlobalFont, setActiveGlobalTextColor } from "@/lib/typography";
import { PageContentReset } from "@/components/page-content-reset";

const NAVIGATION = [
  { id: "today", href: "/", label: "Today", glyph: "✦" },
  { id: "log", href: "/log", label: "Daily Log", glyph: "☰" },
  { id: "health", href: "/health", label: "Health", glyph: "✚" },
  { id: "steamy", href: "/steamy", label: "Steamy", glyph: "♥" },
  { id: "purchase", href: "/purchases", label: "Purchase", glyph: "▤" },
  { id: "cleaning", href: "/cleaning", label: "Cleaning", glyph: "✦" },
  { id: "calendar", href: "/calendar", label: "Calendar", glyph: "♥" },
  { id: "themes", href: "/themes", label: "Themes", glyph: "◐" },
  { id: "pastDays", href: "/days", label: "Past Days", glyph: "▤" },
];

function revealGradientCardSurfaces(node: ReactNode, fontFamily: string, textColor: string, borderColor: string): ReactNode {
  return Children.map(node, (entry) => {
    if (!isValidElement(entry)) return entry;
    const element = entry as ReactElement<{
      children?: ReactNode;
      style?: unknown;
      testID?: string;
    }>;
    const nextChildren = element.props.children
      ? revealGradientCardSurfaces(element.props.children, fontFamily, textColor, borderColor)
      : element.props.children;
    const flatStyle = StyleSheet.flatten(element.props.style as never) as
      | Record<string, unknown>
      | undefined;
    const isNativeView = element.type === View;
    const isTextElement = element.type === Text || element.type === TextInput;
    const baseFontSize = typeof flatStyle?.fontSize === "number"
      ? flatStyle.fontSize
      : isTextElement
        ? 14
        : undefined;
    const baseLineHeight = typeof flatStyle?.lineHeight === "number"
      ? flatStyle.lineHeight
      : undefined;
    const isCardSurface =
      isNativeView &&
      element.props.testID !== "preserve-card-color" &&
      flatStyle &&
      typeof flatStyle.backgroundColor === "string" &&
      flatStyle.backgroundColor !== "transparent" &&
      Number(flatStyle.borderRadius ?? 0) >= 8 &&
      (Number(flatStyle.padding ?? flatStyle.paddingHorizontal ?? flatStyle.paddingVertical ?? 0) > 0 || flatStyle.overflow === "hidden");

    const hasRoundedOutline =
      element.props.testID !== "preserve-card-color" &&
      flatStyle &&
      Number(flatStyle.borderRadius ?? 0) >= 8 &&
      Number(flatStyle.borderWidth ?? 0) > 0;

    if (!isCardSurface && !hasRoundedOutline && !isTextElement && nextChildren === element.props.children) return element;
    return cloneElement(element, {
      children: nextChildren,
      ...(isTextElement
        ? {
            style: [
              element.props.style,
              {
                color: textColor,
                fontFamily,
                ...(baseFontSize ? { fontSize: Math.round(baseFontSize * 1.16) } : {}),
                ...(baseLineHeight ? { lineHeight: Math.round(baseLineHeight * 1.16) } : {}),
              },
            ],
          }
        : {}),
      ...(isCardSurface || hasRoundedOutline
        ? {
            style: [
              element.props.style,
              {
                ...(isCardSurface ? { backgroundColor: "transparent" } : {}),
                borderColor,
                shadowOpacity: 0,
                shadowRadius: 0,
                shadowOffset: { width: 0, height: 0 },
                elevation: 0,
              },
            ],
          }
        : {}),
    });
  });
}

/** Adds the confirmed clear control to the active page's primary vertical scroll area. */
function appendPageContentReset(node: ReactNode, pageId: string): ReactNode {
  if (!isValidElement(node)) return node;

  const element = node as ReactElement<{ children?: ReactNode; horizontal?: boolean }>;
  const childNodes = element.props.children;

  if (element.type === ScrollView && !element.props.horizontal) {
    return cloneElement(element, {
      children: <>
        {childNodes}
        <PageContentReset pageId={pageId} />
      </>,
    });
  }

  if (!childNodes) return element;
  return cloneElement(element, {
    children: Children.map(childNodes, (child) => appendPageContentReset(child, pageId)),
  });
}

export function AppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const headerDate = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const isLaptopLayout = width >= 900;
  const {
    roomCode,
    memberId,
    roomMembers,
    isSyncing,
    registerPushToken,
    theme,
    tabLabels,
    tabGlyphs,
    tabOrder,
    customSubheadings,
  } = useLocalJournal();
  const [inviteFeedback, setInviteFeedback] = useState<string | null>(null);
  const [inviteToolsOpen, setInviteToolsOpen] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [pagesOpen, setPagesOpen] = useState(false);
  const [themeDate, setThemeDate] = useState(() => localDateKey());
  const gradientMotion = useRef(new Animated.Value(0)).current;
  const [pushStatus, setPushStatus] = useState<
    "idle" | "setting-up" | "enabled"
  >("idle");
  const partnerToInvite =
    memberId === "princess" ? PARTNERS.beans : PARTNERS.princess;
  const partnerConnected = roomMembers.includes(partnerToInvite.id);
  const roomInviteLink = roomCode
    ? `https://togdaily-agtvyn2n.manus.space/join?roomCode=${encodeURIComponent(roomCode)}&partner=${partnerToInvite.id}`
    : "";
  const normalizedTabOrder = tabOrder;
  const orderedNavigation = [
    ...normalizedTabOrder.filter((id) => NAVIGATION.some((item) => item.id === id)),
    ...NAVIGATION.map((item) => item.id).filter((id) => !normalizedTabOrder.includes(id)),
  ]
    .map((id) => NAVIGATION.find((item) => item.id === id)!)
    .filter(Boolean);
  const currentPage =
    NAVIGATION.find(
      (item) =>
        pathname === item.href || (item.href === "/" && pathname === "/index"),
    ) ?? NAVIGATION[0];
  const renderedTheme = dynamicThemeForDate(theme, themeDate);
  const accentColor = renderedTheme.accentColor ?? COLORS.orchid;
  const { backgroundColor, gradient: backgroundGradient } = resolveThemeBackdrop(renderedTheme, undefined, COLORS.blush);
  const scrollBackgroundColor = backgroundGradient ? "transparent" : backgroundColor;
  const selectedFont = normalizeGlobalFont(theme.fontId ?? customSubheadings.globalFont);
  const fontFamily = fontFamilyFor(selectedFont, Platform.OS as FontPlatform);
  const textColor = normalizeGlobalTextColor(theme.fontColor);
  const borderColor = normalizeGlobalBorderColor(theme.borderColor);
  setActiveGlobalFont(selectedFont, fontFamily);
  setActiveGlobalTextColor(textColor);
  useEffect(() => {
    if (Platform.OS === "web" && typeof document !== "undefined")
      document.documentElement.style.setProperty("--together-font", fontFamily);
  }, [fontFamily]);
  useEffect(() => {
    setPagesOpen(false);
  }, [pathname]);
  useEffect(() => {
    const timer = setInterval(() => setThemeDate((current) => {
      const next = localDateKey();
      return current === next ? current : next;
    }), 60_000);
    return () => clearInterval(timer);
  }, []);
  const animatedGradient = Boolean(backgroundGradient) && isAnimatedTheme(renderedTheme);
  useEffect(() => {
    gradientMotion.stopAnimation();
    gradientMotion.setValue(0);
    if (!animatedGradient) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(gradientMotion, { toValue: 1, duration: DYNAMIC_GRADIENT_MOTION.legDuration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(gradientMotion, { toValue: 0, duration: DYNAMIC_GRADIENT_MOTION.legDuration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [animatedGradient, gradientMotion]);
  const gradientShiftX = gradientMotion.interpolate({ inputRange: [0, 1], outputRange: [-DYNAMIC_GRADIENT_MOTION.horizontalTravel, DYNAMIC_GRADIENT_MOTION.horizontalTravel] });
  const gradientShiftY = gradientMotion.interpolate({ inputRange: [0, 1], outputRange: [DYNAMIC_GRADIENT_MOTION.verticalTravel, -DYNAMIC_GRADIENT_MOTION.verticalTravel] });
  const gradientScale = gradientMotion.interpolate({ inputRange: [0, 1], outputRange: [DYNAMIC_GRADIENT_MOTION.baseScale, DYNAMIC_GRADIENT_MOTION.peakScale] });
  const pageSurfaceStyle = {
    marginHorizontal: 8,
    marginTop: 8,
    borderWidth: 0,
    backgroundColor: "transparent",
    borderRadius: 20,
    overflow: "hidden" as const,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  };
  const child = isValidElement(children)
      ? (children as ReactElement<{
        children?: ReactNode;
        contentContainerStyle?: unknown;
        style?: unknown;
      }>)
    : null;
  const styledChildren = child
    ? cloneElement(child, {
          contentContainerStyle: [
            child.props.contentContainerStyle,
            { backgroundColor: scrollBackgroundColor },
          ],
          style: [child.props.style, { backgroundColor: scrollBackgroundColor }],
          children: appendPageContentReset(
            revealGradientCardSurfaces(child.props.children, fontFamily, textColor, borderColor),
            currentPage.id,
          ),
      })
    : children;

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

  const inviteMessage = roomCode
    ? `Join me in our private Together Daily room.\n\nOpen this link, choose ${partnerToInvite.name}, and tap Join our room:\n${roomInviteLink}\n\nRoom code: ${roomCode}`
    : "";

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
      showInviteFeedback(
        `Choose ${partnerToInvite.name} in Messages, then send the invite`,
      );
    } catch {
      await copyFullInvite();
    }
  };

  const shareRoomInvite = async () => {
    if (!roomCode) return;

    try {
      await Share.share({
        message: inviteMessage,
        title: "Together Daily room invite",
      });
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
    <ScreenContainer containerClassName="bg-black" className="flex-1">
      <View style={[styles.frame, { backgroundColor: backgroundGradient ? "transparent" : backgroundColor }]}>
        {backgroundGradient ? <View pointerEvents="none" style={styles.themeGradient}>{animatedGradient ? <Animated.View style={[styles.animatedGradient, { transform: [{ translateX: gradientShiftX }, { translateY: gradientShiftY }, { scale: gradientScale }] }]}><LinearGradient colors={backgroundGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.themeGradient} /></Animated.View> : <LinearGradient colors={backgroundGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.themeGradient} />}</View> : null}
          <View style={[styles.topbar, isLaptopLayout && styles.topbarLaptop]}>
            <View style={styles.brandRow}>
            <Text style={[styles.brandMark, { color: textColor }]}>♥</Text>
            <View>
              <Text style={[styles.brand, { fontFamily, color: textColor }]}>Together Daily</Text>
              <Text style={[styles.brandSub, { fontFamily, color: textColor }]}>
                {PARTNERS.beans.avatar} {PARTNERS.beans.name.toUpperCase()} +{" "}
                {PARTNERS.princess.avatar}{" "}
                {PARTNERS.princess.name.toUpperCase()}
              </Text>
              <Text style={[styles.brandDate, { fontFamily, color: textColor }]}>{headerDate}</Text>
            </View>
          </View>
          <View style={styles.liveStatus}>
            <View
              style={[
                styles.liveDot,
                { backgroundColor: isSyncing ? COLORS.gold : COLORS.sage },
              ]}
            />
            <Text style={[styles.liveText, { color: textColor }]}>
              {isSyncing ? "SYNCING" : "LIVE"}
            </Text>
          </View>
        </View>
        <View style={styles.pageMenu}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Choose a page"
            accessibilityState={{ expanded: pagesOpen }}
            onPress={() => setPagesOpen((open) => !open)}
            style={({ pressed }) => [styles.pageMenuToggle, pressed && styles.pageMenuPressed, { borderColor }]}
          >
            <View style={styles.pageMenuLead}>
              <Text style={[styles.pageMenuKicker, { color: textColor }]}>PAGES</Text>
              <Text style={[styles.pageMenuCurrent, { fontFamily, color: textColor }]}>
                {tabGlyphs[currentPage.id]?.trim() || currentPage.glyph} {tabLabels[currentPage.id]?.trim() || currentPage.label}
              </Text>
            </View>
            <Text style={[styles.pageMenuChevron, { color: textColor }]}>{pagesOpen ? "⌃" : "⌄"}</Text>
          </Pressable>
          {pagesOpen ? <View style={[styles.pageMenuGrid, { borderColor }]}>{orderedNavigation.map((item) => {
            const active = pathname === item.href || (item.href === "/" && pathname === "/index");
            return <Pressable
              key={item.href}
              accessibilityRole="button"
              accessibilityLabel={`Open ${tabLabels[item.id]?.trim() || item.label}`}
              accessibilityState={{ selected: active }}
              onPress={() => router.replace(item.href as never)}
              style={({ pressed }) => [styles.pageMenuItem, active && { backgroundColor: accentColor }, pressed && styles.pageMenuPressed, { borderColor }]}
            >
              <Text style={[styles.pageMenuItemGlyph, { color: textColor }]}>{tabGlyphs[item.id]?.trim() || item.glyph}</Text>
              <Text style={[styles.pageMenuItemLabel, { fontFamily, color: textColor }]} numberOfLines={1}>{tabLabels[item.id]?.trim() || item.label}</Text>
            </Pressable>;
          })}</View> : null}
        </View>
        {currentPage.id === "themes" ? (
          <View style={styles.identityArea}>
            {roomCode ? (
              <View style={styles.inviteRow}>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Toggle invite tools"
                  accessibilityState={{ expanded: inviteToolsOpen }}
                  onPress={toggleInviteTools}
                  style={styles.invitePanelHeader}
                >
                  <View style={styles.invitePanelLead}>
                    <Text style={styles.invitePanelKicker}>INVITE TOOLS</Text>
                    <Text style={styles.invitePanelMeta}>
                      Text {partnerToInvite.name} · Copy invite · QR
                    </Text>
                  </View>
                  <Text style={styles.invitePanelChevron}>
                    {inviteToolsOpen ? "⌃" : "⌄"}
                  </Text>
                </TouchableOpacity>
                {inviteToolsOpen ? (
                  <View style={styles.invitePanelBody}>
                    <View style={styles.roomCodeRow}>
                      <Text style={styles.roomCodeLabel}>ROOM CODE</Text>
                      <Text style={styles.roomCodeValue}>{roomCode}</Text>
                    </View>
                    <View style={styles.inviteActions}>
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Copy room code"
                        onPress={copyRoomCode}
                        style={styles.inviteAction}
                      >
                        <Text style={styles.inviteActionText}>COPY CODE</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel={`Text ${partnerToInvite.name} the room invite`}
                        onPress={textRoomInvite}
                        style={[styles.inviteAction, styles.shareAction]}
                      >
                        <Text style={styles.shareActionText}>
                          TEXT {partnerToInvite.name.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Copy complete room invitation"
                        onPress={copyFullInvite}
                        style={[styles.inviteAction, styles.copyInviteAction]}
                      >
                        <Text style={styles.copyInviteText}>COPY INVITE</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Share room invitation to another app"
                        onPress={shareRoomInvite}
                        style={styles.inviteAction}
                      >
                        <Text style={styles.inviteActionText}>OTHER APPS</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Show room QR code"
                        onPress={() => setShowQr((visible) => !visible)}
                        style={[styles.inviteAction, styles.qrAction]}
                      >
                        <Text style={styles.qrActionText}>
                          {showQr ? "HIDE QR" : "SHOW QR"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    {showQr ? (
                      <View style={styles.qrPanel}>
                        <View style={styles.qrCodeWrap}>
                          <QRCode
                            value={roomInviteLink}
                            size={150}
                            color={COLORS.ink}
                            backgroundColor="#FFF9F6"
                          />
                        </View>
                        <View style={styles.qrCopy}>
                          <Text style={styles.qrTitle}>
                            {partnerToInvite.name}, scan this code
                          </Text>
                          <Text style={styles.qrText}>
                            It opens Together Daily in her browser with your
                            room code ready to join.
                          </Text>
                        </View>
                      </View>
                    ) : null}
                  </View>
                ) : null}
                <View
                  style={[
                    styles.connectionStatus,
                    partnerConnected && {
                      borderColor: partnerToInvite.color,
                      backgroundColor: `${partnerToInvite.color}22`,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.connectionDot,
                      {
                        backgroundColor: partnerConnected
                          ? partnerToInvite.color
                          : COLORS.gold,
                      },
                    ]}
                  />
                  <Text style={styles.connectionText}>
                    {partnerConnected
                      ? `${partnerToInvite.name.toUpperCase()} CONNECTED`
                      : `WAITING FOR ${partnerToInvite.name.toUpperCase()}`}
                  </Text>
                </View>
                <View style={styles.alertRow}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Enable partner alerts"
                    disabled={pushStatus !== "idle"}
                    onPress={enablePartnerAlerts}
                    style={[
                      styles.inviteAction,
                      styles.alertAction,
                      pushStatus !== "idle" && styles.disabledAction,
                    ]}
                  >
                    <Text style={styles.alertActionText}>
                      {pushStatus === "setting-up"
                        ? "CONNECTING…"
                        : pushStatus === "enabled"
                          ? "ALERTS ON"
                          : "ENABLE ALERTS"}
                    </Text>
                  </TouchableOpacity>
                </View>
                {inviteFeedback ? (
                  <Text
                    accessibilityLiveRegion="polite"
                    style={styles.inviteFeedback}
                  >
                    {inviteFeedback}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}
        <View style={[styles.content, pageSurfaceStyle, { paddingBottom: Math.max(insets.bottom, 12) }, isLaptopLayout && styles.contentLaptop]}>
          {styledChildren}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  themeGradient: { ...StyleSheet.absoluteFillObject },
  animatedGradient: { ...StyleSheet.absoluteFillObject, left: -112, right: -112, top: -82, bottom: -82 },
  frame: { flex: 1, backgroundColor: COLORS.blush, overflow: "hidden" },
  topbar: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#211C24",
    backgroundColor: "transparent",
  },
  topbarLaptop: { paddingHorizontal: 32, paddingTop: 18, paddingBottom: 16 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  brandMark: { color: COLORS.rose, fontSize: 25, lineHeight: 26 },
  brand: {
    color: COLORS.plum,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  brandSub: {
    color: COLORS.slate,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.3,
    marginTop: 1,
  },
  brandDate: {
    color: COLORS.slate,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginTop: 2,
  },
  liveStatus: {
    borderRadius: 11,
    backgroundColor: "#16131A",
    paddingVertical: 6,
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: {
    color: COLORS.slate,
    fontSize: 9,
    letterSpacing: 1,
    fontWeight: "900",
  },
  pageMenu: { borderBottomWidth: 1, borderBottomColor: "#211C24", backgroundColor: "transparent", paddingHorizontal: 16, paddingVertical: 9, zIndex: 10 },
  pageMenuToggle: { minHeight: 48, borderRadius: 14, borderWidth: 1, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(255,255,255,0.05)" },
  pageMenuLead: { gap: 2, flex: 1 },
  pageMenuKicker: { fontSize: 9, fontWeight: "900", letterSpacing: 1.1 },
  pageMenuCurrent: { fontSize: 15, fontWeight: "900" },
  pageMenuChevron: { fontSize: 19, fontWeight: "900", paddingLeft: 12 },
  pageMenuGrid: { marginTop: 8, borderWidth: 1, borderRadius: 14, padding: 8, flexDirection: "row", flexWrap: "wrap", gap: 7, backgroundColor: "rgba(10,7,15,0.16)" },
  pageMenuItem: { width: "48.6%", minHeight: 45, borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "rgba(255,255,255,0.05)" },
  pageMenuItemGlyph: { fontSize: 15 },
  pageMenuItemLabel: { flex: 1, fontSize: 11, fontWeight: "900" },
  pageMenuPressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
  identityArea: {
    borderBottomWidth: 1,
    borderBottomColor: "#211C24",
    backgroundColor: "transparent",
  },
  identityStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 7,
  },
  identityDot: { width: 7, height: 7, borderRadius: 4 },
  identityName: { fontSize: 11, fontWeight: "900" },
  identityDivider: { color: "#554C58", marginHorizontal: 1 },
  identityRoom: {
    color: COLORS.slate,
    marginLeft: "auto",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  currentChip: {
    marginLeft: 4,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 7,
  },
  currentChipText: { fontSize: 8, fontWeight: "900", letterSpacing: 0.6 },
  pageEditRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 10,
  },
  pageEditKicker: {
    color: COLORS.gold,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  pageEditCopy: { color: COLORS.slate, fontSize: 10, marginTop: 2 },
  pageEditButton: {
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  pageEditButtonText: { fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  pageEditorPanel: {
    borderTopWidth: 1,
    borderTopColor: "#2C2431",
    borderBottomWidth: 1,
    borderBottomColor: "#2C2431",
    backgroundColor: "#111014",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 7,
  },
  pageEditorLabel: {
    color: COLORS.gold,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.9,
    marginTop: 2,
  },
  pageSwatches: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  pageSwatch: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: "transparent",
  },
  pageSwatchActive: { borderColor: COLORS.white },
  pageChoiceRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  pageChoice: {
    minHeight: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3A313E",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 9,
    backgroundColor: "#171218",
  },
  pageChoiceText: { color: COLORS.slate, fontSize: 10, fontWeight: "900" },
  resetPageButton: { alignSelf: "flex-start", paddingVertical: 6 },
  resetPageText: { color: COLORS.slate, fontSize: 10, fontWeight: "900" },
  inviteRow: { paddingHorizontal: 20, paddingBottom: 10, gap: 8 },
  invitePanelHeader: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#000000",
    backgroundColor: "transparent",
    minHeight: 48,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  invitePanelLead: { gap: 2 },
  invitePanelKicker: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  invitePanelMeta: {
    color: "#FFFFFF",
    fontSize: 10,
    fontFamily: "monospace",
  },
  invitePanelChevron: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    paddingHorizontal: 4,
  },
  invitePanelBody: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#000000",
    backgroundColor: "transparent",
    padding: 10,
    gap: 9,
  },
  roomCodeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 9,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#000000",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  roomCodeLabel: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.9,
  },
  roomCodeValue: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  connectionStatus: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#6A5B43",
    backgroundColor: "rgba(198,160,76,0.10)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  connectionDot: { width: 7, height: 7, borderRadius: 4 },
  connectionText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  inviteActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  alertRow: { flexDirection: "row", alignItems: "center" },
  inviteAction: {
    borderWidth: 1,
    borderColor: "#C6A04C",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  inviteActionText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  shareAction: {
    borderColor: COLORS.orchid,
    backgroundColor: "rgba(141,91,166,0.15)",
  },
  shareActionText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  copyInviteAction: {
    borderColor: "#5A8092",
    backgroundColor: "rgba(102,183,221,0.10)",
  },
  copyInviteText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  qrAction: {
    borderColor: PARTNERS.princess.color,
    backgroundColor: "rgba(213,107,136,0.12)",
  },
  qrActionText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  alertAction: {
    borderColor: COLORS.sage,
    backgroundColor: "rgba(144,185,157,0.10)",
  },
  alertActionText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  disabledAction: { opacity: 0.62 },
  qrPanel: {
    marginTop: 12,
    borderRadius: 14,
    padding: 12,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#000000",
    flexDirection: "row",
    gap: 13,
    alignItems: "center",
  },
  qrCodeWrap: { borderRadius: 10, backgroundColor: "#FFF9F6", padding: 8 },
  qrCopy: { flex: 1 },
  qrTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
  qrText: {
    color: "#FFFFFF",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
    fontFamily: "monospace",
  },
  inviteFeedback: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 7,
  },
  content: { flex: 1, width: "100%", maxWidth: 920, alignSelf: "center" },
  contentLaptop: { maxWidth: 1120, paddingHorizontal: 12 },
  pageResetFooter: {
    alignSelf: "center",
    marginVertical: 18,
    borderWidth: 1,
    borderColor: "#4B4054",
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pageResetText: {
    color: COLORS.slate,
    fontSize: 10,
    fontWeight: "900",
    fontFamily: "cursive",
  },
  pageResetFeedback: {
    color: COLORS.slate,
    fontSize: 10,
    fontFamily: "monospace",
    textAlign: "center",
    marginTop: -10,
    marginBottom: 8,
  },
});
