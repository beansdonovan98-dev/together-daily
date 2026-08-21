import { ScreenContainer } from "@/components/screen-container";
import { COLORS } from "@/lib/together";
import { router, usePathname } from "expo-router";
import { type ReactNode } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";

const NAVIGATION = [
  { href: "/", label: "Today", glyph: "◉" },
  { href: "/log", label: "Shared log", glyph: "≡" },
  { href: "/connect", label: "Connect", glyph: "♡" },
  { href: "/memories", label: "Photos", glyph: "▧" },
  { href: "/chat", label: "Chat", glyph: "◌" },
];

export function AppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === "web" && width >= 960;

  return (
    <ScreenContainer containerClassName="bg-background" className="flex-1">
      {isDesktopWeb ? (
        <View style={styles.desktopFrame}>
          <View style={styles.rail}>
            <View>
              <Text style={styles.brandEyebrow}>PRIVATE · TWO PEOPLE</Text>
              <Text style={styles.brand}>Together{`\n`}Daily</Text>
              <Text style={styles.brandCopy}>A gentle daily place, saved in this browser.</Text>
            </View>
            <View style={styles.navigation}>
              {NAVIGATION.map((item) => {
                const active = pathname === item.href || (item.href === "/" && pathname === "/index");
                return (
                  <TouchableOpacity key={item.href} style={[styles.navItem, active && styles.navItemActive]} onPress={() => router.replace(item.href as never)}>
                    <Text style={[styles.navGlyph, active && styles.navTextActive]}>{item.glyph}</Text>
                    <Text style={[styles.navText, active && styles.navTextActive]}>{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.privacyNote}>
              <Text style={styles.privacyTitle}>Local by design</Text>
              <Text style={styles.privacyCopy}>Your entries stay in this browser unless you export them.</Text>
            </View>
          </View>
          <View style={styles.desktopContent}>{children}</View>
        </View>
      ) : (
        children
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  desktopFrame: { flex: 1, flexDirection: "row", backgroundColor: COLORS.blush },
  rail: { width: 250, backgroundColor: COLORS.plum, paddingHorizontal: 24, paddingVertical: 34, justifyContent: "space-between" },
  brandEyebrow: { color: "#E8C7EF", fontSize: 10, fontWeight: "800", letterSpacing: 1.2, marginBottom: 10 },
  brand: { color: COLORS.white, fontSize: 30, lineHeight: 31, fontWeight: "800", letterSpacing: -0.7 },
  brandCopy: { color: "#D9CCD9", fontSize: 13, lineHeight: 19, marginTop: 12, maxWidth: 180 },
  navigation: { gap: 7, marginTop: 36 },
  navItem: { minHeight: 47, paddingHorizontal: 13, borderRadius: 13, flexDirection: "row", alignItems: "center", gap: 11 },
  navItemActive: { backgroundColor: "rgba(255,255,255,0.14)" },
  navGlyph: { color: "#CFB8D2", width: 18, textAlign: "center", fontSize: 18, fontWeight: "700" },
  navText: { color: "#E5D9E6", fontSize: 14, fontWeight: "700" },
  navTextActive: { color: COLORS.white },
  privacyNote: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.16)", paddingTop: 18 },
  privacyTitle: { color: COLORS.white, fontSize: 13, fontWeight: "800", marginBottom: 5 },
  privacyCopy: { color: "#D9CCD9", fontSize: 12, lineHeight: 17 },
  desktopContent: { flex: 1, width: "100%", maxWidth: 1180, alignSelf: "center", backgroundColor: COLORS.blush, paddingTop: 24 },
});
