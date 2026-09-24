import { localDateKey } from "./together";

export type CalendarCell = { date: string; day: number; isHeartDay: boolean } | null;

export function monthCells(year: number, monthIndex: number): CalendarCell[] {
  const firstWeekday = new Date(year, monthIndex, 1, 12).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0, 12).getDate();
  const cells: CalendarCell[] = Array.from({ length: firstWeekday }, () => null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      date: localDateKey(new Date(year, monthIndex, day, 12)),
      day,
      isHeartDay: day === 9,
    });
  }

  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function shiftMonth(year: number, monthIndex: number, delta: number) {
  const cursor = new Date(year, monthIndex + delta, 1, 12);
  return { year: cursor.getFullYear(), monthIndex: cursor.getMonth() };
}

export function monthLabel(year: number, monthIndex: number) {
  return new Date(year, monthIndex, 1, 12).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
