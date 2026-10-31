content = open('components/tab-manager.tsx', 'r', encoding='utf-8').read()
end = content.index('export function TabManager')
emojis = ['\U0001F3E0','\U0001F4CB','\u2764\uFE0F','\U0001F3C0','\U0001F383','\U0001F41B','\u2665\uFE0F','\U0001F6D2','\U0001F9F9','\U0001F4C5','\U0001F3A8','\U0001F4D6']
ids = ['today','log','health','nba','halloweenEditor','crashReports','steamy','purchase','cleaning','calendar','themes','pastDays']
labels = ['Today','Daily Log','Health','NBA','Halloween Editor','Crash Reports','Steamy','Purchase','Cleaning','Calendar','Themes','Past Days']
lines = ['const TABS = [']
for i in range(len(ids)):
    lines.append('  { id: "%s", label: "%s", glyph: "%s" },' % (ids[i], labels[i], emojis[i]))
lines.append('];')
lines.append('')
newTabs = '\n'.join(lines)
newContent = newTabs + content[end:]
open('components/tab-manager.tsx', 'w', encoding='utf-8').write(newContent)
print('Done')
