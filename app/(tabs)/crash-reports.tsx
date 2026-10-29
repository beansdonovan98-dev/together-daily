import { AppFrame } from "@/components/app-frame";
import { COLORS } from "@/lib/together";
import { clearCrashLogs, getCrashLogs, type CrashEntry } from "@/lib/crash-log";
import { ScrollView, StyleSheet, Share, Alert } from "react-native";
import { useEffect, useState } from "react";
import { VisualText as Text, VisualTouchableOpacity as TouchableOpacity, VisualView as View } from "@/components/visual-primitives";

export default function CrashReportsScreen() {
  const [logs, setLogs] = useState<CrashEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setLogs(await getCrashLogs());
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const clear = () => {
    Alert.alert("Clear logs", "Delete all Crash Logs?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: async () => { await clearCrashLogs(); await load(); } },
    ]);
  };

  const share = async (entry: CrashEntry) => {
    try {
      await Share.share({ message: `${entry.name}: ${entry.message}\n\n${entry.stack}` });
    } catch {
      // ignore
    }
  };

  return (
    <AppFrame>
      <ScrollView contentContainerStyle={styles.page}>
        <View>
          <Text style={styles.eyebrow}>CRASH REPORTS</Text>
          <Text style={styles.hero}>Crash Logs</Text>
          <Text style={styles.copy}>Recent errors captured on this device.</Text>
        </View>
        <TouchableOpacity onPress={clear} style={styles.button}>
          <Text style={styles.buttonText}>Clear logs</Text>
        </TouchableOpacity>
        {loading ? <Text style={styles.copy}>Loading…</Text> : null}
        {!loading && logs.length === 0 ? <Text style={styles.copy}>No Crash Logs yet.</Text> : null}
        {logs.map((entry) => (
          <View key={entry.id} style={styles.card}>
            <Text style={styles.name}>{entry.name}</Text>
            <Text style={styles.message}>{entry.message}</Text>
            <Text style={styles.meta}>{entry.source} · {new Date(entry.createdAt).toLocaleString()}</Text>
            <TouchableOpacity onPress={() => share(entry)} style={styles.smallButton}>
              <Text style={styles.smallButtonText}>Share</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </AppFrame>
  );
}

const styles = StyleSheet.create({
  page: { padding: 18, paddingBottom: 36, gap: 14 },
  eyebrow: { color: "#A855F7", fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  hero: { color: "#F3E8FF", fontSize: 32, fontWeight: "900", fontStyle: "italic" },
  copy: { color: "#D8B4FE", fontFamily: "monospace", fontSize: 11, lineHeight: 17, marginTop: 4 },
  button: { alignSelf: "flex-start", borderWidth: 1, borderColor: "#A855F7", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  buttonText: { color: "#F3E8FF", fontSize: 11, fontWeight: "900" },
  card: { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 12, borderWidth: 1, borderColor: "#4C1D95", padding: 12, gap: 4 },
  name: { color: "#F3E8FF", fontSize: 14, fontWeight: "900" },
  message: { color: "#D8B4FE", fontSize: 11 },
  meta: { color: "#A78BFA", fontSize: 9, fontFamily: "monospace" },
  smallButton: { alignSelf: "flex-start", borderWidth: 1, borderColor: "#6D28D9", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, marginTop: 6 },
  smallButtonText: { color: "#F3E8FF", fontSize: 9, fontWeight: "900" },
});
