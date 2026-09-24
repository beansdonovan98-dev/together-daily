type SharedRoomState = Record<string, unknown>;

function revision(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

/**
 * Protects the shared Theme from a stale full-room update.
 * All other journal fields keep their normal last-write behavior.
 */
export function mergeSharedThemeRevision(existing: SharedRoomState, incoming: SharedRoomState): SharedRoomState {
  const existingRevision = revision(existing.themeUpdatedAt);
  const incomingRevision = revision(incoming.themeUpdatedAt);
  if (incomingRevision >= existingRevision) return { ...incoming, pageStyles: undefined, themeUpdatedAt: incomingRevision };

  return {
    ...incoming,
    theme: existing.theme,
    themesByPartner: existing.themesByPartner,
    pageStyles: undefined,
    themeUpdatedAt: existingRevision,
  };
}
