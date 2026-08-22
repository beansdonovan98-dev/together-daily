export function timestampForEditedTime(dayKey: string, value: string): string | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;
  let hour = Number(match[1]); const minute = Number(match[2]); const period = match[3]?.toUpperCase();
  if (minute > 59 || hour > (period ? 12 : 23) || hour < 0 || (period && hour === 0)) return null;
  if (period === "AM" && hour === 12) hour = 0;
  if (period === "PM" && hour !== 12) hour += 12;
  const [year, month, day] = dayKey.split("-").map(Number);
  return new Date(year, month - 1, day, hour, minute).toISOString();
}
