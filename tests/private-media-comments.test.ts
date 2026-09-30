import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { privateMediaCommentsFor, unreadPrivateMediaCommentCount } from "../lib/private-media-comments";

describe("private media comments", () => {
  it("keeps comments in conversation order and preserves a prior caption as a comment", () => {
    const comments = privateMediaCommentsFor({
      id: "gif-1",
      uploadedBy: "beans",
      createdAt: "2026-09-24T10:00:00.000Z",
      caption: "Old caption",
      comments: [
        { id: "new", authorId: "princess", text: "Newer reply", createdAt: "2026-09-24T12:00:00.000Z" },
        { id: "first", authorId: "beans", text: "First reply", createdAt: "2026-09-24T11:00:00.000Z" },
      ],
    });

    expect(comments.map((comment) => comment.text)).toEqual(["Old caption", "First reply", "Newer reply"]);
    expect(comments[0].authorId).toBe("beans");
  });

  it("keeps unlimited saved comments available behind a compact collapsible drawer", () => {
    const component = readFileSync(resolve(process.cwd(), "components/private-media-comments.tsx"), "utf8");

    expect(component).toContain("const [expanded, setExpanded] = useState(false)");
    expect(component).toContain("accessibilityLabel=\"Toggle private media comments\"");
    expect(component).toContain("style={styles.commentScroll}");
    expect(component).toContain("commentScroll: { maxHeight: 176 }");
    expect(component).toContain("comments.map((comment)");
    expect(component).not.toContain("comments.slice(");
  });

  it("opens an expanded drawer at the newest comment and puts an unread heart on its photo", () => {
    const component = readFileSync(resolve(process.cwd(), "components/private-media-comments.tsx"), "utf8");
    const steamy = readFileSync(resolve(process.cwd(), "app/(tabs)/steamy.tsx"), "utf8");

    expect(component).toContain("commentScrollRef.current?.scrollToEnd({ animated: false })");
    expect(component).toContain("onContentSizeChange={jumpToNewestComment}");
    expect(component).toContain("setExpanded(true)");
    expect(steamy).toContain("unreadComments ? (");
    expect(steamy).toContain("styles.unreadPhotoHeart");
    expect(steamy).toContain("unread private");
  });

  it("counts only unread partner replies until the comment drawer is opened", () => {
    const comments = [
      { id: "mine", authorId: "beans" as const, text: "Mine", createdAt: "2026-09-29T10:00:00.000Z" },
      { id: "old", authorId: "princess" as const, text: "Old", createdAt: "2026-09-29T10:01:00.000Z" },
      { id: "new", authorId: "princess" as const, text: "New", createdAt: "2026-09-29T10:03:00.000Z" },
    ];

    expect(unreadPrivateMediaCommentCount(comments, "beans", "2026-09-29T10:02:00.000Z")).toBe(1);
    expect(unreadPrivateMediaCommentCount(comments, "beans", "2026-09-29T10:04:00.000Z")).toBe(0);
    expect(unreadPrivateMediaCommentCount(comments, "beans")).toBe(2);

    const component = readFileSync(resolve(process.cwd(), "components/private-media-comments.tsx"), "utf8");
    const journal = readFileSync(resolve(process.cwd(), "lib/local-journal.tsx"), "utf8");
    const router = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
    expect(component).toContain("NEW");
    expect(component).toContain("onOpen();");
    expect(journal).toContain("markPrivateMediaCommentsViewed");
    expect(router).toContain("markPrivateMediaCommentsViewed");
  });
});
