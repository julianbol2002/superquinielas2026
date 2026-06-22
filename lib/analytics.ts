import {
  quinielas,
  quinielaToSlug,
  getRankedQuinielas,
  type Quiniela,
} from "@/data/quinielas";
import { getAllGroupFixtures } from "@/data/countries";
import { getPredictionsForSlug } from "@/data/predictions";
import {
  mergeLiveResults,
  resultKeyFromTeams,
  type MatchResult,
} from "@/data/tournamentResults";
import {
  scoreMatchPrediction,
} from "@/lib/quinielaScoring";
import type { LiveMatch } from "@/lib/liveScores";
import { buildQuinielaColorMap } from "@/lib/chartColors";

export type AccuracyCell = "exact" | "result" | "wrong" | "pending";

export interface AnalyticsMatch {
  id: string;
  matchNumber: number;
  team1: string;
  team2: string;
  score1: number | null;
  score2: number | null;
  played: boolean;
  stage: string;
  group: string | null;
  label: string;
  margin: number;
  isGoleada: boolean;
}

export interface QuinielaMatchPoints {
  slug: string;
  name: string;
  captain: string;
  pointsEarned: number;
  predictedScore1: number;
  predictedScore2: number;
  accuracy: AccuracyCell;
  exactScore: boolean;
  goleadaBonus: boolean;
}

export interface ManOfTheMatchEntry {
  match: AnalyticsMatch;
  winners: QuinielaMatchPoints[];
}

export interface GoleadaEvent {
  match: AnalyticsMatch;
  hit: QuinielaMatchPoints[];
  missed: QuinielaMatchPoints[];
}

export interface StreakInfo {
  slug: string;
  name: string;
  captain: string;
  bestStreak: number;
  currentStreak: number;
  active: boolean;
}

export interface SummaryCallout {
  id: string;
  emoji: string;
  label: string;
  value: string;
  detail?: string;
}

export interface AnalyticsSnapshot {
  matches: AnalyticsMatch[];
  playedCount: number;
  quinielaSlugs: string[];
  quinielaNames: Record<string, string>;
  quinielaCaptains: Record<string, string>;
  /** Cumulative points after each match (index 0 = after match 1) */
  cumulativePoints: Record<string, number[]>;
  /** Rank after each match (1 = best) */
  ranksOverTime: Record<string, number[]>;
  /** Points earned on each match */
  matchPoints: Record<string, number[]>;
  heatmap: Record<string, AccuracyCell[]>;
  climbers: { slug: string; name: string; captain: string; delta: number }[];
  fallers: { slug: string; name: string; captain: string; delta: number }[];
  streaks: StreakInfo[];
  headToHead: Record<string, Record<string, number>>;
  manOfTheMatch: ManOfTheMatchEntry[];
  countryPopularity: { country: string; count: number; color: string }[];
  goleadas: GoleadaEvent[];
  summary: SummaryCallout[];
  colors: Record<string, string>;
}

const COUNTRY_KIT_COLORS: Record<string, string> = {
  Spain: "#C60B1E",
  France: "#002395",
  Argentina: "#75AADB",
  Brazil: "#009C3B",
  Portugal: "#006600",
  Netherlands: "#FF6600",
  England: "#CF081F",
  Germany: "#000000",
  Australia: "#FFCD00",
  Mexico: "#006847",
};

function liveResultsFromMatches(liveMatches: LiveMatch[]): Map<string, MatchResult> {
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

function scorePredictionFromData(
  q: Quiniela,
  match: AnalyticsMatch
): QuinielaMatchPoints {
  const slug = quinielaToSlug(q.name);
  const predictions = getPredictionsForSlug(slug) ?? {};
  const pred = predictions[match.id] ?? null;
  const base = {
    slug,
    name: q.name,
    captain: q.captain,
    predictedScore1: pred?.score1 ?? 0,
    predictedScore2: pred?.score2 ?? 0,
    pointsEarned: 0,
    accuracy: "pending" as AccuracyCell,
    exactScore: false,
    goleadaBonus: false,
  };

  if (!pred) {
    return { ...base, accuracy: "pending" };
  }

  if (!match.played || match.score1 === null || match.score2 === null) {
    return base;
  }

  const scored = scoreMatchPrediction(pred, match.score1, match.score2);
  let accuracy: AccuracyCell = "wrong";
  if (scored.exact) accuracy = "exact";
  else if (scored.correctResult) accuracy = "result";

  return {
    ...base,
    predictedScore1: pred.score1,
    predictedScore2: pred.score2,
    pointsEarned: scored.points,
    accuracy,
    exactScore: scored.exact,
    goleadaBonus: scored.goleadaBonus,
  };
}

function buildMatchList(liveMatches: LiveMatch[]): AnalyticsMatch[] {
  const results = mergeLiveResults(liveResultsFromMatches(liveMatches));
  const fixtures = getAllGroupFixtures();

  const matches: AnalyticsMatch[] = fixtures.map((f, i) => {
    const result = results.get(resultKeyFromTeams(f.team1, f.team2));
    const score1 = result?.score1 ?? null;
    const score2 = result?.score2 ?? null;
    const played = score1 !== null && score2 !== null;
    const margin = played ? Math.abs(score1 - score2) : 0;

    return {
      id: `${f.group}-${f.team1}-${f.team2}`,
      matchNumber: i + 1,
      team1: f.team1,
      team2: f.team2,
      score1,
      score2,
      played,
      stage: "group",
      group: f.group,
      label: played
        ? `${f.team1} ${score1}-${score2} ${f.team2}`
        : `${f.team1} vs ${f.team2}`,
      margin,
      isGoleada: margin >= 4,
    };
  });

  const knockoutSlots = [
    "Round of 32", "Round of 16", "Quarterfinals", "Semifinals", "Final",
  ];
  let n = matches.length;
  for (const stage of knockoutSlots) {
    for (let k = 0; k < (stage === "Round of 32" ? 16 : stage === "Round of 16" ? 8 : stage === "Quarterfinals" ? 4 : stage === "Semifinals" ? 2 : 1); k++) {
      n += 1;
      matches.push({
        id: `ko-${n}`,
        matchNumber: n,
        team1: "TBD",
        team2: "TBD",
        score1: null,
        score2: null,
        played: false,
        stage: stage.toLowerCase().replace(/\s+/g, "-"),
        group: null,
        label: `${stage} — Por definir`,
        margin: 0,
        isGoleada: false,
      });
    }
  }

  return matches;
}

function getMatchPrediction(
  q: Quiniela,
  matchId: string
): { score1: number; score2: number } | null {
  const slug = quinielaToSlug(q.name);
  const predictions = getPredictionsForSlug(slug) ?? {};
  return predictions[matchId] ?? null;
}

function computeRanks(
  cumulative: Record<string, number[]>,
  len: number,
  names: Record<string, string>,
  captains: Record<string, string>
): Record<string, number[]> {
  const slugs = quinielas.map((q) => quinielaToSlug(q.name));
  const ranks: Record<string, number[]> = {};
  slugs.forEach((s) => {
    ranks[s] = [];
  });

  for (let i = 0; i < len; i++) {
    const sorted = [...slugs].sort((a, b) => {
      const ca = cumulative[a]?.[i] ?? 0;
      const cb = cumulative[b]?.[i] ?? 0;
      if (cb !== ca) return cb - ca;
      return (captains[a] ?? names[a] ?? a).localeCompare(
        captains[b] ?? names[b] ?? b,
        "es"
      );
    });
    sorted.forEach((slug, idx) => {
      ranks[slug].push(idx + 1);
    });
  }

  return ranks;
}

export function buildAnalytics(
  liveMatches: LiveMatch[] = [],
  pointsByQuiniela?: Record<string, number>
): AnalyticsSnapshot {
  const matches = buildMatchList(liveMatches);
  const playedCount = matches.filter((m) => m.played).length;
  const playedMatches = matches.filter((m) => m.played);

  const rawByMatch: Record<string, number[]> = {};
  const heatmap: Record<string, AccuracyCell[]> = {};
  const perMatchResults: Record<string, QuinielaMatchPoints[]> = {};

  quinielas.forEach((q) => {
    const slug = quinielaToSlug(q.name);
    rawByMatch[slug] = [];
    heatmap[slug] = [];
  });

  playedMatches.forEach((match) => {
    const results: QuinielaMatchPoints[] = [];
    for (const q of quinielas) {
      const slug = quinielaToSlug(q.name);
      const scored = scorePredictionFromData(q, match);
      rawByMatch[slug].push(scored.pointsEarned);
      heatmap[slug].push(scored.accuracy);
      results.push(scored);
    }
    perMatchResults[match.id] = results;
  });

  matches.filter((m) => !m.played).forEach(() => {
    quinielas.forEach((q) => {
      const slug = quinielaToSlug(q.name);
      heatmap[slug].push("pending");
    });
  });

  const matchPointsBySlug = rawByMatch;

  const cumulativePoints: Record<string, number[]> = {};
  quinielas.forEach((q) => {
    const slug = quinielaToSlug(q.name);
    const pts = matchPointsBySlug[slug] ?? [];
    const cum: number[] = [];
    let total = 0;
    for (let i = 0; i < playedCount; i++) {
      total += pts[i] ?? 0;
      cum.push(total);
    }
    cumulativePoints[slug] = cum;
  });

  const names: Record<string, string> = {};
  const captains: Record<string, string> = {};
  quinielas.forEach((q) => {
    const s = quinielaToSlug(q.name);
    names[s] = q.name;
    captains[s] = q.captain;
  });

  const ranksOverTime = computeRanks(cumulativePoints, playedCount, names, captains);

  const ranked = getRankedQuinielas(liveMatches, { pointsByQuiniela });
  const climbers = ranked
    .map((q) => {
      const ranks = ranksOverTime[q.slug] ?? [];
      if (ranks.length < 2) return { slug: q.slug, name: q.name, captain: q.captain, delta: 0 };
      return {
        slug: q.slug,
        name: q.name,
        captain: q.captain,
        delta: (ranks[0] ?? q.rank) - (ranks[ranks.length - 1] ?? q.rank),
      };
    })
    .filter((x) => x.delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 3);

  const fallers = ranked
    .map((q) => {
      const ranks = ranksOverTime[q.slug] ?? [];
      if (ranks.length < 2) return { slug: q.slug, name: q.name, captain: q.captain, delta: 0 };
      return {
        slug: q.slug,
        name: q.name,
        captain: q.captain,
        delta: (ranks[ranks.length - 1] ?? q.rank) - (ranks[0] ?? q.rank),
      };
    })
    .filter((x) => x.delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 3);

  const streaks: StreakInfo[] = quinielas.map((q) => {
    const slug = quinielaToSlug(q.name);
    const pts = matchPointsBySlug[slug] ?? [];
    let best = 0;
    let current = 0;
    let run = 0;
    for (let i = 0; i < playedCount; i++) {
      if ((pts[i] ?? 0) >= 1) {
        run += 1;
        best = Math.max(best, run);
      } else {
        run = 0;
      }
    }
    for (let i = playedCount - 1; i >= 0; i--) {
      if ((pts[i] ?? 0) >= 1) current += 1;
      else break;
    }
    return {
      slug,
      name: q.name,
      captain: q.captain,
      bestStreak: best,
      currentStreak: current,
      active: playedCount > 0 && (pts[playedCount - 1] ?? 0) >= 1,
    };
  });

  const slugs = quinielas.map((q) => quinielaToSlug(q.name));
  const headToHead: Record<string, Record<string, number>> = {};
  slugs.forEach((a) => {
    headToHead[a] = {};
    slugs.forEach((b) => {
      if (a === b) {
        headToHead[a][b] = 0;
        return;
      }
      let wins = 0;
      playedMatches.forEach((match) => {
        const res = perMatchResults[match.id] ?? [];
        const pa = res.find((r) => r.slug === a);
        const pb = res.find((r) => r.slug === b);
        if (pa && pb && pa.pointsEarned > pb.pointsEarned) wins += 1;
        if (pa && pb && pa.pointsEarned < pb.pointsEarned) wins -= 1;
      });
      headToHead[a][b] = wins;
    });
  });

  const manOfTheMatch: ManOfTheMatchEntry[] = playedMatches.map((match) => {
    const results = perMatchResults[match.id] ?? [];
    const maxPts = Math.max(...results.map((r) => r.pointsEarned), 0);
    return {
      match,
      winners: results.filter((r) => r.pointsEarned === maxPts && maxPts > 0),
    };
  });

  const winnerCounts = new Map<string, number>();
  quinielas.forEach((q) => {
    winnerCounts.set(q.winner, (winnerCounts.get(q.winner) ?? 0) + 1);
  });
  const countryPopularity = [...winnerCounts.entries()]
    .map(([country, count]) => ({
      country,
      count,
      color: COUNTRY_KIT_COLORS[country] ?? "#00D084",
    }))
    .sort((a, b) => b.count - a.count);

  const goleadas: GoleadaEvent[] = playedMatches
    .filter((m) => m.isGoleada)
    .map((match) => {
      const results = perMatchResults[match.id] ?? [];
      return {
        match,
        hit: results.filter((r) => r.goleadaBonus),
        missed: results.filter((r) => !r.goleadaBonus && r.accuracy !== "pending"),
      };
    });

  let totalExact = 0;
  let totalGoalsPredicted = 0;
  let totalDraws = 0;
  let totalGoleadasPredicted = 0;
  const optimism: { slug: string; name: string; captain: string; goals: number }[] = [];
  const agreementByMatch: { match: AnalyticsMatch; key: string; count: number }[] = [];

  quinielas.forEach((q) => {
    let goals = 0;
    playedMatches.forEach((match) => {
      const pred = getMatchPrediction(q, match.id);
      if (!pred) return;
      goals += pred.score1 + pred.score2;
      if (pred.score1 === pred.score2) totalDraws += 1;
      if (Math.abs(pred.score1 - pred.score2) >= 4) totalGoleadasPredicted += 1;
    });
    optimism.push({
      slug: quinielaToSlug(q.name),
      name: q.name,
      captain: q.captain,
      goals,
    });
  });

  playedMatches.forEach((match) => {
    const keys = quinielas
      .map((q) => getMatchPrediction(q, match.id))
      .filter((p): p is { score1: number; score2: number } => p !== null)
      .map((p) => `${p.score1}-${p.score2}`);
    const freq = new Map<string, number>();
    keys.forEach((k) => freq.set(k, (freq.get(k) ?? 0) + 1));
    let bestKey = "";
    let bestCount = 0;
    freq.forEach((c, k) => {
      if (c > bestCount) {
        bestCount = c;
        bestKey = k;
      }
    });
    agreementByMatch.push({ match, key: bestKey, count: bestCount });
    const results = perMatchResults[match.id] ?? [];
    totalExact += results.filter((r) => r.exactScore).length;
    quinielas.forEach((q) => {
      const p = getMatchPrediction(q, match.id);
      if (p) totalGoalsPredicted += p.score1 + p.score2;
    });
  });

  optimism.sort((a, b) => b.goals - a.goals);
  agreementByMatch.sort((a, b) => b.count - a.count);
  const chaosMatch = [...agreementByMatch].sort((a, b) => a.count - b.count)[0];
  const agreeMatch = agreementByMatch[0];

  const summary: SummaryCallout[] = [
    {
      id: "exact",
      emoji: "🎯",
      label: "Pronósticos exactos",
      value: String(totalExact),
    },
    {
      id: "goals",
      emoji: "⚽",
      label: "Goles pronosticados",
      value: String(totalGoalsPredicted),
    },
    {
      id: "optimist",
      emoji: "😄",
      label: "Mayor optimista",
      value: optimism[0]?.name ?? "—",
      detail: optimism[0] ? `(${optimism[0].captain})` : undefined,
    },
    {
      id: "pessimist",
      emoji: "😐",
      label: "Mayor pesimista",
      value: optimism[optimism.length - 1]?.name ?? "—",
      detail: optimism.at(-1) ? `(${optimism.at(-1)!.captain})` : undefined,
    },
    {
      id: "draws",
      emoji: "🤝",
      label: "Más conservador",
      value: quinielas
        .map((q) => ({
          name: q.name,
          draws: playedMatches.filter((m) => {
            const p = getMatchPrediction(q, m.id);
            return p !== null && p.score1 === p.score2;
          }).length,
        }))
        .sort((a, b) => b.draws - a.draws)[0]?.name ?? "—",
    },
    {
      id: "bold",
      emoji: "🔥",
      label: "Más atrevido",
      value: quinielas
        .map((q) => ({
          name: q.name,
          goleadas: playedMatches.filter((m) => {
            const p = getMatchPrediction(q, m.id);
            return p !== null && Math.abs(p.score1 - p.score2) >= 4;
          }).length,
        }))
        .sort((a, b) => b.goleadas - a.goleadas)[0]?.name ?? "—",
    },
    {
      id: "agree",
      emoji: "🤲",
      label: "Acuerdo familiar",
      value: agreeMatch ? `${agreeMatch.count}/27` : "—",
      detail: agreeMatch?.match.label,
    },
    {
      id: "chaos",
      emoji: "🌪️",
      label: "Caos total",
      value: chaosMatch ? `${chaosMatch.count}/27` : "—",
      detail: chaosMatch?.match.label,
    },
  ];

  const colors = buildQuinielaColorMap(
    Object.fromEntries(slugs.map((slug, i) => [slug, names[slug] ?? quinielas[i]?.name ?? slug]))
  );

  return {
    matches,
    playedCount,
    quinielaSlugs: slugs,
    quinielaNames: names,
    quinielaCaptains: captains,
    cumulativePoints,
    ranksOverTime,
    matchPoints: matchPointsBySlug,
    heatmap,
    climbers,
    fallers,
    streaks,
    headToHead,
    manOfTheMatch,
    countryPopularity,
    goleadas,
    summary,
    colors,
  };
}

export function getTimelineChartData(
  snapshot: AnalyticsSnapshot,
  slugs: string[]
) {
  const played = snapshot.playedCount;
  const rows: Record<string, string | number>[] = [];

  for (let i = 0; i < played; i++) {
    const row: Record<string, string | number> = {
      match: i + 1,
      label: snapshot.matches[i]?.label ?? `M${i + 1}`,
    };
    slugs.forEach((slug) => {
      row[slug] = snapshot.cumulativePoints[slug]?.[i] ?? 0;
    });
    rows.push(row);
  }

  return rows;
}

export function getBumpChartData(snapshot: AnalyticsSnapshot, slugs: string[]) {
  const played = snapshot.playedCount;
  const rows: Record<string, string | number>[] = [];

  for (let i = 0; i < played; i++) {
    const row: Record<string, string | number> = { match: i + 1 };
    slugs.forEach((slug) => {
      row[slug] = snapshot.ranksOverTime[slug]?.[i] ?? 27;
    });
    rows.push(row);
  }

  return rows;
}

export function getTopSlugs(
  _snapshot: AnalyticsSnapshot,
  n: number,
  pointsByQuiniela?: Record<string, number>
): string[] {
  return getRankedQuinielas([], { pointsByQuiniela })
    .slice(0, n)
    .map((q) => q.slug);
}

export function getBottomSlugs(
  _snapshot: AnalyticsSnapshot,
  n: number,
  pointsByQuiniela?: Record<string, number>
): string[] {
  return getRankedQuinielas([], { pointsByQuiniela })
    .slice(-n)
    .map((q) => q.slug);
}
