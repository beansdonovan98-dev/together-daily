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

export const FONT_COLOR_OPTIONS = [
  ["#FFFFFF", "White"],
  ["#000000", "Black"],
  ["#FF8FC6", "Candy pink"],
  ["#FF6F91", "Coral rose"],
  ["#8FE8FF", "Aqua blue"],
  ["#A8FFEB", "Mint"],
  ["#FFE16B", "Sunshine gold"],
  ["#FFB86C", "Apricot"],
  ["#D7A7FF", "Violet"],
  ["#B7CEFF", "Periwinkle"],
  ["#B7ED4B", "Lime"],
  ["#F4EFFF", "Lilac white"],
  ["#FFD6EA", "Blush"],
  ["#FFB8DF", "Bubblegum"],
  ["#C9B6FF", "Soft lavender"],
  ["#BEF3FF", "Ice blue"],
  ["#70E8FF", "Electric sky"],
  ["#B9FFE0", "Seafoam"],
  ["#F8FFA8", "Lemon cream"],
  ["#FFD6A5", "Peach cream"],
  ["#FFB1BC", "Strawberry"],
  ["#D0FF8A", "Spring green"],
  ["#9E7BFF", "Bright purple"],
] as const;

export const BORDER_COLOR_OPTIONS = [
  ["#000000", "Black"],
  ["#FFFFFF", "White"],
  ["#6A4E91", "Deep purple"],
  ["#E454A7", "Berry pink"],
  ["#D9B65D", "Gold"],
] as const;

const CUSTOM_FONT_FAMILIES: Record<Exclude<GlobalFontId, "classic" | "serif" | "mono">, string> = {
  handwritten: "TogetherDaily-Handwritten",
  notebook: "TogetherDaily-Notebook",
  casual: "TogetherDaily-Casual",
  comic: "TogetherDaily-Comic",
  typewriter: "TogetherDaily-Typewriter",
};

let activeGlobalFontFamilyName = "TogetherDaily-Handwritten";
let activeGlobalTextColorValue = "#FFFFFF";

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

export function normalizeGlobalTextColor(value: unknown): string {
  return FONT_COLOR_OPTIONS.some(([color]) => color === value) ? String(value) : "#FFFFFF";
}

export function setActiveGlobalTextColor(color: string) {
  activeGlobalTextColorValue = normalizeGlobalTextColor(color);
}

export function activeGlobalTextColor(): string {
  return activeGlobalTextColorValue;
}

export function normalizeGlobalBorderColor(value: unknown): string {
  return BORDER_COLOR_OPTIONS.some(([color]) => color === value) ? String(value) : "#000000";
}
