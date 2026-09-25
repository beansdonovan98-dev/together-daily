export type PartnerNotificationEvent = "connection" | "daily-log" | "love-note" | "todo" | "private-update" | "steamy-update";
export type PartnerNotificationId = "beans" | "princess";

type PartnerNotification = { title: string; body: string; path: string };

function partnerName(partnerId: PartnerNotificationId) {
  return partnerId === "beans" ? "Daddy" : "Princess";
}

/** Notification copy intentionally excludes journal, chat, photo, and intimate content. */
export function buildPartnerNotification(event: PartnerNotificationEvent, actorId: PartnerNotificationId): PartnerNotification {
  const name = partnerName(actorId);

  if (event === "connection") return { title: "Together Daily", body: `${name} connected to your private room.`, path: "/" };
  if (event === "daily-log") return { title: "Together Daily", body: `${name} added a shared daily-log update.`, path: "/log" };
  if (event === "love-note") return { title: "Together Daily", body: `${name} left you a love note.`, path: "/" };
  if (event === "todo") return { title: "Together Daily", body: `${name} updated your shared to-dos.`, path: "/" };
  if (event === "steamy-update") return { title: "Together Daily", body: `${name} added a Steamy update.`, path: "/steamy" };
  return { title: "Together Daily", body: `${name} added a private update.`, path: "/steamy" };
}

export async function sendPartnerPushNotifications(tokens: string[], notification: PartnerNotification) {
  const recipients = tokens.filter((token) => /^(ExponentPushToken|ExpoPushToken)\[.+\]$/.test(token));
  if (!recipients.length) return;

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(recipients.map((to) => ({
      to,
      sound: "default",
      title: notification.title,
      body: notification.body,
      data: { path: notification.path },
      channelId: "together-daily",
      priority: "high",
    }))),
  });

  if (!response.ok) throw new Error(`Push delivery request failed with status ${response.status}.`);
}
