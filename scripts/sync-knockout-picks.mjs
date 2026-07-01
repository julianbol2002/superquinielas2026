/**
 * Generate data/knockoutPicks.ts from the published Google Sheet's per-quiniela
 * tabs (each holds that quiniela's knockout picks under "TU PRONÓSTICO").
 * Usage: node scripts/sync-knockout-picks.mjs
 */
import * as XLSX from "xlsx";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const SHEET_XLSX_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTsPKdTcdhXbjmGSlaoLKAlrV-3H6KL_gKPqHl4mkH5eSA8g7OWmIfxhAj5uK_pJl3eWmhb2R4bIWr7/pub?output=xlsx";

const SKIP_TABS = new Set(["Clasificación", "Eliminatorias", "Reglas"]);

// Ranking order — matches the quiniela tab order in the workbook.
const SLUGS_IN_ORDER = [
  "martino", "the-krusty-krab", "cam-bolanos", "que-finta", "panoramix",
  "lico-bp", "camb", "soquenla", "barquito-de-papel", "jeb-corliss",
  "panzer", "abuela", "duo-dinamico-iron-beagle", "corre-como-el-viento-tiro-al-blanco",
  "it-s-coming-home", "mister-shit", "c2", "juliquini", "ana-x", "oly-con-todo",
  "quiniela-pupusera", "marco-bolanos", "tessa", "mosquito-letal", "estrella-psiquica",
  "maradriano", "dani-bolanos",
];

/** Map sheet team names to the app's canonical names */
function mapTeam(raw) {
  const t = raw.trim();
  if (t === "Congo") return "DR Congo";
  return t;
}

/** Sorted team-pair key — mirrors resultKeyFromTeams in data/tournamentResults.ts */
function pairKey(a, b) {
  return [a, b].sort().join("|");
}

function parsePick(raw) {
  const m = String(raw ?? "").trim().match(/^(\d+)\s*-\s*(\d+)$/);
  if (!m) return null;
  return { score1: parseInt(m[1], 10), score2: parseInt(m[2], 10) };
}

async function main() {
  const res = await fetch(SHEET_XLSX_URL, {
    redirect: "follow",
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!res.ok) throw new Error(`Sheet fetch failed: HTTP ${res.status}`);
  const wb = XLSX.read(await res.arrayBuffer(), { type: "array" });

  const quinielaTabs = wb.SheetNames.filter((n) => !SKIP_TABS.has(n));
  if (quinielaTabs.length !== SLUGS_IN_ORDER.length) {
    console.warn(
      `[knockout] Expected ${SLUGS_IN_ORDER.length} quiniela tabs, found ${quinielaTabs.length}`
    );
  }

  const out = {};
  let totalPicks = 0;

  quinielaTabs.forEach((tab, i) => {
    const slug = SLUGS_IN_ORDER[i];
    if (!slug) return;
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[tab], {
      header: 1,
      blankrows: false,
      defval: "",
    });

    // locate header row (has "PARTIDO")
    let headerIdx = -1;
    let pCol = -1;
    let predCol = -1;
    for (let r = 0; r < Math.min(rows.length, 8); r++) {
      const cells = (rows[r] ?? []).map((c) => String(c ?? "").trim().toUpperCase());
      const pi = cells.findIndex((c) => c === "PARTIDO");
      const di = cells.findIndex((c) => c.includes("PRON"));
      if (pi !== -1 && di !== -1) {
        headerIdx = r;
        pCol = pi;
        predCol = di;
        break;
      }
    }
    if (headerIdx === -1) return;

    const picks = {};
    for (let r = headerIdx + 1; r < rows.length; r++) {
      const row = rows[r] ?? [];
      const partido = String(row[pCol] ?? "").trim();
      if (!partido.includes(" vs ")) continue;
      const pick = parsePick(row[predCol]);
      if (!pick) continue;
      const [a, b] = partido.split(" vs ").map((s) => mapTeam(s));
      picks[pairKey(a, b)] = pick;
      totalPicks += 1;
    }
    if (Object.keys(picks).length > 0) out[slug] = picks;
  });

  const header = `// Auto-generated from the published Google Sheet knockout tabs — do not edit by hand.
// Regenerate: node scripts/sync-knockout-picks.mjs
// Keyed by quiniela slug, then by sorted team-pair (resultKeyFromTeams format).

export type KnockoutPick = { score1: number; score2: number };

export const KNOCKOUT_PICKS: Record<string, Record<string, KnockoutPick>> = ${JSON.stringify(
    out,
    null,
    2
  )};
`;

  const dir = dirname(fileURLToPath(import.meta.url));
  const target = join(dir, "..", "data", "knockoutPicks.ts");
  writeFileSync(target, header, "utf8");
  console.log(
    `[knockout] Wrote ${Object.keys(out).length} quinielas, ${totalPicks} picks → data/knockoutPicks.ts`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
