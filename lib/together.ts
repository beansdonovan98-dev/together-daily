export const COLORS = {
  plum: "#F7F2F8",
  orchid: "#A421FF",
  rose: "#EE43B8",
  blush: "#09080B",
  lavender: "#21142B",
  sage: "#53C58D",
  gold: "#D9B45F",
  slate: "#ADA3B1",
  white: "#151217",
  border: "#302833",
  surface: "#1A161D",
  ink: "#0E0C10",
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
