import { dateTimeLabel, localDateKey } from "./together";

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

type SteamyRecord = {
  createdAt: string;
  content: Record<string, unknown>;
  recordType: string;
};

type PrivateMedia = {
  kind: string;
  dailyDate?: string;
  createdAt: string;
};

export function steamyRecordDateKey(record: SteamyRecord) {
  const savedDate = typeof record.content.date === "string" ? record.content.date : "";
  return DATE_KEY.test(savedDate) ? savedDate : localDateKey(new Date(record.createdAt));
}

export function privateMediaDateKey(item: PrivateMedia) {
  return item.dailyDate && DATE_KEY.test(item.dailyDate)
    ? item.dailyDate
    : localDateKey(new Date(item.createdAt));
}

export function intimateEntriesForDate<T extends SteamyRecord>(records: T[], date: string) {
  return records
    .filter((record) => record.recordType === "cumLog" && steamyRecordDateKey(record) === date)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function privateMediaForDate<T extends PrivateMedia>(media: T[], date: string) {
  return media.filter((item) => item.kind === "private" && privateMediaDateKey(item) === date);
}

export function intimateEntryDateTimeLabel(createdAt: string, date: string) {
  const dateLabel = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
  return `${dateLabel} · ${dateTimeLabel(createdAt)}`;
}
