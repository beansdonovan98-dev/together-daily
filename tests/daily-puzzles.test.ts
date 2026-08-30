import { describe, expect, it } from "vitest";

import { dailyPuzzlesFor, hasUniqueSudokuSolution } from "../lib/daily-puzzles";

describe("daily puzzles", () => {
  it("is deterministic for a date and changes across the daily rotation", () => {
    expect(dailyPuzzlesFor("2026-08-28")).toEqual(dailyPuzzlesFor("2026-08-28"));
    expect(dailyPuzzlesFor("2026-08-28")).not.toEqual(dailyPuzzlesFor("2026-08-29"));
  });

  it("provides a valid four-by-four Sudoku plus two short answer puzzles", () => {
    const puzzles = dailyPuzzlesFor("2026-08-28");
    expect(puzzles.sudoku.grid).toHaveLength(16);
    expect(puzzles.sudoku.solution).toHaveLength(16);
    expect(puzzles.sudoku.solution.every((value) => value >= 1 && value <= 4)).toBe(true);
    expect(puzzles.sudoku.grid.some((value) => value === 0)).toBe(true);
    expect(puzzles.word.answer).not.toBe("");
    expect(puzzles.sequence.answer).not.toBe("");
  });

  it("only presents daily Sudoku boards with exactly one valid solution", () => {
    const puzzles = ["2026-08-01", "2026-08-02", "2026-08-03"].map((date) => dailyPuzzlesFor(date).sudoku);
    expect(puzzles.every((puzzle) => hasUniqueSudokuSolution(puzzle.grid))).toBe(true);
  });
});
