import { quinielas } from "@/data/quinielas";
import { ORIGINAL_SITE_POINTS } from "@/data/expectedPoints";
import * as XLSX from "xlsx";

export interface Score {
  quiniela: string;
  points: number;
}

const SHEET_XLSX_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTsPKdTcdhXbjmGSlaoLKAlrV-3H6KL_gKPqHl4mkH5eSA8g7OWmIfxhAj5uK_pJl3eWmhb2R4bIWr7/pub?output=xlsx";

let cachedScores: Score[] = [];
let lastFetched = 0;
const CACHE_DURATION = 30 * 60 * 1000;

let inFlight: Promise<Score[]> | null = null;

export function getLastFetched(): number {
  return lastFetched;
}

export function clearScoresCache(): void {
  lastFetched = 0;
}

export function scoresToMap(scores: Score[]): Record<string, number> {
  return Object.fromEntries(scores.map((s) => [s.quiniela, s.points]));
}

function fallbackScores(): Score[] {
  return quinielas.map((q) => ({
    quiniela: q.name,
    points: ORIGINAL_SITE_POINTS[q.name] ?? 0,
  }));
}

/** Reference totals when the sheet is unavailable */
export function getBundledScores(): Score[] {
  return fallbackScores();
}

function useFallbackScores(reason: string): Score[] {
  console.warn(`[SCORES] ${reason} - using bundled reference scores`);
  const fallback = fallbackScores();
  cachedScores = fallback;
  lastFetched = Date.now();
  return fallback;
}

/** Fuzzy-match a raw sheet name to a canonical quiniela name in data/quinielas.ts */
function normalizeQuinielaName(raw: string): string | null {
  const cleaned = raw.replace(/\s+/g, " ").trim();
  if (!cleaned) return null;

  const exact = quinielas.find(
    (q) => q.name.toLowerCase() === cleaned.toLowerCase()
  );
  if (exact) return exact.name;

  const byLength = [...quinielas].sort((a, b) => b.name.length - a.name.length);
  const contains = byLength.find(
    (q) =>
      cleaned.toLowerCase().includes(q.name.toLowerCase()) ||
      q.name.toLowerCase().includes(cleaned.toLowerCase())
  );
  return contains?.name ?? null;
}

/** Fill any quiniela missing from the sheet with its reference total, in canonical order */
function validateSheetScores(scores: Score[]): Score[] {
  const byName = new Map(scores.map((s) => [s.quiniela, s.points]));
  const merged: Score[] = [];
  const missing: string[] = [];

  for (const q of quinielas) {
    const found = byName.get(q.name);
    if (found === undefined) {
      missing.push(q.name);
      merged.push({ quiniela: q.name, points: ORIGINAL_SITE_POINTS[q.name] ?? 0 });
    } else {
      merged.push({ quiniela: q.name, points: found });
    }
  }

  if (missing.length > 0) {
    console.warn(
      `[SCORES] Sheet missing ${missing.length} quiniela(s), filled from reference: ${missing.join(", ")}`
    );
  }

  return merged;
}

/**
 * Locate the header row + the name/points columns by scanning, so the parser
 * survives layout changes. Looks for a header cell that looks like a quiniela/name
 * column and one that looks like a points/puntos column; otherwise falls back to
 * a heuristic (a text column followed by a numeric column).
 */
function parseSheet(rows: unknown[][]): Score[] {
  if (!rows || rows.length === 0) {
    throw new Error("[SCORES] Sheet is empty");
  }

  const norm = (v: unknown) =>
    String(v ?? "").replace(/\s+/g, " ").trim().toLowerCase();

  const nameHeaders = ["quiniela", "nombre", "name", "equipo"];
  const pointsHeaders = ["puntos totales", "puntos", "points", "total", "pts"];

  let headerRowIdx = -1;
  let nameCol = -1;
  let pointsCol = -1;

  for (let r = 0; r < Math.min(rows.length, 10); r++) {
    const row = rows[r] ?? [];
    const cells = row.map(norm);
    const nCol = cells.findIndex((c) => nameHeaders.includes(c));
    // prefer the most specific points header present
    let pCol = -1;
    for (const h of pointsHeaders) {
      const idx = cells.findIndex((c) => c === h);
      if (idx !== -1) {
        pCol = idx;
        break;
      }
    }
    if (nCol !== -1 && pCol !== -1) {
      headerRowIdx = r;
      nameCol = nCol;
      pointsCol = pCol;
      break;
    }
  }

  // Heuristic fallback: first row where col A is text and some later col is an integer
  if (headerRowIdx === -1) {
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r] ?? [];
      const firstText = row.findIndex(
        (v) => typeof v === "string" && v.trim() !== "" && isNaN(Number(v))
      );
      const numCol = row.findIndex((v) => /^\d+$/.test(String(v ?? "").trim()));
      if (firstText !== -1 && numCol !== -1 && numCol !== firstText) {
        headerRowIdx = r - 1; // treat prior row as (missing) header; start data at r
        nameCol = firstText;
        pointsCol = numCol;
        break;
      }
    }
  }

  if (nameCol === -1 || pointsCol === -1) {
    console.log("[SCORES] First 3 rows for debugging:", JSON.stringify(rows.slice(0, 3)));
    throw new Error("[SCORES] Could not locate name/points columns in sheet");
  }

  const scores: Score[] = [];
  const seen = new Map<string, number>();

  for (let r = headerRowIdx + 1; r < rows.length; r++) {
    const row = rows[r] ?? [];
    const rawName = String(row[nameCol] ?? "").trim();
    const rawPoints = String(row[pointsCol] ?? "").trim();
    if (!rawName) continue;
    if (!/^-?\d+$/.test(rawPoints)) continue;

    const name = normalizeQuinielaName(rawName);
    if (!name) continue;

    seen.set(name, parseInt(rawPoints, 10));
  }

  for (const [quiniela, points] of seen.entries()) {
    scores.push({ quiniela, points });
  }

  console.log(`[SCORES] Parsed ${scores.length} rows from sheet`);

  if (scores.length === 0) {
    console.log("[SCORES] First 3 rows for debugging:", JSON.stringify(rows.slice(0, 3)));
    throw new Error("[SCORES] Parsed zero rows from sheet");
  }

  return scores;
}

async function fetchSheetScores(): Promise<Score[]> {
  console.log("[SCORES] Fetching published Google Sheet xlsx...");
  const res = await fetch(SHEET_XLSX_URL, {
    cache: "no-store",
    redirect: "follow",
    headers: { "User-Agent": "Mozilla/5.0" },
  });

  if (!res.ok) {
    throw new Error(`[SCORES] Sheet fetch failed: HTTP ${res.status}`);
  }

  const buf = await res.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const firstSheetName = wb.SheetNames[0];
  if (!firstSheetName) {
    throw new Error("[SCORES] Workbook has no sheets");
  }

  const ws = wb.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    blankrows: false,
    defval: "",
  });

  const parsed = parseSheet(rows);
  console.log(`[SCORES] Sheet fetch complete. ${parsed.length} scores.`);
  return parsed;
}

export async function getScores(force = false): Promise<Score[]> {
  if (!force && Date.now() - lastFetched < CACHE_DURATION && cachedScores.length > 0) {
    return cachedScores;
  }

  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const fresh = validateSheetScores(await fetchSheetScores());
      if (fresh.length === 0) {
        throw new Error("Sheet returned zero scores");
      }
      cachedScores = fresh;
      lastFetched = Date.now();
      return fresh;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[SCORES ERROR] getScores failed:", message);
      if (cachedScores.length > 0) {
        console.warn("[SCORES] Returning last cached scores");
        return cachedScores;
      }
      return useFallbackScores("Sheet unavailable");
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}
