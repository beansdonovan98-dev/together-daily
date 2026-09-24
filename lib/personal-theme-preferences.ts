export type ThemePartnerId = "beans" | "princess";

export type PersonalThemePreferences = {
  accentColor?: string;
  backgroundColor?: string;
  backgroundGradient?: string[];
  fontColor?: string;
  borderColor?: string;
  fontId?: string;
};

export type PersonalThemeMap = Partial<
  Record<ThemePartnerId, PersonalThemePreferences>
>;

type ThemeSource = PersonalThemePreferences | PersonalThemeMap | undefined;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isThemePartnerId(value: string): value is ThemePartnerId {
  return value === "beans" || value === "princess";
}

function isThemeMap(value: ThemeSource): value is PersonalThemeMap {
  return isRecord(value) && Object.keys(value).some(isThemePartnerId);
}

function legacyTheme(value: ThemeSource): PersonalThemePreferences {
  return isThemeMap(value) ? {} : (value ?? {});
}

function themeMap(value: ThemeSource): PersonalThemeMap {
  return isThemeMap(value) ? value : {};
}

/**
 * Reads a partner's display preferences. A one-time shared legacy preference
 * remains the fallback until that partner chooses their own theme.
 */
export function selectPersonalTheme(
  legacyOrMap: ThemeSource,
  explicitMap: ThemeSource,
  partnerId: ThemePartnerId | null,
): PersonalThemePreferences {
  const legacy = legacyTheme(legacyOrMap);
  const inheritedMap = themeMap(legacyOrMap);
  const storedMap = themeMap(explicitMap);
  if (!partnerId) return legacy;

  return {
    ...legacy,
    ...(inheritedMap[partnerId] ?? {}),
    ...(storedMap[partnerId] ?? {}),
  };
}

/**
 * Applies a patch only to the active partner while preserving the other
 * partner's independently chosen theme.
 */
export function updatePersonalTheme(
  legacyOrMap: ThemeSource,
  explicitMap: ThemeSource,
  partnerId: ThemePartnerId,
  patch: PersonalThemePreferences,
): PersonalThemeMap {
  const legacy = legacyTheme(legacyOrMap);
  const inheritedMap = themeMap(legacyOrMap);
  const storedMap = themeMap(explicitMap);
  const current = {
    ...legacy,
    ...(inheritedMap[partnerId] ?? {}),
    ...(storedMap[partnerId] ?? {}),
  };

  return {
    ...inheritedMap,
    ...storedMap,
    [partnerId]: { ...current, ...patch },
  };
}

/**
 * Combines an update received by the server without allowing one partner's
 * stale device state to overwrite the other partner's appearance.
 */
export function mergePersonalThemeUpdate(
  existing: ThemeSource,
  incoming: ThemeSource,
  actorId: ThemePartnerId | undefined,
): PersonalThemeMap | undefined {
  const existingMap = themeMap(existing);
  const incomingMap = themeMap(incoming);
  if (!actorId || !incomingMap[actorId]) {
    return Object.keys(incomingMap).length ? incomingMap : undefined;
  }

  return {
    ...existingMap,
    [actorId]: incomingMap[actorId],
  };
}
