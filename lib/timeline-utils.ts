export type DatedTimelineEntry = { createdAt: string };

export function sortTimelineEntriesOldestFirst<T extends DatedTimelineEntry>(entries: T[]): T[] {
  return [...entries].sort((first, second) => {
    const firstTime = Date.parse(first.createdAt);
    const secondTime = Date.parse(second.createdAt);
    return (Number.isFinite(firstTime) ? firstTime : Number.MAX_SAFE_INTEGER) - (Number.isFinite(secondTime) ? secondTime : Number.MAX_SAFE_INTEGER);
  });
}
