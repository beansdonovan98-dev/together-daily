import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

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

function formatGames(games: NbaGame[]): string {
  if (!games.length) return "NBA: No games scheduled today";
  return games
    .map((game) => {
      const hasScore = game.awayScore !== "" && game.homeScore !== "";
      if (hasScore) return `${game.away} ${game.awayScore} - ${game.home} ${game.homeScore}  ${game.status}`;
      return `${game.away} vs ${game.home}  ${game.status}`;
    })
    .join("     •     ");
}

export default function NbaScoreTicker() {
  const [text, setText] = useState("NBA: Loading scores...");
  const translateX = useRef(new Animated.Value(0)).current;
  const contentWidth = useRef(0);
  const containerWidth = useRef(0);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  const startAnimation = () => {
    if (!contentWidth.current || !containerWidth.current) return;
    if (animationRef.current) animationRef.current.stop();
    const distance = contentWidth.current;
    translateX.setValue(containerWidth.current);
    const animation = Animated.loop(
      Animated.timing(translateX, {
        toValue: -distance,
        duration: Math.max(12000, distance * 25),
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animationRef.current = animation;
    animation.start();
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const games = await fetchNbaGames();
        if (mounted) setText(formatGames(games));
      } catch {
        if (mounted) setText("NBA: Scores unavailable");
      }
    };
    load();
    const interval = setInterval(load, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
      if (animationRef.current) animationRef.current.stop();
    };
  }, []);

  useEffect(() => {
    startAnimation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, containerWidth.current, contentWidth.current]);

  return (
    <View
      style={styles.container}
      onLayout={(event) => {
        containerWidth.current = event.nativeEvent.layout.width;
        startAnimation();
      }}
    >
      <Animated.View
        style={[styles.track, { transform: [{ translateX }] }]}
        onLayout={(event) => {
          contentWidth.current = event.nativeEvent.layout.width / 2;
          startAnimation();
        }}
      >
        <Text style={styles.text} numberOfLines={1}>{text}     •     {text}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 26,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.92)",
    justifyContent: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.15)",
  },
  track: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  text: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 12,
    // Allow the full score line to measure beyond the ticker viewport.
    // numberOfLines={1} caps maxWidth to 100% by default, which truncates
    // the text to roughly two games.
    maxWidth: 100000,
    flexShrink: 0,
  },
});