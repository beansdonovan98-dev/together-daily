type SharedRoomState = Record<string, unknown>;

function revision(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

/**
 * Protects the shared Theme and page styles from a stale full-room update.
 * All other journal fields keep their normal last-write behavior.
 */
export function mergeSharedThemeRevision(existing: SharedRoomState, incoming: SharedRoomState): SharedRoomState {
  const existingRevision = revision(existing.themeUpdatedAt);
  const incomingRevision = revision(incoming.themeUpdatedAt);
  if (incomingRevision >= existingRevision) return { ...incoming, themeUpdatedAt: incomingRevision };

  return {
    ...incoming,
    theme: existing.theme,
    themesByPartner: existing.themesByPartner,
    pageStyles: existing.pageStyles,
    themeUpdatedAt: existingRevision,
  };
}
