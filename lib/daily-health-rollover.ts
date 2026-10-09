export type CarriedHealthTask = {
  id: string;
  text: string;
  done: Record<string, boolean>;
  [key: string]: unknown;
};

/** Daily food entries are deliberately never carried into the next calendar day. */
export function freshDailyFoodState() {
  return {
    meals: {
      breakfast: "",
      breakfastDone: false,
      lunch: "",
      lunchDone: false,
      dinner: "",
      dinnerDone: false,
      prepGrocery: "",
      prepGroceryDone: false,
    },
    mealMeta: {},
    health: { snacks: [] as unknown[] },
  };
}

export function carryDailyHealthTasks(days: Record<string, Record<string, unknown>>, date: string): CarriedHealthTask[] {
  const previousDate = Object.keys(days).filter((existingDate) => existingDate < date).sort().at(-1);
  const previousDay = previousDate ? days[previousDate] : undefined;
  const previousHealth = previousDay && typeof previousDay.health === "object" && previousDay.health !== null
    ? previousDay.health as Record<string, unknown>
    : {};
  const previousTasks: unknown[] = Array.isArray(previousHealth.tasks) ? previousHealth.tasks : [];

  return previousTasks
    .filter((task): task is Record<string, unknown> => {
      if (!task || typeof task !== "object") return false;
      const record = task as Record<string, unknown>;
      return typeof record.text === "string" && record.text.trim().length > 0;
    })
    .map((task, index) => {
      const { done: _previousCompletion, ...details } = task;
      return {
        ...details,
        id: typeof details.id === "string" ? details.id : `health-task-${date}-${index}`,
        text: String(details.text).trim(),
        done: {},
      };
    });
}
