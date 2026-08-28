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
