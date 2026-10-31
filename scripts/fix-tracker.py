import re
content = open('app/(tabs)/index.tsx', 'r', encoding='utf-8').read()
pattern = r'    <View style=\{\[styles\.card, styles\.trackerCard\]\}>.*?</View>\n'
new = '    <View style={[styles.card, styles.trackerCard]}><View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}><View><Text style={styles.cardKicker}>RELATIONSHIP TRACKER</Text><Text style={styles.trackerTitle}>Together since Aug 9, 2019</Text></View><View style={{ flexDirection: "row", gap: 6 }}>{[[together.days, "D"], [together.weeks, "W"], [together.months, "M"], [together.hours, "H"]].map(([value, label]) => <View key={String(label)} style={styles.durationCell}><Text style={styles.durationNumber}>{Number(value).toLocaleString()}</Text><Text style={styles.durationLabel}>{label}</Text></View>)}</View></View></View>\n'
content2 = re.sub(pattern, new, content, count=1, flags=re.DOTALL)
assert content2 != content, "no change"
open('app/(tabs)/index.tsx', 'w', encoding='utf-8').write(content2)
print('Done')
