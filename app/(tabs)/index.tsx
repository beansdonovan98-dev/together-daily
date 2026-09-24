import { AppFrame } from "@/components/app-frame";
import { getSubheading } from "@/components/personalization-editor";
import { PrivateGate } from "@/components/together-access";
import { getApiBaseUrl } from "@/constants/oauth";
import { dailySparkFor, friendMotivationFor } from "@/lib/daily-spark";
import { shouldShowDailyRelationshipSection } from "@/lib/room-settings";
import { COLORS as BASE_COLORS, TAB_CARD_PALETTES, asObject, localDateKey, prettyDate } from "@/lib/together";
import { PARTNERS, type PartnerId, useLocalJournal } from "@/lib/local-journal";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { preparePickedImageForUpload } from "@/lib/media-base64";
import { imageMimeFromAsset, isAnimatedGif, maxBase64LengthForMedia } from "@/lib/media-upload-policy";
import { Image as ExpoImage } from "expo-image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, ScrollView, StyleSheet } from "react-native";
import { VisualText as Text, VisualTextInput as TextInput, VisualTouchableOpacity as TouchableOpacity, VisualView as View } from "@/components/visual-primitives";

const RELATIONSHIP_START = new Date(2019, 7, 9, 0, 0, 0);
const COLORS = {
  ...BASE_COLORS,
  ink: TAB_CARD_PALETTES.today.surface,
  surface: TAB_CARD_PALETTES.today.surface,
};

function useTogetherTime() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);
  const hours = Math.max(0, Math.floor((now.getTime() - RELATIONSHIP_START.getTime()) / 3_600_000));
  const days = Math.floor(hours / 24);
  return {
    hours,
    days,
    weeks: Math.floor(days / 7),
    months: Math.max(0, (now.getFullYear() - 2019) * 12 + now.getMonth() - 7 - (now.getDate() < 9 ? 1 : 0)),
  };
}

export default function TodayScreen() {
  return <PrivateGate>{({ userId, memberName, coupleName }) => <TodayContent userId={userId} memberName={memberName} coupleName={coupleName} />}</PrivateGate>;
}

function TodayContent({ userId, memberName, coupleName }: { userId: PartnerId; memberName: string; coupleName: string }) {
  const date = localDateKey();
  const { ready, getDay, updateDay, uploadDailyCover, deleteDailyCover, customSubheadings, theme, roomSettings } = useLocalJournal();
  const [loveDraft, setLoveDraft] = useState("");
  const loveLoadedKey = useRef<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [confirmRemoveSlot, setConfirmRemoveSlot] = useState<"first" | "second" | null>(null);
  const [removingSlot, setRemovingSlot] = useState<"first" | "second" | null>(null);
  const [quoteOffset, setQuoteOffset] = useState(0);
  const [riddleAnswerVisible, setRiddleAnswerVisible] = useState(false);
  const riddleFlip = useRef(new Animated.Value(0)).current;

  const content = asObject(getDay(date));
  const cover = asObject(content.coverPhoto);
  const secondCover = asObject(content.coverPhotoTwo);
  const loveNotes = asObject(content.loveNotes);
  const savedLoveNote = String(loveNotes[userId] ?? "");
  const partner = PARTNERS[userId];
  const textColor = theme.fontColor ?? "#FFFFFF";
  const together = useTogetherTime();
  const dailySpark = dailySparkFor(date);
  const isFriendMode = roomSettings.mode === "friends";
  const displayedQuote = isFriendMode ? friendMotivationFor(date, quoteOffset) : dailySparkFor(date, quoteOffset).quote;
  const loveDraftKey = `${date}:${userId}`;

  useEffect(() => {
    if (!ready || loveLoadedKey.current === loveDraftKey) return;
    loveLoadedKey.current = loveDraftKey;
    setLoveDraft(savedLoveNote);
  }, [loveDraftKey, ready, savedLoveNote]);

  const save = (patch: Record<string, unknown>) => updateDay(date, patch);
  const saveLoveNote = () => {
    const nextNotes = { ...loveNotes };
    const trimmed = loveDraft.trim();
    if (trimmed) nextNotes[userId] = trimmed;
    else delete nextNotes[userId];
    updateDay(date, { loveNotes: nextNotes }, "love-note");
  };

  const saveCoverAsset = useCallback(async (slot: "first" | "second", asset: ImagePicker.ImagePickerAsset) => {
    setUploading(true);
    setUploadError("");
    try {
      const selectedMimeType = imageMimeFromAsset(asset.mimeType, asset.fileName, asset.uri);
      const prepared = await preparePickedImageForUpload({ uri: asset.uri, base64: asset.base64, mimeType: selectedMimeType });
      if (!prepared.base64) throw new Error("The selected image could not be read.");
      if (prepared.base64.length > maxBase64LengthForMedia(prepared.mimeType, "cover")) throw new Error(prepared.mimeType === "image/gif" ? "This cover GIF is too large. Choose a GIF under about 5 MB." : "This cover photo is still too large. Please choose a smaller image.");
      await uploadDailyCover({ dailyDate: date, slot, fileName: asset.fileName ?? `cover-${slot}-${date}.${prepared.mimeType === "image/gif" ? "gif" : "jpg"}`, mimeType: prepared.mimeType, base64: prepared.base64, caption: "" });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "The cover photo could not be saved. Please try again.");
    } finally {
      setUploading(false);
      await AsyncStorage.removeItem("together-daily-pending-cover-slot");
    }
  }, [date, uploadDailyCover]);

  const selectCover = async (slot: "first" | "second") => {
    await AsyncStorage.setItem("together-daily-pending-cover-slot", slot);
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, quality: 1, base64: true });
    if (result.canceled || !result.assets[0]) {
      await AsyncStorage.removeItem("together-daily-pending-cover-slot");
      return;
    }
    await saveCoverAsset(slot, result.assets[0]);
  };

  useEffect(() => {
    if (!ready) return;
    let active = true;
    void (async () => {
      const result = await ImagePicker.getPendingResultAsync();
      const slot = await AsyncStorage.getItem("together-daily-pending-cover-slot");
      if (active && result && "assets" in result && !result.canceled && result.assets[0] && (slot === "first" || slot === "second")) await saveCoverAsset(slot, result.assets[0]);
    })();
    return () => { active = false; };
  }, [ready, saveCoverAsset]);

  const removeCover = async (slot: "first" | "second") => {
    setRemovingSlot(slot);
    setUploadError("");
    try {
      await deleteDailyCover({ dailyDate: date, slot });
      setConfirmRemoveSlot(null);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "The cover photo could not be removed. Please try again.");
    } finally {
      setRemovingSlot(null);
    }
  };
  const setCoverCaption = (slot: "first" | "second", partnerId: PartnerId, caption: string) => {
    const current = slot === "first" ? cover : secondCover;
    if (!current.url) return;
    const captions = asObject(current.captions);
    save(slot === "first"
      ? { coverPhoto: { ...current, captions: { ...captions, [partnerId]: caption } } }
      : { coverPhotoTwo: { ...current, captions: { ...captions, [partnerId]: caption } } });
  };
  const switchQuote = () => setQuoteOffset((offset) => offset + 1);
  const toggleRiddleAnswer = () => {
    if (riddleAnswerVisible) {
      Animated.timing(riddleFlip, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => setRiddleAnswerVisible(false));
      return;
    }
    setRiddleAnswerVisible(true);
    riddleFlip.setValue(0);
    Animated.spring(riddleFlip, { toValue: 1, useNativeDriver: true, friction: 8, tension: 90 }).start();
  };
  const mediaUrl = (url: string) => url.startsWith("/") ? `${getApiBaseUrl()}${url}` : url;

  if (!ready) return <AppFrame><View style={styles.loading}><Text style={styles.muted}>Opening your daily journal…</Text></View></AppFrame>;

  const covers = [{ key: "first" as const, cover, label: "DAILY COVER" }, { key: "second" as const, cover: secondCover, label: "SECOND COVER" }];
  const loveNotesSection = <View style={styles.card}><Text style={styles.cardKicker}>LOVE NOTES</Text><Text style={styles.cardTitle}>{getSubheading(customSubheadings, "loveNotes")}</Text><View style={styles.loveStack}>{(["beans", "princess"] as PartnerId[]).map((id) => { const person = PARTNERS[id]; const saved = String(loveNotes[id] ?? ""); const mine = id === userId; return <View key={id} style={[styles.loveCard, { borderColor: person.color }]}><View style={styles.loveHeader}><Text style={[styles.loveName, { color: textColor }]}>{person.avatar} {person.name}</Text><Text style={styles.loveState}>{saved ? "SAVED" : mine ? "YOUR NOTE" : "WAITING"}</Text></View>{mine ? <><TextInput value={loveDraft} onChangeText={setLoveDraft} multiline placeholder="Leave a little love note…" placeholderTextColor="#7F7582" style={styles.textArea} /><TouchableOpacity style={[styles.smallPrimary, { backgroundColor: person.color }]} onPress={saveLoveNote}><Text style={styles.smallPrimaryText}>{saved ? "Save changes" : "Save my note"}</Text></TouchableOpacity></> : saved ? <Text style={styles.loveSaved}>{saved}</Text> : <Text style={styles.loveWaiting}>This note space is waiting for {person.name}.</Text>}</View>; })}</View></View>;

  return <AppFrame><ScrollView contentContainerStyle={[styles.page, { backgroundColor: "transparent" }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
    <View style={styles.topRow}><View><Text style={[styles.eyebrow, { color: partner.color }]}>{prettyDate(date).toUpperCase()}</Text><Text style={styles.title}>{coupleName}</Text></View><View style={[styles.avatar, { backgroundColor: partner.color }]}><Text style={styles.avatarText}>{memberName.slice(0, 1).toUpperCase()}</Text></View></View>
    {shouldShowDailyRelationshipSection(roomSettings, "relationshipTracker") ? <View style={[styles.card, styles.trackerCard]}><Text style={styles.cardKicker}>RELATIONSHIP TRACKER</Text><Text style={styles.trackerTitle}>Together since August 9, 2019</Text><Text style={styles.trackerSub}>{getSubheading(customSubheadings, "relationshipTracker")}</Text><View style={styles.durationGrid}>{[[together.days, "DAYS"], [together.weeks, "WEEKS"], [together.months, "MONTHS"], [together.hours, "HOURS"]].map(([value, label]) => <View key={String(label)} style={styles.durationCell}><Text style={styles.durationNumber}>{Number(value).toLocaleString()}</Text><Text style={styles.durationLabel}>{label}</Text></View>)}</View><Text style={styles.trackerHint}>Started 08 / 09 / 19 · Updates automatically</Text></View> : null}
    {shouldShowDailyRelationshipSection(roomSettings, "loveNotes") ? loveNotesSection : null}
    <View style={styles.coverGrid}>{covers.map(({ key, cover: coverSlot, label }) => {
      const captions = asObject(coverSlot.captions);
      const coverIsGif = isAnimatedGif(coverSlot.mimeType, coverSlot.fileName, coverSlot.url);
      return <View key={key} style={styles.coverSlot}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${coverSlot.url ? "Change" : "Add"} ${label.toLowerCase()}`} style={[styles.coverCard, { backgroundColor: "transparent", borderColor: "#000000" }]} onPress={() => selectCover(key)} disabled={uploading || removingSlot === key}>
          {coverSlot.url ? <><ExpoImage source={mediaUrl(String(coverSlot.url))} contentFit="cover" transition={0} style={StyleSheet.absoluteFillObject} />{coverIsGif ? <View style={styles.coverGifBadge}><Text style={styles.coverGifBadgeText}>GIF</Text></View> : null}</> : <><View style={[StyleSheet.absoluteFillObject, styles.coverShade]} /><View style={styles.coverContent}><Text style={styles.coverKicker}>{uploading ? "SAVING PHOTO" : label}</Text><Text style={styles.coverTitle}>Add a photo or GIF</Text><Text style={styles.coverCopy}>A visual little memory for today.</Text></View></>}
          <View style={styles.coverAdd}><Text style={styles.coverAddText}>+</Text></View>
        </TouchableOpacity>
        {coverSlot.url ? <><View style={styles.coverActions}><TouchableOpacity onPress={() => selectCover(key)} disabled={uploading || removingSlot === key} style={styles.changeCoverButton}><Text style={styles.changeCoverText}>Change photo or GIF</Text></TouchableOpacity>{confirmRemoveSlot === key ? <><Text style={styles.removeCoverPrompt}>Remove this cover?</Text><TouchableOpacity onPress={() => setConfirmRemoveSlot(null)} disabled={removingSlot === key} style={styles.keepCoverButton}><Text style={styles.keepCoverText}>Keep</Text></TouchableOpacity><TouchableOpacity onPress={() => removeCover(key)} disabled={removingSlot === key} style={styles.removeCoverButton}><Text style={styles.removeCoverText}>{removingSlot === key ? "Removing…" : "Remove"}</Text></TouchableOpacity></> : <TouchableOpacity onPress={() => setConfirmRemoveSlot(key)} disabled={uploading || removingSlot === key} style={styles.removeCoverLink}><Text style={styles.removeCoverLinkText}>Remove photo or GIF</Text></TouchableOpacity>}</View><View style={styles.coverCaptionPanel}>{(["beans", "princess"] as PartnerId[]).map((partnerId) => { const person = PARTNERS[partnerId]; const mine = partnerId === userId; const caption = String(captions[partnerId] ?? ""); return <View key={partnerId} style={styles.coverCaptionRow}><Text style={[styles.coverCaptionName, { color: textColor }]}>{person.avatar} {person.name}</Text>{mine ? <TextInput value={caption} onChangeText={(value) => setCoverCaption(key, partnerId, value)} placeholder="Add a caption…" placeholderTextColor="#7F7582" maxLength={90} style={styles.coverCaptionInput} /> : <Text style={styles.coverCaptionPartnerText}>{caption || `Waiting for ${person.name}'s caption`}</Text>}</View>; })}</View></> : null}
      </View>;
    })}</View>
    {uploadError ? <View style={styles.uploadError}><Text style={styles.uploadErrorText}>{uploadError}</Text></View> : null}
    <View style={styles.dailySparkGrid}>
      <View style={styles.dailySparkCard}><View style={styles.dailySparkHeader}><Text style={[styles.cardKicker, { color: textColor }]}>{isFriendMode ? "MOTIVATION OF THE DAY" : "QUOTE OF THE DAY"}</Text><TouchableOpacity accessibilityRole="button" accessibilityLabel={isFriendMode ? "Switch to another daily motivation" : "Switch to another daily quote"} onPress={switchQuote} style={styles.dailySparkSwitch}><Text style={styles.dailySparkSwitchText}>Switch</Text></TouchableOpacity></View><Text style={[styles.dailySparkText, { color: textColor }]}>“{displayedQuote}”</Text></View>
      <View style={styles.dailySparkCard}><Text style={[styles.cardKicker, { color: textColor }]}>TODAY’S DARKER JOKE</Text><Text style={[styles.dailySparkText, { color: textColor }]}>{dailySpark.joke}</Text></View>
      <View style={styles.dailySparkCard}><Text style={[styles.cardKicker, { color: textColor }]}>RIDDLE OF THE DAY</Text><Text style={[styles.dailySparkText, { color: textColor }]}>{dailySpark.riddle.prompt}</Text><TouchableOpacity accessibilityRole="button" accessibilityLabel={riddleAnswerVisible ? "Hide riddle answer" : "Show riddle answer"} onPress={toggleRiddleAnswer} style={styles.dailySparkSwitch}><Text style={styles.dailySparkSwitchText}>{riddleAnswerVisible ? "Hide answer" : "Show answer"}</Text></TouchableOpacity>{riddleAnswerVisible ? <Animated.View style={[styles.riddleAnswer, { opacity: riddleFlip, transform: [{ rotateX: riddleFlip.interpolate({ inputRange: [0, 1], outputRange: ["-90deg", "0deg"] }) }] }]}><Text style={[styles.riddleAnswerText, { color: textColor }]}>{dailySpark.riddle.answer}</Text></Animated.View> : null}</View>
      <View style={styles.dailySparkCard}><Text style={[styles.cardKicker, { color: textColor }]}>WORD OF THE DAY</Text><Text style={[styles.dailySparkWord, { color: textColor }]}>{dailySpark.word.term}</Text><Text style={[styles.dailySparkText, { color: textColor }]}>{dailySpark.word.definition}</Text></View>
      <View style={styles.dailySparkCard}><Text style={[styles.cardKicker, { color: textColor }]}>LEARN SOMETHING TODAY</Text><Text style={[styles.dailySparkText, { color: textColor }]}>{dailySpark.fact}</Text></View>
    </View>
  </ScrollView></AppFrame>;
}

const styles = StyleSheet.create({
  page: { padding: 18, paddingBottom: 36, gap: 14, backgroundColor: COLORS.blush }, loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.blush }, muted: { color: COLORS.slate, fontSize: 15 }, topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 }, eyebrow: { fontSize: 10, letterSpacing: 1.2, fontWeight: "900", marginBottom: 4 }, title: { color: COLORS.plum, fontSize: 31, fontWeight: "900", fontStyle: "italic" }, avatar: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" }, avatarText: { color: "#FFFFFF", fontWeight: "900", fontSize: 17 },
  coverGrid: { gap: 12 }, coverSlot: { gap: 7 }, coverCard: { height: 155, borderRadius: 20, overflow: "hidden", backgroundColor: COLORS.ink, borderWidth: 1, borderColor: "#56346C", padding: 17, justifyContent: "flex-end" }, coverShade: { backgroundColor: "rgba(8,6,10,.34)" }, coverContent: { zIndex: 2 }, coverKicker: { color: COLORS.gold, fontWeight: "900", fontSize: 10, letterSpacing: 1.2, marginBottom: 5 }, coverTitle: { color: COLORS.plum, fontSize: 22, fontWeight: "800", marginBottom: 2, fontStyle: "italic" }, coverCopy: { color: COLORS.slate, fontSize: 12 }, coverGifBadge: { position: "absolute", left: 13, top: 13, zIndex: 3, borderRadius: 7, borderWidth: 1, borderColor: "#8A6030", backgroundColor: "rgba(55,39,23,.92)", paddingHorizontal: 7, paddingVertical: 3 }, coverGifBadgeText: { color: "#FFD88D", fontSize: 9, fontWeight: "900", letterSpacing: .7 }, coverAdd: { position: "absolute", top: 13, right: 13, zIndex: 3, width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: "#4A4050", alignItems: "center", justifyContent: "center" }, coverAddText: { color: COLORS.gold, fontSize: 22, lineHeight: 25 }, coverActions: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 }, changeCoverButton: { borderRadius: 9, paddingVertical: 7, paddingHorizontal: 10, backgroundColor: COLORS.gold }, changeCoverText: { color: "#1D131F", fontSize: 10, fontWeight: "900" }, removeCoverLink: { paddingVertical: 7, paddingHorizontal: 3 }, removeCoverLinkText: { color: "#D98099", fontSize: 10, fontWeight: "900" }, removeCoverPrompt: { color: COLORS.slate, fontSize: 10, fontWeight: "800" }, keepCoverButton: { paddingVertical: 7, paddingHorizontal: 7 }, keepCoverText: { color: COLORS.slate, fontSize: 10, fontWeight: "900" }, removeCoverButton: { borderRadius: 9, paddingVertical: 7, paddingHorizontal: 10, backgroundColor: "#A84261" }, removeCoverText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900" }, coverCaptionPanel: { gap: 7, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: "#43364A", backgroundColor: COLORS.ink }, coverCaptionRow: { gap: 4 }, coverCaptionName: { fontSize: 10, fontWeight: "900" }, coverCaptionInput: { minHeight: 36, borderRadius: 8, borderWidth: 1, borderColor: "#43364A", backgroundColor: "#120F14", color: COLORS.plum, paddingHorizontal: 10, fontSize: 12 }, coverCaptionPartnerText: { color: COLORS.slate, fontSize: 12, fontStyle: "italic", paddingVertical: 5 }, uploadError: { borderRadius: 12, padding: 12, backgroundColor: "#391825", borderWidth: 1, borderColor: "#A84261" }, uploadErrorText: { color: "#FFD9E2", fontSize: 12, lineHeight: 18, fontWeight: "700" },
  dailySparkGrid: { gap: 10 }, dailySparkCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 15, gap: 8, borderWidth: 2, borderColor: "#000000" }, dailySparkHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }, dailySparkText: { fontSize: 14, lineHeight: 21, fontStyle: "italic" }, dailySparkWord: { color: "#FFFFFF", fontSize: 23, fontWeight: "900", fontStyle: "italic" }, dailySparkSwitch: { alignSelf: "flex-start", borderWidth: 1, borderColor: "#6D5B77", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }, dailySparkSwitchText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900" }, riddleAnswer: { marginTop: 4, borderRadius: 10, padding: 10, backgroundColor: "rgba(255,255,255,0.12)" }, riddleAnswerText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  statsRow: { flexDirection: "row", gap: 8 }, statCard: { flex: 1, paddingVertical: 13, borderRadius: 14, alignItems: "center", borderWidth: 1, borderColor: "#2E2632" }, statNumber: { color: COLORS.plum, fontSize: 20, fontWeight: "900" }, statLabel: { color: COLORS.slate, fontSize: 10, fontWeight: "800", marginTop: 2 }, card: { backgroundColor: COLORS.ink, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: "#35273D" }, cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }, cardTitle: { color: COLORS.plum, fontSize: 20, fontWeight: "800", fontStyle: "italic" }, cardDescription: { color: COLORS.slate, fontFamily: "monospace", fontSize: 11, marginBottom: 5 }, cardMeta: { fontWeight: "900", fontSize: 13 }, cardKicker: { color: COLORS.gold, fontSize: 10, letterSpacing: 1.1, fontWeight: "900", marginBottom: 8 }, trackerCard: { borderColor: "#55335C" }, trackerTitle: { color: COLORS.plum, fontSize: 20, lineHeight: 27, fontStyle: "italic", fontWeight: "700" }, trackerSub: { color: COLORS.slate, fontSize: 12, fontFamily: "monospace", marginTop: 3 }, durationGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 }, durationCell: { width: "48.5%", backgroundColor: COLORS.surface, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#3A313E" }, durationNumber: { color: COLORS.plum, fontSize: 23, fontStyle: "italic", fontWeight: "900" }, durationLabel: { color: COLORS.gold, fontSize: 9, fontWeight: "900", letterSpacing: 1, marginTop: 2 }, trackerHint: { color: COLORS.slate, fontFamily: "monospace", fontSize: 11, marginTop: 10 },
  loveStack: { gap: 10, marginTop: 13 }, loveCard: { backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 1, padding: 13 }, loveHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, loveName: { fontSize: 12, fontWeight: "900" }, loveState: { color: COLORS.slate, fontSize: 9, fontFamily: "monospace", letterSpacing: 0.8 }, loveSaved: { color: COLORS.plum, fontSize: 15, fontStyle: "italic", lineHeight: 21, marginTop: 10 }, loveWaiting: { color: COLORS.slate, fontSize: 13, fontStyle: "italic", marginTop: 10 }, textArea: { minHeight: 76, borderColor: "#3A313E", borderWidth: 1, borderRadius: 13, padding: 12, marginTop: 11, color: COLORS.plum, textAlignVertical: "top", fontSize: 15, backgroundColor: "#120F14" }, smallPrimary: { alignSelf: "flex-start", paddingVertical: 10, paddingHorizontal: 13, borderRadius: 10, marginTop: 9 }, smallPrimaryText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  mealCard: { borderColor: "#294839" }, mealList: { gap: 8, marginTop: 13 }, mealBlock: { gap: 6 }, mealRow: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: "#2D3D35", borderRadius: 13, padding: 11 }, mealEmoji: { fontSize: 20 }, mealBody: { flex: 1 }, mealLabel: { color: COLORS.sage, fontSize: 11, fontWeight: "900", letterSpacing: 0.5 }, mealInput: { color: COLORS.plum, fontSize: 14, paddingVertical: 3, marginTop: 2 }, mealDone: { borderRadius: 9, borderWidth: 1, borderColor: "#46574D", paddingHorizontal: 8, paddingVertical: 8 }, mealDoneActive: { backgroundColor: COLORS.sage, borderColor: COLORS.sage }, mealDoneText: { color: COLORS.slate, fontSize: 10, fontWeight: "900" }, mealDoneTextActive: { color: "#102318" }, mealEditButton: { minHeight: 29, justifyContent: "center", paddingHorizontal: 3 }, mealEditButtonText: { color: "#A9CDEC", fontSize: 9, fontWeight: "900" }, mealEditPanel: { flexDirection: "row", gap: 7, alignItems: "center", paddingHorizontal: 8, paddingBottom: 5 }, mealEmojiInput: { width: 43, minHeight: 35, borderRadius: 8, borderWidth: 1, borderColor: "#3B5645", backgroundColor: "#111915", color: COLORS.plum, textAlign: "center", fontSize: 17 }, mealLabelInput: { flex: 1, minHeight: 35, borderRadius: 8, borderWidth: 1, borderColor: "#3B5645", backgroundColor: "#111915", color: COLORS.plum, paddingHorizontal: 8, fontSize: 11 }, mealSaveButton: { minHeight: 35, borderRadius: 8, justifyContent: "center", paddingHorizontal: 8 }, mealSaveText: { color: COLORS.white, fontSize: 9, fontWeight: "900" }, mealCancelButton: { minHeight: 35, justifyContent: "center", paddingHorizontal: 3 }, mealCancelText: { color: COLORS.slate, fontSize: 9, fontWeight: "900" }, todoRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#2C2530" }, todoCircle: { width: 20, height: 20, borderRadius: 10, borderColor: "#635A67", borderWidth: 1, alignItems: "center", justifyContent: "center" }, todoCircleDone: { backgroundColor: COLORS.sage, borderColor: COLORS.sage }, check: { color: "#FFFFFF", fontWeight: "900", fontSize: 13 }, todoText: { color: COLORS.plum, fontSize: 14, flex: 1 }, todoDone: { color: COLORS.slate, textDecorationLine: "line-through" }, todoTextButton: { minHeight: 27, justifyContent: "center", paddingHorizontal: 3 }, todoTextButtonLabel: { color: "#A9CDEC", fontSize: 9, fontWeight: "900" }, todoDeleteButton: { width: 25, height: 25, borderRadius: 13, alignItems: "center", justifyContent: "center" }, todoDeleteText: { color: "#E98393", fontSize: 19, lineHeight: 20 }, todoEditBody: { flex: 1, gap: 7 }, todoEditInput: { minHeight: 37, borderRadius: 8, borderWidth: 1, borderColor: "#4A3B50", backgroundColor: "#121014", color: COLORS.plum, paddingHorizontal: 9, fontSize: 13 }, todoEditActions: { flexDirection: "row", gap: 8, alignItems: "center" }, todoSaveButton: { minHeight: 30, borderRadius: 8, justifyContent: "center", paddingHorizontal: 9 }, todoSaveText: { color: COLORS.white, fontSize: 9, fontWeight: "900" }, todoCancelButton: { minHeight: 30, justifyContent: "center", paddingHorizontal: 4 }, todoCancelText: { color: COLORS.slate, fontSize: 9, fontWeight: "900" }, addRow: { flexDirection: "row", gap: 8, marginTop: 12 }, addInput: { flex: 1, minHeight: 42, paddingHorizontal: 12, borderWidth: 1, borderColor: "#3A313E", backgroundColor: COLORS.surface, borderRadius: 12, color: COLORS.plum }, addButton: { borderRadius: 12, paddingHorizontal: 14, justifyContent: "center" }, addButtonText: { fontSize: 13, fontWeight: "900" },
});
