import { useLocalJournal } from "@/lib/local-journal";
import { ActivityIndicator, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { type ReactNode } from "react";

const COLORS = { plum: "#281C32", orchid: "#8D5BA6", blush: "#FDF3F6", white: "#FFFFFF", slate: "#665F6B" };

type PrivateGateProps = { children: (access: { userId: number; memberName: string; coupleName: string; inviteCode: string; memberCount: number }) => ReactNode };

/**
 * Direct-access mode intentionally has no account or sign-in gate. Entries persist in the current
 * browser or device using local storage, so this mode is suitable for a private personal workspace.
 */
export function PrivateGate({ children }: PrivateGateProps) {
  const { ready } = useLocalJournal();
  if (!ready) return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.orchid} /><Text style={styles.loadingText}>Opening your daily journal…</Text></View>;
  return children({ userId: 1, memberName: "You", coupleName: "Together Daily", inviteCode: "", memberCount: 2 });
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: COLORS.blush } as ViewStyle,
  loadingText: { color: COLORS.slate, fontSize: 15, marginTop: 12 },
});
