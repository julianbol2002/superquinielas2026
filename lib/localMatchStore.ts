import type { MatchRow } from "@/lib/supabase";
import type { LiveMatch } from "@/lib/liveScores";

const STORAGE_KEY = "super_quinielas_match_results";

function matchRowKey(m: Pick<MatchRow, "group_name" | "team1" | "team2">): string {
  const group = m.group_name ?? "";
  return `${group}|${[m.team1, m.team2].sort().join("|")}`;
}

export function loadLocalMatches(): MatchRow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MatchRow[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalMatches(matches: MatchRow[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(matches));
  } catch {
    /* ignore quota errors */
  }
}

export function mergeEspnIntoLocal(espnMatches: LiveMatch[]): MatchRow[] {
  const existing = loadLocalMatches();
  const map = new Map<string, MatchRow>();

  for (const row of existing) {
    map.set(matchRowKey(row), row);
  }

  for (const match of espnMatches) {
    if (match.status === "scheduled" || !match.group) continue;

    const key = matchRowKey({
      group_name: match.group,
      team1: match.team1,
      team2: match.team2,
    });

    map.set(key, {
      id: match.espnId || key,
      stage: match.stage,
      group_name: match.group,
      team1: match.team1,
      team2: match.team2,
      score1: match.score1,
      score2: match.score2,
      match_date: match.matchDate,
      updated_at: new Date().toISOString(),
    });
  }

  const merged = [...map.values()].sort((a, b) =>
    (a.match_date ?? "").localeCompare(b.match_date ?? "")
  );
  saveLocalMatches(merged);
  return merged;
}
