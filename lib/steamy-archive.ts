export function filterSteamyEntriesForDate<T extends { dailyDate?: string; createdAt?: string }>(entries: T[], date: string): T[] {
  return entries.filter((entry) => {
    const dailyDate = typeof entry.dailyDate === "string" && entry.dailyDate ? entry.dailyDate : (typeof entry.createdAt === "string" ? entry.createdAt.slice(0, 10) : null);
    return dailyDate === date;
  });
}
