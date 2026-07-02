import { getAllGroupFixtures } from "@/data/countries";
import {
  getPredictionsForSlug,
  type PredictionScore,
} from "@/data/predictions";
import { KNOCKOUT_PICKS } from "@/data/knockoutPicks";
import { R32_FIXTURES, KNOCKOUT_ROUND_SIZES } from "@/data/knockoutFixtures";
import {
  mergeLiveResults,
  resultKeyFromTeams,
  type MatchResult,
} from "@/data/tournamentResults";
import type { LiveMatch } from "@/lib/liveScores";
import { scoreMatchPrediction } from "@/lib/quinielaScoring";

export type RowAccuracy = "exact" | "result" | "wrong" | "pending" | "missing";

export interface ScoredPredictionRow {
  id: string;
  matchNumber: number;
  team1: string;
  team2: string;
  group: string;
  phase: "group" | "r32" | "r16" | "quarter" | "semi" | "final";
  predicted: PredictionScore;
  actualScore1: number | null;
  actualScore2: number | null;
  played: boolean;
  pointsEarned: number;
  accuracy: RowAccuracy;
  goleadaBonus: boolean;
}

export interface QuinielaPredictionStats {
  exactScores: number;
  correctResults: number;
  wrongPredictions: number;
  playedCount: number;
  predictedCount: number;
  accuracyPct: number;
  bestMatch: ScoredPredictionRow | null;
  currentHotStreak: number;
}

function liveResultsMap(liveMatches: LiveMatch[]): Map<string, MatchResult> {
  const map = new Map<string, MatchResult>();
  for (const m of liveMatches) {
    if (m.status === "scheduled") continue;
    map.set(resultKeyFromTeams(m.team1, m.team2), {
      score1: m.score1,
      score2: m.score2,
    });
  }
  return map;
}

function scoreRow(
  predicted: PredictionScore,
  actualScore1: number | null,
  actualScore2: number | null
): Pick<ScoredPredictionRow, "pointsEarned" | "accuracy" | "goleadaBonus"> {
  if (!predicted) {
    return { pointsEarned: 0, accuracy: "missing", goleadaBonus: false };
  }

  if (actualScore1 === null || actualScore2 === null) {
    return { pointsEarned: 0, accuracy: "pending", goleadaBonus: false };
  }

  const scored = scoreMatchPrediction(predicted, actualScore1, actualScore2);
  let accuracy: RowAccuracy = "wrong";
  if (scored.exact) accuracy = "exact";
  else if (scored.correctResult) accuracy = "result";

  return {
    pointsEarned: scored.points,
    accuracy,
    goleadaBonus: scored.goleadaBonus,
  };
}

export function getBetTierLabel(bet: 25 | 50 | 100): "JUGADOR" | "GOLEADOR" | "MVP" {
  if (bet >= 100) return "MVP";
  if (bet >= 50) return "GOLEADOR";
  return "JUGADOR";
}

export function getBetTierAbbrev(bet: 25 | 50 | 100): "JUG" | "GOL" | "MVP" {
  if (bet >= 100) return "MVP";
  if (bet >= 50) return "GOL";
  return "JUG";
}

export function getScoredPredictions(
  slug: string,
  liveMatches: LiveMatch[] = []
): ScoredPredictionRow[] {
  const predictions = getPredictionsForSlug(slug) ?? {};
  const results = mergeLiveResults(liveResultsMap(liveMatches));
  const fixtures = getAllGroupFixtures();

  const groupRows: ScoredPredictionRow[] = fixtures.map((f, i) => {
    const matchId = `${f.group}-${f.team1}-${f.team2}`;
    const result = results.get(resultKeyFromTeams(f.team1, f.team2));
    const actualScore1 = result?.score1 ?? null;
    const actualScore2 = result?.score2 ?? null;
    const played = actualScore1 !== null && actualScore2 !== null;
    const predicted = predictions[matchId] ?? null;
    const scored = scoreRow(predicted, actualScore1, actualScore2);

    return {
      id: matchId,
      matchNumber: i + 1,
      team1: f.team1,
      team2: f.team2,
      group: f.group,
      phase: "group",
      predicted,
      actualScore1,
      actualScore2,
      played,
      ...scored,
    };
  });

  const knockoutPicks = KNOCKOUT_PICKS[slug] ?? {};
  let n = groupRows.length;
  const knockoutRows: ScoredPredictionRow[] = [];

  // Round of 32 — real fixtures, with each quiniela's picks and live results.
  // Scored with the group rule (the sheet uses "misma regla" for knockouts).
  for (const [team1, team2] of R32_FIXTURES) {
    n += 1;
    const key = resultKeyFromTeams(team1, team2);
    const predicted = knockoutPicks[key] ?? null;
    const result = results.get(key);
    const actualScore1 = result?.score1 ?? null;
    const actualScore2 = result?.score2 ?? null;
    const played = actualScore1 !== null && actualScore2 !== null;
    const scored = scoreRow(predicted, actualScore1, actualScore2);

    knockoutRows.push({
      id: `r32-${team1}-${team2}`,
      matchNumber: n,
      team1,
      team2,
      group: "R32",
      phase: "r32",
      predicted,
      actualScore1,
      actualScore2,
      played,
      ...scored,
    });
  }

  // Later rounds — teams aren't known until the bracket resolves; show as pending.
  for (const { phase, label, count } of KNOCKOUT_ROUND_SIZES) {
    for (let k = 0; k < count; k++) {
      n += 1;
      knockoutRows.push({
        id: `ko-${phase}-${k + 1}`,
        matchNumber: n,
        team1: "TBD",
        team2: "TBD",
        group: label,
        phase,
        predicted: null,
        actualScore1: null,
        actualScore2: null,
        played: false,
        pointsEarned: 0,
        accuracy: "pending",
        goleadaBonus: false,
      });
    }
  }

  return [...groupRows, ...knockoutRows];
}

export function computePredictionStats(rows: ScoredPredictionRow[]): QuinielaPredictionStats {
  // Count every real fixture the quiniela had a pick for — group and knockout.
  // Unplayed later-round placeholders carry no pick, so they never count.
  const playedRows = rows.filter((r) => r.played);
  let exactScores = 0;
  let correctResults = 0;
  let wrongPredictions = 0;
  let predictedCount = 0;
  let bestMatch: ScoredPredictionRow | null = null;

  for (const row of rows) {
    if (row.predicted) predictedCount += 1;
    if (!row.played || row.accuracy === "missing") continue;

    if (row.accuracy === "exact") exactScores += 1;
    else if (row.accuracy === "result") correctResults += 1;
    else if (row.accuracy === "wrong") wrongPredictions += 1;

    if (!bestMatch || row.pointsEarned > bestMatch.pointsEarned) {
      bestMatch = row;
    }
  }

  const graded = exactScores + correctResults + wrongPredictions;
  const accuracyPct = graded > 0 ? Math.round(((exactScores + correctResults) / graded) * 100) : 0;

  let currentHotStreak = 0;
  for (let i = playedRows.length - 1; i >= 0; i--) {
    const row = playedRows[i];
    if (row.accuracy === "missing" || row.pointsEarned < 1) break;
    currentHotStreak += 1;
  }

  return {
    exactScores,
    correctResults,
    wrongPredictions,
    playedCount: playedRows.length,
    predictedCount,
    accuracyPct,
    bestMatch: bestMatch && bestMatch.pointsEarned > 0 ? bestMatch : null,
    currentHotStreak,
  };
}
