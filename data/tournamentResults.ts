import { getAllGroupFixtures } from "@/data/countries";

export interface MatchResult {
  score1: number;
  score2: number;
}

/** Sealed results for played fixtures — synced from ESPN / original site */
export const PLAYED_MATCH_RESULTS: Record<string, MatchResult> = {
  "A-Mexico-South Africa": { score1: 2, score2: 0 },
  "A-South Korea-Czechia": { score1: 2, score2: 1 },
  "B-Canada-Bosnia and Herzegovina": { score1: 1, score2: 1 },
};

/** Calendar date (YYYY-MM-DD) when each sealed match finished — for daily recaps */
export const MATCH_PLAYED_DATES: Record<string, string> = {
  "A-Mexico-South Africa": "2026-06-11",
  "A-South Korea-Czechia": "2026-06-12",
  "B-Canada-Bosnia and Herzegovina": "2026-06-12",
};

export const ACTUAL_FINALISTS = ["Spain", "France"] as const;
export const ACTUAL_CHAMPION = "Spain";

export function getPlayedResultsMap(): Map<string, MatchResult> {
  const map = new Map<string, MatchResult>();
  const fixtures = getAllGroupFixtures();

  for (const [fixtureKey, result] of Object.entries(PLAYED_MATCH_RESULTS)) {
    const fixture = fixtures.find(
      (f) => `${f.group}-${f.team1}-${f.team2}` === fixtureKey
    );
    if (!fixture) continue;
    map.set(resultKeyFromTeams(fixture.team1, fixture.team2), result);
  }

  return map;
}

export function mergeLiveResults(
  liveResults: Map<string, MatchResult>
): Map<string, MatchResult> {
  const merged = getPlayedResultsMap();
  const sealed = new Set(merged.keys());
  for (const [key, value] of liveResults) {
    if (sealed.has(key)) continue;
    merged.set(key, value);
  }
  return merged;
}

/** Resolve fixture id from team pair */
export function fixtureIdForTeams(team1: string, team2: string): string | null {
  const fixtures = getAllGroupFixtures();
  const found = fixtures.find(
    (f) =>
      (f.team1 === team1 && f.team2 === team2) ||
      (f.team1 === team2 && f.team2 === team1)
  );
  if (!found) return null;
  return `${found.group}-${found.team1}-${found.team2}`;
}

export function resultKeyFromTeams(team1: string, team2: string): string {
  return [team1, team2].sort().join("|");
}
