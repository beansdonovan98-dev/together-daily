import type { PartnerId } from "./local-journal";

export type PrivateMediaComment = {
  id: string;
  authorId: PartnerId;
  text: string;
  createdAt: string;
};

type CommentablePrivateMedia = {
  id: string;
  uploadedBy?: PartnerId;
  createdAt: string;
  caption?: string;
  comments?: unknown;
};

function isPartnerId(value: unknown): value is PartnerId {
  return value === "beans" || value === "princess";
}

function validComments(value: unknown): PrivateMediaComment[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((comment) => {
    if (!comment || typeof comment !== "object") return [];
    const candidate = comment as Record<string, unknown>;
    const text = typeof candidate.text === "string" ? candidate.text.trim() : "";
    if (!text || typeof candidate.id !== "string" || !isPartnerId(candidate.authorId) || typeof candidate.createdAt !== "string") return [];
    return [{ id: candidate.id, authorId: candidate.authorId, text, createdAt: candidate.createdAt }];
  });
}

/** Returns older comments first, including an existing legacy caption as a preserved first comment. */
export function privateMediaCommentsFor(media: CommentablePrivateMedia): PrivateMediaComment[] {
  const comments = validComments(media.comments);
  const legacyCaption = typeof media.caption === "string" ? media.caption.trim() : "";
  if (legacyCaption && !comments.some((comment) => comment.id === `${media.id}-legacy-caption`)) {
    comments.push({
      id: `${media.id}-legacy-caption`,
      authorId: media.uploadedBy ?? "beans",
      text: legacyCaption,
      createdAt: media.createdAt,
    });
  }
  return comments.sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}
