import * as XLSX from "xlsx";
import { quinielas } from "@/data/quinielas";
import { ORIGINAL_SITE_POINTS } from "@/data/expectedPoints";

export interface Score {
  quiniela: string;
  points: number;
}

/** Public Google Sheets export (xlsx) — leaderboard/summary is the first sheet */
const XLSX_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRDcftczOm0lmTPVwBIM1fr5B7Ycq34Vzvple63Pb5F-BHVKV5i6HT0U-06rfdmh6CZCHGxowwM7kGG/pub?output=xlsx";

let cachedScores: Score[] = [];
let lastFetched = 0;
const CACHE_MS = 30 * 60 * 1000;

let inFlight: Promise<Score[]> | null = null;

export function getLastFetched(): number {
  return lastFetched;
}

export function clearScoresCache(): void {
  lastFetched = 0;
  cachedScores = [];
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

/** Reference totals when the Excel pull is unavailable */
export function getBundledScores(): Score[] {
  return fallbackScores();
}

/** Match an Excel-provided name to the canonical roster name */
function normalizeQuinielaName(raw: string): string | null {
  const cleaned = raw.replace(/\s+/g, " ").trim();
  if (!cleaned) return null;

  const exact = quinielas.find((q) => q.name.toLowerCase() === cleaned.toLowerCase());
  if (exact) return exact.name;

  const byLength = [...quinielas].sort((a, b) => b.name.length - a.name.length);
  const contains = byLength.find((q) =>
    cleaned.toLowerCase().includes(q.name.toLowerCase())
  );
  return contains?.name ?? null;
}

/** Ensure every roster quiniela is present; fill gaps from the bundled reference */
function validateExcelScores(scores: Score[]): Score[] {
  const byName = new Map(scores.map((s) => [s.quiniela, s.points]));
  const merged: Score[] = [];
  const missing: string[] = [];

  for (const q of quinielas) {
    const parsed = byName.get(q.name);
    if (parsed === undefined) {
      missing.push(q.name);
      merged.push({ quiniela: q.name, points: ORIGINAL_SITE_POINTS[q.name] ?? 0 });
    } else {
      merged.push({ quiniela: q.name, points: parsed });
    }
  }

  if (missing.length > 0) {
    console.warn(
      `[SCORES] Excel missing ${missing.length} quiniela(s), filled from reference: ${missing.join(", ")}`
    );
  }

  return merged;
}

function isNameHeader(header: string): boolean {
  const s = header.toLowerCase();
  return s.includes("quiniela") || s.includes("nombre");
}

function isPointsHeader(header: string): boolean {
  const s = header.toLowerCase();
  return s.includes("puntos") || s.includes("total") || s.includes("pts");
}

/** Locate the header row and the name/points columns by scanning labels (not hardcoded letters) */
function locateColumns(
  rows: unknown[][]
): { headerRow: number; nameCol: number; pointsCol: number } | null {
  const scanLimit = Math.min(rows.length, 15);
  for (let r = 0; r < scanLimit; r++) {
    const row = rows[r] ?? [];
    let nameCol = -1;
    let pointsCol = -1;
    for (let c = 0; c < row.length; c++) {
      const cell = row[c];
      if (typeof cell !== "string") continue;
      if (nameCol === -1 && isNameHeader(cell)) nameCol = c;
      if (pointsCol === -1 && isPointsHeader(cell)) pointsCol = c;
    }
    if (nameCol !== -1 && pointsCol !== -1 && nameCol !== pointsCol) {
      return { headerRow: r, nameCol, pointsCol };
    }
  }
  return null;
}

function parsePoints(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9-]/g, "");
    if (cleaned === "" || cleaned === "-") return null;
    const n = parseInt(cleaned, 10);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

async function fetchFromExcel(): Promise<Score[]> {
  const res = await fetch(XLSX_URL, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Excel fetch failed: HTTP ${res.status}`);
  }

  const buffer = await res.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error("Workbook contains no sheets");
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    blankrows: false,
    defval: null,
  });

  const located = locateColumns(rows);
  if (!located) {
    throw new Error(
      "Could not find quiniela name / points columns in the leaderboard sheet"
    );
  }

  const { headerRow, nameCol, pointsCol } = located;
  const scores: Score[] = [];

  for (let r = headerRow + 1; r < rows.length; r++) {
    const row = rows[r] ?? [];
    const rawName = row[nameCol];
    if (rawName == null || String(rawName).trim() === "") continue;

    const points = parsePoints(row[pointsCol]);
    if (points === null) continue;

    const name = normalizeQuinielaName(String(rawName)) ?? String(rawName).trim();
    scores.push({ quiniela: name, points });
  }

  if (scores.length === 0) {
    throw new Error("Parsed zero rows from leaderboard sheet");
  }

  return scores;
}

export async function getScores(force = false): Promise<Score[]> {
  if (!force && Date.now() - lastFetched < CACHE_MS && cachedScores.length > 0) {
    return cachedScores;
  }

  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const fresh = validateExcelScores(await fetchFromExcel());
      cachedScores = fresh;
      lastFetched = Date.now();
      return fresh;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[SCORES ERROR] Excel pull failed: ${message}`);
      if (cachedScores.length > 0) {
        console.warn("[SCORES] Returning last cached scores");
        return cachedScores;
      }
      const fallback = fallbackScores();
      cachedScores = fallback;
      lastFetched = Date.now();
      return fallback;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}
