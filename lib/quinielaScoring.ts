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

/** Per Reglas.pdf: correct result = 1pt, exact score adds +2 (3 total), goleada +3 */
export function scoreMatchPrediction(
  predicted: PredictionScore,
  actualScore1: number,
  actualScore2: number
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
  const actualMargin = Math.abs(actualScore1 - actualScore2);
  const goleadaBonus =
    actualMargin >= 4 && predMargin >= 4 && correctResult;

  let points = 0;
  if (exact) {
    points = 3;
  } else if (correctResult) {
    points = 1;
  }
  if (goleadaBonus) points += 3;

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
  const parts: string[] = [];
  const isEs = locale === "es";

  parts.push(
    isEs
      ? `Pronósticos de partidos: ${breakdown.matchPoints} pts`
      : `Match predictions: ${breakdown.matchPoints} pts`
  );

  if (breakdown.finalistBonus > 0) {
    parts.push(
      isEs
        ? `Ambos finalistas correctos: ${breakdown.finalistBonus} pts`
        : `Both finalists correct: ${breakdown.finalistBonus} pts`
    );
  }

  if (breakdown.championBonus > 0) {
    parts.push(
      isEs
        ? `Campeón correcto: ${breakdown.championBonus} pts`
        : `Champion correct: ${breakdown.championBonus} pts`
    );
  }

  const totalLabel = isEs ? "Total" : "Total";
  return `${parts.join(" + ")} = ${breakdown.totalPoints} ${totalLabel}`;
}
