function rgbChannel(value: string) {
  return Number.parseInt(value, 16) / 255;
}

function linearize(channel: number) {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string) {
  const normalized = hex.replace("#", "");
  const red = linearize(rgbChannel(normalized.slice(0, 2)));
  const green = linearize(rgbChannel(normalized.slice(2, 4)));
  const blue = linearize(rgbChannel(normalized.slice(4, 6)));
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function colorContrastRatio(first: string, second: string) {
  const firstLuminance = luminance(first);
  const secondLuminance = luminance(second);
  return (Math.max(firstLuminance, secondLuminance) + 0.05) / (Math.min(firstLuminance, secondLuminance) + 0.05);
}

export function contrastGuidance(ratio: number) {
  if (ratio >= 4.5) return { label: "Strong contrast", detail: "Comfortable for regular text and small labels.", tone: "strong" as const };
  if (ratio >= 3) return { label: "Moderate contrast", detail: "Best for larger labels and buttons; use with care for smaller text.", tone: "moderate" as const };
  return { label: "Low contrast", detail: "Choose a lighter accent or a darker background for easier reading.", tone: "low" as const };
}
