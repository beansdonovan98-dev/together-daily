import { AppFrame } from "@/components/app-frame";
import { PageContentReset } from "@/components/page-content-reset";
import { PrivateGate } from "@/components/together-access";
import { PrivateMediaComments } from "@/components/private-media-comments";
import { COLORS, localDateKey, prettyDate } from "@/lib/together";
import { PARTNERS, useLocalJournal } from "@/lib/local-journal";
import { getApiBaseUrl } from "@/constants/oauth";
import * as ImagePicker from "expo-image-picker";
import {
  pickedImageByteSize,
} from "@/lib/media-base64";
import {
  imageMimeFromAsset,
  isAnimatedGif,
  maxStoredBytesForMedia,
} from "@/lib/media-upload-policy";
import { resizeImageIfNeeded } from "@/lib/image-resize";
import {
  intimateEntriesForDate,
  intimateEntryDateTimeLabel,
  intimateEntryReadByPartner,
  privateMediaForDate,
} from "@/lib/steamy-history";
import { privateMediaCommentsFor, unreadPrivateMediaCommentCount } from "@/lib/private-media-comments";
import { gifFrameHeight } from "@/lib/gif-frame";
import { Image as ExpoImage } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet } from "react-native";
import {
  VisualText as Text,
  VisualTextInput as TextInput,
  VisualTouchableOpacity as TouchableOpacity,
  VisualView as View,
} from "@/components/visual-primitives";

export default function SteamyScreen() {
  return <PrivateGate>{() => <SteamyContent />}</PrivateGate>;
}

function SteamyContent() {
  const params = useLocalSearchParams<{ date?: string }>();
  const [today, setToday] = useState(() => localDateKey());
  const date =
    typeof params.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(params.date)
      ? params.date
      : today;
  const isToday = date === today;
  const {
    records,
    addRecord,
    media,
    memberId,
    getDay,
    updateDay,
    uploadPrivateMedia,
    uploadPrivateMediaDirect,
    deletePrivateMedia,
    addPrivateMediaComment,
    deletePrivateMediaComment,
    markPrivateMediaCommentsViewed,
    theme,
  } = useLocalJournal();
  const [revealed, setRevealed] = useState(false);
  const [chatDraft, setChatDraft] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [pendingPreview, setPendingPreview] = useState<{
    uri: string;
    isGif: boolean;
    width?: number;
    height?: number;
  } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>(
    {},
  );
  const [savingCommentId, setSavingCommentId] = useState<string | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
    null,
  );
  const [gifDimensions, setGifDimensions] = useState<
    Record<string, { width: number; height: number }>
  >({});
  const [galleryWidth, setGalleryWidth] = useState(320);
  const gradientCard = { backgroundColor: "transparent", borderColor: "#000000" };
  const privateMedia = privateMediaForDate(media, date);
  const chatEntries = intimateEntriesForDate(records, date);
  const day = getDay(date);
  const partnerId = memberId === "beans" ? "princess" : memberId === "princess" ? "beans" : null;
  const partnerViewedAt =
    partnerId && typeof day.steamyChatViewedAt?.[partnerId] === "string"
      ? day.steamyChatViewedAt[partnerId]
      : null;
  const currentViewedAt =
    memberId && typeof day.steamyChatViewedAt?.[memberId] === "string"
      ? day.steamyChatViewedAt[memberId]
      : null;
  const newestIncomingMessageAt =
    [...chatEntries]
      .reverse()
      .find((record) => record.authorId !== memberId)?.createdAt ?? null;

  useEffect(() => {
    const timer = setInterval(() => setToday(localDateKey()), 60_000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    setChatDraft("");
    setPendingPreview(null);
    setUploadError("");
    setUploadSuccess("");
    setCommentDrafts({});
  }, [date]);
  useEffect(() => {
    if (!revealed || !isToday || !memberId) return;
    if (!newestIncomingMessageAt) return;
    if (
      currentViewedAt &&
      new Date(currentViewedAt).getTime() >=
        new Date(newestIncomingMessageAt).getTime()
    ) return;
    const seenBy =
      day.steamyChatViewedAt && typeof day.steamyChatViewedAt === "object"
        ? day.steamyChatViewedAt
        : {};
    updateDay(date, {
      steamyChatViewedAt: { ...seenBy, [memberId]: new Date().toISOString() },
    });
  }, [
    revealed,
    isToday,
    memberId,
    date,
    currentViewedAt,
    newestIncomingMessageAt,
    day.steamyChatViewedAt,
    updateDay,
  ]);

  const addChatEntry = () => {
    const text = chatDraft.trim();
    if (!isToday || !text) return;
    addRecord("cumLog", { text, date, matureOnly: true });
    setChatDraft("");
  };

  const savePrivateAsset = useCallback(
    async (asset: ImagePicker.ImagePickerAsset) => {
      const selectedMimeType = imageMimeFromAsset(
        asset.mimeType,
        asset.fileName,
        asset.uri,
      );
      const fileName =
        asset.fileName ??
        `private-${Date.now()}.${selectedMimeType === "image/gif" ? "gif" : "jpg"}`;
      const byteSize = await pickedImageByteSize(asset.uri, asset.fileSize);
      if (byteSize > maxStoredBytesForMedia(selectedMimeType, "private")) {
        throw new Error(
          selectedMimeType === "image/gif"
            ? "This GIF is too large. Choose a GIF under 60 MB."
            : "This photo is too large. Choose a photo under 5 MB.",
        );
      }

      // Use direct S3 uploads for all private media so photos and GIFs avoid JSON/body-size parser failures.
      const resizedUri = await resizeImageIfNeeded(asset.uri, selectedMimeType);
      const resizedByteSize = await pickedImageByteSize(resizedUri, byteSize);
      const saved = await uploadPrivateMediaDirect({
        dailyDate: date,
        fileName,
        mimeType: selectedMimeType,
        uri: resizedUri,
        byteSize: resizedByteSize,
        caption: "",
        width: asset.width,
        height: asset.height,
      });
      if (!saved?.id)
        throw new Error(
          "The shared room did not confirm this private upload. Please try again.",
        );
      setUploadSuccess("Saved privately for both of you.");
    },
    [date, uploadPrivateMedia, uploadPrivateMediaDirect],
  );

  const pickPrivatePhoto = async () => {
    setUploading(true);
    setUploadError("");
    setUploadSuccess("");
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
        base64: false,
        preferredAssetRepresentationMode:
          Platform.OS === "ios"
            ? ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Current
            : undefined,
      });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      setPendingPreview({
        uri: asset.uri,
        isGif: isAnimatedGif(asset.mimeType, asset.fileName, asset.uri),
        width: asset.width,
        height: asset.height,
      });
      await savePrivateAsset(asset);
      setPendingPreview(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Please try choosing a smaller photo or GIF.";
      setUploadError(message);
      Alert.alert("Media wasn't saved", message);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    ImagePicker.getPendingResultAsync()
      .then(async (result) => {
        if (
          !result ||
          !("assets" in result) ||
          result.canceled ||
          !result.assets[0]
        )
          return;
        setUploading(true);
        try {
          await savePrivateAsset(result.assets[0]);
        } catch (error) {
          Alert.alert(
            "Photo wasn't saved",
            error instanceof Error
              ? error.message
              : "Please try choosing a smaller photo.",
          );
        } finally {
          setUploading(false);
        }
      })
      .catch(() => undefined);
  }, [savePrivateAsset]);

  const removePrivatePhoto = async (id: string) => {
    setDeletingId(id);
    try {
      await deletePrivateMedia(id);
      setConfirmDeleteId(null);
    } catch (error) {
      Alert.alert(
        "Photo wasn't removed",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setDeletingId(null);
    }
  };
  const submitPrivateComment = async (id: string) => {
    const text = (commentDrafts[id] ?? "").trim();
    if (!text) return;
    setSavingCommentId(id);
    try {
      await addPrivateMediaComment(id, text);
      setCommentDrafts((current) => ({ ...current, [id]: "" }));
    } catch (error) {
      Alert.alert(
        "Comment wasn’t saved",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setSavingCommentId(null);
    }
  };
  const removePrivateComment = async (mediaId: string, commentId: string) => {
    setDeletingCommentId(commentId);
    try {
      await deletePrivateMediaComment(mediaId, commentId);
    } catch (error) {
      Alert.alert(
        "Comment wasn’t removed",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setDeletingCommentId(null);
    }
  };
  const mediaUrl = (url: string) =>
    url.startsWith("/") ? `${getApiBaseUrl()}${url}` : url;
  const captureGifDimensions = (id: string, width: number, height: number) => {
    if (!width || !height) return;
    setGifDimensions((current) =>
      current[id]?.width === width && current[id]?.height === height
        ? current
        : { ...current, [id]: { width, height } },
    );
  };

  if (!revealed)
    return (
      <AppFrame showAutomaticPageReset={false}>
        <ScrollView
          contentContainerStyle={[
            styles.page,
            { backgroundColor: theme.backgroundColor ?? COLORS.blush },
          ]}
        >
          <View style={[styles.safeCard, gradientCard]}>
            <Text style={styles.safeMark}>♥</Text>
            <Text style={styles.eyebrow}>
              PRIVATE · ADULT-ONLY · {PARTNERS.beans.avatar}{" "}
              {PARTNERS.beans.name.toUpperCase()} + {PARTNERS.princess.avatar}{" "}
              {PARTNERS.princess.name.toUpperCase()}
            </Text>
            <Text style={styles.safeTitle}>Steamy</Text>
            <Text style={styles.safeCopy}>
              This section is for your shared daily intimate chat and your own
              uploaded private media. Only reveal it when you both agree the
              space is appropriate to open.
            </Text>
            <TouchableOpacity
              style={styles.revealButton}
              onPress={() => setRevealed(true)}
            >
              <Text style={styles.revealButtonText}>
                I understand · Tap to reveal
              </Text>
            </TouchableOpacity>
            <Text style={styles.safeHint}>
              Safe mode is on. Private media and intimate history remain hidden
              until you choose.
            </Text>
          </View>
        </ScrollView>
      </AppFrame>
    );

  return (
    <AppFrame showAutomaticPageReset={false}>
      <ScrollView
        contentContainerStyle={[
          styles.page,
          { backgroundColor: theme.backgroundColor ?? COLORS.blush },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>
              PRIVATE · ADULT-ONLY · {PARTNERS.beans.avatar}{" "}
              {PARTNERS.beans.name.toUpperCase()} + {PARTNERS.princess.avatar}{" "}
              {PARTNERS.princess.name.toUpperCase()}
            </Text>
            <Text style={styles.title}>Steamy</Text>
            <Text style={styles.subtitle}>
              A fresh private space each day, with older days kept in your
              history.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.safeToggle}
            onPress={() => setRevealed(false)}
          >
            <Text style={styles.safeToggleText}>Hide now</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.dayNav}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="View previous Steamy day"
            style={styles.dayNavButton}
            onPress={() => {
              const previous = new Date(`${date}T12:00:00`);
              previous.setDate(previous.getDate() - 1);
              router.replace({ pathname: "/steamy", params: { date: localDateKey(previous) } } as never);
            }}
          >
            <Text style={styles.dayNavText}>← Previous</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={
              isToday ? "Viewing today" : "View next Steamy day"
            }
            style={[styles.dayNavButton, isToday && styles.dayNavDisabled]}
            disabled={isToday}
            onPress={() => {
              const next = new Date(`${date}T12:00:00`);
              next.setDate(next.getDate() + 1);
              const nextDate = localDateKey(next);
              router.replace(
                nextDate === today
                  ? "/steamy"
                  : ({
                      pathname: "/steamy",
                      params: { date: nextDate },
                    } as never),
              );
            }}
          >
            <Text style={styles.dayNavText}>
              {isToday ? "Today" : "Next →"}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.viewingDate}>
          {isToday ? "TODAY" : "ARCHIVED DAY"} ·{" "}
          {prettyDate(date).toUpperCase()}
        </Text>
        <View style={styles.consent}>
          <Text style={styles.consentIcon}>✓</Text>
          <Text style={styles.consentText}>
            Only share your own content, keep consent current, and honor a pause
            or “not today” immediately.
          </Text>
        </View>
        {isToday ? <PageContentReset pageId="steamy" /> : null}

        <View style={[styles.cumCard, gradientCard]}>
          <Text style={styles.cardKicker}>PRIVATE INTIMATE CHAT</Text>
          <Text style={styles.cardTitle}>Shared intimate log</Text>
          <Text style={styles.copy}>
            {isToday
              ? "Chat privately together. Messages stay in today’s conversation, then remain in this dated history."
              : `Archived conversation from ${prettyDate(date)}.`}
          </Text>
          <ScrollView
            nestedScrollEnabled
            showsVerticalScrollIndicator
            persistentScrollbar={Platform.OS === "android"}
            style={styles.chatScroll}
            contentContainerStyle={styles.chatList}
          >
            {chatEntries.length ? (
              chatEntries.map((record) => {
                const author = PARTNERS[record.authorId];
                const mine = record.authorId === memberId;
                const read = mine && intimateEntryReadByPartner(record, partnerViewedAt);
                const text = String(record.content.text ?? "");
                return (
                  <View
                    key={record.id}
                    style={[
                      styles.chatBubbleWrap,
                      mine ? styles.chatMine : styles.chatPartner,
                    ]}
                  >
                    <View
                      style={[
                        styles.chatBubble,
                        mine ? styles.chatMineBubble : styles.chatPartnerBubble,
                      ]}
                    >
                      <Text
                        style={[styles.chatAuthor, { color: author.color }]}
                      >
                        {author.avatar} {author.name}
                      </Text>
                      <Text style={styles.chatText}>
                        {text || "Private entry added."}
                      </Text>
                      <Text style={styles.chatTime}>
                        {intimateEntryDateTimeLabel(record.createdAt, date)}
                        {mine ? (read ? " · Read" : " · Sent") : ""}
                      </Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.cumEmpty}>
                <Text style={styles.emptyGalleryTitle}>
                  {isToday
                    ? "Today’s private chat is ready."
                    : "No intimate entries were saved this day."}
                </Text>
                <Text style={styles.emptyGalleryCopy}>
                  {isToday
                    ? "Send the first private message whenever you are both ready."
                    : "Use Previous or Next to browse another day."}
                </Text>
              </View>
            )}
          </ScrollView>
          {isToday ? (
            <View style={styles.chatComposer}>
              <TextInput
                value={chatDraft}
                onChangeText={setChatDraft}
                placeholder="Write a private message…"
                placeholderTextColor="#7F7582"
                multiline
                style={styles.textArea}
              />
              <TouchableOpacity
                disabled={!chatDraft.trim()}
                style={[
                  styles.cumButton,
                  !chatDraft.trim() && styles.disabledPhotoButton,
                ]}
                onPress={addChatEntry}
              >
                <Text style={styles.cumButtonText}>Send private message</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        <View style={[styles.card, gradientCard]}>
          <Text style={styles.cardKicker}>PRIVATE GALLERY</Text>
          <Text style={styles.cardTitle}>Your own uploaded media</Text>
          <Text style={styles.copy}>
            {isToday
              ? "Private photos and animated GIFs save securely for today. GIFs upload directly to secure storage, so there is no JSON parser limit, and they fit fully in their gallery card."
              : `Viewing private media saved on ${prettyDate(date)}.`}
          </Text>
          {isToday ? (
            <>
              <TouchableOpacity
                style={styles.goldButton}
                disabled={uploading}
                onPress={pickPrivatePhoto}
              >
                <Text style={styles.goldButtonText}>
                  {uploading ? "Saving privately…" : "Choose photo or GIF"}
                </Text>
              </TouchableOpacity>
              {uploadSuccess ? (
                <Text style={styles.uploadSuccess}>{uploadSuccess}</Text>
              ) : null}
              {uploadError ? (
                <Text style={styles.uploadError}>{uploadError}</Text>
              ) : null}
            </>
          ) : null}
          <View
            style={styles.gallery}
            onLayout={(event) => {
              const width = Math.max(
                160,
                Math.round(event.nativeEvent.layout.width),
              );
              setGalleryWidth((current) =>
                current === width ? current : width,
              );
            }}
          >
            {pendingPreview ? (
              <View style={[styles.photoCard, styles.pendingPhotoCard]}>
                <ExpoImage
                  source={pendingPreview.uri}
                  autoplay={pendingPreview.isGif}
                  contentFit={pendingPreview.isGif ? "contain" : "cover"}
                  onLoad={({ source }) =>
                    pendingPreview.isGif &&
                    captureGifDimensions("pending", source.width, source.height)
                  }
                  style={[
                    styles.photo,
                    pendingPreview.isGif
                      ? [
                          styles.gifPhoto,
                          {
                            height: gifFrameHeight(
                              galleryWidth,
                              pendingPreview
                                ? {
                                    width:
                                      pendingPreview.width ??
                                      gifDimensions.pending?.width ??
                                      0,
                                    height:
                                      pendingPreview.height ??
                                      gifDimensions.pending?.height ??
                                      0,
                                  }
                                : undefined,
                            ),
                          },
                        ]
                      : undefined,
                  ]}
                />
                <View style={styles.photoFooter}>
                  <View style={styles.photoMetaRow}>
                    <Text style={styles.photoMeta}>
                      {uploading
                        ? "Selected · saving privately…"
                        : "Selected · not yet saved"}
                    </Text>
                    {pendingPreview.isGif ? (
                      <Text style={styles.gifBadge}>GIF</Text>
                    ) : null}
                  </View>
                  {!uploading ? (
                    <Text style={styles.unsavedPhotoCopy}>
                      Choose it again to retry the private save.
                    </Text>
                  ) : null}
                </View>
              </View>
            ) : null}
            {privateMedia.length ? (
              privateMedia.map((item) => {
                const owner = PARTNERS[item.uploadedBy ?? "beans"];
                const confirming = confirmDeleteId === item.id;
                const deleting = deletingId === item.id;
                const isGif = isAnimatedGif(
                  item.mimeType,
                  item.fileName,
                  item.url,
                );
                const dimensions =
                  item.width && item.height
                    ? { width: item.width, height: item.height }
                    : gifDimensions[item.id];
                const comments = privateMediaCommentsFor(item);
                const unreadComments = unreadPrivateMediaCommentCount(
                  comments,
                  memberId,
                  item.commentViewedAt?.[memberId ?? "beans"],
                );
                return (
                  <View key={item.id} style={styles.photoCard}>
                    {unreadComments ? (
                      <View
                        accessibilityRole="image"
                        accessibilityLabel={`${unreadComments} unread private ${unreadComments === 1 ? "comment" : "comments"}`}
                        style={styles.unreadPhotoHeart}
                      >
                        <Text style={styles.unreadPhotoHeartText}>♥</Text>
                        <Text style={styles.unreadPhotoHeartCount}>
                          {unreadComments > 9 ? "9+" : unreadComments}
                        </Text>
                      </View>
                    ) : null}
                    <ExpoImage
                      recyclingKey={`${item.id}-${galleryWidth}-${dimensions?.width ?? "auto"}-${dimensions?.height ?? "auto"}`}
                      source={mediaUrl(item.url)}
                      autoplay={isGif}
                      contentFit={isGif ? "contain" : "cover"}
                      onLoad={({ source }) =>
                        isGif &&
                        captureGifDimensions(
                          item.id,
                          source.width,
                          source.height,
                        )
                      }
                      style={[
                        styles.photo,
                        isGif
                          ? [
                              styles.gifPhoto,
                              {
                                height: gifFrameHeight(galleryWidth, dimensions),
                              },
                            ]
                          : undefined,
                      ]}
                    />
                    <PrivateMediaComments
                      comments={comments}
                      unreadCount={unreadComments}
                      draft={commentDrafts[item.id] ?? ""}
                      isToday={isToday}
                      saving={savingCommentId === item.id}
                      deletingCommentId={deletingCommentId}
                      currentMemberId={memberId}
                      onChangeDraft={(value) =>
                        setCommentDrafts((current) => ({
                          ...current,
                          [item.id]: value,
                        }))
                      }
                      onSubmit={() => {
                        void submitPrivateComment(item.id);
                      }}
                      onDelete={(commentId) => {
                        void removePrivateComment(item.id, commentId);
                      }}
                      onOpen={() => {
                        void markPrivateMediaCommentsViewed(item.id);
                      }}
                    />
                    <View style={styles.photoFooter}>
                      <View style={styles.photoMetaRow}>
                        <Text style={styles.photoMeta}>
                          {owner.avatar} {owner.name} · {prettyDate(date)}
                        </Text>
                        {isGif ? (
                          <Text style={styles.gifBadge}>GIF</Text>
                        ) : null}
                      </View>
                      {confirming ? (
                        <View style={styles.photoDeleteConfirm}>
                          <Text style={styles.photoDeleteCopy}>
                            Remove this photo or GIF?
                          </Text>
                          <TouchableOpacity
                            disabled={deleting}
                            onPress={() => setConfirmDeleteId(null)}
                            style={styles.keepPhotoButton}
                          >
                            <Text style={styles.keepPhotoText}>Keep</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            disabled={deleting}
                            onPress={() => removePrivatePhoto(item.id)}
                            style={[
                              styles.deletePhotoButton,
                              deleting && styles.disabledPhotoButton,
                            ]}
                          >
                            <Text style={styles.deletePhotoText}>
                              {deleting ? "Removing…" : "Remove"}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          onPress={() => setConfirmDeleteId(item.id)}
                          style={styles.deletePhotoLink}
                        >
                          <Text style={styles.deletePhotoLinkText}>
                            Remove photo or GIF
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })
            ) : pendingPreview ? null : (
              <View style={styles.emptyGallery}>
                <Text style={styles.emptyGalleryTitle}>
                  {isToday
                    ? "Today’s private gallery is empty."
                    : "No private media was saved this day."}
                </Text>
                <Text style={styles.emptyGalleryCopy}>
                  {isToday
                    ? "Choose a private photo or GIF from your device whenever you are both ready."
                    : "Use Previous or Next to browse another day."}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </AppFrame>
  );
}

const styles = StyleSheet.create({
  page: {
    padding: 18,
    paddingBottom: 36,
    gap: 16,
    backgroundColor: COLORS.blush,
    flexGrow: 1,
  },
  safeCard: {
    flex: 1,
    minHeight: 580,
    backgroundColor: "#160B10",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#60243D",
    padding: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  safeMark: { color: COLORS.rose, fontSize: 44, marginBottom: 10 },
  eyebrow: {
    color: COLORS.rose,
    fontSize: 10,
    letterSpacing: 1.3,
    fontWeight: "900",
  },
  safeTitle: {
    color: COLORS.plum,
    fontSize: 42,
    fontWeight: "900",
    fontStyle: "italic",
    marginTop: 4,
  },
  safeCopy: {
    color: COLORS.slate,
    fontFamily: "monospace",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 350,
    marginTop: 10,
  },
  revealButton: {
    backgroundColor: COLORS.rose,
    marginTop: 24,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  revealButtonText: { color: "#FFFFFF", fontWeight: "900", fontSize: 15 },
  safeHint: {
    color: "#B39BA7",
    fontSize: 11,
    fontFamily: "monospace",
    marginTop: 16,
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginTop: 4,
  },
  title: {
    color: COLORS.plum,
    fontSize: 34,
    fontWeight: "900",
    fontStyle: "italic",
    marginTop: -2,
  },
  subtitle: {
    color: COLORS.slate,
    fontFamily: "monospace",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
    maxWidth: 270,
  },
  safeToggle: {
    paddingVertical: 9,
    paddingHorizontal: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#6B2D45",
    backgroundColor: "#210F17",
  },
  safeToggleText: { color: "#F08AA9", fontSize: 11, fontWeight: "900" },
  dayNav: { flexDirection: "row", gap: 8 },
  dayNavButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#000000",
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  dayNavDisabled: { opacity: 0.55 },
  dayNavText: { color: COLORS.gold, fontSize: 12, fontWeight: "900" },
  viewingDate: {
    color: COLORS.slate,
    fontFamily: "monospace",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
    textAlign: "center",
  },
  consent: {
    backgroundColor: "#1A1418",
    borderWidth: 1,
    borderColor: "#49313B",
    borderRadius: 14,
    padding: 13,
    flexDirection: "row",
    gap: 9,
    alignItems: "flex-start",
  },
  consentIcon: { color: COLORS.sage, fontSize: 16, fontWeight: "900" },
  consentText: { color: "#C8BDC3", fontSize: 13, lineHeight: 19, flex: 1 },
  card: {
    backgroundColor: "#160B10",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#59243A",
    padding: 18,
  },
  cumCard: {
    backgroundColor: "#1B0A12",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#7B2F4A",
    padding: 18,
  },
  cardKicker: {
    color: COLORS.rose,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  cardTitle: {
    color: COLORS.plum,
    fontSize: 22,
    fontWeight: "800",
    fontStyle: "italic",
    marginTop: 5,
  },
  copy: {
    color: COLORS.slate,
    fontFamily: "monospace",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  goldButton: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.gold,
    marginTop: 10,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  goldButtonText: { color: "#1C1014", fontSize: 13, fontWeight: "900" },
  uploadSuccess: {
    color: "#8BE0B3",
    fontFamily: "monospace",
    fontSize: 11,
    marginTop: 9,
  },
  uploadError: {
    color: "#FFA5BB",
    fontFamily: "monospace",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 9,
  },
  gallery: { gap: 10, marginTop: 14 },
  photoCard: {
    position: "relative",
    backgroundColor: "#211218",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#49313B",
  },
  unreadPhotoHeart: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 3,
    minWidth: 31,
    height: 31,
    paddingHorizontal: 5,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    backgroundColor: "#D56B88",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#120B0F",
    shadowOpacity: 0.72,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  unreadPhotoHeartText: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 17,
    fontWeight: "900",
  },
  unreadPhotoHeartCount: {
    position: "absolute",
    right: -5,
    bottom: -5,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#1B0A12",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    color: "#FFFFFF",
    fontFamily: "monospace",
    fontSize: 8,
    lineHeight: 14,
    textAlign: "center",
    fontWeight: "900",
  },
  pendingPhotoCard: { borderColor: "#8A6030" },
  photo: { width: "100%", aspectRatio: 1.1, backgroundColor: "#120B0F" },
  gifPhoto: { aspectRatio: undefined, backgroundColor: "#120B0F" },
  photoFooter: { padding: 12, gap: 8 },
  photoMetaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  photoMeta: { color: COLORS.slate, fontFamily: "monospace", fontSize: 10 },
  unsavedPhotoCopy: { color: "#FFA5BB", fontFamily: "monospace", fontSize: 10 },
  gifBadge: {
    color: "#FFD88D",
    backgroundColor: "#372717",
    borderColor: "#8A6030",
    borderWidth: 1,
    borderRadius: 6,
    overflow: "hidden",
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  deletePhotoLink: { alignSelf: "flex-start", paddingVertical: 3 },
  deletePhotoLinkText: { color: "#F08AA9", fontSize: 10, fontWeight: "900" },
  photoDeleteConfirm: {
    gap: 7,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#49313B",
  },
  photoDeleteCopy: {
    color: COLORS.slate,
    fontFamily: "monospace",
    fontSize: 10,
  },
  keepPhotoButton: { alignSelf: "flex-start", paddingVertical: 4 },
  keepPhotoText: { color: COLORS.slate, fontSize: 10, fontWeight: "900" },
  deletePhotoButton: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.rose,
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  deletePhotoText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900" },
  disabledPhotoButton: { opacity: 0.55 },
  emptyGallery: { backgroundColor: "#211218", borderRadius: 12, padding: 15 },
  emptyGalleryTitle: {
    color: COLORS.plum,
    fontSize: 16,
    fontWeight: "800",
    fontStyle: "italic",
  },
  emptyGalleryCopy: {
    color: COLORS.slate,
    fontFamily: "monospace",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  chatScroll: { maxHeight: 280, marginTop: 14 },
  chatList: { gap: 8, paddingRight: 5 },
  chatBubbleWrap: { width: "100%" },
  chatMine: { alignItems: "flex-end" },
  chatPartner: { alignItems: "flex-start" },
  chatBubble: {
    maxWidth: "88%",
    borderRadius: 14,
    padding: 11,
    borderWidth: 1,
  },
  chatMineBubble: {
    backgroundColor: "#3D1730",
    borderColor: "#9B426A",
    borderBottomRightRadius: 3,
  },
  chatPartnerBubble: {
    backgroundColor: "#281018",
    borderColor: "#5A2D3D",
    borderBottomLeftRadius: 3,
  },
  chatAuthor: { fontSize: 10, fontWeight: "900", marginBottom: 3 },
  chatText: { color: "#F7E6EE", fontSize: 14, lineHeight: 20 },
  chatTime: {
    color: "#BCA5AF",
    fontFamily: "monospace",
    fontSize: 8,
    marginTop: 6,
  },
  chatComposer: { marginTop: 10 },
  textArea: {
    minHeight: 54,
    maxHeight: 92,
    marginTop: 0,
    backgroundColor: "#120B0F",
    borderWidth: 1,
    borderColor: "#49313B",
    borderRadius: 13,
    color: COLORS.plum,
    padding: 12,
    textAlignVertical: "top",
    fontSize: 14,
  },
  cumButton: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.rose,
    marginTop: 10,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  cumButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  cumEmpty: { backgroundColor: "#281018", borderRadius: 12, padding: 14 },
});
