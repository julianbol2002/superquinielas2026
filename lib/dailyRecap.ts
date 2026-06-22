import { quinielas, quinielaToSlug, getRankedQuinielas } from "@/data/quinielas";
import { getAllGroupFixtures } from "@/data/countries";
import { getPredictionsForSlug } from "@/data/predictions";
import {
  mergeLiveResults,
  resultKeyFromTeams,
  type MatchResult,
} from "@/data/tournamentResults";
import { scoreMatchPrediction } from "@/lib/quinielaScoring";
import type { LiveMatch } from "@/lib/liveScores";
import type { MatchRow } from "@/lib/supabase";
import {
  fixtureOccurredOnDate,
  resolveFixtureRecapDate,
  getMatchCompletionYmd,
} from "@/lib/matchDates";

export { getMatchCompletionYmd as getMatchEndDateYmd };

export const RECAP_HOUR = 9;
export const MAX_RECAP_HISTORY = 14;

export type DailyRecapStoryKind =
  | "headline"
  | "match_results"
  | "top_scorer"
  | "climber"
  | "faller"
  | "multi_exact"
  | "goleada_hit"
  | "goleada_miss"
  | "everyone_wrong"
  | "lone_wolf"
  | "shutout"
  | "consensus_hit"
  | "hot_streak"
  | "quiet_day"
  | "standings";

export interface RecapMatch {
  id: string;
  team1: string;
  team2: string;
  score1: number;
  score2: number;
  group: string | null;
  isGoleada: boolean;
}

export interface RecapPlayerRef {
  slug: string;
  name: string;
  captain: string;
}

export interface DailyRecapStory {
  id: string;
  kind: DailyRecapStoryKind;
  data: Record<string, unknown>;
}

export interface DailyRecap {
  date: string;
  matchCount: number;
  hasMatchActivity: boolean;
  stories: DailyRecapStory[];
}

interface DayMatchResult {
  match: RecapMatch;
  perQuiniela: {
    slug: string;
    name: string;
    captain: string;
    points: number;
    exact: boolean;
    correctResult: boolean;
    goleadaBonus: boolean;
    predicted: { score1: number; score2: number } | null;
  }[];
}

function formatYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDays(ymd: string, days: number): string {
  const d = parseYmd(ymd);
  d.setDate(d.getDate() + days);
  return formatYmd(d);
}

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededShuffle<T>(items: T[], seed: string): T[] {
  const arr = [...items];
  let s = hashSeed(seed);
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickVariant<T>(items: T[], seed: string, salt: string): T {
  const idx = hashSeed(`${seed}:${salt}`) % items.length;
  return items[idx];
}


function extendLiveMatches(
  liveMatches: LiveMatch[],
  localRows: MatchRow[]
): LiveMatch[] {
  const byKey = new Map<string, LiveMatch>();
  for (const m of liveMatches) {
    byKey.set(resultKeyFromTeams(m.team1, m.team2), m);
  }
  for (const row of localRows) {
    if (row.score1 === null || row.score2 === null) continue;
    const key = resultKeyFromTeams(row.team1, row.team2);
    if (byKey.has(key)) continue;
    byKey.set(key, {
      espnId: row.id,
      team1: row.team1,
      team2: row.team2,
      score1: row.score1,
      score2: row.score2,
      group: row.group_name,
      stage: row.stage,
      status: "final",
      isLive: false,
      matchDate: row.match_date ?? "",
    });
  }
  return [...byKey.values()];
}

function liveResultsMap(liveMatches: LiveMatch[]): Map<string, MatchResult> {
  const map = new Map<string, MatchResult>();
  for (const m of liveMatches) {
    if (m.status !== "final") continue;
    if (m.score1 === null || m.score2 === null) continue;
    map.set(resultKeyFromTeams(m.team1, m.team2), {
      score1: m.score1,
      score2: m.score2,
    });
  }
  return map;
}

function resolveCompletionDate(
  fixtureId: string,
  team1: string,
  team2: string,
  liveMatches: LiveMatch[],
  localRows: MatchRow[]
): string | null {
  return resolveFixtureRecapDate(fixtureId, team1, team2, liveMatches, localRows);
}

function buildAllPlayedMatches(
  liveMatches: LiveMatch[],
  localRows: MatchRow[] = []
): RecapMatch[] {
  const allLive = extendLiveMatches(liveMatches, localRows);
  const results = mergeLiveResults(liveResultsMap(allLive));
  const fixtures = getAllGroupFixtures();
  const matches: RecapMatch[] = [];

  for (const f of fixtures) {
    const id = `${f.group}-${f.team1}-${f.team2}`;
    const result = results.get(resultKeyFromTeams(f.team1, f.team2));
    if (!result) continue;
    const margin = Math.abs(result.score1 - result.score2);
    matches.push({
      id,
      team1: f.team1,
      team2: f.team2,
      score1: result.score1,
      score2: result.score2,
      group: f.group,
      isGoleada: margin >= 4,
    });
  }

  return matches;
}

function getMatchesForRecapDate(
  recapDate: string,
  liveMatches: LiveMatch[],
  localRows: MatchRow[] = []
): RecapMatch[] {
  const allLive = extendLiveMatches(liveMatches, localRows);
  const all = buildAllPlayedMatches(liveMatches, localRows);
  return all.filter((m) =>
    fixtureOccurredOnDate(m.id, m.team1, m.team2, recapDate, allLive, localRows)
  );
}

function scoreDayMatches(
  dayMatches: RecapMatch[]
): DayMatchResult[] {
  return dayMatches.map((match) => {
    const perQuiniela = quinielas.map((q) => {
      const slug = quinielaToSlug(q.name);
      const predictions = getPredictionsForSlug(slug) ?? {};
      const predicted = predictions[match.id] ?? null;
      let points = 0;
      let exact = false;
      let correctResult = false;
      let goleadaBonus = false;

      if (predicted) {
        const scored = scoreMatchPrediction(
          predicted,
          match.score1,
          match.score2
        );
        points = scored.points;
        exact = scored.exact;
        correctResult = scored.correctResult;
        goleadaBonus = scored.goleadaBonus;
      }

      return {
        slug,
        name: q.name,
        captain: q.captain,
        points,
        exact,
        correctResult,
        goleadaBonus,
        predicted,
      };
    });

    return { match, perQuiniela };
  });
}

function computeDayRanks(
  dayResults: DayMatchResult[],
  before: boolean,
  pointsByQuiniela?: Record<string, number>
): Map<string, number> {
  const totals = new Map<string, number>();
  quinielas.forEach((q) => totals.set(quinielaToSlug(q.name), 0));

  const ranked = getRankedQuinielas([], { pointsByQuiniela });
  ranked.forEach((q) => totals.set(q.slug, q.points));

  if (before && dayResults.length > 0) {
    for (const dr of dayResults) {
      for (const p of dr.perQuiniela) {
        totals.set(p.slug, (totals.get(p.slug) ?? 0) - p.points);
      }
    }
  }

  const slugs = quinielas.map((q) => quinielaToSlug(q.name));
  const sorted = [...slugs].sort((a, b) => {
    const pa = totals.get(a) ?? 0;
    const pb = totals.get(b) ?? 0;
    if (pb !== pa) return pb - pa;
    const ca = quinielas.find((q) => quinielaToSlug(q.name) === a)?.captain ?? a;
    const cb = quinielas.find((q) => quinielaToSlug(q.name) === b)?.captain ?? b;
    return ca.localeCompare(cb, "es");
  });

  const ranks = new Map<string, number>();
  sorted.forEach((slug, i) => ranks.set(slug, i + 1));
  return ranks;
}

export interface RecapRankMover {
  slug: string;
  delta: number;
  direction: "up" | "down";
}

/** Rank movers for a single recap calendar day (match points only). */
export function getRecapRankMovers(
  recapDate: string,
  liveMatches: LiveMatch[] = [],
  localRows: MatchRow[] = [],
  pointsByQuiniela?: Record<string, number>
): RecapRankMover[] {
  const dayMatches = getMatchesForRecapDate(recapDate, liveMatches, localRows);
  if (dayMatches.length === 0) return [];

  const dayResults = scoreDayMatches(dayMatches);
  const ranksBefore = computeDayRanks(dayResults, true, pointsByQuiniela);
  const ranksAfter = computeDayRanks(dayResults, false, pointsByQuiniela);
  const movers: RecapRankMover[] = [];

  for (const q of quinielas) {
    const slug = quinielaToSlug(q.name);
    const before = ranksBefore.get(slug) ?? 27;
    const after = ranksAfter.get(slug) ?? 27;
    const delta = before - after;
    if (delta === 0) continue;
    movers.push({
      slug,
      delta: Math.abs(delta),
      direction: delta > 0 ? "up" : "down",
    });
  }

  return movers;
}

export function isRecapWindowOpen(now = new Date()): boolean {
  return now.getHours() >= RECAP_HOUR;
}

/** Latest calendar date whose recap is published (yesterday once it's 9 AM). */
export function getLatestRecapDate(now = new Date()): string {
  const d = new Date(now);
  if (!isRecapWindowOpen(now)) {
    d.setDate(d.getDate() - 2);
  } else {
    d.setDate(d.getDate() - 1);
  }
  return formatYmd(d);
}

export function getAvailableRecapDates(
  liveMatches: LiveMatch[],
  now = new Date(),
  localRows: MatchRow[] = []
): string[] {
  const latest = getLatestRecapDate(now);
  const dates: string[] = [];
  const allLive = extendLiveMatches(liveMatches, localRows);
  const allPlayed = buildAllPlayedMatches(liveMatches, localRows);

  const playedDates = new Set<string>();
  for (const m of allPlayed) {
    const date = resolveCompletionDate(m.id, m.team1, m.team2, allLive, localRows);
    if (date) playedDates.add(date);
    const live = allLive.find(
      (x) =>
        x.status === "final" &&
        ((x.team1 === m.team1 && x.team2 === m.team2) ||
          (x.team1 === m.team2 && x.team2 === m.team1))
    );
    if (live?.matchDate) playedDates.add(live.matchDate);
  }

  let cursor = latest;
  for (let i = 0; i < MAX_RECAP_HISTORY; i++) {
    if (cursor < "2026-06-01") break;
    if (playedDates.has(cursor) || cursor === latest) {
      dates.push(cursor);
    }
    cursor = addDays(cursor, -1);
  }

  if (dates.length === 0 && isRecapWindowOpen(now)) {
    dates.push(latest);
  }

  return dates;
}

export function buildDailyRecap(
  recapDate: string,
  liveMatches: LiveMatch[] = [],
  localRows: MatchRow[] = [],
  pointsByQuiniela?: Record<string, number>
): DailyRecap {
  const dayMatches = getMatchesForRecapDate(recapDate, liveMatches, localRows);
  const dayResults = scoreDayMatches(dayMatches);
  const hasMatchActivity = dayMatches.length > 0;

  const stories: DailyRecapStory[] = [];
  const seed = recapDate;

  if (!hasMatchActivity) {
    const ranked = getRankedQuinielas(liveMatches, { pointsByQuiniela }).slice(0, 5);
    stories.push({
      id: "quiet",
      kind: "quiet_day",
      data: { date: recapDate },
    });
    stories.push({
      id: "standings",
      kind: "standings",
      data: {
        leaders: ranked.map((q) => ({
          slug: q.slug,
          name: q.name,
          captain: q.captain,
          points: q.points,
          rank: q.rank,
        })),
      },
    });
    return { date: recapDate, matchCount: 0, hasMatchActivity, stories };
  }

  stories.push({
    id: "matches",
    kind: "match_results",
    data: {
      matches: dayMatches.map((m) => ({
        team1: m.team1,
        team2: m.team2,
        score1: m.score1,
        score2: m.score2,
        group: m.group,
        isGoleada: m.isGoleada,
      })),
    },
  });

  const pointsBySlug = new Map<string, { player: RecapPlayerRef; points: number; exacts: number }>();
  for (const dr of dayResults) {
    for (const p of dr.perQuiniela) {
      const existing = pointsBySlug.get(p.slug) ?? {
        player: { slug: p.slug, name: p.name, captain: p.captain },
        points: 0,
        exacts: 0,
      };
      existing.points += p.points;
      if (p.exact) existing.exacts += 1;
      pointsBySlug.set(p.slug, existing);
    }
  }

  const topScorers = [...pointsBySlug.values()]
    .filter((x) => x.points > 0)
    .sort((a, b) => b.points - a.points || a.player.name.localeCompare(b.player.name, "es"));

  if (topScorers.length > 0) {
    const hero = topScorers[0];
    const tied = topScorers.filter((x) => x.points === hero.points);
    stories.push({
      id: "top_scorer",
      kind: "top_scorer",
      data: {
        players: tied.map((t) => ({ ...t.player, points: t.points, exacts: t.exacts })),
        matchCount: dayMatches.length,
      },
    });
  }

  const ranksBefore = computeDayRanks(dayResults, true, pointsByQuiniela);
  const ranksAfter = computeDayRanks(dayResults, false, pointsByQuiniela);
  const movers: { player: RecapPlayerRef; delta: number; direction: "up" | "down" }[] = [];

  for (const q of quinielas) {
    const slug = quinielaToSlug(q.name);
    const before = ranksBefore.get(slug) ?? 27;
    const after = ranksAfter.get(slug) ?? 27;
    const delta = before - after;
    if (delta === 0) continue;
    movers.push({
      player: { slug, name: q.name, captain: q.captain },
      delta: Math.abs(delta),
      direction: delta > 0 ? "up" : "down",
    });
  }

  const climbers = movers
    .filter((m) => m.direction === "up")
    .sort((a, b) => b.delta - a.delta || a.player.name.localeCompare(b.player.name, "es"));
  const fallers = movers
    .filter((m) => m.direction === "down")
    .sort((a, b) => b.delta - a.delta || a.player.name.localeCompare(b.player.name, "es"));

  if (climbers.length > 0) {
    stories.push({
      id: "climber",
      kind: "climber",
      data: { movers: climbers.slice(0, 3) },
    });
  }
  if (fallers.length > 0) {
    stories.push({
      id: "faller",
      kind: "faller",
      data: { movers: fallers.slice(0, 3) },
    });
  }

  const multiExact = [...pointsBySlug.values()]
    .filter((x) => x.exacts >= 2)
    .sort((a, b) => b.exacts - a.exacts || b.points - a.points);
  if (multiExact.length > 0) {
    stories.push({
      id: "multi_exact",
      kind: "multi_exact",
      data: {
        players: multiExact.slice(0, 3).map((x) => ({
          ...x.player,
          exacts: x.exacts,
          points: x.points,
        })),
      },
    });
  }

  for (const dr of dayResults) {
    if (!dr.match.isGoleada) continue;
    const hit = dr.perQuiniela.filter((p) => p.goleadaBonus);
    const missed = dr.perQuiniela.filter((p) => !p.goleadaBonus && p.predicted);
    if (hit.length > 0) {
      stories.push({
        id: `goleada_hit_${dr.match.id}`,
        kind: "goleada_hit",
        data: {
          match: dr.match,
          players: hit.map((p) => ({ slug: p.slug, name: p.name, captain: p.captain })),
        },
      });
    }
    if (missed.length >= 5) {
      stories.push({
        id: `goleada_miss_${dr.match.id}`,
        kind: "goleada_miss",
        data: {
          match: dr.match,
          missCount: missed.length,
        },
      });
    }
  }

  for (const dr of dayResults) {
    const withPoints = dr.perQuiniela.filter((p) => p.points > 0);
    const exacts = dr.perQuiniela.filter((p) => p.exact);
    const predictedCount = dr.perQuiniela.filter((p) => p.predicted).length;

    if (withPoints.length === 0 && predictedCount >= 10) {
      stories.push({
        id: `everyone_wrong_${dr.match.id}`,
        kind: "everyone_wrong",
        data: { match: dr.match },
      });
    } else if (withPoints.length === 0 && predictedCount > 0) {
      stories.push({
        id: `shutout_${dr.match.id}`,
        kind: "shutout",
        data: { match: dr.match },
      });
    }

    if (exacts.length === 1) {
      const winner = exacts[0];
      stories.push({
        id: `lone_wolf_${dr.match.id}`,
        kind: "lone_wolf",
        data: {
          match: dr.match,
          player: { slug: winner.slug, name: winner.name, captain: winner.captain },
        },
      });
    }

    const correct = dr.perQuiniela.filter((p) => p.correctResult || p.exact);
    if (correct.length >= 15) {
      stories.push({
        id: `consensus_${dr.match.id}`,
        kind: "consensus_hit",
        data: {
          match: dr.match,
          count: correct.length,
          total: dr.perQuiniela.filter((p) => p.predicted).length,
        },
      });
    }
  }

  const streakCandidates = [...pointsBySlug.values()]
    .filter((x) => x.points >= 3)
    .sort((a, b) => b.points - a.points);
  if (streakCandidates.length > 0) {
    stories.push({
      id: "hot_streak",
      kind: "hot_streak",
      data: {
        player: streakCandidates[0].player,
        points: streakCandidates[0].points,
      },
    });
  }

  const ranked = getRankedQuinielas(liveMatches, { pointsByQuiniela }).slice(0, 3);
  stories.push({
    id: "standings",
    kind: "standings",
    data: {
      leaders: ranked.map((q) => ({
        slug: q.slug,
        name: q.name,
        captain: q.captain,
        points: q.points,
        rank: q.rank,
      })),
    },
  });

  const headlineKind = pickVariant(
    ["top_scorer", "climber", "multi_exact", "lone_wolf", "goleada_hit"] as const,
    seed,
    "headline"
  );
  let headlineData: Record<string, unknown> = {};

  if (headlineKind === "top_scorer" && topScorers.length > 0) {
    headlineData = { players: topScorers.slice(0, 2).map((t) => ({ ...t.player, points: t.points })) };
  } else if (headlineKind === "climber" && climbers.length > 0) {
    headlineData = { mover: climbers[0] };
  } else if (headlineKind === "multi_exact" && multiExact.length > 0) {
    headlineData = { player: multiExact[0].player, exacts: multiExact[0].exacts };
  } else {
    const loneWolf = stories.find((s) => s.kind === "lone_wolf");
    const goleada = stories.find((s) => s.kind === "goleada_hit");
    if (loneWolf) {
      headlineData = loneWolf.data;
    } else if (goleada) {
      headlineData = goleada.data;
    } else if (topScorers.length > 0) {
      headlineData = { players: [{ ...topScorers[0].player, points: topScorers[0].points }] };
    } else {
      headlineData = { matches: dayMatches.length };
    }
  }

  stories.unshift({
    id: "headline",
    kind: "headline",
    data: { variant: headlineKind, ...headlineData },
  });

  const bodyStories = stories.filter((s) => s.kind !== "headline");
  const shuffled = seededShuffle(bodyStories, `${seed}:body`);
  const headline = stories.find((s) => s.kind === "headline")!;
  const matchResults = shuffled.find((s) => s.kind === "match_results");
  const rest = shuffled.filter((s) => s.kind !== "match_results");
  const standings = rest.find((s) => s.kind === "standings");
  const middle = rest.filter((s) => s.kind !== "standings");

  const ordered = [
    headline,
    ...(matchResults ? [matchResults] : []),
    ...middle.slice(0, 6),
    ...(standings ? [standings] : []),
  ];

  return {
    date: recapDate,
    matchCount: dayMatches.length,
    hasMatchActivity,
    stories: ordered,
  };
}

export function formatRecapDateLabel(date: string, locale: string): string {
  const d = parseYmd(date);
  return d.toLocaleDateString(locale === "en" ? "en-US" : "es-PA", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
