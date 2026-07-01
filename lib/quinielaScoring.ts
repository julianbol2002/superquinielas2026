import { getAllGroupFixtures } from "@/data/countries";
import {
  quinielas,
  quinielaToSlug,
  type Quiniela,
} from "@/data/quinielas";
import {
  getPredictionsForSlug,
  type PredictionScore,
} from "@/data/predictions";
import {
  ACTUAL_CHAMPION,
  ACTUAL_FINALISTS,
  type MatchResult,
  mergeLiveResults,
  resultKeyFromTeams,
} from "@/data/tournamentResults";
import type { LiveMatch } from "@/lib/liveScores";

export interface MatchPointsBreakdown {
  matchId: string;
  team1: string;
  team2: string;
  group: string;
  predicted: PredictionScore;
  actualScore1: number | null;
  actualScore2: number | null;
  points: number;
  exact: boolean;
  correctResult: boolean;
  goleadaBonus: boolean;
}

export interface QuinielaScoreBreakdown {
  slug: string;
  name: string;
  captain: string;
  matchPoints: number;
  finalistBonus: number;
  championBonus: number;
  totalPoints: number;
  bothFinalistsCorrect: boolean;
  championCorrect: boolean;
  matches: MatchPointsBreakdown[];
}

function resultOf(s1: number, s2: number): "home" | "draw" | "away" {
  if (s1 > s2) return "home";
  if (s2 > s1) return "away";
  return "draw";
}

export type MatchStage = "group" | "knockout";

/**
 * Official Super Quiniela scoring for a single match.
 *
 * Scores are compared against the result after 90 min + extra time only —
 * penalty-shootout goals never count. For knockouts, a 0-0 after ET means the
 * game went to penalties.
 *
 * Group stage (matches 1-72):
 *   - correct winner or draw: 1 pt
 *   - exact score: +2 (stacks)
 *   - predicted 0-0 and result goes to pens (0-0 after ET): +2 (stacks)
 *   - correct winner with predicted margin >= 4 (goleada): +3 (stacks)
 *   - max 6 pts
 *
 * Knockout stage (Round of 32 onward):
 *   - correct winner or draw after ET: 2 pts
 *   - exact score: +4 (stacks)
 *   - predicted 0-0 and game goes to pens: +4 (stacks)
 *   - correct winner with predicted margin >= 4: +3 (stacks)
 *   - max 9 pts
 */
export function scoreMatch(
  pred: { score1: number | null; score2: number | null },
  actual: { score1: number; score2: number },
  stage: MatchStage
): number {
  if (pred.score1 === null || pred.score2 === null) return 0;

  const p1 = pred.score1;
  const p2 = pred.score2;
  const a1 = actual.score1;
  const a2 = actual.score2;

  const basePoints = stage === "group" ? 1 : 2;
  const exactBonus = stage === "group" ? 2 : 4;
  const pensBonus = stage === "group" ? 2 : 4;
  const goleadaBonus = 3;

  const predResult = resultOf(p1, p2);
  const actualResult = resultOf(a1, a2);
  const correctResult = predResult === actualResult;

  let points = 0;

  // Correct winner or correct draw
  if (correctResult) points += basePoints;

  // Exact score
  if (p1 === a1 && p2 === a2) points += exactBonus;

  // Predicted 0-0 and the game ends 0-0 (goes to penalties)
  if (p1 === 0 && p2 === 0 && a1 === 0 && a2 === 0) points += pensBonus;

  // Goleada: predicted a win by a >= 4 goal margin and got the winner right
  if (correctResult && predResult !== "draw" && Math.abs(p1 - p2) >= 4) {
    points += goleadaBonus;
  }

  return points;
}

/** Breakdown wrapper around {@link scoreMatch} used for per-match display */
export function scoreMatchPrediction(
  predicted: PredictionScore,
  actualScore1: number,
  actualScore2: number,
  stage: MatchStage = "group"
): {
  points: number;
  exact: boolean;
  correctResult: boolean;
  goleadaBonus: boolean;
} {
  if (!predicted) {
    return {
      points: 0,
      exact: false,
      correctResult: false,
      goleadaBonus: false,
    };
  }

  const exact =
    predicted.score1 === actualScore1 && predicted.score2 === actualScore2;
  const predResult = resultOf(predicted.score1, predicted.score2);
  const actualResult = resultOf(actualScore1, actualScore2);
  const correctResult = predResult === actualResult;
  const predMargin = Math.abs(predicted.score1 - predicted.score2);
  const goleadaBonus = correctResult && predResult !== "draw" && predMargin >= 4;

  const points = scoreMatch(
    predicted,
    { score1: actualScore1, score2: actualScore2 },
    stage
  );

  return { points, exact, correctResult, goleadaBonus };
}

export function computeFinalistBonus(quiniela: Quiniela): number {
  const picks = new Set([quiniela.finalist1, quiniela.finalist2]);
  const hasBoth = ACTUAL_FINALISTS.every((f) => picks.has(f));
  return hasBoth ? 10 : 0;
}

export function computeChampionBonus(quiniela: Quiniela): number {
  return quiniela.winner === ACTUAL_CHAMPION ? 5 : 0;
}

function liveResultsMap(liveMatches: LiveMatch[] = []): Map<string, MatchResult> {
  const map = new Map<string, MatchResult>();
  for (const m of liveMatches) {
    if (m.status === "scheduled") continue;
    if (m.score1 === null || m.score2 === null) continue;
    map.set(resultKeyFromTeams(m.team1, m.team2), {
      score1: m.score1,
      score2: m.score2,
    });
  }
  return map;
}

export function computeQuinielaScore(
  quiniela: Quiniela,
  liveMatches: LiveMatch[] = []
): QuinielaScoreBreakdown {
  const slug = quinielaToSlug(quiniela.name);
  const predictions = getPredictionsForSlug(slug) ?? {};
  const results = mergeLiveResults(liveResultsMap(liveMatches));
  const fixtures = getAllGroupFixtures();
  const matches: MatchPointsBreakdown[] = [];
  let matchPoints = 0;

  for (const f of fixtures) {
    const matchId = `${f.group}-${f.team1}-${f.team2}`;
    const predicted = predictions[matchId] ?? null;
    const result = results.get(resultKeyFromTeams(f.team1, f.team2));

    if (!result) {
      matches.push({
        matchId,
        team1: f.team1,
        team2: f.team2,
        group: f.group,
        predicted,
        actualScore1: null,
        actualScore2: null,
        points: 0,
        exact: false,
        correctResult: false,
        goleadaBonus: false,
      });
      continue;
    }

    const scored = scoreMatchPrediction(
      predicted,
      result.score1,
      result.score2
    );
    matchPoints += scored.points;
    matches.push({
      matchId,
      team1: f.team1,
      team2: f.team2,
      group: f.group,
      predicted,
      actualScore1: result.score1,
      actualScore2: result.score2,
      points: scored.points,
      exact: scored.exact,
      correctResult: scored.correctResult,
      goleadaBonus: scored.goleadaBonus,
    });
  }

  const finalistBonus = computeFinalistBonus(quiniela);
  const championBonus = computeChampionBonus(quiniela);
  const picks = new Set([quiniela.finalist1, quiniela.finalist2]);

  return {
    slug,
    name: quiniela.name,
    captain: quiniela.captain,
    matchPoints,
    finalistBonus,
    championBonus,
    totalPoints: matchPoints + finalistBonus + championBonus,
    bothFinalistsCorrect: ACTUAL_FINALISTS.every((f) => picks.has(f)),
    championCorrect: quiniela.winner === ACTUAL_CHAMPION,
    matches,
  };
}

export function computeAllQuinielaScores(
  liveMatches: LiveMatch[] = []
): QuinielaScoreBreakdown[] {
  return quinielas.map((q) => computeQuinielaScore(q, liveMatches));
}

export function formatScoreTooltip(
  breakdown: QuinielaScoreBreakdown,
  locale: "es" | "en" = "es"
): string {
  const isEs = locale === "es";

  const matchLabel = isEs
    ? `Pronósticos de partidos: ${breakdown.matchPoints} pts`
    : `Match predictions: ${breakdown.matchPoints} pts`;
  const finalistLabel = isEs
    ? `Ambos finalistas correctos: ${breakdown.finalistBonus} pts`
    : `Both finalists correct: ${breakdown.finalistBonus} pts`;
  const championLabel = isEs
    ? `Campeón correcto: ${breakdown.championBonus} pts`
    : `Champion correct: ${breakdown.championBonus} pts`;
  const totalLabel = isEs ? "Total" : "Total";

  return `${matchLabel} + ${finalistLabel} + ${championLabel} = ${breakdown.totalPoints} ${totalLabel}`;
}
