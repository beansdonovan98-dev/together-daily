export const COLORS = {
  plum: "#F7F2F8",
  orchid: "#A421FF",
  rose: "#EE43B8",
  blush: "#09080B",
  lavender: "#21142B",
  sage: "#53C58D",
  gold: "#D9B45F",
  slate: "#FFFFFF",
  white: "#FFFFFF",
  border: "#302833",
  surface: "#1A161D",
  ink: "#0E0C10",
};

export const TAB_CARD_PALETTES = {
  today: { surface: "transparent", border: "#000000" },
  log: { surface: "transparent", border: "#000000" },
  habits: { surface: "transparent", border: "#000000" },
  health: { surface: "transparent", border: "#000000" },
  steamy: { surface: "transparent", border: "#000000" },
  purchase: { surface: "transparent", border: "#000000" },
  cleaning: { surface: "transparent", border: "#000000" },
  themes: { surface: "transparent", border: "#000000" },
  pastDays: { surface: "transparent", border: "#000000" },
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
