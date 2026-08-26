import { PrivateGate } from "@/components/together-access";
import { AppFrame } from "@/components/app-frame";
import { COLORS } from "@/lib/together";
import { useLocalJournal } from "@/lib/local-journal";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function FavoritesScreen() {
  return <PrivateGate>{() => <FavoritesContent />}</PrivateGate>;
}

function FavoritesContent() {
  const { favorites, deleteFavorite, theme } = useLocalJournal();
  const quotes = favorites.filter((favorite) => favorite.kind === "quote");
  const jokes = favorites.filter((favorite) => favorite.kind === "joke");
  return <AppFrame><ScrollView contentContainerStyle={[styles.page, { backgroundColor: theme.backgroundColor ?? COLORS.blush }]} showsVerticalScrollIndicator={false}>
    <View style={styles.hero}><Text style={styles.eyebrow}>SHARED COLLECTION</Text><Text style={styles.title}>Favorites</Text><Text style={styles.copy}>Keep the quotes and jokes you both want to revisit.</Text></View>
    {([ ["INSPIRATIONAL QUOTES", quotes], ["EDGY JOKES", jokes] ] as const).map(([title, items]) => <View key={title} style={styles.group}><Text style={styles.groupTitle}>{title}</Text>{items.length ? items.map((favorite) => <View key={favorite.id} style={styles.favoriteCard}><Text style={styles.favoriteText}>{favorite.kind === "quote" ? `“${favorite.text}”` : favorite.text}</Text><TouchableOpacity accessibilityRole="button" accessibilityLabel="Remove favorite" onPress={() => deleteFavorite(favorite.id)} style={styles.removeButton}><Text style={styles.removeText}>Remove</Text></TouchableOpacity></View>) : <View style={styles.emptyCard}><Text style={styles.emptyText}>Save one from Today to keep it here.</Text></View>}</View>)}
  </ScrollView></AppFrame>;
}

const styles = StyleSheet.create({
  page: { padding: 18, paddingBottom: 40, gap: 16, flexGrow: 1 }, hero: { gap: 4, paddingTop: 4 }, eyebrow: { fontSize: 10, fontWeight: "900", letterSpacing: 1.2 }, title: { fontSize: 34, fontWeight: "900", fontStyle: "italic" }, copy: { fontSize: 12, lineHeight: 19, maxWidth: 560 }, group: { gap: 9 }, groupTitle: { fontSize: 11, fontWeight: "900", letterSpacing: 1.2 }, favoriteCard: { backgroundColor: "transparent", borderRadius: 16, padding: 15, gap: 10 }, favoriteText: { fontSize: 15, lineHeight: 22, fontStyle: "italic" }, removeButton: { alignSelf: "flex-start", minHeight: 30, paddingHorizontal: 10, borderRadius: 9, borderWidth: 1, justifyContent: "center" }, removeText: { fontSize: 10, fontWeight: "900" }, emptyCard: { backgroundColor: "transparent", borderRadius: 16, padding: 15 }, emptyText: { fontSize: 13, fontStyle: "italic" },
});
