/**
 * Scrape Azure and print data/expectedPoints.ts contents.
 * Usage: npx tsx scripts/sync-expected-points.ts
 * Requires ORIGINAL_SITE_EMAIL and ORIGINAL_SITE_PASSWORD in .env.local
 */
import { readFileSync } from "fs";
import { join } from "path";
import { quinielas } from "../data/quinielas";
import { clearScoresCache, getScores } from "../lib/getScores";

function loadEnvLocal(): void {
  try {
    const raw = readFileSync(join(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // .env.local optional when vars are already exported
  }
}

async function main() {
  loadEnvLocal();
  clearScoresCache();
  const scores = await getScores(true);
  const byName = Object.fromEntries(scores.map((s) => [s.quiniela, s.points]));

  const ranked = [...quinielas]
    .sort((a, b) => {
      const pa = byName[a.name] ?? 0;
      const pb = byName[b.name] ?? 0;
      if (pb !== pa) return pb - pa;
      return a.captain.localeCompare(b.captain, "es");
    })
    .map((q) => q.name);

  console.log("/** Ground-truth totals from superquinielawc2026.azurewebsites.net — Puntos Efectivos */");
  console.log("export const ORIGINAL_SITE_POINTS: Record<string, number> = {");
  for (const q of quinielas) {
    const pts = byName[q.name] ?? 0;
    const key = /^[a-zA-Z0-9_]+$/.test(q.name) ? q.name : `"${q.name}"`;
    console.log(`  ${key}: ${pts},`);
  }
  console.log("};");
  console.log("");
  console.log("/** Expected rank order (quiniela names) — matches Azure leaderboard */");
  console.log("export const ORIGINAL_SITE_RANK_ORDER: string[] = [");
  for (const name of ranked) {
    console.log(`  ${JSON.stringify(name)},`);
  }
  console.log("];");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
