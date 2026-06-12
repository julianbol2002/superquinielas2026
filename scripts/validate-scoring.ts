import {
  computeAllQuinielaScores,
  type QuinielaScoreBreakdown,
} from "../lib/quinielaScoring";
import {
  ORIGINAL_SITE_POINTS,
  ORIGINAL_SITE_RANK_ORDER,
} from "../data/expectedPoints";

const scores = computeAllQuinielaScores();
let mismatches = 0;

console.log("\n=== Scoring validation vs original site (Puntos Efectivos) ===\n");
console.log(
  "Quiniela".padEnd(28),
  "Match".padStart(6),
  "Bonus".padStart(6),
  "Total".padStart(6),
  "Expected".padStart(8),
  "Status".padStart(8)
);
console.log("-".repeat(68));

for (const row of scores) {
  const expected = ORIGINAL_SITE_POINTS[row.name];
  const bonus = row.finalistBonus + row.championBonus;
  const ok = expected !== undefined && row.matchPoints === expected;
  if (!ok) mismatches += 1;
  console.log(
    row.name.padEnd(28),
    String(row.matchPoints).padStart(6),
    String(bonus).padStart(6),
    String(row.totalPoints).padStart(6),
    String(expected ?? "?").padStart(8),
    (ok ? "OK" : "FAIL").padStart(8)
  );
}

const rankedNames = [...scores]
  .sort((a, b) => {
    if (b.matchPoints !== a.matchPoints) return b.matchPoints - a.matchPoints;
    return a.captain.localeCompare(b.captain, "es");
  })
  .map((s) => s.name);

const rankOk =
  rankedNames.length === ORIGINAL_SITE_RANK_ORDER.length &&
  rankedNames.every((name, i) => name === ORIGINAL_SITE_RANK_ORDER[i]);

console.log("\nRank order:", rankOk ? "OK" : "FAIL");
if (!rankOk) {
  console.log("Expected:", ORIGINAL_SITE_RANK_ORDER.join(" > "));
  console.log("Computed:", rankedNames.join(" > "));
}

console.log(
  `\nBonuses (tooltip only — ${scores.filter((s) => s.finalistBonus + s.championBonus > 0).length} quinielas with bonus):`
);
for (const row of scores.filter(
  (s) => s.finalistBonus > 0 || s.championBonus > 0
)) {
  console.log(
    `  ${row.name}: match ${row.matchPoints} + finalists ${row.finalistBonus} + champion ${row.championBonus} = ${row.totalPoints}`
  );
}

console.log(`\n${mismatches} point mismatch(es), rank ${rankOk ? "OK" : "FAIL"}\n`);

if (mismatches > 0 || !rankOk) {
  process.exit(1);
}

export type { QuinielaScoreBreakdown };
