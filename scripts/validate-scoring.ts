import { quinielas } from "@/data/quinielas";
import {
  ORIGINAL_SITE_POINTS,
  ORIGINAL_SITE_RANK_ORDER,
} from "@/data/expectedPoints";

let mismatches = 0;

console.log("\n=== Official points reference validation ===\n");
console.log(
  "Quiniela".padEnd(28),
  "In reference".padStart(12),
  "Status".padStart(8)
);
console.log("-".repeat(52));

for (const entry of quinielas) {
  const expected = ORIGINAL_SITE_POINTS[entry.name];
  const ok = expected !== undefined;
  if (!ok) mismatches += 1;
  console.log(
    entry.name.padEnd(28),
    String(expected ?? "?").padStart(12),
    (ok ? "OK" : "FAIL").padStart(8)
  );
}

const rankedNames = [...quinielas]
  .sort((a, b) => {
    const pa = ORIGINAL_SITE_POINTS[a.name] ?? 0;
    const pb = ORIGINAL_SITE_POINTS[b.name] ?? 0;
    if (pb !== pa) return pb - pa;
    return a.captain.localeCompare(b.captain, "es");
  })
  .map((q) => q.name);

const rankOk =
  rankedNames.length === ORIGINAL_SITE_RANK_ORDER.length &&
  rankedNames.every((name, i) => name === ORIGINAL_SITE_RANK_ORDER[i]);

console.log("\nRank order:", rankOk ? "OK" : "FAIL");
if (!rankOk) {
  console.log("Expected:", ORIGINAL_SITE_RANK_ORDER.join(" > "));
  console.log("Computed:", rankedNames.join(" > "));
}

console.log(`\n${mismatches} missing reference(s), rank ${rankOk ? "OK" : "FAIL"}\n`);

if (mismatches > 0 || !rankOk) {
  process.exit(1);
}
