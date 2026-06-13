import type { RankedQuiniela } from "@/data/quinielas";

const STORAGE_KEY = "quiniela_rank_history";
const MAX_SNAPSHOTS = 20;

interface RankSnapshot {
  at: string;
  ranks: Record<string, number>;
}

function loadHistory(): RankSnapshot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RankSnapshot[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(history: RankSnapshot[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-MAX_SNAPSHOTS)));
}

/** Record ranks after each live-score sync (call when lastUpdated changes). */
export function recordRankSnapshot(entries: RankedQuiniela[]): void {
  if (entries.length === 0) return;

  const ranks = Object.fromEntries(entries.map((e) => [e.name, e.rank]));
  const history = loadHistory();
  const last = history[history.length - 1];

  if (last && JSON.stringify(last.ranks) === JSON.stringify(ranks)) {
    return;
  }

  history.push({ at: new Date().toISOString(), ranks });
  saveHistory(history);
}

export function getRankSnapshotCount(): number {
  return loadHistory().length;
}

export function hasReliableRankHistory(): boolean {
  return getRankSnapshotCount() >= 2;
}

/** Ranks from the snapshot before the most recent one. */
export function getPreviousRanksFromHistory(): Record<string, number> | null {
  const history = loadHistory();
  if (history.length < 2) return null;
  return history[history.length - 2].ranks;
}
