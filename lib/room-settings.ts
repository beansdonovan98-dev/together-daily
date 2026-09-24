export const ROOM_PAGE_IDS = [
  "today",
  "log",
  "puzzles",
  "habits",
  "health",
  "steamy",
  "purchase",
  "cleaning",
  "calendar",
  "pastDays",
] as const;

export type RoomPageId = (typeof ROOM_PAGE_IDS)[number];
export type RoomMode = "couple" | "friends";
export type DailyRelationshipSection = "relationshipTracker" | "loveNotes";

export type RoomSettings = {
  mode: RoomMode;
  visibleTabs: Record<RoomPageId, boolean>;
  dailyRelationshipSections: Record<DailyRelationshipSection, boolean>;
};

const DEFAULT_VISIBLE_TABS: Record<RoomPageId, boolean> = {
  today: true,
  log: true,
  puzzles: true,
  habits: true,
  health: true,
  steamy: true,
  purchase: true,
  cleaning: true,
  calendar: true,
  pastDays: true,
};

const DEFAULT_DAILY_RELATIONSHIP_SECTIONS: Record<DailyRelationshipSection, boolean> = {
  relationshipTracker: true,
  loveNotes: true,
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

export function defaultRoomSettings(mode: RoomMode = "couple"): RoomSettings {
  if (mode === "friends") {
    return {
      mode,
      visibleTabs: { ...DEFAULT_VISIBLE_TABS, steamy: false },
      dailyRelationshipSections: {
        relationshipTracker: false,
        loveNotes: false,
      },
    };
  }
  return {
    mode,
    visibleTabs: { ...DEFAULT_VISIBLE_TABS },
    dailyRelationshipSections: { ...DEFAULT_DAILY_RELATIONSHIP_SECTIONS },
  };
}

/** Converts older room state into a complete, safe shared-room configuration. */
export function normalizeRoomSettings(value: unknown): RoomSettings {
  const raw = record(value);
  const mode: RoomMode = raw.mode === "friends" ? "friends" : "couple";
  const defaults = defaultRoomSettings(mode);
  const rawTabs = record(raw.visibleTabs);
  const rawDaily = record(raw.dailyRelationshipSections);

  return {
    mode,
    visibleTabs: Object.fromEntries(ROOM_PAGE_IDS.map((id) => [
      id,
      typeof rawTabs[id] === "boolean" ? rawTabs[id] : defaults.visibleTabs[id],
    ])) as Record<RoomPageId, boolean>,
    dailyRelationshipSections: {
      relationshipTracker: typeof rawDaily.relationshipTracker === "boolean"
        ? rawDaily.relationshipTracker
        : defaults.dailyRelationshipSections.relationshipTracker,
      loveNotes: typeof rawDaily.loveNotes === "boolean"
        ? rawDaily.loveNotes
        : defaults.dailyRelationshipSections.loveNotes,
    },
  };
}

export function setRoomMode(settings: RoomSettings, mode: RoomMode): RoomSettings {
  const defaults = defaultRoomSettings(mode);
  if (mode === settings.mode) return settings;
  return {
    ...settings,
    mode,
    visibleTabs: { ...settings.visibleTabs, steamy: defaults.visibleTabs.steamy },
    dailyRelationshipSections: { ...defaults.dailyRelationshipSections },
  };
}

export function setRoomPageVisibility(settings: RoomSettings, pageId: RoomPageId, visible: boolean): RoomSettings {
  return {
    ...settings,
    visibleTabs: { ...settings.visibleTabs, [pageId]: visible },
  };
}

export function setDailyRelationshipSection(
  settings: RoomSettings,
  section: DailyRelationshipSection,
  visible: boolean,
): RoomSettings {
  return {
    ...settings,
    dailyRelationshipSections: { ...settings.dailyRelationshipSections, [section]: visible },
  };
}

/** Themes always remains visible so hidden pages can be restored. */
export function shouldShowRoomPage(settings: RoomSettings, pageId: string): boolean {
  if (pageId === "themes") return true;
  return !ROOM_PAGE_IDS.includes(pageId as RoomPageId) || settings.visibleTabs[pageId as RoomPageId] !== false;
}

export function shouldShowDailyRelationshipSection(
  settings: RoomSettings,
  section: DailyRelationshipSection,
): boolean {
  return settings.dailyRelationshipSections[section] !== false;
}
