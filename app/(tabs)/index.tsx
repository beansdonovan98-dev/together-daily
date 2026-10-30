import { AppFrame } from "@/components/app-frame";
import { getSubheading } from "@/components/personalization-editor";
import { PrivateGate } from "@/components/together-access";
import { getApiBaseUrl } from "@/constants/oauth";
import { dailySparkFor } from "@/lib/daily-spark";
import { COLORS as BASE_COLORS, TAB_CARD_PALETTES, asObject, localDateKey, prettyDate } from "@/lib/together";
import { PARTNERS, type LocalMedia, type PartnerId, useLocalJournal } from "@/lib/local-journal";
import * as ImagePicker from "expo-image-picker";
import { pickedImageByteSize } from "@/lib/media-base64";
import { imageMimeFromAsset, isAnimatedGif, maxStoredBytesForMedia } from "@/lib/media-upload-policy";
import { resizeImageIfNeeded } from "@/lib/image-resize";
import { mediaFrameHeight } from "@/lib/gif-frame";
import { formatActivityDuration } from "@/lib/app-usage";
import { Image as ExpoImage } from "expo-image";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, ScrollView, StyleSheet } from "react-native";
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

/** Adds a second-by-second local display between durable server checkpoints. */
function useLiveForegroundActivity(recordedMilliseconds: number) {
  const normalizedRecorded = Math.max(0, Number(recordedMilliseconds) || 0);
  const baseline = useRef({ recordedMilliseconds: normalizedRecorded, capturedAt: Date.now() });
  const [now, setNow] = useState(() => Date.now());
  const [isForeground, setIsForeground] = useState(() => AppState.currentState === "active");
  const foregroundStartedAt = useRef<number | null>(AppState.currentState === "active" ? Date.now() : null);

  if (baseline.current.recordedMilliseconds !== normalizedRecorded) {
    baseline.current = { recordedMilliseconds: normalizedRecorded, capturedAt: Date.now() };
    foregroundStartedAt.current = AppState.currentState === "active" ? Date.now() : null;
  }

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1_000);
    const subscription = AppState.addEventListener("change", (nextState) => {
      const active = nextState === "active";
      foregroundStartedAt.current = active ? Date.now() : null;
      setIsForeground(active);
      setNow(Date.now());
    });
    return () => { clearInterval(timer); subscription.remove(); };
  }, []);

  const optimisticForegroundMilliseconds = isForeground && foregroundStartedAt.current
    ? Math.max(0, now - foregroundStartedAt.current)
    : 0;
  return {
    milliseconds: baseline.current.recordedMilliseconds + optimisticForegroundMilliseconds,
    isForeground,
  };
}

export default function TodayScreen() {
  return <PrivateGate>{({ userId, memberName, coupleName }) => <TodayContent userId={userId} memberName={memberName} coupleName={coupleName} />}</PrivateGate>;
}

function TodayContent({ userId, memberName, coupleName }: { userId: PartnerId; memberName: string; coupleName: string }) {
  const date = localDateKey();
  const { ready, getDay, updateDay, uploadDailyCoverCarouselDirect, deleteDailyCoverCarouselItem, updateDailyCoverCaption, customSubheadings, theme } = useLocalJournal();
  const [loveDraft, setLoveDraft] = useState("");
  const loveLoadedKey = useRef<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [removingCoverId, setRemovingCoverId] = useState<string | null>(null);
  const [quoteOffset, setQuoteOffset] = useState(0);
  const [coverFrameWidth, setCoverFrameWidth] = useState(320);
  const [coverDimensions, setCoverDimensions] = useState<Record<string, { width: number; height: number }>>({});
  const [coverCaptionDrafts, setCoverCaptionDrafts] = useState<Record<string, string>>({});
  const [editingCoverCaptionId, setEditingCoverCaptionId] = useState<string | null>(null);

  const content = asObject(getDay(date));
  const cover = asObject(content.coverPhoto);
  const secondCover = asObject(content.coverPhotoTwo);
  const loveNotes = asObject(content.loveNotes);
  const appUsage = asObject(content.appUsage);
  const liveCurrentUserUsage = useLiveForegroundActivity(Number(appUsage[userId] ?? 0));
  const savedLoveNote = String(loveNotes[userId] ?? "");
  const partner = PARTNERS[userId];
  const textColor = theme.fontColor ?? "#FFFFFF";
  const together = useTogetherTime();
  const dailySpark = dailySparkFor(date);
  const displayedQuote = dailySparkFor(date, quoteOffset).quote;
  const loveDraftKey = `${date}:${userId}`;

  useEffect(() => {
    if (!ready || loveLoadedKey.current === loveDraftKey) return;
    loveLoadedKey.current = loveDraftKey;
    setLoveDraft(savedLoveNote);
  }, [loveDraftKey, ready, savedLoveNote]);

  const saveLoveNote = () => {
    const nextNotes = { ...loveNotes };
    const trimmed = loveDraft.trim();
    if (trimmed) nextNotes[userId] = trimmed;
    else delete nextNotes[userId];
    updateDay(date, { loveNotes: nextNotes }, "love-note");
  };

  const saveCoverAsset = useCallback(async (asset: ImagePicker.ImagePickerAsset) => {
    const mimeType = imageMimeFromAsset(asset.mimeType, asset.fileName, asset.uri);
    const resizedUri = await resizeImageIfNeeded(asset.uri, mimeType);
    const byteSize = await pickedImageByteSize(resizedUri, asset.fileSize);
    if (byteSize > maxStoredBytesForMedia(mimeType, "cover")) throw new Error(mimeType === "image/gif" ? "This cover GIF is too large. Choose a GIF under 60 MB." : "This cover photo is too large. Choose a photo under 2.5 MB.");
    return uploadDailyCoverCarouselDirect({ dailyDate: date, fileName: asset.fileName ?? `cover-${Date.now()}.${mimeType === "image/gif" ? "gif" : "jpg"}`, mimeType, uri: resizedUri, byteSize });
  }, [date, uploadDailyCoverCarouselDirect]);

  const selectCovers = async () => {
    setUploading(true);
    setUploadError("");
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, allowsMultipleSelection: true, selectionLimit: 0, quality: 1, base64: false, preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Current });
      if (result.canceled || !result.assets.length) return;
      for (const asset of result.assets) await saveCoverAsset(asset);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "The cover photo could not be saved. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const removeCover = async (coverId: string) => {
    setRemovingCoverId(coverId);
    setUploadError("");
    try {
      await deleteDailyCoverCarouselItem({ dailyDate: date, mediaId: coverId });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "The cover photo could not be removed. Please try again.");
    } finally {
      setRemovingCoverId(null);
    }
  };
  const saveCoverCaption = async (coverId: string) => {
    if (!coverId) return;
    setUploadError("");
    try {
      await updateDailyCoverCaption({ dailyDate: date, mediaId: coverId, caption: coverCaptionDrafts[coverId] ?? "" });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "The cover caption could not be saved. Please try again.");
    }
  };
  const switchQuote = () => setQuoteOffset((offset) => offset + 1);
  const mediaUrl = (url: string) => url.startsWith("/") ? `${getApiBaseUrl()}${url}` : url;

  if (!ready) return <AppFrame><View style={styles.loading}><Text style={styles.muted}>Opening your daily journal…</Text></View></AppFrame>;

  const covers = ([cover, secondCover, ...(Array.isArray(content.coverPhotos) ? content.coverPhotos.map(asObject) : [])]
    .filter((item) => Boolean(item.url))
    .filter((item, index, items) => items.findIndex((candidate) => candidate.id === item.id) === index) as unknown) as LocalMedia[];
  const loveNotesSection = <View style={styles.card}><Text style={styles.cardKicker}>LOVE NOTES</Text><Text style={styles.cardTitle}>{getSubheading(customSubheadings, "loveNotes")}</Text><View style={styles.loveStack}>{(["beans", "princess"] as PartnerId[]).map((id) => { const person = PARTNERS[id]; const saved = String(loveNotes[id] ?? ""); const mine = id === userId; return <View key={id} style={[styles.loveCard, { borderColor: person.color }]}><View style={styles.loveHeader}><Text style={[styles.loveName, { color: textColor }]}>{person.avatar} {person.name}</Text><Text style={styles.loveState}>{saved ? "SAVED" : mine ? "YOUR NOTE" : "WAITING"}</Text></View>{mine ? <><TextInput value={loveDraft} onChangeText={setLoveDraft} multiline placeholder="Leave a little love note…" placeholderTextColor="#7F7582" style={styles.textArea} /><TouchableOpacity style={[styles.smallPrimary, { backgroundColor: person.color }]} onPress={saveLoveNote}><Text style={styles.smallPrimaryText}>{saved ? "Save changes" : "Save my note"}</Text></TouchableOpacity></> : saved ? <Text style={styles.loveSaved}>{saved}</Text> : <Text style={styles.loveWaiting}>This note space is waiting for {person.name}.</Text>}</View>; })}</View></View>;
  const activityByPartner = (["beans", "princess"] as PartnerId[]).map((id) => ({ id, person: PARTNERS[id], milliseconds: id === userId ? liveCurrentUserUsage.milliseconds : Math.max(0, Number(appUsage[id] ?? 0)) }));
  const sharedActivityMilliseconds = activityByPartner.reduce((total, entry) => total + entry.milliseconds, 0);
  const longestActivityMilliseconds = Math.max(1, ...activityByPartner.map((entry) => entry.milliseconds));
  const appActivitySection = <View style={styles.appActivityCard} testID="shared-app-time-card">
    <View style={styles.appActivityHeader}>
      <View><Text style={styles.cardKicker}>TODAY’S APP TIME</Text><Text style={styles.cardTitle}>Time together, today</Text></View>
      <View style={styles.appActivityLive}><View style={styles.appActivityLiveDot} /><Text style={styles.appActivityLiveText}>{liveCurrentUserUsage.isForeground ? "LIVE" : "PAUSED"}</Text></View>
    </View>
    <View style={styles.appActivityTotalRow}><View><Text style={styles.appActivityTotalLabel}>SHARED ACTIVE TIME</Text><Text style={styles.appActivityTotal}>{formatActivityDuration(sharedActivityMilliseconds)}</Text></View><Text style={styles.appActivityReset}>{"RESETS\nMIDNIGHT"}</Text></View>
    <View style={styles.appActivityGrid}>{activityByPartner.map(({ id, person, milliseconds }) => <View key={id} style={[styles.appActivityPerson, { borderColor: person.color }]}>
      <View style={styles.appActivityPersonHeader}><Text style={styles.appActivityName}>{person.avatar} {person.name}</Text><Text style={[styles.appActivityPresence, { color: person.color }]}>ACTIVE</Text></View>
      <Text style={[styles.appActivityTime, { color: person.color }]}>{formatActivityDuration(milliseconds)}</Text>
      <View style={styles.appActivityTrack}><View style={[styles.appActivityFill, { backgroundColor: person.color, width: `${Math.max(milliseconds ? 6 : 0, Math.round((milliseconds / longestActivityMilliseconds) * 100))}%` }]} /></View>
    </View>)}</View>
    <Text style={styles.appActivityCopy}>Seconds update live on the active phone. Your partner’s total refreshes when their app securely syncs.</Text>
  </View>;

  return <AppFrame><ScrollView contentContainerStyle={[styles.page, { backgroundColor: "transparent" }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
    <View style={styles.topRow}><View><Text style={[styles.eyebrow, { color: partner.color }]}>{prettyDate(date).toUpperCase()}</Text><Text style={styles.title}>{coupleName}</Text></View><View style={[styles.avatar, { backgroundColor: partner.color }]}><Text style={styles.avatarText}>{memberName.slice(0, 1).toUpperCase()}</Text></View></View>
    <View style={[styles.card, styles.trackerCard]}><Text style={styles.cardKicker}>RELATIONSHIP TRACKER</Text><Text style={styles.trackerTitle}>Together since August 9, 2019</Text><Text style={styles.trackerSub}>{getSubheading(customSubheadings, "relationshipTracker")}</Text><View style={styles.durationGrid}>{[[together.days, "DAYS"], [together.weeks, "WEEKS"], [together.months, "MONTHS"], [together.hours, "HOURS"]].map(([value, label]) => <View key={String(label)} style={styles.durationCell}><Text style={styles.durationNumber}>{Number(value).toLocaleString()}</Text><Text style={styles.durationLabel}>{label}</Text></View>)}</View><Text style={styles.trackerHint}>Started 08 / 09 / 19 · Updates automatically</Text></View>
    {loveNotesSection}
    {appActivitySection}
    <View style={styles.coverCarouselHeader}><View><Text style={styles.cardKicker}>DAILY COVERS</Text><Text style={styles.coverCarouselTitle}>Your visual memories</Text></View><TouchableOpacity accessibilityRole="button" accessibilityLabel="Add cover photos or GIFs" onPress={selectCovers} disabled={uploading} style={[styles.coverCarouselAddButton, { backgroundColor: partner.color }]}><Text style={styles.coverCarouselAddText}>{uploading ? "Saving…" : "+ Add"}</Text></TouchableOpacity></View>
    {covers.length ? <View style={styles.coverGrid}>{covers.map((coverSlot) => {
      const captions = asObject(coverSlot.captions);
      const coverId = String(coverSlot.id ?? "");
      const coverIsGif = isAnimatedGif(coverSlot.mimeType, coverSlot.fileName, coverSlot.url);
      const isEditing = editingCoverCaptionId === coverId;
      return <View key={coverId || coverSlot.url} style={styles.coverSlot}>
        <View style={[styles.coverSlide, { height: 220 }]}>
          <ExpoImage source={mediaUrl(String(coverSlot.url))} contentFit="contain" contentPosition="center" transition={0} style={StyleSheet.absoluteFillObject} />
          {coverIsGif ? <View style={styles.coverGifBadge}><Text style={styles.coverGifBadgeText}>GIF</Text></View> : null}
          {coverSlot.id ? <TouchableOpacity accessibilityRole="button" accessibilityLabel="Remove this cover" onPress={() => removeCover(coverSlot.id)} disabled={removingCoverId === coverSlot.id} style={styles.coverRemoveButton}><Text style={styles.coverRemoveText}>{removingCoverId === coverSlot.id ? "…" : "×"}</Text></TouchableOpacity> : null}
        </View>
        <View style={styles.coverCaptionPanel}>
          {(["beans", "princess"] as PartnerId[]).map((id) => {
            const person = PARTNERS[id];
            const saved = String(captions[id] ?? "");
            const mine = id === userId;
            return <View key={id} style={styles.coverCaptionRow}>
              <Text style={[styles.coverCaptionName, { color: person.color }]}>{person.avatar} {person.name}</Text>
              {mine ? (isEditing ? (
                <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                  <TextInput value={coverCaptionDrafts[coverId] ?? saved} onChangeText={(text) => setCoverCaptionDrafts((current) => ({ ...current, [coverId]: text }))} placeholder="Add your caption…" placeholderTextColor="#7F7582" style={styles.coverCaptionInput} />
                  <TouchableOpacity accessibilityRole="button" accessibilityLabel="Save caption" onPress={async () => { await saveCoverCaption(coverId); setEditingCoverCaptionId(null); }} style={styles.changeCoverButton}><Text style={styles.changeCoverText}>Save</Text></TouchableOpacity>
                </View>
              ) : (
                <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                  <Text style={styles.coverCaptionPartnerText}>{saved || "Add your caption…"}</Text>
                  <TouchableOpacity accessibilityRole="button" accessibilityLabel="Edit caption" onPress={() => { setCoverCaptionDrafts((current) => ({ ...current, [coverId]: saved })); setEditingCoverCaptionId(coverId); }} style={styles.keepCoverButton}><Text style={styles.keepCoverText}>Edit</Text></TouchableOpacity>
                </View>
              )) : <Text style={styles.coverCaptionPartnerText}>{saved || "Waiting for a caption…"}</Text>}
            </View>;
          })}
        </View>
      </View>;
    })}</View> : null}
    {uploadError ? <View style={styles.uploadError}><Text style={styles.uploadErrorText}>{uploadError}</Text></View> : null}
    <View style={styles.dailySparkGrid}>
      <View style={styles.dailySparkCard}><View style={styles.dailySparkHeader}><Text style={[styles.cardKicker, { color: textColor }]}>QUOTE OF THE DAY</Text><TouchableOpacity accessibilityRole="button" accessibilityLabel="Switch to another daily quote" onPress={switchQuote} style={styles.dailySparkSwitch}><Text style={styles.dailySparkSwitchText}>Switch</Text></TouchableOpacity></View><Text style={[styles.dailySparkText, { color: textColor }]}>“{displayedQuote}”</Text></View>
      <View style={styles.dailySparkCard}><Text style={[styles.cardKicker, { color: textColor }]}>WORD OF THE DAY</Text><Text style={[styles.dailySparkWord, { color: textColor }]}>{dailySpark.word.term}</Text><Text style={[styles.dailySparkText, { color: textColor }]}>{dailySpark.word.definition}</Text></View>
      <View style={styles.dailySparkCard}><Text style={[styles.cardKicker, { color: textColor }]}>LEARN SOMETHING TODAY</Text><Text style={[styles.dailySparkText, { color: textColor }]}>{dailySpark.fact}</Text></View>
    </View>
  </ScrollView></AppFrame>;
}

const styles = StyleSheet.create({
  coverCarousel: { gap: 10, backgroundColor: "rgba(18,13,29,.72)", borderRadius: 20, padding: 14, borderWidth: 1, borderColor: "#000000", overflow: "hidden" },
  coverCarouselHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  coverCarouselTitle: { color: COLORS.plum, fontSize: 20, fontWeight: "900", fontStyle: "italic" },
  coverCarouselAddButton: { minHeight: 38, borderRadius: 10, paddingHorizontal: 13, justifyContent: "center" },
  coverCarouselAddText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  coverCarouselTrack: { alignItems: "flex-start" },
  coverSlide: { borderRadius: 16, overflow: "hidden", backgroundColor: "#100D14", borderWidth: 1, borderColor: "#000000" },
  coverPagePill: { position: "absolute", left: 11, bottom: 11, borderRadius: 8, backgroundColor: "rgba(10,8,13,.78)", borderWidth: 1, borderColor: "rgba(255,255,255,.22)", paddingHorizontal: 8, paddingVertical: 4 },
  coverPagePillText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900" },
  coverRemoveButton: { position: "absolute", right: 10, bottom: 10, width: 30, height: 30, borderRadius: 15, backgroundColor: "rgba(130,35,59,.92)", borderWidth: 1, borderColor: "#FFB1C2", alignItems: "center", justifyContent: "center" },
  coverRemoveText: { color: "#FFFFFF", fontSize: 19, lineHeight: 22, fontWeight: "900" },
  coverCarouselHint: { color: COLORS.slate, fontSize: 11, lineHeight: 16, textAlign: "center", fontFamily: "monospace" },
  coverEmpty: { minHeight: 178, borderRadius: 16, borderWidth: 1, borderStyle: "dashed", borderColor: "#6A5478", backgroundColor: "rgba(0,0,0,.14)", padding: 18, justifyContent: "center" },
  page: { padding: 18, paddingBottom: 36, gap: 14, backgroundColor: COLORS.blush }, loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.blush }, muted: { color: COLORS.slate, fontSize: 15 }, topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 }, eyebrow: { fontSize: 10, letterSpacing: 1.2, fontWeight: "900", marginBottom: 4 }, title: { color: COLORS.plum, fontSize: 31, fontWeight: "900", fontStyle: "italic" }, avatar: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" }, avatarText: { color: "#FFFFFF", fontWeight: "900", fontSize: 17 },
  coverGrid: { gap: 12 }, coverSlot: { gap: 7 }, coverCard: { minHeight: 155, borderRadius: 20, overflow: "hidden", backgroundColor: COLORS.ink, borderWidth: 1, borderColor: "#56346C", padding: 17, justifyContent: "flex-end" }, coverShade: { backgroundColor: "rgba(8,6,10,.34)" }, coverContent: { zIndex: 2 }, coverKicker: { color: COLORS.gold, fontWeight: "900", fontSize: 10, letterSpacing: 1.2, marginBottom: 5 }, coverTitle: { color: COLORS.plum, fontSize: 22, fontWeight: "800", marginBottom: 2, fontStyle: "italic" }, coverCopy: { color: COLORS.slate, fontSize: 12 }, coverGifBadge: { position: "absolute", left: 13, top: 13, zIndex: 3, borderRadius: 7, borderWidth: 1, borderColor: "#8A6030", backgroundColor: "rgba(55,39,23,.92)", paddingHorizontal: 7, paddingVertical: 3 }, coverGifBadgeText: { color: "#FFD88D", fontSize: 9, fontWeight: "900", letterSpacing: .7 }, coverAdd: { position: "absolute", top: 13, right: 13, zIndex: 3, width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: "#4A4050", alignItems: "center", justifyContent: "center" }, coverAddText: { color: COLORS.gold, fontSize: 22, lineHeight: 25 }, coverActions: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 }, changeCoverButton: { borderRadius: 9, paddingVertical: 7, paddingHorizontal: 10, backgroundColor: COLORS.gold }, changeCoverText: { color: "#1D131F", fontSize: 10, fontWeight: "900" }, removeCoverLink: { paddingVertical: 7, paddingHorizontal: 3 }, removeCoverLinkText: { color: "#D98099", fontSize: 10, fontWeight: "900" }, removeCoverPrompt: { color: COLORS.slate, fontSize: 10, fontWeight: "800" }, keepCoverButton: { paddingVertical: 7, paddingHorizontal: 7 }, keepCoverText: { color: COLORS.slate, fontSize: 10, fontWeight: "900" }, removeCoverButton: { borderRadius: 9, paddingVertical: 7, paddingHorizontal: 10, backgroundColor: "#A84261" }, removeCoverText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900" }, coverCaptionPanel: { gap: 7, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: "#43364A", backgroundColor: COLORS.ink }, coverCaptionRow: { gap: 4 }, coverCaptionName: { fontSize: 10, fontWeight: "900" }, coverCaptionInput: { minHeight: 36, borderRadius: 8, borderWidth: 1, borderColor: "#43364A", backgroundColor: "#120F14", color: COLORS.plum, paddingHorizontal: 10, fontSize: 12 }, coverCaptionPartnerText: { color: COLORS.slate, fontSize: 12, fontStyle: "italic", paddingVertical: 5 }, uploadError: { borderRadius: 12, padding: 12, backgroundColor: "#391825", borderWidth: 1, borderColor: "#A84261" }, uploadErrorText: { color: "#FFD9E2", fontSize: 12, lineHeight: 18, fontWeight: "700" },
  dailySparkGrid: { gap: 10 }, dailySparkCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 15, gap: 8, borderWidth: 2, borderColor: "#000000" }, dailySparkHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }, dailySparkText: { fontSize: 14, lineHeight: 21, fontStyle: "italic" }, dailySparkWord: { color: "#FFFFFF", fontSize: 23, fontWeight: "900", fontStyle: "italic" }, dailySparkSwitch: { alignSelf: "flex-start", borderWidth: 1, borderColor: "#6D5B77", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }, dailySparkSwitchText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900" }, riddleAnswer: { marginTop: 4, borderRadius: 10, padding: 10, backgroundColor: "rgba(255,255,255,0.12)" }, riddleAnswerText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  statsRow: { flexDirection: "row", gap: 8 }, statCard: { flex: 1, paddingVertical: 13, borderRadius: 14, alignItems: "center", borderWidth: 1, borderColor: "#2E2632" }, statNumber: { color: COLORS.plum, fontSize: 20, fontWeight: "900" }, statLabel: { color: COLORS.slate, fontSize: 10, fontWeight: "800", marginTop: 2 }, card: { backgroundColor: COLORS.ink, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: "#35273D" }, cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }, cardTitle: { color: COLORS.plum, fontSize: 20, fontWeight: "800", fontStyle: "italic" }, cardDescription: { color: COLORS.slate, fontFamily: "monospace", fontSize: 11, marginBottom: 5 }, cardMeta: { fontWeight: "900", fontSize: 13 }, cardKicker: { color: COLORS.gold, fontSize: 10, letterSpacing: 1.1, fontWeight: "900", marginBottom: 8 }, trackerCard: { borderColor: "#55335C" }, trackerTitle: { color: COLORS.plum, fontSize: 20, lineHeight: 27, fontStyle: "italic", fontWeight: "700" }, trackerSub: { color: COLORS.slate, fontSize: 12, fontFamily: "monospace", marginTop: 3 }, durationGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 }, durationCell: { width: "48.5%", backgroundColor: COLORS.surface, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#3A313E" }, durationNumber: { color: COLORS.plum, fontSize: 23, fontStyle: "italic", fontWeight: "900" }, durationLabel: { color: COLORS.gold, fontSize: 9, fontWeight: "900", letterSpacing: 1, marginTop: 2 }, trackerHint: { color: COLORS.slate, fontFamily: "monospace", fontSize: 11, marginTop: 10 },
  loveStack: { gap: 10, marginTop: 13 }, loveCard: { backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 1, padding: 13 }, loveHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, loveName: { fontSize: 12, fontWeight: "900" }, loveState: { color: COLORS.slate, fontSize: 9, fontFamily: "monospace", letterSpacing: 0.8 }, loveSaved: { color: COLORS.plum, fontSize: 15, fontStyle: "italic", lineHeight: 21, marginTop: 10 }, loveWaiting: { color: COLORS.slate, fontSize: 13, fontStyle: "italic", marginTop: 10 }, textArea: { minHeight: 76, borderColor: "#3A313E", borderWidth: 1, borderRadius: 13, padding: 12, marginTop: 11, color: COLORS.plum, textAlignVertical: "top", fontSize: 15, backgroundColor: "#120F14" }, smallPrimary: { alignSelf: "flex-start", paddingVertical: 10, paddingHorizontal: 13, borderRadius: 10, marginTop: 9 }, smallPrimaryText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  appActivityCard: { backgroundColor: "rgba(18,13,29,.72)", borderRadius: 20, padding: 18, borderWidth: 1.5, borderColor: "#8871A7", gap: 12 }, appActivityHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }, appActivityLive: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 9, borderWidth: 1, borderColor: "#4D8769", backgroundColor: "rgba(83,197,141,.14)", paddingHorizontal: 8, paddingVertical: 5 }, appActivityLiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#8EF0BA" }, appActivityLiveText: { color: "#CFFFE1", fontSize: 9, fontWeight: "900", letterSpacing: .8 }, appActivityTotalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 14, paddingVertical: 12, paddingHorizontal: 13, backgroundColor: "rgba(255,255,255,.08)", borderWidth: 1, borderColor: "rgba(255,255,255,.16)" }, appActivityTotalLabel: { color: "#DCCCF2", fontSize: 9, letterSpacing: 1.1, fontWeight: "900" }, appActivityTotal: { color: "#FFF5D9", fontSize: 21, lineHeight: 28, fontWeight: "900", fontStyle: "italic", marginTop: 2, letterSpacing: -.3 }, appActivityReset: { color: "#BFB0CD", fontSize: 8, lineHeight: 12, letterSpacing: .8, fontWeight: "900", textAlign: "right" }, appActivityCopy: { color: COLORS.slate, fontSize: 11, lineHeight: 17, fontFamily: "monospace" }, appActivityGrid: { flexDirection: "row", gap: 9 }, appActivityPerson: { flex: 1, minHeight: 111, borderRadius: 13, borderWidth: 1, backgroundColor: "rgba(255,255,255,.055)", padding: 11, justifyContent: "center", gap: 6 }, appActivityPersonHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 4 }, appActivityName: { color: COLORS.plum, fontSize: 11, fontWeight: "900", flexShrink: 1 }, appActivityPresence: { fontSize: 7, fontWeight: "900", letterSpacing: .6 }, appActivityTime: { fontSize: 14, lineHeight: 20, fontWeight: "900", fontStyle: "italic", letterSpacing: -.25 }, appActivityTrack: { height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,.13)", overflow: "hidden", marginTop: 1 }, appActivityFill: { height: "100%", minWidth: 0, borderRadius: 3 },
  mealCard: { borderColor: "#294839" }, mealList: { gap: 8, marginTop: 13 }, mealBlock: { gap: 6 }, mealRow: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: "#2D3D35", borderRadius: 13, padding: 11 }, mealEmoji: { fontSize: 20 }, mealBody: { flex: 1 }, mealLabel: { color: COLORS.sage, fontSize: 11, fontWeight: "900", letterSpacing: 0.5 }, mealInput: { color: COLORS.plum, fontSize: 14, paddingVertical: 3, marginTop: 2 }, mealDone: { borderRadius: 9, borderWidth: 1, borderColor: "#46574D", paddingHorizontal: 8, paddingVertical: 8 }, mealDoneActive: { backgroundColor: COLORS.sage, borderColor: COLORS.sage }, mealDoneText: { color: COLORS.slate, fontSize: 10, fontWeight: "900" }, mealDoneTextActive: { color: "#102318" }, mealEditButton: { minHeight: 29, justifyContent: "center", paddingHorizontal: 3 }, mealEditButtonText: { color: "#A9CDEC", fontSize: 9, fontWeight: "900" }, mealEditPanel: { flexDirection: "row", gap: 7, alignItems: "center", paddingHorizontal: 8, paddingBottom: 5 }, mealEmojiInput: { width: 43, minHeight: 35, borderRadius: 8, borderWidth: 1, borderColor: "#3B5645", backgroundColor: "#111915", color: COLORS.plum, textAlign: "center", fontSize: 17 }, mealLabelInput: { flex: 1, minHeight: 35, borderRadius: 8, borderWidth: 1, borderColor: "#3B5645", backgroundColor: "#111915", color: COLORS.plum, paddingHorizontal: 8, fontSize: 11 }, mealSaveButton: { minHeight: 35, borderRadius: 8, justifyContent: "center", paddingHorizontal: 8 }, mealSaveText: { color: COLORS.white, fontSize: 9, fontWeight: "900" }, mealCancelButton: { minHeight: 35, justifyContent: "center", paddingHorizontal: 3 }, mealCancelText: { color: COLORS.slate, fontSize: 9, fontWeight: "900" }, todoRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#2C2530" }, todoCircle: { width: 20, height: 20, borderRadius: 10, borderColor: "#635A67", borderWidth: 1, alignItems: "center", justifyContent: "center" }, todoCircleDone: { backgroundColor: COLORS.sage, borderColor: COLORS.sage }, check: { color: "#FFFFFF", fontWeight: "900", fontSize: 13 }, todoText: { color: COLORS.plum, fontSize: 14, flex: 1 }, todoDone: { color: COLORS.slate, textDecorationLine: "line-through" }, todoTextButton: { minHeight: 27, justifyContent: "center", paddingHorizontal: 3 }, todoTextButtonLabel: { color: "#A9CDEC", fontSize: 9, fontWeight: "900" }, todoDeleteButton: { width: 25, height: 25, borderRadius: 13, alignItems: "center", justifyContent: "center" }, todoDeleteText: { color: "#E98393", fontSize: 19, lineHeight: 20 }, todoEditBody: { flex: 1, gap: 7 }, todoEditInput: { minHeight: 37, borderRadius: 8, borderWidth: 1, borderColor: "#4A3B50", backgroundColor: "#121014", color: COLORS.plum, paddingHorizontal: 9, fontSize: 13 }, todoEditActions: { flexDirection: "row", gap: 8, alignItems: "center" }, todoSaveButton: { minHeight: 30, borderRadius: 8, justifyContent: "center", paddingHorizontal: 9 }, todoSaveText: { color: COLORS.white, fontSize: 9, fontWeight: "900" }, todoCancelButton: { minHeight: 30, justifyContent: "center", paddingHorizontal: 4 }, todoCancelText: { color: COLORS.slate, fontSize: 9, fontWeight: "900" }, addRow: { flexDirection: "row", gap: 8, marginTop: 12 }, addInput: { flex: 1, minHeight: 42, paddingHorizontal: 12, borderWidth: 1, borderColor: "#3A313E", backgroundColor: COLORS.surface, borderRadius: 12, color: COLORS.plum }, addButton: { borderRadius: 12, paddingHorizontal: 14, justifyContent: "center" }, addButtonText: { fontSize: 13, fontWeight: "900" },
});
