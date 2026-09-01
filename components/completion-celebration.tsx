import { useEffect, useRef } from "react";
import { Animated, StyleSheet } from "react-native";

import { VisualText as Text, VisualView as View } from "@/components/visual-primitives";

type CompletionCelebrationProps = {
  title: string;
  detail: string;
};

export function CompletionCelebration({ title, detail }: CompletionCelebrationProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progress.setValue(0);
    const animation = Animated.sequence([
      Animated.timing(progress, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.delay(600),
      Animated.timing(progress, { toValue: 1, duration: 1, useNativeDriver: true }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [progress]);

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      style={[
        styles.shell,
        {
          opacity: progress,
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
            { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
          ],
        },
      ]}
    >
      <View style={styles.sparkles}>
        <Text style={styles.sparkle}>✦</Text>
        <Text style={styles.sparkle}>★</Text>
        <Text style={styles.sparkle}>✦</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.detail}>{detail}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shell: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderColor: "#000000",
    borderRadius: 16,
    borderWidth: 2,
    gap: 4,
    overflow: "hidden",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sparkles: { flexDirection: "row", gap: 12, alignItems: "center" },
  sparkle: { fontSize: 20, fontWeight: "900" },
  title: { fontSize: 17, fontWeight: "900", textAlign: "center" },
  detail: { fontSize: 11, fontWeight: "700", lineHeight: 16, textAlign: "center" },
});
