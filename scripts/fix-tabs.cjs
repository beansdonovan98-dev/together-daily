const fs = require('fs');
const e = {
  today: '\u{1F3E0}',
  log: '\u{1F4CB}',
  health: '\u{2764}\u{FE0F}',
  nba: '\u{1F3C0}',
  halloween: '\u{1F383}',
  crash: '\u{1F41B}',
  steamy: '\u{2665}\u{FE0F}',
  purchase: '\u{1F6D2}',
  cleaning: '\u{1F9F9}',
  calendar: '\u{1F4C5}',
  themes: '\u{1F3A8}',
  pastDays: '\u{1F4D6}',
};
const content = fs.readFileSync('components/tab-manager.tsx', 'utf8');
const end = content.indexOf('export function TabManager');
const newTabs = `const TABS = [
  { id: "today", label: "Today", glyph: "${e.today}" },
  { id: "log", label: "Daily Log", glyph: "${e.log}" },
  { id: "health", label: "Health", glyph: "${e.health}" },
  { id: "nba", label: "NBA", glyph: "${e.nba}" },
  { id: "halloweenEditor", label: "Halloween Editor", glyph: "${e.halloween}" },
  { id: "crashReports", label: "Crash Reports", glyph: "${e.crash}" },
  { id: "steamy", label: "Steamy", glyph: "${e.steamy}" },
  { id: "purchase", label: "Purchase", glyph: "${e.purchase}" },
  { id: "cleaning", label: "Cleaning", glyph: "${e.cleaning}" },
  { id: "calendar", label: "Calendar", glyph: "${e.calendar}" },
  { id: "themes", label: "Themes", glyph: "${e.themes}" },
  { id: "pastDays", label: "Past Days", glyph: "${e.pastDays}" },
];

`;
const newContent = newTabs + content.slice(end);
fs.writeFileSync('components/tab-manager.tsx', newContent, 'utf8');
console.log('Done');
`