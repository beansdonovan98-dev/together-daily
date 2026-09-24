import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { appendDailyLogTodo, dailyLogTodos, renameDailyLogTodo, toggleDailyLogTodo } from "../lib/daily-log-todos";

describe("Daily Log checklist", () => {
  const todos = [{ id: "todo-1", text: "Book dinner", completed: false, createdBy: "beans" as const }];

  it("normalizes persisted bullet items and ignores malformed entries", () => {
    expect(dailyLogTodos([...todos, { id: "bad", completed: false }, null])).toEqual(todos);
  });

  it("lets either partner cross off and edit a daily log item", () => {
    const checked = toggleDailyLogTodo(todos, "todo-1", "princess");
    expect(checked[0]).toMatchObject({ completed: true, completedBy: "princess" });
    expect(renameDailyLogTodo(checked, "todo-1", "Reserve dinner")[0].text).toBe("Reserve dinner");
    expect(toggleDailyLogTodo(checked, "todo-1", "princess")[0]).toMatchObject({ completed: false, completedBy: undefined });
  });

  it("keeps the checklist top-to-bottom by appending new tasks at the bottom", () => {
    const next = appendDailyLogTodo(todos, { id: "todo-2", text: "Send photo", completed: false, createdBy: "princess" });
    expect(next.map((todo) => todo.text)).toEqual(["Book dinner", "Send photo"]);
  });

  it("replaces Notes & Debrief with a checkable Daily Log list", () => {
    const log = readFileSync(resolve(process.cwd(), "app/(tabs)/log.tsx"), "utf8");

    expect(log).toContain("Daily to-do list");
    expect(log).toContain('accessibilityRole="checkbox"');
    expect(log).toContain("beginTodoEdit(todo)");
    expect(log).toContain("deleteLogTodo(todo.id)");
    expect(log).not.toContain("Notes & Debrief");
  });
});
