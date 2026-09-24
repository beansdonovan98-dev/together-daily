export type ResettablePageId = "today" | "log" | "habits" | "health" | "steamy" | "cleaning" | "purchase" | "calendar";

export type PageContentResetState = {
  days: Record<string, Record<string, unknown>>;
  records: Array<{ recordType?: string; dailyDate?: string; createdAt?: string; [key: string]: unknown }>;
  media: Array<{ kind?: string; dailyDate?: string; [key: string]: unknown }>;
  purchaseItems?: unknown[];
  calendarEntries?: unknown[];
  calendarBackground?: unknown;
  [key: string]: unknown;
};

export const RESETTABLE_PAGE_IDS: ResettablePageId[] = [
  "today",
  "log",
  "habits",
  "health",
  "steamy",
  "cleaning",
  "purchase",
  "calendar",
];

export const PAGE_CLEAR_LABELS: Record<ResettablePageId, string> = {
  today: "Today",
  log: "Daily Log",
  habits: "Good Habits",
  health: "Health",
  steamy: "Steamy for today",
  cleaning: "Cleaning lists",
  purchase: "Purchase list",
  calendar: "Calendar",
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

/**
 * Clears only content added to one page in the currently open room. It deliberately
 * leaves Theme, page visibility, room codes, partner profiles, saved type/template
 * definitions, and all unrelated page data untouched.
 */
export function clearPageContent(
  state: PageContentResetState,
  pageId: ResettablePageId,
  date: string,
  weekStart: string,
  emptyDay: (date: string) => Record<string, unknown>,
): PageContentResetState {
  const days = state.days ?? {};
  const currentDay = record(days[date]);

  if (pageId === "today") {
    return {
      ...state,
      days: {
        ...days,
        [date]: {
          ...currentDay,
          date,
          coverPhoto: null,
          coverPhotoTwo: null,
          loveNotes: {},
          sharedHighlight: "",
          checkIns: {},
          photos: [],
        },
      },
      media: state.media.filter((item) => !(item.kind === "cover" && item.dailyDate === date)),
    };
  }

  if (pageId === "log") {
    return {
      ...state,
      days: {
        ...days,
        [date]: { ...currentDay, date, timelineEvents: [], todos: [], notesList: [], sharedNotes: "" },
      },
    };
  }

  if (pageId === "habits") {
    return {
      ...state,
      days: {
        ...days,
        [date]: { ...currentDay, date, habits: { list: [], checks: {} }, affection: {}, affectionCelebrations: {} },
      },
    };
  }

  if (pageId === "health") {
    return {
      ...state,
      days: {
        ...days,
        [date]: {
          ...currentDay,
          date,
          health: {},
          meals: { breakfast: "", breakfastDone: false, lunch: "", lunchDone: false, dinner: "", dinnerDone: false, prepGrocery: "", prepGroceryDone: false },
          mealMeta: {},
          water: { slots: [], glassesLogged: 0, dailyGoalGlasses: 8, resetDate: date, contributions: {} },
        },
      },
    };
  }

  if (pageId === "steamy") {
    return {
      ...state,
      records: state.records.filter((entry) => !(entry.recordType === "cumLog" && entry.dailyDate === date)),
      media: state.media.filter((item) => !(item.kind === "private" && item.dailyDate === date)),
    };
  }

  if (pageId === "cleaning") {
    const weekDay = record(days[weekStart]);
    return {
      ...state,
      days: {
        ...days,
        [date]: { ...currentDay, date, dailyCleaning: { tasks: [], date } },
        [weekStart]: { ...weekDay, date: weekStart, cleaning: { tasks: [], weekStart } },
      },
    };
  }

  if (pageId === "purchase") return { ...state, purchaseItems: [] };
  if (pageId === "calendar") return { ...state, calendarEntries: [], calendarBackground: undefined };

  return state;
}
