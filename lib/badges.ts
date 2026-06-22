import { quinielas, quinielaToSlug, type RankedQuiniela } from "@/data/quinielas";
import { getPredictionsForSlug } from "@/data/predictions";
import { getLatestRecapDate, getRecapRankMovers } from "@/lib/dailyRecap";
import type { LiveMatch } from "@/lib/liveScores";
import { loadLocalMatches } from "@/lib/localMatchStore";
import {
  getScoredPredictions,
  type ScoredPredictionRow,
} from "@/lib/predictionScoring";
import type { MatchRow } from "@/lib/supabase";
import { scoreMatchPrediction } from "@/lib/quinielaScoring";
import {
  mergeLiveResults,
  resultKeyFromTeams,
  type MatchResult,
} from "@/data/tournamentResults";
import { getAllGroupFixtures } from "@/data/countries";

export type BadgeTier = "daily" | "streak" | "collectible" | "secret";

export type BadgeId =
  | "daily_climber"
  | "daily_faller"
  | "hot_streak"
  | "on_a_roll"
  | "cold_streak"
  | "ice_age"
  | "goleada_hunter"
  | "upset_caller"
  | "lone_wolf"
  | "sniper"
  | "maverick"
  | "draw_master"
  | "perfect_match";

export interface QuinielaBadge {
  id: BadgeId;
  emoji: string;
  tier: BadgeTier;
  priority: number;
}

export interface LeaderboardBadgeBoard {
  bySlug: Record<string, QuinielaBadge[]>;
}

const BADGE_META: Record<
  BadgeId,
  { emoji: string; tier: BadgeTier; priority: number }
> = {
  daily_climber: { emoji: "📈", tier: "daily", priority: 100 },
  daily_faller: { emoji: "📉", tier: "daily", priority: 99 },
  on_a_roll: { emoji: "🚀", tier: "streak", priority: 92 },
  hot_streak: { emoji: "🔥", tier: "streak", priority: 88 },
  ice_age: { emoji: "🧊", tier: "streak", priority: 86 },
  cold_streak: { emoji: "🥶", tier: "streak", priority: 82 },
  perfect_match: { emoji: "💯", tier: "collectible", priority: 75 },
  goleada_hunter: { emoji: "🌋", tier: "secret", priority: 70 },
  lone_wolf: { emoji: "🐺", tier: "secret", priority: 68 },
  upset_caller: { emoji: "🎲", tier: "secret", priority: 66 },
  maverick: { emoji: "🃏", tier: "collectible", priority: 64 },
  draw_master: { emoji: "🤝", tier: "collectible", priority: 58 },
  sniper: { emoji: "🎯", tier: "collectible", priority: 52 },
};

function badge(id: BadgeId): QuinielaBadge {
  const meta = BADGE_META[id];
  return { id, ...meta };
}

function getPlayedGroupRows(rows: ScoredPredictionRow[]): ScoredPredictionRow[] {
  return rows.filter((r) => r.phase === "group" && r.played);
}

function currentStreaks(played: ScoredPredictionRow[]): { hot: number; cold: number } {
  let hot = 0;
  let cold = 0;

  for (let i = played.length - 1; i >= 0; i--) {
    const row = played[i];
    if (row.accuracy === "missing") continue;

    if (row.pointsEarned >= 1) {
      if (cold > 0) break;
      hot += 1;
    } else {
      if (hot > 0) break;
      cold += 1;
    }
  }

  return { hot, cold };
}

function resultSign(score1: number, score2: number): "home" | "draw" | "away" {
  if (score1 > score2) return "home";
  if (score2 > score1) return "away";
  return "draw";
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

interface GlobalAwards {
  goleada: Set<string>;
  loneWolf: Set<string>;
  upset: Set<string>;
  maverick: Set<string>;
}

function computeGlobalAwards(liveMatches: LiveMatch[]): GlobalAwards {
  const results = mergeLiveResults(liveResultsMap(liveMatches));
  const awards: GlobalAwards = {
    goleada: new Set(),
    loneWolf: new Set(),
    upset: new Set(),
    maverick: new Set(),
  };

  for (const f of getAllGroupFixtures()) {
    const matchId = `${f.group}-${f.team1}-${f.team2}`;
    const actual = results.get(resultKeyFromTeams(f.team1, f.team2));
    if (!actual) continue;

    const actualSign = resultSign(actual.score1, actual.score2);
    const perQuiniela: {
      slug: string;
      points: number;
      exact: boolean;
      goleadaBonus: boolean;
      predictedSign: "home" | "draw" | "away" | null;
      correctResult: boolean;
    }[] = [];

    const signCounts = { home: 0, draw: 0, away: 0 };
    let predictors = 0;

    for (const q of quinielas) {
      const slug = quinielaToSlug(q.name);
      const pred = getPredictionsForSlug(slug)?.[matchId] ?? null;
      if (!pred) {
        perQuiniela.push({
          slug,
          points: 0,
          exact: false,
          goleadaBonus: false,
          predictedSign: null,
          correctResult: false,
        });
        continue;
      }

      const scored = scoreMatchPrediction(pred, actual.score1, actual.score2);
      const predictedSign = resultSign(pred.score1, pred.score2);
      signCounts[predictedSign] += 1;
      predictors += 1;

      perQuiniela.push({
        slug,
        points: scored.points,
        exact: scored.exact,
        goleadaBonus: scored.goleadaBonus,
        predictedSign,
        correctResult: scored.correctResult,
      });
    }

    const exacts = perQuiniela.filter((p) => p.exact);
    if (exacts.length === 1) {
      awards.loneWolf.add(exacts[0].slug);
    }

    for (const p of perQuiniela) {
      if (p.goleadaBonus) awards.goleada.add(p.slug);
      if (p.correctResult && p.predictedSign) {
        const pickedSame = signCounts[p.predictedSign];
        const minority = predictors > 0 && pickedSame <= Math.max(3, Math.floor(predictors * 0.25));
        if (minority) awards.upset.add(p.slug);
      }
    }

    const withPoints = perQuiniela.filter((p) => p.points > 0);
    const zeroes = perQuiniela.filter((p) => p.points === 0 && p.predictedSign);
    if (withPoints.length === 1 && zeroes.length >= 10) {
      awards.maverick.add(withPoints[0].slug);
    }
  }

  return awards;
}

function streakBadges(hot: number, cold: number): QuinielaBadge[] {
  const badges: QuinielaBadge[] = [];
  if (hot >= 5) badges.push(badge("on_a_roll"));
  else if (hot >= 3) badges.push(badge("hot_streak"));

  if (cold >= 5) badges.push(badge("ice_age"));
  else if (cold >= 3) badges.push(badge("cold_streak"));

  return badges;
}

function collectibleBadges(
  slug: string,
  played: ScoredPredictionRow[],
  globalAwards: GlobalAwards
): QuinielaBadge[] {
  const badges: QuinielaBadge[] = [];
  const exactCount = played.filter((r) => r.accuracy === "exact").length;
  const drawHits = played.filter(
    (r) =>
      r.predicted &&
      r.predicted.score1 === r.predicted.score2 &&
      (r.accuracy === "exact" || r.accuracy === "result")
  ).length;
  const maxPoints = Math.max(0, ...played.map((r) => r.pointsEarned));

  if (globalAwards.goleada.has(slug)) badges.push(badge("goleada_hunter"));
  if (globalAwards.loneWolf.has(slug)) badges.push(badge("lone_wolf"));
  if (globalAwards.upset.has(slug)) badges.push(badge("upset_caller"));
  if (globalAwards.maverick.has(slug)) badges.push(badge("maverick"));

  if (exactCount >= 3) badges.push(badge("sniper"));

  if (drawHits >= 3) badges.push(badge("draw_master"));
  if (maxPoints >= 6) badges.push(badge("perfect_match"));

  return badges;
}

export function computeLeaderboardBadges(
  entries: RankedQuiniela[],
  liveMatches: LiveMatch[] = [],
  localRows?: MatchRow[],
  pointsByQuiniela?: Record<string, number>
): LeaderboardBadgeBoard {
  const rows =
    localRows ??
    (typeof window !== "undefined" ? loadLocalMatches() : []);

  const globalAwards = computeGlobalAwards(liveMatches);
  const recapDate = getLatestRecapDate();
  const movers = getRecapRankMovers(recapDate, liveMatches, rows, pointsByQuiniela);

  const topClimber = [...movers]
    .filter((m) => m.direction === "up")
    .sort((a, b) => b.delta - a.delta || a.slug.localeCompare(b.slug))[0];
  const topFaller = [...movers]
    .filter((m) => m.direction === "down")
    .sort((a, b) => b.delta - a.delta || a.slug.localeCompare(b.slug))[0];

  const bySlug: Record<string, QuinielaBadge[]> = {};

  for (const entry of entries) {
    const scored = getScoredPredictions(entry.slug, liveMatches);
    const played = getPlayedGroupRows(scored);
    const { hot, cold } = currentStreaks(played);

    const earned: QuinielaBadge[] = [];

    if (topClimber && topClimber.slug === entry.slug && topClimber.delta > 0) {
      earned.push(badge("daily_climber"));
    }
    if (topFaller && topFaller.slug === entry.slug && topFaller.delta > 0) {
      earned.push(badge("daily_faller"));
    }

    earned.push(...streakBadges(hot, cold));
    earned.push(...collectibleBadges(entry.slug, played, globalAwards));

    const seen = new Set<BadgeId>();
    bySlug[entry.slug] = earned
      .filter((b) => {
        if (seen.has(b.id)) return false;
        seen.add(b.id);
        return true;
      })
      .sort((a, b) => b.priority - a.priority);
  }

  return { bySlug };
}
