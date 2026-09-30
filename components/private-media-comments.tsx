import { PARTNERS, type PartnerId } from "@/lib/local-journal";
import type { PrivateMediaComment } from "@/lib/private-media-comments";
import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { VisualText as Text, VisualTextInput as TextInput, VisualTouchableOpacity as TouchableOpacity, VisualView as View } from "./visual-primitives";

type PrivateMediaCommentsProps = {
  comments: PrivateMediaComment[];
  unreadCount: number;
  draft: string;
  isToday: boolean;
  saving: boolean;
  deletingCommentId: string | null;
  currentMemberId: PartnerId | null;
  onChangeDraft: (text: string) => void;
  onSubmit: () => void;
  onDelete: (commentId: string) => void;
  onOpen: () => void;
};

function canDeleteComment(comment: PrivateMediaComment, currentMemberId: PartnerId | null) {
  return currentMemberId === comment.authorId && !comment.id.endsWith("-legacy-caption");
}

export function PrivateMediaComments({ comments, unreadCount, draft, isToday, saving, deletingCommentId, currentMemberId, onChangeDraft, onSubmit, onDelete, onOpen }: PrivateMediaCommentsProps) {
  const [expanded, setExpanded] = useState(false);
  const commentScrollRef = useRef<ScrollView>(null);
  const commentCount = comments.length;
  const jumpToNewestComment = useCallback(() => {
    if (!expanded || !commentCount) return;
    requestAnimationFrame(() => commentScrollRef.current?.scrollToEnd({ animated: false }));
  }, [commentCount, expanded]);
  useEffect(() => {
    if (!expanded || !commentCount) return;
    const timer = setTimeout(jumpToNewestComment, 30);
    return () => clearTimeout(timer);
  }, [expanded, commentCount, jumpToNewestComment]);
  const openComments = () => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    if (unreadCount) onOpen();
    setExpanded(true);
  };
  return <View style={styles.section}>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Toggle private media comments" accessibilityState={{ expanded }} onPress={openComments} style={styles.toggle}>
      <View style={styles.toggleLead}><Text style={styles.kicker}>PRIVATE COMMENTS</Text><Text style={styles.count}>{commentCount ? `${commentCount} saved` : "Add a note"}</Text>{!expanded && unreadCount ? <View style={styles.unreadBadge}><Text style={styles.unreadText}>{unreadCount > 9 ? "9+" : unreadCount} NEW</Text></View> : null}</View>
      <Text style={styles.chevron}>{expanded ? "⌃" : "⌄"}</Text>
    </TouchableOpacity>
    {expanded && (comments.length ? <ScrollView ref={commentScrollRef} nestedScrollEnabled showsVerticalScrollIndicator style={styles.commentScroll} contentContainerStyle={styles.list} onContentSizeChange={jumpToNewestComment}>{comments.map((comment) => {
      const author = PARTNERS[comment.authorId as PartnerId];
      const deleting = deletingCommentId === comment.id;
      return <View key={comment.id} style={[styles.comment, { borderLeftColor: author.color }]}>
        <View style={styles.commentHeader}>
          <Text style={[styles.author, { color: author.color }]}>{author.avatar} {author.name}</Text>
          {canDeleteComment(comment, currentMemberId) ? <TouchableOpacity disabled={deleting} accessibilityRole="button" accessibilityLabel="Delete your private comment" onPress={() => onDelete(comment.id)} style={[styles.delete, deleting && styles.disabled]}><Text style={styles.deleteText}>{deleting ? "Deleting…" : "Delete"}</Text></TouchableOpacity> : null}
        </View>
        <Text style={styles.body}>{comment.text}</Text>
      </View>;
    })}</ScrollView> : <Text style={styles.empty}>No comments yet. Leave a private note for each other.</Text>)}
    {isToday ? <View style={styles.composer}>
      <TextInput value={draft} onChangeText={onChangeDraft} placeholder="Add a private comment…" placeholderTextColor="#7F7582" maxLength={500} multiline style={styles.input} />
      <TouchableOpacity disabled={saving || !draft.trim()} onPress={onSubmit} style={[styles.send, (saving || !draft.trim()) && styles.disabled]}><Text style={styles.sendText}>{saving ? "Sending…" : "Comment"}</Text></TouchableOpacity>
    </View> : null}
  </View>;
}

const styles = StyleSheet.create({
  section: { marginTop: 10, borderTopWidth: 1, borderTopColor: "#49313B", paddingTop: 10, gap: 8 },
  toggle: { minHeight: 30, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  toggleLead: { flexDirection: "row", alignItems: "baseline", gap: 7, flex: 1 },
  kicker: { color: "#A89AA1", fontFamily: "monospace", fontSize: 9, fontWeight: "900", letterSpacing: .8 },
  count: { color: "#D8C7D0", fontFamily: "monospace", fontSize: 9 },
  unreadBadge: { borderRadius: 9, backgroundColor: "#D56B88", paddingHorizontal: 6, paddingVertical: 2 },
  unreadText: { color: "#FFFFFF", fontSize: 8, fontWeight: "900", letterSpacing: .5 },
  chevron: { color: "#F7E6EE", fontSize: 16, fontWeight: "900" },
  commentScroll: { maxHeight: 176 },
  list: { gap: 7 },
  comment: { borderLeftWidth: 3, paddingLeft: 9, gap: 2 },
  commentHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  author: { fontSize: 10, fontWeight: "900", flex: 1 },
  body: { color: "#F7E6EE", fontSize: 13, lineHeight: 18 },
  delete: { paddingVertical: 2, paddingHorizontal: 2 },
  deleteText: { color: "#F08AA9", fontSize: 9, fontWeight: "900" },
  empty: { color: "#A89AA1", fontFamily: "monospace", fontSize: 10, lineHeight: 15 },
  composer: { gap: 7 },
  input: { minHeight: 54, borderWidth: 1, borderColor: "#49313B", borderRadius: 10, backgroundColor: "#120B0F", color: "#F7E6EE", padding: 10, textAlignVertical: "top", fontSize: 12 },
  send: { alignSelf: "flex-start", borderRadius: 8, backgroundColor: "#D56B88", paddingVertical: 7, paddingHorizontal: 10 },
  disabled: { opacity: .5 },
  sendText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900" },
});
