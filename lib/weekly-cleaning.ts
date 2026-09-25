export type WeeklyCleaningTask = {
  id: string;
  text: string;
  createdBy: "beans" | "princess";
  completed: boolean;
  completedBy?: "beans" | "princess";
};

function isPartnerId(value: unknown): value is WeeklyCleaningTask["createdBy"] {
  return value === "beans" || value === "princess";
}

/** Normalizes legacy saved task arrays before appending a new weekly task. */
export function weeklyCleaningTasks(value: unknown): WeeklyCleaningTask[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is WeeklyCleaningTask => {
    if (!item || typeof item !== "object") return false;
    const task = item as Partial<WeeklyCleaningTask>;
    return (
      typeof task.id === "string" &&
      Boolean(task.id) &&
      typeof task.text === "string" &&
      Boolean(task.text.trim()) &&
      isPartnerId(task.createdBy) &&
      typeof task.completed === "boolean" &&
      (task.completedBy === undefined || isPartnerId(task.completedBy))
    );
  });
}

/** Appends without reordering existing chores, so the weekly list remains stable for both partners. */
export function appendWeeklyCleaningTask(
  current: unknown,
  task: WeeklyCleaningTask,
): WeeklyCleaningTask[] {
  return [...weeklyCleaningTasks(current), task];
}
