import { fetchMatches, isSupabaseConfigured, upsertMatch, type MatchRow } from "@/lib/supabase";
import { loadLocalMatches, mergeEspnIntoLocal, saveLocalMatches } from "@/lib/localMatchStore";
import type { LiveMatch } from "@/lib/liveScores";

export async function fetchAllMatchRows(): Promise<MatchRow[]> {
  if (isSupabaseConfigured()) {
    return fetchMatches();
  }
  return loadLocalMatches();
}

export function syncEspnToLocalStore(matches: LiveMatch[]): MatchRow[] {
  if (isSupabaseConfigured()) return [];
  return mergeEspnIntoLocal(matches);
}

export async function saveMatchResult(
  params: Omit<MatchRow, "id" | "updated_at"> & { id?: string }
): Promise<void> {
  if (isSupabaseConfigured()) {
    await upsertMatch(params);
    return;
  }

  const existing = loadLocalMatches();
  const key = `${params.group_name}|${[params.team1, params.team2].sort().join("|")}`;
  const found = existing.find(
    (m) =>
      `${m.group_name}|${[m.team1, m.team2].sort().join("|")}` === key
  );

  const row: MatchRow = {
    id: found?.id ?? params.id ?? key,
    stage: params.stage,
    group_name: params.group_name,
    team1: params.team1,
    team2: params.team2,
    score1: params.score1,
    score2: params.score2,
    match_date: params.match_date,
    updated_at: new Date().toISOString(),
  };

  const next = found
    ? existing.map((m) => (m.id === found.id ? row : m))
    : [...existing, row];
  saveLocalMatches(next);
}
