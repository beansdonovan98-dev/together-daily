export type PageStyleMap = Record<string, Record<string, unknown>>;

/** Removes one page's personal overrides without changing other page styles. */
export function removePersonalPageStyle(
  pageStyles: PageStyleMap | undefined,
  memberId: "beans" | "princess",
  pageId: string,
): PageStyleMap {
  const existing = pageStyles ?? {};
  const memberStyles = { ...(existing[memberId] ?? {}) };
  delete memberStyles[pageId];
  return { ...existing, [memberId]: memberStyles };
}
