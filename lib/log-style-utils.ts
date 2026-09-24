const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

type SavedStyle = {
  id: string;
  label: string;
  emoji: string;
  color: string;
};

type JournalDay = Record<string, unknown> & {
  timelineEvents?: unknown[];
};

type TimelineEvent = Record<string, unknown> & {
  type?: unknown;
  emoji?: unknown;
  color?: unknown;
};

export function recolorSavedLogStyle<T extends SavedStyle>(
  styles: T[],
  days: Record<string, JournalDay>,
  id: string,
  requestedColor: string,
) {
  const color = requestedColor.trim().toUpperCase();
  const target = styles.find((style) => style.id === id);
  if (!target || !HEX_COLOR.test(color) || target.color.toUpperCase() === color) {
    return { styles, days, changed: false };
  }

  const nextStyles = styles.map((style) => style.id === id ? { ...style, color } : style);
  const nextDays = Object.fromEntries(
    Object.entries(days).map(([date, day]) => {
      if (!Array.isArray(day.timelineEvents)) return [date, day];
      const timelineEvents = (day.timelineEvents as TimelineEvent[]).map((event) => {
        const matchesSavedType = event.type === target.label
          && event.emoji === target.emoji
          && event.color === target.color;
        return matchesSavedType ? { ...event, color } : event;
      });
      return [date, { ...day, timelineEvents }];
    }),
  );

  return { styles: nextStyles, days: nextDays, changed: true };
}
