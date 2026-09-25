export type PartnerNotificationEvent = "connection" | "daily-log" | "love-note" | "todo" | "private-update" | "steamy-update" | "test";
export type PartnerNotificationId = "beans" | "princess";

type PartnerNotification = { title: string; body: string; path: string };

export type PartnerPushDelivery = {
  acceptedCount: number;
  invalidTokens: string[];
};

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
  if (event === "test") return { title: "Together Daily", body: `Partner alert test from ${name}.`, path: "/themes" };
  return { title: "Together Daily", body: `${name} added a private update.`, path: "/steamy" };
}

/** Reads Expo push tickets so stale device tokens can be retired instead of silently failing forever. */
export function summarizeExpoPushTickets(tokens: string[], payload: unknown): PartnerPushDelivery {
  const entries = payload && typeof payload === "object" && Array.isArray((payload as { data?: unknown }).data)
    ? (payload as { data: unknown[] }).data
    : [];
  if (entries.length !== tokens.length) throw new Error("Push service returned an incomplete delivery result.");

  return entries.reduce<PartnerPushDelivery>((summary, entry, index) => {
    const ticket = entry && typeof entry === "object" ? entry as { status?: unknown; details?: { error?: unknown } } : {};
    if (ticket.status === "ok") {
      summary.acceptedCount += 1;
      return summary;
    }

    const error = ticket.details?.error;
    if (error === "DeviceNotRegistered" || error === "InvalidCredentials" || error === "InvalidProviderToken") {
      summary.invalidTokens.push(tokens[index]);
    }
    return summary;
  }, { acceptedCount: 0, invalidTokens: [] });
}

export async function sendPartnerPushNotifications(tokens: string[], notification: PartnerNotification): Promise<PartnerPushDelivery> {
  const recipients = tokens.filter((token) => /^(ExponentPushToken|ExpoPushToken)\[.+\]$/.test(token));
  if (!recipients.length) return { acceptedCount: 0, invalidTokens: [] };

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
  return summarizeExpoPushTickets(recipients, await response.json());
}
