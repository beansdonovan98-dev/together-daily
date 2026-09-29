import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { privateMediaCommentsFor } from "../lib/private-media-comments";

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
});
