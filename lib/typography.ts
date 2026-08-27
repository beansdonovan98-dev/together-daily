export const FONT_OPTIONS = [
  ["handwritten", "Handwritten"],
  ["notebook", "Notebook"],
  ["casual", "Casual"],
  ["classic", "Classic"],
  ["serif", "Serif"],
  ["mono", "Mono"],
  ["comic", "Comic Sans"],
  ["typewriter", "Typewriter"],
] as const;

export type GlobalFontId = (typeof FONT_OPTIONS)[number][0];
export type FontPlatform = "ios" | "android" | "web";

const CUSTOM_FONT_FAMILIES: Record<Exclude<GlobalFontId, "classic" | "serif" | "mono">, string> = {
  handwritten: "TogetherDaily-Handwritten",
  notebook: "TogetherDaily-Notebook",
  casual: "TogetherDaily-Casual",
  comic: "TogetherDaily-Comic",
  typewriter: "TogetherDaily-Typewriter",
};

let activeGlobalFontFamilyName = "TogetherDaily-Handwritten";

export function normalizeGlobalFont(value: unknown): GlobalFontId {
  return FONT_OPTIONS.some(([id]) => id === value) ? value as GlobalFontId : "handwritten";
}

export function fontFamilyFor(fontId: GlobalFontId, platform: FontPlatform = "web"): string {
  if (fontId === "classic") return platform === "ios" ? "System" : "sans-serif";
  if (fontId === "serif") return "serif";
  if (fontId === "mono") return "monospace";
  return CUSTOM_FONT_FAMILIES[fontId];
}

export function setActiveGlobalFont(fontId: GlobalFontId, fontFamily = fontFamilyFor(fontId)) {
  activeGlobalFontFamilyName = fontFamily;
}

export function activeGlobalFontFamily(): string {
  return activeGlobalFontFamilyName;
}
