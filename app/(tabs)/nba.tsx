import { AppFrame } from "@/components/app-frame";
import { COLORS } from "@/lib/together";
import { ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { VisualText as Text, VisualTouchableOpacity as TouchableOpacity, VisualView as View } from "@/components/visual-primitives";

type NbaGame = {
  away: string;
  home: string;
  awayScore: string;
  homeScore: string;
  status: string;
};

const ESPN_NBA_SCOREBOARD = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard";

async function fetchNbaGames(): Promise<NbaGame[]> {
  const response = await fetch(ESPN_NBA_SCOREBOARD);
  if (!response.ok) throw new Error("NBA scoreboard request failed");
  const data = await response.json();
  const events = Array.isArray(data?.events) ? data.events : [];
  return events.map((event: any) => {
    const competition = Array.isArray(event?.competitions) ? event.competitions[0] : null;
    const competitors = Array.isArray(competition?.competitors) ? competition.competitors : [];
    const home = competitors.find((item: any) => item?.homeAway === "home");
    const away = competitors.find((item: any) => item?.homeAway === "away");
    const status = String(event?.status?.type?.shortDetail ?? event?.status?.type?.description ?? "Scheduled");
    return {
      away: String(away?.team?.abbreviation ?? away?.team?.shortDisplayName ?? "AWAY"),
      home: String(home?.team?.abbreviation ?? home?.team?.shortDisplayName ?? "HOME"),
      awayScore: String(away?.score ?? ""),
      homeScore: String(home?.score ?? ""),
      status,
    };
  });
}

export default function NbaScreen() {
  const [games, setGames] = useState<NbaGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await fetchNbaGames();
      setGames(next);
    } catch {
      setError("Could not load NBA scores.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AppFrame>
      <ScrollView contentContainerStyle={styles.page}>
        <View>
          <Text style={styles.eyebrow}>NBA</Text>
          <Text style={styles.hero}>Today's scores</Text>
          <Text style={styles.copy}>Live and scheduled NBA games for today.</Text>
        </View>
        <TouchableOpacity onPress={() => void load()} style={styles.refresh}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
        {loading ? <ActivityIndicator color={COLORS.gold} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!loading && !error && games.length === 0 ? (
          <Text style={styles.copy}>No games scheduled today.</Text>
        ) : null}
        {games.map((game, index) => {
          const hasScore = game.awayScore !== "" && game.homeScore !== "";
          return (
            <View key={`${game.away}-${game.home}-${index}`} style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.team}>{game.away}</Text>
                <Text style={styles.score}>{hasScore ? game.awayScore : ""}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.team}>{game.home}</Text>
                <Text style={styles.score}>{hasScore ? game.homeScore : ""}</Text>
              </View>
              <Text style={styles.status}>{game.status}</Text>
            </View>
          );
        })}
      </ScrollView>
    </AppFrame>
  );
}

const styles = StyleSheet.create({
  page: { padding: 18, paddingBottom: 36, gap: 14 },
  eyebrow: { color: COLORS.gold, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  hero: { color: COLORS.plum, fontSize: 32, fontWeight: "900", fontStyle: "italic" },
  copy: { color: COLORS.slate, fontFamily: "monospace", fontSize: 11, lineHeight: 17, marginTop: 4 },
  refresh: { alignSelf: "flex-start", borderWidth: 1, borderColor: "#C6A04C", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  refreshText: { color: "#FFFFFF", fontSize: 9, fontWeight: "900", letterSpacing: 0.7 },
  error: { color: "#E98393", fontSize: 11, fontWeight: "700" },
  card: { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 14, borderWidth: 1, borderColor: "#3A313E", padding: 12, gap: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  team: { color: COLORS.plum, fontSize: 16, fontWeight: "900" },
  score: { color: COLORS.plum, fontSize: 16, fontWeight: "900" },
  status: { color: COLORS.slate, fontSize: 10, fontFamily: "monospace", marginTop: 4 },
});
