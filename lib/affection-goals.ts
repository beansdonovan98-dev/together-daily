export type AffectionGoalKey = "hugs" | "kisses" | "loveYew";

export type AffectionGoal = {
  key: AffectionGoalKey;
  emoji: string;
  label: string;
};

export const AFFECTION_GOAL_KEYS: AffectionGoalKey[] = ["hugs", "kisses", "loveYew"];

export const DEFAULT_AFFECTION_GOALS: AffectionGoal[] = [
  { key: "hugs", emoji: "🤗", label: "Hugs" },
  { key: "kisses", emoji: "💋", label: "Kisses" },
  { key: "loveYew", emoji: "♥", label: "I love yew" },
];

export function normalizeAffectionGoals(value: unknown): AffectionGoal[] {
  const items = Array.isArray(value) ? value : [];
  return DEFAULT_AFFECTION_GOALS.map((fallback) => {
    const candidate = items.find((item) => item && typeof item === "object" && (item as Record<string, unknown>).key === fallback.key) as Record<string, unknown> | undefined;
    const label = typeof candidate?.label === "string" ? candidate.label.trim().slice(0, 40) : "";
    const emoji = typeof candidate?.emoji === "string" ? candidate.emoji.trim().slice(0, 12) : "";
    return {
      key: fallback.key,
      label: label || fallback.label,
      emoji: emoji || fallback.emoji,
    };
  });
}

export function updateAffectionGoal(
  goals: AffectionGoal[],
  key: AffectionGoalKey,
  patch: Pick<AffectionGoal, "emoji" | "label">,
): AffectionGoal[] {
  const normalized = normalizeAffectionGoals(goals);
  const label = patch.label.trim().slice(0, 40);
  const emoji = patch.emoji.trim().slice(0, 12);
  if (!label || !emoji) return normalized;
  return normalized.map((goal) => goal.key === key ? { ...goal, label, emoji } : goal);
}
