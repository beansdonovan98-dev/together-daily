import { startOAuthLogin } from "@/constants/oauth";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { useEffect, useState, type ReactNode } from "react";
import { ActivityIndicator, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from "react-native";

const COLORS = {
  plum: "#281C32",
  orchid: "#8D5BA6",
  rose: "#D56B88",
  blush: "#FDF3F6",
  lavender: "#F1EAF7",
  slate: "#665F6B",
  white: "#FFFFFF",
};

type PrivateGateProps = {
  children: (access: { userId: number; memberName: string; coupleName: string; inviteCode: string; memberCount: number }) => ReactNode;
};

export function PrivateGate({ children }: PrivateGateProps) {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === "web" && width >= 960;
  const { user, loading, isAuthenticated } = useAuth();
  const couple = trpc.couple.mine.useQuery(undefined, { enabled: isAuthenticated, retry: false, refetchInterval: 10_000 });
  const [mode, setMode] = useState<"create" | "join">("create");
  const [spaceName, setSpaceName] = useState("Together Daily");
  const [memberName, setMemberName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const createSpace = trpc.couple.create.useMutation({ onSuccess: () => couple.refetch() });
  const joinSpace = trpc.couple.join.useMutation({ onSuccess: () => couple.refetch() });

  useEffect(() => {
    if (user?.name && !memberName) setMemberName(user.name.split(" ")[0]);
  }, [memberName, user?.name]);

  if (loading || (isAuthenticated && couple.isLoading)) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.orchid} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={isDesktopWeb ? styles.desktopEntry : styles.centered}>
        {isDesktopWeb ? <View style={styles.entryStory}><Text style={styles.storyEyebrow}>TOGETHER DAILY · PRIVATE BY DESIGN</Text><Text style={styles.storyTitle}>A gentle shared rhythm for the two of you.</Text><Text style={styles.storyCopy}>Keep the day close: a morning check-in, a note worth saving, a task you can divide, or a photo that makes an ordinary day feel remembered.</Text><View style={styles.storyGrid}><View style={styles.storyTile}><Text style={styles.storyTileTitle}>Daily ritual</Text><Text style={styles.storyTileCopy}>Moods, appreciation, and small moments.</Text></View><View style={styles.storyTile}><Text style={styles.storyTileTitle}>Shared life</Text><Text style={styles.storyTileCopy}>Chat, to-dos, photos, and memories.</Text></View></View></View> : null}
        <View style={[styles.accessCard, isDesktopWeb && styles.desktopAccessCard]}>
          <Text style={styles.accessEyebrow}>PRIVATE COUPLE SPACE</Text>
          <Text style={styles.accessTitle}>A shared place for the two of you.</Text>
          <Text style={styles.accessCopy}>Sign in to keep your daily journal, messages, memories, and private notes visible only to you and your partner.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => startOAuthLogin()}>
            <Text style={styles.primaryButtonText}>Sign in to continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (couple.isError) {
    return (
      <View style={isDesktopWeb ? styles.desktopEntry : styles.centered}>
        {isDesktopWeb ? <View style={styles.entryStory}><Text style={styles.storyEyebrow}>TOGETHER DAILY</Text><Text style={styles.storyTitle}>Your private shared space.</Text><Text style={styles.storyCopy}>We could not reconnect to your journal just now. Your data remains protected while we retry the connection.</Text></View> : null}
        <View style={[styles.accessCard, isDesktopWeb && styles.desktopAccessCard]}>
          <Text style={styles.accessTitle}>We could not open your space.</Text>
          <Text style={styles.accessCopy}>Please try again. If the problem continues, sign out and sign back in.</Text>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => couple.refetch()}>
            <Text style={styles.secondaryButtonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!couple.data) {
    const pending = createSpace.isPending || joinSpace.isPending;
    const error = createSpace.error?.message ?? joinSpace.error?.message;
    const submit = () => {
      if (mode === "create") {
        createSpace.mutate({ displayName: spaceName, memberName, avatarEmoji: "💜", accentColor: "#8D5BA6" });
      } else {
        joinSpace.mutate({ inviteCode, memberName, avatarEmoji: "🩷", accentColor: "#D56B88" });
      }
    };

    return (
      <View style={isDesktopWeb ? styles.desktopEntry : styles.centered}>
        {isDesktopWeb ? <View style={styles.entryStory}><Text style={styles.storyEyebrow}>A PRIVATE SPACE FOR TWO</Text><Text style={styles.storyTitle}>Make a daily place you will actually come back to.</Text><Text style={styles.storyCopy}>Start a two-person journal, then share one short code directly with your partner. Everything lives inside your private shared space.</Text></View> : null}
        <View style={[styles.accessCard, isDesktopWeb && styles.desktopAccessCard]}>
          <Text style={styles.accessEyebrow}>SET UP TOGETHER</Text>
          <Text style={styles.accessTitle}>{mode === "create" ? "Create your private daily space" : "Join your partner’s private space"}</Text>
          <Text style={styles.accessCopy}>{mode === "create" ? "You’ll receive a short invite code to share directly with your partner." : "Enter the invite code your partner created. A couple space is limited to two people."}</Text>
          <TextInput value={memberName} onChangeText={setMemberName} placeholder="Your first name" placeholderTextColor="#A399AA" style={styles.input} maxLength={80} />
          {mode === "create" ? (
            <TextInput value={spaceName} onChangeText={setSpaceName} placeholder="Space name" placeholderTextColor="#A399AA" style={styles.input} maxLength={120} />
          ) : (
            <TextInput value={inviteCode} onChangeText={(value) => setInviteCode(value.toUpperCase())} placeholder="Invite code" placeholderTextColor="#A399AA" autoCapitalize="characters" style={styles.input} maxLength={16} />
          )}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity style={[styles.primaryButton, pending && styles.disabled]} disabled={pending} onPress={submit}>
            <Text style={styles.primaryButtonText}>{pending ? "Saving…" : mode === "create" ? "Create our space" : "Join our space"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modeButton} onPress={() => setMode(mode === "create" ? "join" : "create")}> 
            <Text style={styles.modeButtonText}>{mode === "create" ? "I already have an invite code" : "I need to create a new space"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return children({
    userId: user!.id,
    memberName: couple.data.member.displayName,
    coupleName: couple.data.displayName,
    inviteCode: couple.data.inviteCode,
    memberCount: couple.data.members.length,
  });
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: COLORS.blush },
  desktopEntry: { flex: 1, flexDirection: "row", alignItems: "stretch", backgroundColor: COLORS.blush, padding: 32, gap: 32 },
  entryStory: { flex: 1, minWidth: 0, backgroundColor: COLORS.plum, borderRadius: 30, paddingHorizontal: 52, paddingVertical: 54, justifyContent: "center" },
  storyEyebrow: { color: "#E8C7EF", fontSize: 11, fontWeight: "800", letterSpacing: 1.4, marginBottom: 14 },
  storyTitle: { color: COLORS.white, fontSize: 39, lineHeight: 46, letterSpacing: -1.1, fontWeight: "800", maxWidth: 510 },
  storyCopy: { color: "#E4D9E5", fontSize: 17, lineHeight: 25, marginTop: 18, maxWidth: 490 },
  storyGrid: { flexDirection: "row", gap: 14, marginTop: 38, maxWidth: 520 },
  storyTile: { flex: 1, minHeight: 112, borderRadius: 18, padding: 17, backgroundColor: "rgba(255,255,255,0.11)" },
  storyTileTitle: { color: COLORS.white, fontSize: 15, fontWeight: "800", marginBottom: 6 },
  storyTileCopy: { color: "#E4D9E5", fontSize: 13, lineHeight: 18 },
  accessCard: { width: "100%", maxWidth: 420, padding: 24, borderRadius: 28, backgroundColor: COLORS.white, shadowColor: COLORS.plum, shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 2 },
  desktopAccessCard: { maxWidth: 430, alignSelf: "center", marginHorizontal: 36, shadowOpacity: 0.12, shadowRadius: 28, shadowOffset: { width: 0, height: 14 } },
  accessEyebrow: { color: COLORS.orchid, fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginBottom: 10 },
  accessTitle: { color: COLORS.plum, fontSize: 26, fontWeight: "800", lineHeight: 32, marginBottom: 10 },
  accessCopy: { color: COLORS.slate, fontSize: 15, lineHeight: 22, marginBottom: 20 },
  input: { minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: "#E8DEE9", paddingHorizontal: 14, color: COLORS.plum, backgroundColor: "#FFFCFF", marginBottom: 12, fontSize: 16 },
  primaryButton: { minHeight: 50, justifyContent: "center", alignItems: "center", borderRadius: 16, backgroundColor: COLORS.orchid, paddingHorizontal: 18, marginTop: 4 },
  primaryButtonText: { color: COLORS.white, fontSize: 16, fontWeight: "800" },
  secondaryButton: { minHeight: 48, justifyContent: "center", alignItems: "center", borderRadius: 16, backgroundColor: COLORS.lavender, paddingHorizontal: 18 },
  secondaryButtonText: { color: COLORS.orchid, fontSize: 16, fontWeight: "800" },
  modeButton: { alignItems: "center", paddingTop: 16, paddingBottom: 4 },
  modeButtonText: { color: COLORS.orchid, fontSize: 14, fontWeight: "700" },
  error: { color: "#B42345", fontSize: 13, lineHeight: 18, marginBottom: 8 },
  disabled: { opacity: 0.6 },
});
