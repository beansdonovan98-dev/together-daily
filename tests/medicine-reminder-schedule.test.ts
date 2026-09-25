import { beforeEach, describe, expect, it, vi } from "vitest";

const notificationMocks = vi.hoisted(() => ({
  cancelScheduledNotificationAsync: vi.fn(),
  getAllScheduledNotificationsAsync: vi.fn(),
  getPermissionsAsync: vi.fn(),
  requestPermissionsAsync: vi.fn(),
  scheduleNotificationAsync: vi.fn(),
  setNotificationChannelAsync: vi.fn(),
}));

vi.mock("react-native", () => ({ Platform: { OS: "ios" } }));
vi.mock("expo-notifications", () => ({
  AndroidImportance: { HIGH: "high" },
  SchedulableTriggerInputTypes: { DAILY: "daily" },
  ...notificationMocks,
}));

import { scheduleMedicineReminder } from "../lib/medicine-reminders";

describe("native medicine reminder scheduling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    notificationMocks.getPermissionsAsync.mockResolvedValue({ status: "granted" });
    notificationMocks.getAllScheduledNotificationsAsync.mockResolvedValue([
      { identifier: "old-reminder", content: { data: { kind: "medicine-reminder", medicineId: "med-1" } } },
      { identifier: "other-reminder", content: { data: { kind: "medicine-reminder", medicineId: "med-2" } } },
    ]);
    notificationMocks.scheduleNotificationAsync.mockResolvedValue("new-reminder");
  });

  it("uses the chosen reminder time, replaces an older reminder, and schedules it daily", async () => {
    const scheduled = await scheduleMedicineReminder({
      id: "med-1",
      text: "Evening medicine",
      time: "7:00 AM",
      reminderTime: "9:30 PM",
      reminder: true,
    });

    expect(scheduled).toBe(true);
    expect(notificationMocks.cancelScheduledNotificationAsync).toHaveBeenCalledWith("old-reminder");
    expect(notificationMocks.cancelScheduledNotificationAsync).not.toHaveBeenCalledWith("other-reminder");
    expect(notificationMocks.scheduleNotificationAsync).toHaveBeenCalledWith({
      content: {
        title: "Medicine reminder",
        body: "It’s time for Evening medicine.",
        sound: true,
        data: { kind: "medicine-reminder", medicineId: "med-1" },
      },
      trigger: { type: "daily", hour: 21, minute: 30 },
    });
  });

  it("does not schedule a disabled or invalid reminder", async () => {
    await expect(scheduleMedicineReminder({ id: "med-1", text: "Medicine", reminder: false, reminderTime: "8:00 AM" })).resolves.toBe(false);
    await expect(scheduleMedicineReminder({ id: "med-1", text: "Medicine", reminder: true, reminderTime: "invalid" })).resolves.toBe(false);
    expect(notificationMocks.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});
