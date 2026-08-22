export type DatedTimelineEntry = { createdAt: string };

export function sortTimelineEntriesOldestFirst<T extends DatedTimelineEntry>(entries: T[]): T[] {
  return [...entries].sort((first, second) => new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime());
}
