import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { medicineReminderTime } from "./medicine-reminder-time";

export type ReminderMedicine = { id: string; text: string; time?: string; reminder?: boolean };

export { medicineReminderTime } from "./medicine-reminder-time";

async function permitted(requestIfNeeded: boolean) {
  if (Platform.OS === "web") return false;
  const current = await Notifications.getPermissionsAsync();
  const result = current.status === "granted" || !requestIfNeeded ? current : await Notifications.requestPermissionsAsync();
  return result.status === "granted";
}

export async function cancelMedicineReminder(medicineId: string) {
  if (Platform.OS === "web") return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(scheduled
    .filter((notification) => notification.content.data?.kind === "medicine-reminder" && notification.content.data?.medicineId === medicineId)
    .map((notification) => Notifications.cancelScheduledNotificationAsync(notification.identifier)));
}

/** Schedules one private daily reminder on the current phone only. */
export async function scheduleMedicineReminder(medicine: ReminderMedicine, requestPermission = true) {
  const time = medicineReminderTime(medicine.time);
  if (!medicine.reminder || !time || !(await permitted(requestPermission))) return false;
  await cancelMedicineReminder(medicine.id);
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("medicine-reminders", {
      name: "Together Daily medicine reminders",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 180, 100, 180],
      lightColor: "#8D5BA6",
    });
  }
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Medicine reminder",
      body: `It’s time for ${medicine.text}.`,
      sound: true,
      data: { kind: "medicine-reminder", medicineId: medicine.id },
      ...(Platform.OS === "android" ? { android: { channelId: "medicine-reminders" } } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: time.hour,
      minute: time.minute,
    },
  });
  return true;
}

/** Recreates enabled reminders after shared medicines sync to this phone. No permission prompt is shown. */
export async function syncMedicineReminders(medicines: ReminderMedicine[]) {
  if (Platform.OS === "web") return;
  const current = await Notifications.getPermissionsAsync();
  if (current.status !== "granted") return;
  await Promise.all(medicines.filter((medicine) => medicine.reminder).map((medicine) => scheduleMedicineReminder(medicine, false)));
}
