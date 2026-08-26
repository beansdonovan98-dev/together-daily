export type ThemeGradient = readonly [string, string, ...string[]];

const HEX = /^#[0-9A-Fa-f]{6}$/;

export function isThemeGradient(value: unknown): value is ThemeGradient {
  return Array.isArray(value) && value.length >= 2 && value.length <= 4 && value.every((color) => typeof color === "string" && HEX.test(color));
}

export function themeGradientColors(value: unknown): ThemeGradient | null {
  return isThemeGradient(value) ? value : null;
}
