import { PASTEL_THEMES, SAVED_THEMES, type ReadyMadeTheme } from "./ready-made-themes";

export type DynamicThemeSettings = {
  accentColor?: string;
  backgroundColor?: string;
  backgroundGradient?: string[];
  animatedGradient?: boolean;
  dailyGradientRotation?: boolean;
};

const ROTATING_THEMES: readonly ReadyMadeTheme[] = [...SAVED_THEMES, ...PASTEL_THEMES];

/** Deliberately visible motion while keeping the backdrop comfortably behind journal content. */
export const DYNAMIC_GRADIENT_MOTION = {
  legDuration: 3_600,
  horizontalTravel: 108,
  verticalTravel: 52,
  baseScale: 1.08,
  peakScale: 1.2,
} as const;

function utcDayNumber(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  if (!year || !month || !day) return 0;
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

/** Picks one deterministic shared preset for a calendar date, without saving a daily mutation. */
export function dailyThemePreset(dateKey: string): ReadyMadeTheme {
  return ROTATING_THEMES[Math.abs(utcDayNumber(dateKey)) % ROTATING_THEMES.length] ?? ROTATING_THEMES[0];
}

/**
 * Applies the optional shared daily rotation while leaving typography and borders untouched.
 * Both partners calculate the same preset locally from the same date and shared setting.
 */
export function dynamicThemeForDate<T extends DynamicThemeSettings>(theme: T, dateKey: string): T {
  if (!theme.dailyGradientRotation) return theme;
  const preset = dailyThemePreset(dateKey);
  return {
    ...theme,
    accentColor: preset.accent,
    backgroundColor: preset.background,
    backgroundGradient: [...preset.gradient],
  } as T;
}

export function isAnimatedTheme(theme: DynamicThemeSettings) {
  return theme.animatedGradient === true;
}
