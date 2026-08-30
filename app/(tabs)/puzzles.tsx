import { AppFrame } from "@/components/app-frame";
import { PrivateGate } from "@/components/together-access";
import { VisualText as Text, VisualTextInput as TextInput, VisualTouchableOpacity as TouchableOpacity, VisualView as View } from "@/components/visual-primitives";
import { dailyPuzzlesFor } from "@/lib/daily-puzzles";
import { asObject, localDateKey, prettyDate } from "@/lib/together";
import { useLocalJournal } from "@/lib/local-journal";
import { useEffect, useMemo, useRef } from "react";
import { ScrollView, StyleSheet } from "react-native";

type PuzzleState = {
  sudoku?: string[];
  sudokuSolved?: boolean;
  wordAnswer?: string;
  wordSolved?: boolean;
  sequenceAnswer?: string;
  sequenceSolved?: boolean;
};

export default function PuzzlesScreen() {
  return <PrivateGate>{() => <PuzzleContent />}</PrivateGate>;
}

function PuzzleContent() {
  const today = localDateKey();
  const { ready, ensureDay, getDay, updateDay } = useLocalJournal();
  const puzzle = useMemo(() => dailyPuzzlesFor(today), [today]);

  useEffect(() => {
    if (ready) ensureDay(today);
  }, [ensureDay, ready, today]);

  const day = asObject(getDay(today));
  const saved = asObject(day.puzzles) as PuzzleState;
  const sudokuValues = Array.from({ length: 16 }, (_, index) => String(saved.sudoku?.[index] ?? ""));
  const sudokuValuesRef = useRef(sudokuValues);
  useEffect(() => { sudokuValuesRef.current = sudokuValues; });
  const updatePuzzles = (patch: Partial<PuzzleState>) => updateDay(today, { puzzles: { ...saved, ...patch } });
  const setSudokuValue = (index: number, value: string) => {
    const next = [...sudokuValuesRef.current];
    next[index] = value.replace(/[^1-4]/g, "").slice(0, 1);
    sudokuValuesRef.current = next;
    updatePuzzles({ sudoku: next, sudokuSolved: false });
  };
  const checkSudoku = () => {
    const solved = puzzle.sudoku.solution.every((value, index) => {
      const fixed = puzzle.sudoku.grid[index];
      return Number(fixed || sudokuValues[index]) === value;
    });
    updatePuzzles({ sudokuSolved: solved });
  };
  const checkWord = () => updatePuzzles({ wordSolved: String(saved.wordAnswer ?? "").trim().toUpperCase() === puzzle.word.answer });
  const checkSequence = () => updatePuzzles({ sequenceSolved: String(saved.sequenceAnswer ?? "").trim() === puzzle.sequence.answer });

  if (!ready) return <AppFrame><View style={styles.loading}><Text>Opening Puzzles…</Text></View></AppFrame>;

  return <AppFrame><ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
    <Text style={styles.eyebrow}>A LITTLE PLAY, EVERY DAY</Text>
    <Text style={styles.hero}>Daily puzzles</Text>
    <Text style={styles.copy}>{prettyDate(today)} · A fresh Sudoku and two quick puzzles appear each day.</Text>

    <View style={styles.card}>
      <Text style={styles.kicker}>PUZZLE ONE</Text>
      <Text style={styles.title}>Mini Sudoku</Text>
      <Text style={styles.copy}>Fill each row, column, and 2×2 box with 1 through 4.</Text>
      <View style={styles.sudokuGrid}>
        {Array.from({ length: 4 }, (_, row) => <View key={row} style={styles.sudokuRow}>
          {Array.from({ length: 4 }, (_, column) => {
            const index = row * 4 + column;
            const given = puzzle.sudoku.grid[index];
            return given ? <View key={index} style={[styles.sudokuCell, styles.sudokuGiven]}><Text style={styles.sudokuGivenText}>{given}</Text></View> : <TextInput key={index} accessibilityLabel={`Sudoku row ${row + 1} column ${column + 1}`} value={sudokuValues[index]} onChangeText={(value) => setSudokuValue(index, value)} keyboardType="number-pad" maxLength={1} style={styles.sudokuInput} textAlign="center" />;
          })}
        </View>)}
      </View>
      <TouchableOpacity accessibilityRole="button" onPress={checkSudoku} style={styles.action}><Text style={styles.actionText}>Check Sudoku</Text></TouchableOpacity>
      {saved.sudokuSolved ? <Text style={styles.success}>✓ Sudoku solved!</Text> : <Text style={styles.helper}>Keep trying—only the correct solution will complete it.</Text>}
    </View>

    <View style={styles.card}>
      <Text style={styles.kicker}>PUZZLE TWO</Text>
      <Text style={styles.title}>Word scramble</Text>
      <View style={styles.miniPrompt}><Text style={styles.scramble}>{puzzle.word.scramble}</Text><Text style={styles.copy}>{puzzle.word.clue}</Text></View>
      <View style={styles.answerRow}><TextInput accessibilityLabel="Word scramble answer" value={saved.wordAnswer ?? ""} onChangeText={(wordAnswer) => updatePuzzles({ wordAnswer, wordSolved: false })} autoCapitalize="characters" placeholder="Your answer" style={styles.answerInput} /><TouchableOpacity accessibilityRole="button" onPress={checkWord} style={styles.smallAction}><Text style={styles.actionText}>Check</Text></TouchableOpacity></View>
      {saved.wordSolved ? <Text style={styles.success}>✓ Exactly right!</Text> : <Text style={styles.helper}>Unscramble all eight letters.</Text>}
    </View>

    <View style={styles.card}>
      <Text style={styles.kicker}>PUZZLE THREE</Text>
      <Text style={styles.title}>Number sequence</Text>
      <View style={styles.miniPrompt}><Text style={styles.sequence}>{puzzle.sequence.prompt}</Text><Text style={styles.copy}>{puzzle.sequence.hint}</Text></View>
      <View style={styles.answerRow}><TextInput accessibilityLabel="Number sequence answer" value={saved.sequenceAnswer ?? ""} onChangeText={(sequenceAnswer) => updatePuzzles({ sequenceAnswer, sequenceSolved: false })} keyboardType="number-pad" placeholder="Next number" style={styles.answerInput} /><TouchableOpacity accessibilityRole="button" onPress={checkSequence} style={styles.smallAction}><Text style={styles.actionText}>Check</Text></TouchableOpacity></View>
      {saved.sequenceSolved ? <Text style={styles.success}>✓ Sequence solved!</Text> : <Text style={styles.helper}>Find the next number in the pattern.</Text>}
    </View>
  </ScrollView></AppFrame>;
}

const styles = StyleSheet.create({
  page: { padding: 18, paddingBottom: 36, gap: 14, backgroundColor: "transparent" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  eyebrow: { fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  hero: { fontSize: 32, fontWeight: "900", fontStyle: "italic", marginTop: -7 },
  copy: { fontSize: 12, lineHeight: 19 },
  card: { borderRadius: 18, borderWidth: 1, backgroundColor: "transparent", padding: 15, gap: 9 },
  kicker: { fontSize: 9, fontWeight: "900", letterSpacing: 1.1 },
  title: { fontSize: 21, fontWeight: "900", fontStyle: "italic" },
  sudokuGrid: { gap: 5, alignSelf: "center", marginVertical: 4 },
  sudokuRow: { flexDirection: "row", gap: 5 },
  sudokuCell: { width: 54, height: 54, borderWidth: 1, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  sudokuInput: { width: 54, height: 54, borderWidth: 1, borderRadius: 10, fontSize: 21, fontWeight: "900" },
  sudokuGiven: { backgroundColor: "rgba(0,0,0,0.12)" },
  sudokuGivenText: { fontSize: 21, fontWeight: "900" },
  action: { minHeight: 42, borderRadius: 11, borderWidth: 1, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.18)" },
  smallAction: { minHeight: 42, borderRadius: 10, borderWidth: 1, justifyContent: "center", paddingHorizontal: 13, backgroundColor: "rgba(255,255,255,0.18)" },
  actionText: { fontSize: 12, fontWeight: "900" },
  success: { fontSize: 12, fontWeight: "900" },
  helper: { fontSize: 10, lineHeight: 15 },
  miniPrompt: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 6 },
  scramble: { fontSize: 22, fontWeight: "900", letterSpacing: 2, textAlign: "center" },
  sequence: { fontSize: 22, fontWeight: "900", textAlign: "center" },
  answerRow: { flexDirection: "row", gap: 8 },
  answerInput: { flex: 1, minHeight: 42, borderRadius: 10, borderWidth: 1, paddingHorizontal: 11, fontSize: 13 },
});
