import { getAllGroupFixtures } from "@/data/countries";
import {
  getPredictionsForSlug,
  type PredictionScore,
} from "@/data/predictions";
import type { LiveMatch } from "@/lib/liveScores";

export type RowAccuracy = "exact" | "result" | "wrong" | "pending" | "missing";

export interface ScoredPredictionRow {
  id: string;
  matchNumber: number;
  team1: string;
  team2: string;
  group: string;
  phase: "group" | "quarter" | "semi" | "final";
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

function resultOf(s1: number, s2: number): "home" | "draw" | "away" {
  if (s1 > s2) return "home";
  if (s2 > s1) return "away";
  return "draw";
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

  const exact =
    predicted.score1 === actualScore1 && predicted.score2 === actualScore2;
  const predResult = resultOf(predicted.score1, predicted.score2);
  const actualResult = resultOf(actualScore1, actualScore2);
  const correctResult = predResult === actualResult;

  const predMargin = Math.abs(predicted.score1 - predicted.score2);
  const actualMargin = Math.abs(actualScore1 - actualScore2);
  const goleadaBonus =
    actualMargin >= 4 && predMargin >= 4 && correctResult;

  let points = 0;
  let accuracy: RowAccuracy = "wrong";
  if (exact) {
    points = 3;
    accuracy = "exact";
  } else if (correctResult) {
    points = 1;
    accuracy = "result";
  }
  if (goleadaBonus) points += 3;

  return { pointsEarned: points, accuracy, goleadaBonus };
}

function liveMapFromMatches(liveMatches: LiveMatch[]): Map<string, LiveMatch> {
  const map = new Map<string, LiveMatch>();
  for (const m of liveMatches) {
    if (m.status === "scheduled") continue;
    const key = [m.team1, m.team2].sort().join("|");
    map.set(key, m);
  }
  return map;
}

export function getBetTierLabel(bet: 25 | 50 | 100): "JUGADOR" | "GOLEADOR" | "MVP" {
  if (bet >= 100) return "MVP";
  if (bet >= 50) return "GOLEADOR";
  return "JUGADOR";
}

export function getScoredPredictions(
  slug: string,
  liveMatches: LiveMatch[] = []
): ScoredPredictionRow[] {
  const predictions = getPredictionsForSlug(slug) ?? {};
  const liveMap = liveMapFromMatches(liveMatches);
  const fixtures = getAllGroupFixtures();

  const groupRows: ScoredPredictionRow[] = fixtures.map((f, i) => {
    const key = [f.team1, f.team2].sort().join("|");
    const live = liveMap.get(key);
    const actualScore1 = live?.score1 ?? null;
    const actualScore2 = live?.score2 ?? null;
    const played = actualScore1 !== null && actualScore2 !== null;
    const predicted = predictions[`${f.group}-${f.team1}-${f.team2}`] ?? null;
    const scored = scoreRow(predicted, actualScore1, actualScore2);

    return {
      id: `${f.group}-${f.team1}-${f.team2}`,
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

  const knockoutPhases: Array<{ phase: "quarter" | "semi" | "final"; count: number }> = [
    { phase: "quarter", count: 4 },
    { phase: "semi", count: 2 },
    { phase: "final", count: 1 },
  ];

  let n = groupRows.length;
  const knockoutRows: ScoredPredictionRow[] = [];
  for (const { phase, count } of knockoutPhases) {
    for (let k = 0; k < count; k++) {
      n += 1;
      knockoutRows.push({
        id: `ko-${phase}-${k + 1}`,
        matchNumber: n,
        team1: "TBD",
        team2: "TBD",
        group: phase,
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
  const playedRows = rows.filter((r) => r.phase === "group" && r.played);
  let exactScores = 0;
  let correctResults = 0;
  let wrongPredictions = 0;
  let predictedCount = 0;
  let bestMatch: ScoredPredictionRow | null = null;

  for (const row of rows) {
    if (row.phase !== "group") continue;
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
