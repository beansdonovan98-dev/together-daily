export type DailyLogTodo = {
  id: string;
  text: string;
  completed: boolean;
  createdBy: "beans" | "princess";
  completedBy?: "beans" | "princess";
};

export function dailyLogTodos(value: unknown): DailyLogTodo[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const candidate = item as Record<string, unknown>;
    const text = typeof candidate.text === "string" ? candidate.text.trim() : "";
    const createdBy = candidate.createdBy === "princess" ? candidate.createdBy : "beans";
    if (!text || typeof candidate.id !== "string") return [];
    return [{
      id: candidate.id,
      text,
      completed: Boolean(candidate.completed),
      createdBy,
      ...(candidate.completedBy === "beans" || candidate.completedBy === "princess" ? { completedBy: candidate.completedBy } : {}),
    }];
  });
}

/** Appends a new task so the Daily Log always reads from older tasks at the top to newer tasks at the bottom. */
export function appendDailyLogTodo(todos: DailyLogTodo[], todo: DailyLogTodo) {
  return [...todos, todo];
}

export function renameDailyLogTodo(todos: DailyLogTodo[], id: string, text: string) {
  const nextText = text.trim();
  if (!nextText) return todos;
  return todos.map((todo) => todo.id === id ? { ...todo, text: nextText } : todo);
}

export function toggleDailyLogTodo(todos: DailyLogTodo[], id: string, partnerId: "beans" | "princess") {
  return todos.map((todo) => todo.id === id
    ? { ...todo, completed: !todo.completed, ...(todo.completed ? { completedBy: undefined } : { completedBy: partnerId }) }
    : todo);
}
