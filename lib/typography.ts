export const PURE_WHITE = "#FFFFFF";

let activeTogetherFontFamily = "cursive";

export function setTogetherFontFamily(fontFamily: string) {
  activeTogetherFontFamily = fontFamily;
}

export function getTogetherFontFamily() {
  return activeTogetherFontFamily;
}
