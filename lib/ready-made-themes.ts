export type ReadyMadeTheme = {
  name: string;
  accent: string;
  background: string;
  gradient: readonly [string, string, ...string[]];
};

export const SAVED_THEMES: readonly ReadyMadeTheme[] = [
  { name: "Electric Together", accent: "#A421FF", background: "#22002E", gradient: ["#22002E", "#6B0CAC", "#163F90"] },
  { name: "Hot Pink Night", accent: "#FF2D95", background: "#4D082A", gradient: ["#4D082A", "#B10A5C", "#7B166C"] },
  { name: "Ultraviolet", accent: "#C75CFF", background: "#310A3D", gradient: ["#310A3D", "#7622A8", "#243DB9"] },
  { name: "Royal Pulse", accent: "#6D4CFF", background: "#2D0B4E", gradient: ["#2D0B4E", "#4922A8", "#075B9B"] },
  { name: "Cobalt Glow", accent: "#3B82F6", background: "#111B4A", gradient: ["#111B4A", "#1658B5", "#00A2C7"] },
  { name: "Ocean Electric", accent: "#00D1FF", background: "#003A4D", gradient: ["#003A4D", "#006EB8", "#00A981"] },
  { name: "Teal Voltage", accent: "#00C2C7", background: "#00535C", gradient: ["#00535C", "#008F91", "#3550B9"] },
  { name: "Emerald Pop", accent: "#22E06F", background: "#004239", gradient: ["#004239", "#00875B", "#2A9A1E"] },
  { name: "Lime After Dark", accent: "#76D900", background: "#2B3D00", gradient: ["#2B3D00", "#5E9500", "#00906A"] },
  { name: "Golden Flash", accent: "#FFD400", background: "#4A3300", gradient: ["#4A3300", "#BC7800", "#C12855"] },
  { name: "Tangerine Heat", accent: "#FF7A00", background: "#552000", gradient: ["#552000", "#B74600", "#D4006A"] },
  { name: "Scarlet Ember", accent: "#FF4D00", background: "#5C1600", gradient: ["#5C1600", "#C12700", "#A60054"] },
  { name: "Cherry Voltage", accent: "#E5004F", background: "#4D0D10", gradient: ["#4D0D10", "#B20848", "#621AA3"] },
  { name: "Berry Neon", accent: "#F700FF", background: "#46003F", gradient: ["#46003F", "#A000A8", "#2B43A6"] },
  { name: "Magenta Rush", accent: "#D946EF", background: "#4C0038", gradient: ["#4C0038", "#A9128C", "#4851B6"] },
  { name: "Skyline", accent: "#00A8FF", background: "#002E5D", gradient: ["#002E5D", "#0066BD", "#00A9CD"] },
  { name: "Aqua Jewel", accent: "#00B894", background: "#00513D", gradient: ["#00513D", "#008E82", "#116FB4"] },
  { name: "Coral Fire", accent: "#FF6B35", background: "#552000", gradient: ["#552000", "#C54B12", "#B41472"] },
  { name: "Sunburst", accent: "#FFCA3A", background: "#3B2500", gradient: ["#3B2500", "#B37000", "#D6384E"] },
  { name: "Midnight Laser", accent: "#8A2BE2", background: "#26005C", gradient: ["#26005C", "#5520B7", "#006DB3"] },
  { name: "Neon Tropic", accent: "#00F5D4", background: "#003D3B", gradient: ["#003D3B", "#00476E", "#32105A"] },
  { name: "Purple Sunset", accent: "#FF5D8F", background: "#38002E", gradient: ["#38002E", "#6A123C", "#FF4D6D"] },
  { name: "Laser Lime", accent: "#B8FF00", background: "#183900", gradient: ["#183900", "#365A00", "#005B45"] },
  { name: "Blueberry Blast", accent: "#4D6CFF", background: "#170040", gradient: ["#170040", "#242C86", "#004F8F"] },
  { name: "Electric Fiesta", accent: "#FF4D00", background: "#2A003D", gradient: ["#2A003D", "#6A103B", "#D84100"] },
  { name: "Cyber Cherry", accent: "#FF1744", background: "#260019", gradient: ["#260019", "#6B062F", "#A90035"] },
  { name: "Disco Pool", accent: "#00E5FF", background: "#001C4A", gradient: ["#001C4A", "#004C87", "#004F62"] },
  { name: "Acid Candy", accent: "#D500F9", background: "#35004D", gradient: ["#35004D", "#73005E", "#DE176E"] },
  { name: "Tropical Pop", accent: "#00E676", background: "#004B3A", gradient: ["#004B3A", "#00735C", "#126A24"] },
  { name: "Golden Berry", accent: "#FFD740", background: "#351900", gradient: ["#351900", "#784000", "#9B174F"] },
  { name: "Voltage Violet", accent: "#B517FF", background: "#20004A", gradient: ["#20004A", "#5A167A", "#284FAD"] },
  { name: "Mermaid Neon", accent: "#19FFD1", background: "#002E46", gradient: ["#002E46", "#005C69", "#27409B"] },
];
