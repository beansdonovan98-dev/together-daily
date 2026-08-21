export const COLORS = {
  plum: "#281C32",
  orchid: "#8D5BA6",
  rose: "#D56B88",
  blush: "#FDF3F6",
  lavender: "#F1EAF7",
  sage: "#6F9277",
  gold: "#D69A3E",
  slate: "#665F6B",
  white: "#FFFFFF",
  border: "#E8DEE9",
};

export function localDateKey(date = new Date()) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export function prettyDate(dateKey: string) {
  return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date(`${dateKey}T12:00:00`));
}

export function dateTimeLabel(value: string | Date) {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

export function asObject(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, any>) : {};
}
