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

export const TAB_CARD_PALETTES = {
  today: { surface: "#1C1425", border: "#553D63" },
  log: { surface: "#211529", border: "#62426F" },
  habits: { surface: "#17251D", border: "#3F6A50" },
  health: { surface: "#101F2D", border: "#365F82" },
  steamy: { surface: "#210E18", border: "#6E2D48" },
  purchase: { surface: "#241B10", border: "#6B5530" },
  cleaning: { surface: "#14231D", border: "#426555" },
  themes: { surface: "#1B152B", border: "#5B4780" },
  pastDays: { surface: "#21172A", border: "#62456D" },
} as const;

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
