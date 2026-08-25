import { TAB_CARD_PALETTES } from "./together";

export type TabCardId = keyof typeof TAB_CARD_PALETTES;
export type TabCardStyleMap = Record<string, { cardBackgroundColor?: string } | undefined>;

export const TAB_CARD_IDS = Object.keys(TAB_CARD_PALETTES) as TabCardId[];
export const TAB_CARD_HEX = /^#[0-9A-Fa-f]{6}$/;

export function resolveTabCardColor(tabId: TabCardId, color?: string) {
  return color && TAB_CARD_HEX.test(color)
    ? color.toUpperCase()
    : TAB_CARD_PALETTES[tabId].surface;
}

export function tabCardColorFromStyles(pageStyles: TabCardStyleMap, tabId: TabCardId) {
  return resolveTabCardColor(tabId, pageStyles[tabId]?.cardBackgroundColor);
}

export function tabCardColorDrafts(pageStyles: TabCardStyleMap) {
  return Object.fromEntries(
    TAB_CARD_IDS.map((tabId) => [tabId, tabCardColorFromStyles(pageStyles, tabId)]),
  ) as Record<TabCardId, string>;
}

export function shouldApplyTabCardColor(style: Record<string, unknown>) {
  const borderRadius = Number(style.borderRadius ?? 0);
  const padding = Math.max(
    Number(style.padding ?? 0),
    Number(style.paddingHorizontal ?? 0),
    Number(style.paddingVertical ?? 0),
  );
  const width = typeof style.width === "number" ? style.width : undefined;
  const height = typeof style.height === "number" ? style.height : undefined;
  const compactControl =
    width !== undefined && height !== undefined && width <= 56 && height <= 56;

  return Boolean(style.backgroundColor) &&
    borderRadius >= 8 &&
    (padding > 0 || style.overflow === "hidden") &&
    style.position !== "absolute" &&
    !compactControl;
}
