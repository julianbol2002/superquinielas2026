import {
  quinielas,
  quinielaToSlug,
  getRankedQuinielas,
  type Quiniela,
} from "@/data/quinielas";
import {
  getAllGroupFixtures,
} from "@/data/countries";
import type { LiveMatch } from "@/lib/liveScores";

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

const CHART_COLORS = [
  "#00D084", "#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1",
  "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
  "#BB8FCE", "#85C1E9", "#F8B500", "#E74C3C", "#2ECC71",
  "#9B59B6", "#1ABC9C", "#E67E22", "#3498DB", "#16A085",
  "#C0392B", "#8E44AD", "#27AE60", "#2980B9", "#F39C12",
  "#D35400", "#7F8C8D",
];

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

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pickedTeams(q: Quiniela): Set<string> {
  return new Set([q.finalist1, q.finalist2, q.winner]);
}

function supportedTeam(q: Quiniela, team1: string, team2: string): string | null {
  const picked = pickedTeams(q);
  if (picked.has(team1) && !picked.has(team2)) return team1;
  if (picked.has(team2) && !picked.has(team1)) return team2;
  if (picked.has(team1) && picked.has(team2)) return q.winner;
  if (picked.has(q.winner) && (team1 === q.winner || team2 === q.winner)) return q.winner;
  return null;
}

function inferPrediction(
  q: Quiniela,
  match: AnalyticsMatch
): { score1: number; score2: number } {
  const h = hashStr(`${q.name}-${match.id}`);
  const fav = supportedTeam(q, match.team1, match.team2);

  if (!fav) {
    const draws = h % 3 === 0;
    if (draws) return { score1: 1, score2: 1 };
    return h % 2 === 0 ? { score1: 2, score2: 1 } : { score1: 1, score2: 2 };
  }

  const isWinner = fav === q.winner;
  const goleada = isWinner && h % 5 === 0;
  const conservative = h % 7 === 0;

  if (goleada) {
    return fav === match.team1
      ? { score1: 4 + (h % 2), score2: 0 }
      : { score1: 0, score2: 4 + (h % 2) };
  }
  if (conservative) {
    return fav === match.team1 ? { score1: 1, score2: 1 } : { score1: 1, score2: 1 };
  }

  const goals = 2 + (h % 2);
  return fav === match.team1
    ? { score1: goals, score2: 1 }
    : { score1: 1, score2: goals };
}

function resultOf(s1: number, s2: number): "home" | "draw" | "away" {
  if (s1 > s2) return "home";
  if (s2 > s1) return "away";
  return "draw";
}

function scorePrediction(
  q: Quiniela,
  match: AnalyticsMatch,
  pred: { score1: number; score2: number }
): QuinielaMatchPoints {
  const slug = quinielaToSlug(q.name);
  const base = {
    slug,
    name: q.name,
    captain: q.captain,
    predictedScore1: pred.score1,
    predictedScore2: pred.score2,
    pointsEarned: 0,
    accuracy: "pending" as AccuracyCell,
    exactScore: false,
    goleadaBonus: false,
  };

  if (!match.played || match.score1 === null || match.score2 === null) {
    return base;
  }

  const exact =
    pred.score1 === match.score1 && pred.score2 === match.score2;
  const predResult = resultOf(pred.score1, pred.score2);
  const actualResult = resultOf(match.score1, match.score2);
  const correctResult = predResult === actualResult;

  const predMargin = Math.abs(pred.score1 - pred.score2);
  const actualMargin = Math.abs(match.score1 - match.score2);
  const goleadaBonus =
    actualMargin >= 4 && predMargin >= 4 && correctResult;

  let points = 0;
  let accuracy: AccuracyCell = "wrong";
  if (exact) {
    points = 3;
    accuracy = "exact";
  } else if (correctResult) {
    points = 1;
    accuracy = "result";
  }
  if (goleadaBonus) points += 3;

  return {
    ...base,
    pointsEarned: points,
    accuracy,
    exactScore: exact,
    goleadaBonus,
  };
}

function buildMatchList(liveMatches: LiveMatch[]): AnalyticsMatch[] {
  const fixtures = getAllGroupFixtures();
  const liveMap = new Map<string, LiveMatch>();

  for (const m of liveMatches) {
    if (m.status === "scheduled") continue;
    const key = [m.team1, m.team2].sort().join("|");
    liveMap.set(key, m);
  }

  const matches: AnalyticsMatch[] = fixtures.map((f, i) => {
    const key = [f.team1, f.team2].sort().join("|");
    const live = liveMap.get(key);
    const score1 = live?.score1 ?? null;
    const score2 = live?.score2 ?? null;
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

function scaleToTargetTotals(
  rawByMatch: Record<string, number[]>,
  playedCount: number
): Record<string, number[]> {
  const scaled: Record<string, number[]> = {};

  for (const q of quinielas) {
    const slug = quinielaToSlug(q.name);
    const raw = rawByMatch[slug] ?? [];
    const rawTotal = raw.slice(0, playedCount).reduce((a, b) => a + b, 0);
    const target = q.points;

    if (playedCount === 0) {
      scaled[slug] = [];
      continue;
    }

    if (rawTotal <= 0) {
      const per = target / playedCount;
      scaled[slug] = raw.map((_, i) =>
        i < playedCount ? Math.round(per * 10) / 10 : 0
      );
      continue;
    }

    const factor = target / rawTotal;
    scaled[slug] = raw.map((v, i) =>
      i < playedCount ? Math.round(v * factor * 10) / 10 : 0
    );

    const diff =
      target -
      scaled[slug].slice(0, playedCount).reduce((a, b) => a + b, 0);
    if (Math.abs(diff) > 0.01 && playedCount > 0) {
      scaled[slug][playedCount - 1] =
        Math.round((scaled[slug][playedCount - 1] + diff) * 10) / 10;
    }
  }

  return scaled;
}

function computeRanks(cumulative: Record<string, number[]>, len: number): Record<string, number[]> {
  const slugs = quinielas.map((q) => quinielaToSlug(q.name));
  const ranks: Record<string, number[]> = {};
  slugs.forEach((s) => {
    ranks[s] = [];
  });

  for (let i = 0; i < len; i++) {
    const sorted = [...slugs].sort((a, b) => {
      const ca = cumulative[a]?.[i] ?? 0;
      const cb = cumulative[b]?.[i] ?? 0;
      return cb - ca;
    });
    sorted.forEach((slug, idx) => {
      ranks[slug].push(idx + 1);
    });
  }

  return ranks;
}

export function buildAnalytics(liveMatches: LiveMatch[] = []): AnalyticsSnapshot {
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
      const pred = inferPrediction(q, match);
      const scored = scorePrediction(q, match, pred);
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

  const scaledMatchPoints = scaleToTargetTotals(rawByMatch, playedCount);

  const cumulativePoints: Record<string, number[]> = {};
  quinielas.forEach((q) => {
    const slug = quinielaToSlug(q.name);
    const pts = scaledMatchPoints[slug] ?? [];
    const cum: number[] = [];
    let total = 0;
    for (let i = 0; i < playedCount; i++) {
      total += pts[i] ?? 0;
      cum.push(Math.round(total * 10) / 10);
    }
    cumulativePoints[slug] = cum;
  });

  const ranksOverTime = computeRanks(cumulativePoints, playedCount);

  const ranked = getRankedQuinielas();
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
    const pts = scaledMatchPoints[slug] ?? [];
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
      const pred = inferPrediction(q, match);
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
    const keys = quinielas.map((q) => {
      const p = inferPrediction(q, match);
      return `${p.score1}-${p.score2}`;
    });
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
      const p = inferPrediction(q, match);
      totalGoalsPredicted += p.score1 + p.score2;
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
            const p = inferPrediction(q, m);
            return p.score1 === p.score2;
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
            const p = inferPrediction(q, m);
            return Math.abs(p.score1 - p.score2) >= 4;
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

  const colors: Record<string, string> = {};
  quinielas.forEach((q, i) => {
    colors[quinielaToSlug(q.name)] = CHART_COLORS[i % CHART_COLORS.length];
  });

  const names: Record<string, string> = {};
  const captains: Record<string, string> = {};
  quinielas.forEach((q) => {
    const s = quinielaToSlug(q.name);
    names[s] = q.name;
    captains[s] = q.captain;
  });

  return {
    matches,
    playedCount,
    quinielaSlugs: slugs,
    quinielaNames: names,
    quinielaCaptains: captains,
    cumulativePoints,
    ranksOverTime,
    matchPoints: scaledMatchPoints,
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

export function getTopSlugs(snapshot: AnalyticsSnapshot, n: number): string[] {
  return getRankedQuinielas()
    .slice(0, n)
    .map((q) => q.slug);
}

export function getBottomSlugs(snapshot: AnalyticsSnapshot, n: number): string[] {
  return getRankedQuinielas()
    .slice(-n)
    .map((q) => q.slug);
}
