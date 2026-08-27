export type ThemeGradient = readonly [string, string, ...string[]];

const HEX = /^#[0-9A-Fa-f]{6}$/;

export function isThemeGradient(value: unknown): value is ThemeGradient {
  return Array.isArray(value) && value.length >= 2 && value.length <= 4 && value.every((color) => typeof color === "string" && HEX.test(color));
}

export function themeGradientColors(value: unknown): ThemeGradient | null {
  return isThemeGradient(value) ? value : null;
}

/**
 * Resolves the visible page backdrop. A selected shared gradient always takes
 * precedence over older page-level solid-color preferences so that a saved
 * gradient cannot be hidden by legacy TestFlight state.
 */
export function resolveThemeBackdrop(
  theme: { backgroundGradient?: unknown; backgroundColor?: string },
  pageStyle: { backgroundColor?: string } | undefined,
  fallbackColor: string,
): { backgroundColor: string; gradient: ThemeGradient | null } {
  const gradient = themeGradientColors(theme.backgroundGradient);
  if (gradient) return { backgroundColor: gradient[0], gradient };

  return {
    backgroundColor: pageStyle?.backgroundColor ?? theme.backgroundColor ?? fallbackColor,
    gradient: null,
  };
}
