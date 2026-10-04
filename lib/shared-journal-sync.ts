type JsonRecord = Record<string, unknown>;

/**
 * A poll request may have started just before a local edit reached the server.
 * Keeping the local snapshot authoritative for this short period prevents that
 * older response from replacing an active TextInput value.
 */
export const REMOTE_SNAPSHOT_SETTLE_MS = 4_500;

export function shouldApplySharedRoomSnapshot(input: {
  localSerialized: string;
  incomingSerialized: string;
  hasPendingLocalWrite: boolean;
  lastLocalWriteAt: number;
  now?: number;
}) {
  if (input.localSerialized === input.incomingSerialized || input.hasPendingLocalWrite) return false;
  return (input.now ?? Date.now()) - input.lastLocalWriteAt >= REMOTE_SNAPSHOT_SETTLE_MS;
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
}

function usageTotal(value: unknown): number {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount) : 0;
}

/**
 * Incorporates only server-confirmed foreground-time totals into the local
 * draft snapshot. This lets the app-time meter refresh without replacing text
 * that someone is still typing elsewhere in the shared journal.
 */
export function mergeForegroundUsageIntoJournal<T extends JsonRecord>(localState: T, serverState: T): T {
  const localDays = asRecord(localState.days);
  const serverDays = asRecord(serverState.days);
  const nextDays: JsonRecord = { ...localDays };

  for (const [date, serverDayValue] of Object.entries(serverDays)) {
    const serverDay = asRecord(serverDayValue);
    const serverUsage = asRecord(serverDay.appUsage);
    if (!Object.keys(serverUsage).length) continue;

    const localDay = asRecord(nextDays[date]);
    const localUsage = asRecord(localDay.appUsage);
    nextDays[date] = {
      ...localDay,
      date: typeof localDay.date === "string" ? localDay.date : date,
      appUsage: {
        ...localUsage,
        beans: Math.max(usageTotal(localUsage.beans), usageTotal(serverUsage.beans)),
        princess: Math.max(usageTotal(localUsage.princess), usageTotal(serverUsage.princess)),
      },
    };
  }

  return { ...localState, days: nextDays } as T;
}
