import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  clearCrashReports,
  deleteCrashReport,
  formatCrashReport,
  getCrashReports,
  recordTestCrash,
  setCrashResolved,
} from "@/services/crashTracker";
import { formatCrashTime } from "@/utils/crashDiagnostics";
import type { CrashReport } from "@/types/crash";

interface CrashReportsViewProps {
  onClose?: () => void;
}

export function CrashReportsView({ onClose }: CrashReportsViewProps) {
  const [reports, setReports] = useState<CrashReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadReports = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      setReports(await getCrashReports());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadReports(false);
  }, [loadReports]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadReports(false);
  };

  const handleClear = () => {
    Alert.alert("Clear reports", "Delete all crash reports?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: async () => { await clearCrashReports(); await loadReports(); } },
    ]);
  };

  const handleShare = async (report: CrashReport) => {
    try {
      await Share.share({ message: formatCrashReport(report) });
    } catch {
      // ignore
    }
  };

  const handleTest = async () => {
    await recordTestCrash();
    await loadReports();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#A855F7" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Crash Reports</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleTest} style={styles.button}>
            <Text style={styles.buttonText}>Test</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClear} style={styles.button}>
            <Text style={styles.buttonText}>Clear</Text>
          </TouchableOpacity>
          {onClose ? (
            <TouchableOpacity onPress={onClose} style={styles.button}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
      <FlatList
        data={reports}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>No crash reports.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.message}>{item.message}</Text>
            <Text style={styles.meta}>{formatCrashTime(item.lastSeen)} · {item.platform}</Text>
            <View style={styles.row}>
              <TouchableOpacity onPress={() => handleShare(item)} style={styles.smallButton}>
                <Text style={styles.smallButtonText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={async () => { await setCrashResolved(item.id, !item.resolved); await loadReports(); }} style={styles.smallButton}>
                <Text style={styles.smallButtonText}>{item.resolved ? "Unresolve" : "Resolve"}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={async () => { await deleteCrashReport(item.id); await loadReports(); }} style={styles.smallButton}>
                <Text style={styles.smallButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1A0B2E", padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#1A0B2E" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  title: { color: "#F3E8FF", fontSize: 20, fontWeight: "900" },
  headerActions: { flexDirection: "row", gap: 8 },
  button: { borderWidth: 1, borderColor: "#A855F7", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  buttonText: { color: "#F3E8FF", fontSize: 10, fontWeight: "900" },
  empty: { color: "#D8B4FE", textAlign: "center", marginTop: 40 },
  card: { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 12, borderWidth: 1, borderColor: "#4C1D95", padding: 12, marginBottom: 10, gap: 4 },
  name: { color: "#F3E8FF", fontSize: 14, fontWeight: "900" },
  message: { color: "#D8B4FE", fontSize: 11 },
  meta: { color: "#A78BFA", fontSize: 9, fontFamily: "monospace" },
  row: { flexDirection: "row", gap: 8, marginTop: 8 },
  smallButton: { borderWidth: 1, borderColor: "#6D28D9", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  smallButtonText: { color: "#F3E8FF", fontSize: 9, fontWeight: "900" },
});