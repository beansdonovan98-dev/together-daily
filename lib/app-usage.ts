export type AppUsagePartnerId = "beans" | "princess";

export type AppUsageTotals = Partial<Record<AppUsagePartnerId, number>>;
export type AppUsageByDate = Record<string, AppUsageTotals>;
export type AppUsageEntry = { date: string; milliseconds: number };

function localDateKeyAt(timestamp: number) {
  const value = new Date(timestamp);
  const offset = value.getTimezoneOffset();
  return new Date(value.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

/**
 * Splits one active foreground session at local midnight so each calendar day
 * owns only the time that happened on that date.
 */
export function splitForegroundSession(startedAt: number, endedAt: number): AppUsageEntry[] {
  if (!Number.isFinite(startedAt) || !Number.isFinite(endedAt) || endedAt <= startedAt) return [];

  const entries: AppUsageEntry[] = [];
  let cursor = startedAt;

  while (cursor < endedAt) {
    const cursorDate = new Date(cursor);
    const nextMidnight = new Date(cursorDate);
    nextMidnight.setHours(24, 0, 0, 0);
    const segmentEnd = Math.min(endedAt, nextMidnight.getTime());
    const milliseconds = Math.max(0, segmentEnd - cursor);

    if (milliseconds) entries.push({ date: localDateKeyAt(cursor), milliseconds });
    cursor = segmentEnd;
  }

  return entries;
}

/** Adds measured foreground time to the current shared usage map. */
export function addForegroundUsage(
  usage: AppUsageByDate | undefined,
  partnerId: AppUsagePartnerId,
  entries: AppUsageEntry[],
): AppUsageByDate {
  const next: AppUsageByDate = { ...(usage ?? {}) };

  for (const entry of entries) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.date) || !Number.isFinite(entry.milliseconds) || entry.milliseconds <= 0) continue;
    const existing = next[entry.date] ?? {};
    next[entry.date] = {
      ...existing,
      [partnerId]: Math.max(0, Math.round(Number(existing[partnerId] ?? 0))) + Math.round(entry.milliseconds),
    };
  }

  return next;
}

/** Keeps the newest known cumulative total from a device or the shared room. */
export function mergeUsageTotals(base: AppUsageByDate | undefined, incoming: AppUsageByDate | undefined): AppUsageByDate {
  const next: AppUsageByDate = { ...(base ?? {}) };

  for (const [date, incomingTotals] of Object.entries(incoming ?? {})) {
    const current = next[date] ?? {};
    next[date] = {
      beans: Math.max(Number(current.beans ?? 0), Number(incomingTotals.beans ?? 0)),
      princess: Math.max(Number(current.princess ?? 0), Number(incomingTotals.princess ?? 0)),
    };
  }

  return next;
}

export function activityMinutes(milliseconds: number | undefined) {
  return Math.max(0, Math.floor(Number(milliseconds ?? 0) / 60_000));
}

export function formatActivityMinutes(milliseconds: number | undefined) {
  const minutes = activityMinutes(milliseconds);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return hours ? `${hours}h ${remainingMinutes}m` : `${minutes} min`;
}
