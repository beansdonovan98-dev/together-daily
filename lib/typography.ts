type TypographyStyle = { fontFamily: string; fontWeight?: "900"; letterSpacing?: number };
type FontId = "handwritten" | "classic" | "serif" | "comicSans" | "typewriter";

let activeTypographyStyle: TypographyStyle = { fontFamily: "cursive" };
let previewFontId: FontId | null = null;

export function typographyStyleFor(fontId: FontId): TypographyStyle {
  if (fontId === "comicSans") return { fontFamily: "'Comic Sans MS', 'Comic Sans', sans-serif", fontWeight: "900", letterSpacing: 0.45 };
  if (fontId === "typewriter") return { fontFamily: "'Courier New', 'American Typewriter', monospace" };
  if (fontId === "classic") return { fontFamily: "system-ui, sans-serif" };
  if (fontId === "serif") return { fontFamily: "Georgia, serif" };
  return { fontFamily: "cursive" };
}

export function setActiveTypographyFont(fontFamily: string, fontId?: string) {
  const activeId = fontId as FontId | undefined;
  activeTypographyStyle = activeId ? typographyStyleFor(activeId) : { fontFamily };
}

export function previewTypographyFont(fontId: FontId) {
  previewFontId = fontId;
}

export function clearPreviewTypographyFont() {
  previewFontId = null;
}

export function getActiveTypographyStyle() {
  return previewFontId ? typographyStyleFor(previewFontId) : activeTypographyStyle;
}
