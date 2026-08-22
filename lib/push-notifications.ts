import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export type PushRegistrationResult =
  | { ok: true; token: string; platform: "android" | "ios" }
  | { ok: false; message: string };

export async function registerForPartnerPushNotifications(): Promise<PushRegistrationResult> {
  if (Platform.OS === "web") return { ok: false, message: "Partner alerts are available in the Together Daily phone app." };
  if (!Device.isDevice) return { ok: false, message: "Partner alerts need a physical phone." };

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("together-daily", {
      name: "Together Daily partner alerts",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 180, 100, 180],
      lightColor: "#8D5BA6",
    });
  }

  const current = await Notifications.getPermissionsAsync();
  const permission = current.status === "granted" ? current : await Notifications.requestPermissionsAsync();
  if (permission.status !== "granted") return { ok: false, message: "Notifications are off. Allow Together Daily notifications in your phone settings." };

  const configuredProjectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (typeof configuredProjectId !== "string" || !configuredProjectId) {
    return { ok: false, message: "Install the next push-enabled Together Daily APK to turn on partner alerts." };
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync({ projectId: configuredProjectId })).data;
    return { ok: true, token, platform: Platform.OS === "android" ? "android" : "ios" };
  } catch {
    return { ok: false, message: "Could not connect this phone for alerts. Please try again." };
  }
}
