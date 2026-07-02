import * as XLSX from "xlsx";
import { SHEET_XLSX_URL } from "@/lib/getScores";
import { KNOCKOUT_RESULTS_FALLBACK } from "@/data/matchResults";
import type { LiveMatch } from "@/lib/liveScores";

/**
 * Reads knockout results live from the published Google Sheet's "Eliminatorias"
 * tab, so results appear on the site as soon as they're typed into the sheet —
 * no code change or redeploy. Falls back to the bundled snapshot in
 * data/matchResults.ts if the sheet can't be reached.
 */

const ELIMINATORIAS_TAB = "Eliminatorias";
const CACHE_MS = 60 * 1000;

let cached: LiveMatch[] = [];
let lastFetched = 0;
let inFlight: Promise<LiveMatch[]> | null = null;

export function clearKnockoutResultsCache(): void {
  lastFetched = 0;
  cached = [];
}

/** Sheet team name → app canonical name (mirrors scripts/sync-knockout-picks.mjs). */
function mapTeam(raw: string): string {
  const t = raw.trim();
  if (t === "Congo") return "DR Congo";
  return t;
}

const strip = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

/** Sheet FASE label → { app stage, espnId prefix }. */
function mapStage(fase: string): { stage: string; prefix: string } | null {
  switch (strip(fase)) {
    case "32avos":
      return { stage: "r32", prefix: "R32" };
    case "16avos":
      return { stage: "r16", prefix: "R16" };
    case "cuartos":
      return { stage: "qf", prefix: "QF" };
    case "semifinal":
    case "semifinales":
      return { stage: "sf", prefix: "SF" };
    case "3er lugar":
    case "tercer lugar":
      return { stage: "3p", prefix: "3P" };
    case "final":
      return { stage: "final", prefix: "FINAL" };
    default:
      return null;
  }
}

function toInt(value: unknown): number | null {
  if (value === "" || value === null || value === undefined) return null;
  const n = typeof value === "number" ? value : parseInt(String(value).trim(), 10);
  return Number.isInteger(n) ? n : null;
}

/** Parse the Eliminatorias rows into LiveMatch[] — only played games are returned. */
export function parseEliminatorias(rows: unknown[][]): LiveMatch[] {
  const norm = (v: unknown) => String(v ?? "").replace(/\s+/g, " ").trim().toLowerCase();

  // Locate the header row + columns (FASE / PARTIDO / GOL 1 / GOL 2).
  let headerIdx = -1;
  let faseCol = -1;
  let partidoCol = -1;
  let gol1Col = -1;
  let gol2Col = -1;

  for (let r = 0; r < Math.min(rows.length, 8); r++) {
    const cells = (rows[r] ?? []).map(norm);
    const fi = cells.findIndex((c) => c === "fase");
    const pi = cells.findIndex((c) => c === "partido");
    if (fi !== -1 && pi !== -1) {
      headerIdx = r;
      faseCol = fi;
      partidoCol = pi;
      const goals = cells
        .map((c, i) => ({ c, i }))
        .filter(({ c }) => c.includes("gol"))
        .map(({ i }) => i);
      gol1Col = goals[0] ?? partidoCol + 1;
      gol2Col = goals[1] ?? partidoCol + 2;
      break;
    }
  }

  if (headerIdx === -1) {
    throw new Error("[KNOCKOUT] Could not locate header row in Eliminatorias tab");
  }

  const results: LiveMatch[] = [];
  const stageCounters: Record<string, number> = {};

  for (let r = headerIdx + 1; r < rows.length; r++) {
    const row = rows[r] ?? [];
    const partido = String(row[partidoCol] ?? "").trim();
    if (!partido.includes(" vs ")) continue; // skip placeholder rows

    const score1 = toInt(row[gol1Col]);
    const score2 = toInt(row[gol2Col]);
    if (score1 === null || score2 === null) continue; // not played yet

    const mapped = mapStage(String(row[faseCol] ?? ""));
    if (!mapped) continue;

    const [team1, team2] = partido.split(" vs ").map((s) => mapTeam(s));
    if (!team1 || !team2) continue;

    stageCounters[mapped.prefix] = (stageCounters[mapped.prefix] ?? 0) + 1;
    const espnId = `${mapped.prefix}-${String(stageCounters[mapped.prefix]).padStart(2, "0")}`;

    results.push({
      espnId,
      team1,
      team2,
      score1,
      score2,
      group: null,
      stage: mapped.stage,
      status: "final",
      isLive: false,
      matchDate: "",
    });
  }

  return results;
}

async function fetchKnockoutResults(): Promise<LiveMatch[]> {
  const res = await fetch(SHEET_XLSX_URL, {
    cache: "no-store",
    redirect: "follow",
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!res.ok) throw new Error(`[KNOCKOUT] Sheet fetch failed: HTTP ${res.status}`);

  const buf = await res.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[ELIMINATORIAS_TAB];
  if (!ws) throw new Error(`[KNOCKOUT] Workbook has no "${ELIMINATORIAS_TAB}" tab`);

  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    blankrows: false,
    defval: "",
  });

  const parsed = parseEliminatorias(rows);
  console.log(`[KNOCKOUT] Parsed ${parsed.length} played knockout result(s) from sheet`);
  return parsed;
}

/** Live knockout results, cached briefly, falling back to the bundled snapshot. */
export async function getKnockoutResults(force = false): Promise<LiveMatch[]> {
  if (!force && Date.now() - lastFetched < CACHE_MS && cached.length > 0) {
    return cached;
  }
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const fresh = await fetchKnockoutResults();
      cached = fresh;
      lastFetched = Date.now();
      return fresh;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[KNOCKOUT ERROR]", message);
      if (cached.length > 0) return cached;
      console.warn("[KNOCKOUT] Using bundled fallback knockout results");
      return KNOCKOUT_RESULTS_FALLBACK;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}
