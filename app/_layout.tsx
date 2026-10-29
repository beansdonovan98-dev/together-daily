import "@/global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { router, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { Platform, Text, TextInput } from "react-native";
import * as Notifications from "expo-notifications";
import "@/lib/_core/nativewind-pressable";
import { ThemeProvider } from "@/lib/theme-provider";
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import type { EdgeInsets, Metrics, Rect } from "react-native-safe-area-context";

import { trpc, createTRPCClient } from "@/lib/trpc";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { initManusRuntime, subscribeSafeAreaInsets } from "@/lib/_core/manus-runtime";
import { LocalJournalProvider, useLocalJournal } from "@/lib/local-journal";
import { BUNDLED_FONT_RESOURCES } from "@/lib/font-resources";
import { partnerNotificationPathFromData, type PartnerNotificationPath } from "@/lib/notification-navigation";
import { activeGlobalFontFamily, activeGlobalTextColor, fontFamilyFor, normalizeGlobalFont, normalizeGlobalTextColor, setActiveGlobalFont, setActiveGlobalTextColor, type FontPlatform } from "@/lib/typography";
import { initCrashLogging } from "@/lib/crash-log";

const DEFAULT_WEB_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_WEB_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };
const whiteTextDefault = { color: "#FFFFFF" };
type TypographyComponent = {
  defaultProps?: { placeholderTextColor?: string; style?: unknown };
  render?: (props: Record<string, unknown>, ref: unknown) => unknown;
  [key: symbol]: unknown;
};
const whiteTypographyPatch = Symbol.for("together-daily.force-white-typography");
const forceWhiteTypography = (component: unknown, isInput = false) => {
  const target = component as TypographyComponent;
  target.defaultProps = { ...target.defaultProps, style: whiteTextDefault, ...(isInput ? { placeholderTextColor: "#FFFFFF" } : {}) };
  if (target[whiteTypographyPatch] || !target.render) return;
  const originalRender = target.render;
  target.render = (props, ref) => originalRender({ ...props, style: [props.style, { color: activeGlobalTextColor(), fontFamily: activeGlobalFontFamily() }], ...(isInput ? { placeholderTextColor: activeGlobalTextColor() } : {}) }, ref);
  target[whiteTypographyPatch] = true;
};
forceWhiteTypography(Text);
forceWhiteTypography(TextInput, true);

export const unstable_settings = {
  anchor: "(tabs)",
};

function usePartnerNotificationNavigation(navigationReady: boolean) {
  const [pendingPath, setPendingPath] = useState<PartnerNotificationPath | null>(null);

  useEffect(() => {
    if (Platform.OS === "web") return;
    const queueNotificationPath = (notification: Notifications.Notification) => {
      const path = partnerNotificationPathFromData(notification.request.content.data);
      if (path) setPendingPath(path);
      else void Notifications.clearLastNotificationResponseAsync().catch(() => undefined);
    };

    const lastResponse = Notifications.getLastNotificationResponse();
    if (lastResponse?.notification) queueNotificationPath(lastResponse.notification);
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => queueNotificationPath(response.notification));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!navigationReady || !pendingPath) return;
    try {
      // The Stack exists once fonts have loaded, so this cannot run during the
      // null-rendered launch frame that caused notification-tap crashes.
      router.replace(pendingPath as never);
      setPendingPath(null);
      void Notifications.clearLastNotificationResponseAsync().catch(() => undefined);
    } catch (error) {
      // A failed notification route must never take down the whole app.
      console.warn("[Notifications] Could not open notification route:", error);
    }
  }, [navigationReady, pendingPath]);
}

function JournalRoutes() {
  const { theme, customSubheadings } = useLocalJournal();
  const selectedFont = normalizeGlobalFont(theme.fontId ?? customSubheadings.globalFont);
  setActiveGlobalTextColor(normalizeGlobalTextColor(theme.fontColor));
  setActiveGlobalFont(selectedFont, fontFamilyFor(selectedFont, Platform.OS as FontPlatform));
  return <ErrorBoundary><Stack key={`${theme.fontColor ?? "white"}:${theme.fontId ?? customSubheadings.globalFont ?? "classic"}`} screenOptions={{ headerShown: false }}><Stack.Screen name="(tabs)" /><Stack.Screen name="oauth/callback" /></Stack></ErrorBoundary>;
}

export default function RootLayout() {
  useEffect(() => {
    initCrashLogging();
  }, []);
  const [fontsLoaded, fontError] = useFonts(BUNDLED_FONT_RESOURCES);
  usePartnerNotificationNavigation(fontsLoaded || Boolean(fontError));
  const initialInsets = initialWindowMetrics?.insets ?? DEFAULT_WEB_INSETS;
  const initialFrame = initialWindowMetrics?.frame ?? DEFAULT_WEB_FRAME;

  const [insets, setInsets] = useState<EdgeInsets>(initialInsets);
  const [frame, setFrame] = useState<Rect>(initialFrame);

  // Initialize Manus runtime for cookie injection from parent container
  useEffect(() => {
    initManusRuntime();
  }, []);

  const handleSafeAreaUpdate = useCallback((metrics: Metrics) => {
    setInsets(metrics.insets);
    setFrame(metrics.frame);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const unsubscribe = subscribeSafeAreaInsets(handleSafeAreaUpdate);
    return () => unsubscribe();
  }, [handleSafeAreaUpdate]);

  // Create clients once and reuse them
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Disable automatic refetching on window focus for mobile
            refetchOnWindowFocus: false,
            // Retry failed requests once
            retry: 1,
          },
        },
      }),
  );
  const [trpcClient] = useState(() => createTRPCClient());

  // Ensure minimum 8px padding for top and bottom on mobile
  const providerInitialMetrics = useMemo(() => {
    const metrics = initialWindowMetrics ?? { insets: initialInsets, frame: initialFrame };
    return {
      ...metrics,
      insets: {
        ...metrics.insets,
        top: Math.max(metrics.insets.top, 16),
        bottom: Math.max(metrics.insets.bottom, 12),
      },
    };
  }, [initialInsets, initialFrame]);

  if (!fontsLoaded && !fontError) return null;

  const content = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          {/* Default to hiding native headers so raw route segments don't appear (e.g. "(tabs)", "products/[id]"). */}
          {/* If a screen needs the native header, explicitly enable it and set a human title via Stack.Screen options. */}
          {/* in order for ios apps tab switching to work properly, use presentation: "fullScreenModal" for login page, whenever you decide to use presentation: "modal*/}
          <LocalJournalProvider>
            <JournalRoutes />
          </LocalJournalProvider>
          <StatusBar style="light" animated />
        </QueryClientProvider>
      </trpc.Provider>
    </GestureHandlerRootView>
  );

  const shouldOverrideSafeArea = Platform.OS === "web";

  if (shouldOverrideSafeArea) {
    return (
      <ThemeProvider>
        <SafeAreaProvider initialMetrics={providerInitialMetrics}>
          <SafeAreaFrameContext.Provider value={frame}>
            <SafeAreaInsetsContext.Provider value={insets}>
              {content}
            </SafeAreaInsetsContext.Provider>
          </SafeAreaFrameContext.Provider>
        </SafeAreaProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider initialMetrics={providerInitialMetrics}>{content}</SafeAreaProvider>
    </ThemeProvider>
  );
}
