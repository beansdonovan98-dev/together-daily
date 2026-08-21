import { startOAuthLogin } from "@/constants/oauth";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { useEffect, useState, type ReactNode } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

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
      <View style={styles.centered}>
        <View style={styles.accessCard}>
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
      <View style={styles.centered}>
        <View style={styles.accessCard}>
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
      <View style={styles.centered}>
        <View style={styles.accessCard}>
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
  accessCard: { width: "100%", maxWidth: 420, padding: 24, borderRadius: 28, backgroundColor: COLORS.white, shadowColor: COLORS.plum, shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 2 },
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
