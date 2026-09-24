export type SharedThemeValues = {
  accentColor?: string;
  backgroundColor?: string;
  backgroundGradient?: string[];
  fontColor?: string;
  borderColor?: string;
  fontId?: string;
};

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function looksLikePartnerMap(value: unknown) {
  const candidate = record(value);
  return Boolean(candidate && ("beans" in candidate || "princess" in candidate));
}

/** Reads one shared Theme, migrating older per-partner data deterministically when necessary. */
export function selectSharedTheme(theme: unknown, themesByPartner: unknown): SharedThemeValues {
  const direct = record(theme);
  if (direct && !looksLikePartnerMap(theme)) return direct as SharedThemeValues;
  const legacyMap = direct ?? {};
  const explicitMap = record(themesByPartner) ?? {};
  const selected = record(legacyMap.beans) ?? record(legacyMap.princess) ?? record(explicitMap.beans) ?? record(explicitMap.princess) ?? {};
  return selected as SharedThemeValues;
}

/** Reads one shared map of page-specific style overrides, migrating older partner maps if present. */
export function selectSharedPageStyles<T extends Record<string, unknown>>(pageStyles: unknown): Record<string, T> {
  const candidate = record(pageStyles);
  if (!candidate) return {};
  if (looksLikePartnerMap(candidate)) return (record(candidate.beans) ?? record(candidate.princess) ?? {}) as Record<string, T>;
  return candidate as Record<string, T>;
}

export function removeSharedPageStyle<T extends Record<string, unknown>>(pageStyles: Record<string, T>, pageId: string) {
  const next = { ...pageStyles };
  delete next[pageId];
  return next;
}
