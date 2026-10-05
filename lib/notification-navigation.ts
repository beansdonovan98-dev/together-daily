export const PARTNER_NOTIFICATION_PATHS = ["/", "/log", "/steamy", "/themes"] as const;

export type PartnerNotificationPath = (typeof PARTNER_NOTIFICATION_PATHS)[number];

/** Accept only routes that Together Daily actually owns before a notification opens one. */
export function partnerNotificationPath(value: unknown): PartnerNotificationPath | null {
  if (typeof value !== "string") return null;
  return (PARTNER_NOTIFICATION_PATHS as readonly string[]).includes(value)
    ? value as PartnerNotificationPath
    : null;
}

export function partnerNotificationPathFromData(value: unknown): PartnerNotificationPath | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return partnerNotificationPath((value as Record<string, unknown>).path);
}
