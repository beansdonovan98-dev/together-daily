import React, { Component, type ReactNode } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { getCrashLogs, clearCrashLogs } from "@/lib/crash-log";

type Props = { children: ReactNode };
type State = { hasError: boolean; message: string };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message || "Unknown error" };
  }

  componentDidCatch(error: Error) {
    void getCrashLogs();
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.message}>{this.state.message}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={async () => {
            await clearCrashLogs();
            this.setState({ hasError: false, message: "" });
          }}
        >
          <Text style={styles.buttonText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#1A0B2E", padding: 24 },
  title: { color: "#F3E8FF", fontSize: 20, fontWeight: "900", marginBottom: 8 },
  message: { color: "#D8B4FE", fontSize: 12, textAlign: "center", marginBottom: 16 },
  button: { borderWidth: 1, borderColor: "#A855F7", borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  buttonText: { color: "#F3E8FF", fontSize: 12, fontWeight: "900" },
});