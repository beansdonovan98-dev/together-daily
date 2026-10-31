import { AppFrame } from "@/components/app-frame";
import { PrivateGate } from "@/components/together-access";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function ThemesScreen() {
  return <PrivateGate>{() => <ThemesContent />}</PrivateGate>;
}

function ThemesContent() {
  return (
    <AppFrame>
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.title}>Themes</Text>
        <Text style={styles.copy}>Themes coming soon.</Text>
      </ScrollView>
    </AppFrame>
  );
}

const styles = StyleSheet.create({
  page: { padding: 18, gap: 12 },
  title: { color: "#F3E8FF", fontSize: 24, fontWeight: "900" },
  copy: { color: "#D8B4FE", fontSize: 12 },
});