import { quinielas } from "@/data/quinielas";
import { ORIGINAL_SITE_POINTS } from "@/data/expectedPoints";
import { computeQuinielaScore } from "@/lib/quinielaScoring";

const THRESHOLD = 2;

console.log("\n=== Computed vs Azure reference (warning if diff > 2) ===\n");

let warnings = 0;

for (const q of quinielas) {
  const breakdown = computeQuinielaScore(q, []);
  const computed = breakdown.totalPoints;
  const official = ORIGINAL_SITE_POINTS[q.name] ?? 0;
  const diff = Math.abs(computed - official);

  if (diff > THRESHOLD) {
    warnings += 1;
    console.warn(
      `WARNING: ${q.name} — computed ${computed} vs Azure ${official} (diff ${diff})`
    );
  }
}

if (warnings === 0) {
  console.log("No large discrepancies found.\n");
} else {
  console.warn(
    `\n${warnings} quiniela(s) differ from Azure reference by more than ${THRESHOLD} points.`
  );
  console.warn("Leaderboard uses live Azure scrape — this is informational.\n");
}
