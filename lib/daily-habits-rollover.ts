function latestPreviousDay(days: Record<string, Record<string, unknown>>, date: string) {
  const previousDate = Object.keys(days).filter((existingDate) => existingDate < date).sort().at(-1);
  return previousDate ? days[previousDate] : undefined;
}

/** Copies the newest saved Good Habits list into a fresh day without copying either partner's checks. */
export function carryDailyHabitList(days: Record<string, Record<string, unknown>>, date: string): string[] {
  const previousDay = latestPreviousDay(days, date);
  const habits = previousDay && typeof previousDay.habits === "object" && previousDay.habits !== null
    ? previousDay.habits as Record<string, unknown>
    : {};
  const list = Array.isArray(habits.list) ? habits.list : [];

  return list
    .filter((habit): habit is string => typeof habit === "string" && habit.trim().length > 0)
    .map((habit) => habit.trim());
}
