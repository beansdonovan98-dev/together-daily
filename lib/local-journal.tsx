import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const STORAGE_KEY = "together-daily-local-journal-v1";

type RecordType = "chat" | "loveNote" | "intimacy" | "habit" | "dateIdea";
export type LocalRecord = { id: string; authorId: number; recordType: RecordType; content: Record<string, unknown>; createdAt: string };
export type LocalMedia = { id: string; kind: "cover" | "photo"; url: string; fileName: string; mimeType: string; caption: string; createdAt: string; dailyDate: string };
type JournalState = { days: Record<string, Record<string, any>>; records: LocalRecord[]; media: LocalMedia[] };

const QUESTIONS = [
  "What was a small moment today where you felt deeply loved or appreciated?",
  "What habit or quality in me has positively influenced your own life recently?",
  "How can I support you or lighten your mental load over the next 48 hours?",
  "What is your favorite quiet, unscripted memory of us from this past year?",
  "Describe our dream Sunday morning five years from now in three vivid sentences.",
  "What new experience would you love for us to try together before the year ends?",
  "What did you honestly think in the first ten minutes after we first met?",
];

function blankDay(date: string): Record<string, any> {
  const [year, month, day] = date.split("-").map(Number);
  const questionIndex = Math.abs(Math.floor(Date.UTC(year, month - 1, day) / 86_400_000)) % QUESTIONS.length;
  return {
    date,
    title: "Daily Check-in",
    rating: null,
    weather: null,
    tags: [],
    pinned: false,
    coverPhoto: null,
    sharedHighlight: "",
    questionId: `daily-${questionIndex + 1}`,
    questionText: QUESTIONS[questionIndex],
    todos: [],
    meals: { breakfast: "", breakfastDone: false, lunch: "", lunchDone: false, dinner: "", dinnerDone: false, prepGrocery: "", prepGroceryDone: false },
    water: { slots: [], glassesLogged: 0, dailyGoalGlasses: 8 },
    notesList: [],
    timelineEvents: [],
    checkIns: {},
    photos: [],
    sharedNotes: "",
  };
}

type JournalContextValue = {
  ready: boolean;
  getDay: (date: string) => Record<string, any>;
  updateDay: (date: string, patch: Record<string, unknown>) => void;
  allDays: Record<string, any>[];
  records: LocalRecord[];
  addRecord: (recordType: RecordType, content: Record<string, unknown>) => void;
  media: LocalMedia[];
  addMedia: (media: Omit<LocalMedia, "id" | "createdAt">) => LocalMedia;
};

const JournalContext = createContext<JournalContextValue | null>(null);

export function LocalJournalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<JournalState>({ days: {}, records: [], media: [] });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const parsed = JSON.parse(raw) as JournalState;
        if (parsed && parsed.days && parsed.records && parsed.media) setState(parsed);
      })
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, []);

  const persist = (next: JournalState) => {
    setState(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => undefined);
  };

  const value = useMemo<JournalContextValue>(() => ({
    ready,
    getDay: (date) => state.days[date] ?? blankDay(date),
    updateDay: (date, patch) => {
      const current = state.days[date] ?? blankDay(date);
      persist({ ...state, days: { ...state.days, [date]: { ...current, ...patch, date } } });
    },
    allDays: Object.values(state.days).sort((a, b) => String(b.date).localeCompare(String(a.date))),
    records: state.records,
    addRecord: (recordType, content) => {
      const record: LocalRecord = { id: `record-${Date.now()}-${Math.random().toString(16).slice(2)}`, authorId: 1, recordType, content, createdAt: new Date().toISOString() };
      persist({ ...state, records: [...state.records, record] });
    },
    media: state.media,
    addMedia: (input) => {
      const media: LocalMedia = { ...input, id: `media-${Date.now()}-${Math.random().toString(16).slice(2)}`, createdAt: new Date().toISOString() };
      persist({ ...state, media: [media, ...state.media] });
      return media;
    },
  }), [ready, state]);

  return <JournalContext.Provider value={value}>{children}</JournalContext.Provider>;
}

export function useLocalJournal() {
  const value = useContext(JournalContext);
  if (!value) throw new Error("useLocalJournal must be used inside LocalJournalProvider");
  return value;
}
