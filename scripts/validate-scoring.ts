import { getRankedQuinielas } from "@/data/quinielas";
import {
  ORIGINAL_SITE_POINTS,
  ORIGINAL_SITE_RANK_ORDER,
} from "@/data/expectedPoints";

const ranked = getRankedQuinielas();
let mismatches = 0;

console.log("\n=== Official points validation vs Azure site ===\n");
console.log(
  "Quiniela".padEnd(28),
  "Points".padStart(8),
  "Expected".padStart(8),
  "Status".padStart(8)
);
console.log("-".repeat(56));

for (const entry of ranked) {
  const expected = ORIGINAL_SITE_POINTS[entry.name];
  const ok = expected !== undefined && entry.points === expected;
  if (!ok) mismatches += 1;
  console.log(
    entry.name.padEnd(28),
    String(entry.points).padStart(8),
    String(expected ?? "?").padStart(8),
    (ok ? "OK" : "FAIL").padStart(8)
  );
}

const rankedNames = ranked.map((e) => e.name);
const rankOk =
  rankedNames.length === ORIGINAL_SITE_RANK_ORDER.length &&
  rankedNames.every((name, i) => name === ORIGINAL_SITE_RANK_ORDER[i]);

console.log("\nRank order:", rankOk ? "OK" : "FAIL");
if (!rankOk) {
  console.log("Expected:", ORIGINAL_SITE_RANK_ORDER.join(" > "));
  console.log("Computed:", rankedNames.join(" > "));
}

console.log(`\n${mismatches} point mismatch(es), rank ${rankOk ? "OK" : "FAIL"}\n`);

if (mismatches > 0 || !rankOk) {
  process.exit(1);
}
