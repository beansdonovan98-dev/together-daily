type TypographyStyle = { fontFamily: string; fontWeight?: "900"; letterSpacing?: number };

let activeTypographyStyle: TypographyStyle = { fontFamily: "cursive" };

export function setActiveTypographyFont(fontFamily: string, fontId?: string) {
  activeTypographyStyle = fontId === "comicSans"
    ? { fontFamily, fontWeight: "900", letterSpacing: 0.45 }
    : { fontFamily };
}

export function getActiveTypographyStyle() {
  return activeTypographyStyle;
}
