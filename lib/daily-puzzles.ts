export type DailyPuzzleSet = {
  sudoku: { grid: number[]; solution: number[] };
  word: { scramble: string; answer: string; clue: string };
  sequence: { prompt: string; answer: string; hint: string };
};

const SUDOKU_SETS: DailyPuzzleSet["sudoku"][] = [
  {
    grid: [1, 0, 3, 0, 0, 4, 0, 2, 2, 0, 4, 0, 0, 3, 0, 1],
    solution: [1, 2, 3, 4, 3, 4, 1, 2, 2, 1, 4, 3, 4, 3, 2, 1],
  },
  {
    grid: [2, 0, 4, 0, 0, 3, 0, 1, 1, 0, 3, 0, 0, 4, 0, 2],
    solution: [2, 1, 4, 3, 4, 3, 2, 1, 1, 2, 3, 4, 3, 4, 1, 2],
  },
  {
    grid: [4, 0, 2, 0, 0, 1, 0, 3, 3, 0, 1, 0, 0, 2, 0, 4],
    solution: [4, 3, 2, 1, 2, 1, 4, 3, 3, 4, 1, 2, 1, 2, 3, 4],
  },
];

export function hasUniqueSudokuSolution(grid: readonly number[]): boolean {
  if (grid.length !== 16 || grid.some((value) => !Number.isInteger(value) || value < 0 || value > 4)) return false;
  const board = [...grid];
  let solutions = 0;
  const candidatesFor = (index: number) => {
    const row = Math.floor(index / 4);
    const column = index % 4;
    const boxRow = Math.floor(row / 2) * 2;
    const boxColumn = Math.floor(column / 2) * 2;
    const used = new Set<number>();
    for (let i = 0; i < 4; i += 1) { used.add(board[row * 4 + i]); used.add(board[i * 4 + column]); }
    for (let y = boxRow; y < boxRow + 2; y += 1) for (let x = boxColumn; x < boxColumn + 2; x += 1) used.add(board[y * 4 + x]);
    return [1, 2, 3, 4].filter((value) => !used.has(value));
  };
  const solve = () => {
    if (solutions > 1) return;
    let target = -1;
    let candidates: number[] = [];
    for (let index = 0; index < board.length; index += 1) {
      if (board[index] !== 0) continue;
      const nextCandidates = candidatesFor(index);
      if (!nextCandidates.length) return;
      if (target === -1 || nextCandidates.length < candidates.length) { target = index; candidates = nextCandidates; }
    }
    if (target === -1) { solutions += 1; return; }
    for (const value of candidates) { board[target] = value; solve(); board[target] = 0; }
  };
  solve();
  return solutions === 1;
}

const WORD_PUZZLES: DailyPuzzleSet["word"][] = [
  { scramble: "GTEEHROT", answer: "TOGETHER", clue: "A word for the two of you as a pair." },
  { scramble: "SDSIEKN", answer: "KINDNESS", clue: "A small choice that strengthens love." },
  { scramble: "CENPATI", answer: "PATIENCE", clue: "A useful quality on a hard day." },
  { scramble: "NITSEUL", answer: "LISTEN", clue: "The first step in a good conversation." },
];

const SEQUENCE_PUZZLES: DailyPuzzleSet["sequence"][] = [
  { prompt: "2, 4, 8, 16, ?", answer: "32", hint: "Each number doubles." },
  { prompt: "1, 1, 2, 3, 5, ?", answer: "8", hint: "Add the two numbers before it." },
  { prompt: "3, 6, 9, 12, ?", answer: "15", hint: "Add the same number each time." },
  { prompt: "20, 17, 14, 11, ?", answer: "8", hint: "Count backward by three." },
];

function dateSeed(dateKey: string) {
  const timestamp = Date.parse(`${dateKey}T12:00:00Z`);
  if (Number.isFinite(timestamp)) return Math.floor(timestamp / 86_400_000);
  return [...dateKey].reduce((sum, character, index) => sum + character.charCodeAt(0) * (index + 3), 0);
}

export function dailyPuzzlesFor(dateKey: string): DailyPuzzleSet {
  const seed = dateSeed(dateKey);
  return {
    sudoku: SUDOKU_SETS[seed % SUDOKU_SETS.length],
    word: WORD_PUZZLES[(seed * 3 + 1) % WORD_PUZZLES.length],
    sequence: SEQUENCE_PUZZLES[(seed * 5 + 2) % SEQUENCE_PUZZLES.length],
  };
}
