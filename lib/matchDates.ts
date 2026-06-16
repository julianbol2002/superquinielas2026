import type { LiveMatch } from "@/lib/liveScores";
import type { MatchRow } from "@/lib/supabase";
import { MATCH_PLAYED_DATES } from "@/data/tournamentResults";

/** Calendar date (YYYY-MM-DD) in the user's local timezone */
export function toLocalYmd(input: Date | string): string {
  const d = typeof input === "string" ? new Date(input) : input;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Kickoff / occurrence day for a live match (local calendar). */
export function getMatchOccurrenceYmd(match: Pick<LiveMatch, "matchDate" | "finishedAt">): string | null {
  if (match.matchDate) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(match.matchDate)) {
      return match.matchDate;
    }
    const parsed = new Date(match.matchDate);
    if (!Number.isNaN(parsed.getTime())) return toLocalYmd(parsed);
  }
  if (match.finishedAt) return toLocalYmd(match.finishedAt);
  return null;
}

/** Best-effort completion day for recap bucketing (local calendar). */
export function getMatchCompletionYmd(
  match: Pick<LiveMatch, "matchDate" | "finishedAt">
): string | null {
  if (match.finishedAt) return toLocalYmd(match.finishedAt);
  return getMatchOccurrenceYmd(match);
}

export function resolveFixtureRecapDate(
  fixtureId: string,
  team1: string,
  team2: string,
  liveMatches: LiveMatch[],
  localRows: MatchRow[] = []
): string | null {
  const manual = MATCH_PLAYED_DATES[fixtureId];
  if (manual) return manual;

  const live = liveMatches.find(
    (m) =>
      m.status === "final" &&
      ((m.team1 === team1 && m.team2 === team2) ||
        (m.team1 === team2 && m.team2 === team1))
  );
  if (live) {
    const completion = getMatchCompletionYmd(live);
    if (completion) return completion;
  }

  const local = localRows.find(
    (r) =>
      r.score1 !== null &&
      r.score2 !== null &&
      ((r.team1 === team1 && r.team2 === team2) ||
        (r.team1 === team2 && r.team2 === team1))
  );
  if (local?.match_date) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(local.match_date)) {
      return local.match_date;
    }
    const parsed = new Date(local.match_date);
    if (!Number.isNaN(parsed.getTime())) return toLocalYmd(parsed);
  }

  return null;
}

/** True if this fixture belongs on the recap calendar day (local time). */
export function fixtureOccurredOnDate(
  fixtureId: string,
  team1: string,
  team2: string,
  recapDate: string,
  liveMatches: LiveMatch[],
  localRows: MatchRow[] = []
): boolean {
  const resolved = resolveFixtureRecapDate(
    fixtureId,
    team1,
    team2,
    liveMatches,
    localRows
  );
  if (resolved === recapDate) return true;

  const live = liveMatches.find(
    (m) =>
      m.status === "final" &&
      ((m.team1 === team1 && m.team2 === team2) ||
        (m.team1 === team2 && m.team2 === team1))
  );
  if (live) {
    const occurrence = getMatchOccurrenceYmd(live);
    if (occurrence === recapDate) return true;
  }

  return false;
}
