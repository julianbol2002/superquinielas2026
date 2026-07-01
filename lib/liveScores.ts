import { fetchMatches, upsertMatch, isSupabaseConfigured } from "@/lib/supabase";
import { worldCupGroups, getAllGroupFixtures } from "@/data/countries";
import {
  getPlayedResultsMap,
  MATCH_PLAYED_DATES,
  resultKeyFromTeams,
} from "@/data/tournamentResults";
import { toLocalYmd } from "@/lib/matchDates";

export const ESPN_SCOREBOARD_URL =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";

export const TOURNAMENT_START = "20260601";
export const TOURNAMENT_END = "20261231";

export const LIVE_POLL_MS = 30_000;
export const IDLE_POLL_MS = 30 * 60_000;

export type MatchStatus = "scheduled" | "live" | "final";

export interface LiveMatch {
  espnId: string;
  team1: string;
  team2: string;
  score1: number;
  score2: number;
  group: string | null;
  stage: string;
  status: MatchStatus;
  isLive: boolean;
  displayClock?: string;
  matchDate: string;
  /** ISO timestamp when match ended (final only) */
  finishedAt?: string;
}

export interface ScoresResponse {
  matches: LiveMatch[];
  lastUpdated: string;
  hasLiveMatches: boolean;
  syncedCount: number;
  supabaseConfigured: boolean;
}

/** ESPN display names → app country names */
const ESPN_TEAM_MAP: Record<string, string> = {
  "Bosnia-Herzegovina": "Bosnia and Herzegovina",
  "Bosnia and Herzegovina": "Bosnia and Herzegovina",
  "United States": "United States",
  USA: "United States",
  "South Korea": "South Korea",
  "Korea Republic": "South Korea",
  "Côte d'Ivoire": "Ivory Coast",
  "Ivory Coast": "Ivory Coast",
  "Cape Verde": "Cabo Verde",
  "Cabo Verde": "Cabo Verde",
  Curacao: "Curaçao",
  "Curaçao": "Curaçao",
  "DR Congo": "DR Congo",
  "Congo DR": "DR Congo",
  "Democratic Republic of Congo": "DR Congo",
  Türkiye: "Turkey",
  Turkey: "Turkey",
  Czechia: "Czechia",
  "Czech Republic": "Czechia",
  England: "England",
  Scotland: "Scotland",
  Mexico: "Mexico",
  Canada: "Canada",
  Brazil: "Brazil",
  France: "France",
  Spain: "Spain",
  Germany: "Germany",
  Argentina: "Argentina",
  Portugal: "Portugal",
  Netherlands: "Netherlands",
  Paraguay: "Paraguay",
  Australia: "Australia",
  Switzerland: "Switzerland",
  Qatar: "Qatar",
  Morocco: "Morocco",
  Haiti: "Haiti",
  Ecuador: "Ecuador",
  Japan: "Japan",
  Sweden: "Sweden",
  Tunisia: "Tunisia",
  Belgium: "Belgium",
  Iran: "Iran",
  Egypt: "Egypt",
  "New Zealand": "New Zealand",
  Uruguay: "Uruguay",
  "Saudi Arabia": "Saudi Arabia",
  Senegal: "Senegal",
  Norway: "Norway",
  Iraq: "Iraq",
  Algeria: "Algeria",
  Austria: "Austria",
  Jordan: "Jordan",
  Colombia: "Colombia",
  Uzbekistan: "Uzbekistan",
  Croatia: "Croatia",
  Ghana: "Ghana",
  Panama: "Panama",
  "South Africa": "South Africa",
};

const APP_TEAM_NAMES = new Set(
  worldCupGroups.flatMap((g) => g.teams.map((t) => t.name))
);

export function mapEspnTeamName(name: string): string {
  const mapped = ESPN_TEAM_MAP[name] ?? name;
  if (APP_TEAM_NAMES.has(mapped)) return mapped;

  for (const team of APP_TEAM_NAMES) {
    if (
      team.toLowerCase() === mapped.toLowerCase() ||
      team.toLowerCase().includes(mapped.toLowerCase()) ||
      mapped.toLowerCase().includes(team.toLowerCase())
    ) {
      return team;
    }
  }

  return mapped;
}

function parseGroup(note?: string): string | null {
  if (!note) return null;
  const match = note.match(/Group\s+([A-L])/i);
  return match ? match[1].toUpperCase() : null;
}

export function inferGroupFromTeams(team1: string, team2: string): string | null {
  for (const group of worldCupGroups) {
    const names = group.teams.map((t) => t.name);
    if (names.includes(team1) && names.includes(team2)) {
      return group.name;
    }
  }
  return null;
}

function parseStage(slug?: string, note?: string): string {
  if (slug?.includes("group")) return "group";
  if (note?.toLowerCase().includes("final") && !note.includes("Round")) return "final";
  if (note?.toLowerCase().includes("semifinal")) return "sf";
  if (note?.toLowerCase().includes("quarter")) return "qf";
  if (note?.toLowerCase().includes("round of 16")) return "r16";
  if (note?.toLowerCase().includes("round of 32")) return "r32";
  return "group";
}

function parseScore(value: string | number | undefined): number {
  if (value === undefined || value === "") return 0;
  const n = typeof value === "number" ? value : parseInt(value, 10);
  return Number.isNaN(n) ? 0 : n;
}

interface EspnCompetitor {
  homeAway: "home" | "away";
  score: string;
  team: { displayName: string; shortDisplayName: string };
}

interface EspnEvent {
  id: string;
  date: string;
  competitions?: Array<{
    date: string;
    altGameNote?: string;
    status: {
      type: {
        state: string;
        completed: boolean;
        shortDetail?: string;
        description?: string;
      };
      displayClock?: string;
    };
    competitors: EspnCompetitor[];
  }>;
  season?: { slug?: string };
}

interface EspnScoreboard {
  events?: EspnEvent[];
}

function formatYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function getMonthChunks(): Array<{ start: string; end: string }> {
  const chunks: Array<{ start: string; end: string }> = [];
  const start = new Date(2026, 5, 1);
  const end = new Date(2026, 11, 31);
  const today = new Date();
  const effectiveEnd = today < end ? today : end;

  let cursor = new Date(start);
  while (cursor <= effectiveEnd) {
    const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    const chunkEnd = monthEnd > effectiveEnd ? effectiveEnd : monthEnd;
    chunks.push({
      start: formatYmd(monthStart),
      end: formatYmd(chunkEnd),
    });
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }

  return chunks;
}

function getSealedFallbackMatches(): LiveMatch[] {
  const results = getPlayedResultsMap();
  const fixtures = getAllGroupFixtures();
  const matches: LiveMatch[] = [];

  for (const f of fixtures) {
    const fixtureId = `${f.group}-${f.team1}-${f.team2}`;
    const result = results.get(resultKeyFromTeams(f.team1, f.team2));
    if (!result) continue;
    const playedOn = MATCH_PLAYED_DATES[fixtureId];
    matches.push({
      espnId: fixtureId,
      team1: f.team1,
      team2: f.team2,
      score1: result.score1,
      score2: result.score2,
      group: f.group,
      stage: "group",
      status: "final",
      isLive: false,
      matchDate: playedOn ?? "",
      finishedAt: playedOn ? `${playedOn}T23:59:59` : undefined,
    });
  }

  return matches;
}

async function fetchRecentEspnMatches(days = 21): Promise<LiveMatch[]> {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  return fetchEspnScoreboardForDates(formatYmd(start), formatYmd(end));
}

export function parseEspnScoreboard(data: EspnScoreboard): LiveMatch[] {
  const events = data.events ?? [];
  const results: LiveMatch[] = [];

  for (const event of events) {
    const comp = event.competitions?.[0];
    if (!comp?.competitors || comp.competitors.length < 2) continue;

    const home = comp.competitors.find((c) => c.homeAway === "home");
    const away = comp.competitors.find((c) => c.homeAway === "away");
    if (!home || !away) continue;

    const team1 = mapEspnTeamName(home.team.displayName);
    const team2 = mapEspnTeamName(away.team.displayName);
    const score1 = parseScore(home.score);
    const score2 = parseScore(away.score);
    const group =
      parseGroup(comp.altGameNote) ?? inferGroupFromTeams(team1, team2);
    const stage = parseStage(event.season?.slug, comp.altGameNote);
    const state = comp.status.type.state;

    let status: MatchStatus = "scheduled";
    if (state === "in") status = "live";
    else if (state === "post" || comp.status.type.completed) status = "final";

    results.push({
      espnId: event.id,
      team1,
      team2,
      score1,
      score2,
      group,
      stage,
      status,
      isLive: status === "live",
      displayClock:
        comp.status.displayClock ||
        comp.status.type.shortDetail ||
        comp.status.type.description,
      matchDate: toLocalYmd(comp.date || event.date),
      finishedAt:
        status === "final" ? comp.date || event.date : undefined,
    });
  }

  return results;
}

async function fetchEspnScoreboardForDates(
  start: string,
  end: string
): Promise<LiveMatch[]> {
  const url = `${ESPN_SCOREBOARD_URL}?dates=${start}-${end}`;
  const res = await fetch(url, {
    next: { revalidate: 0 },
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`ESPN API error (${start}-${end}): ${res.status}`);
  }

  const data = (await res.json()) as EspnScoreboard;
  return parseEspnScoreboard(data);
}

function mergeLiveMatches(all: LiveMatch[]): LiveMatch[] {
  const byId = new Map<string, LiveMatch>();
  const byFixture = new Map<string, LiveMatch>();

  const fixtureKey = (m: LiveMatch) =>
    `${m.group ?? "?"}|${[m.team1, m.team2].sort().join("|")}`;

  const statusRank = (m: LiveMatch) => {
    if (m.isLive || m.status === "live") return 3;
    if (m.status === "final") return 2;
    return 1;
  };

  for (const match of all) {
    const existingById = byId.get(match.espnId);
    if (
      !existingById ||
      statusRank(match) > statusRank(existingById) ||
      (statusRank(match) === statusRank(existingById) &&
        match.isLive &&
        !existingById.isLive)
    ) {
      byId.set(match.espnId, match);
    }

    const fKey = fixtureKey(match);
    const existingFixture = byFixture.get(fKey);
    if (
      !existingFixture ||
      statusRank(match) > statusRank(existingFixture) ||
      (match.isLive && !existingFixture.isLive)
    ) {
      byFixture.set(fKey, match);
    }
  }

  const merged = new Map<string, LiveMatch>();
  for (const m of byFixture.values()) {
    merged.set(m.espnId, m);
  }
  for (const m of byId.values()) {
    merged.set(m.espnId, m);
  }

  return [...merged.values()];
}

export async function fetchEspnScoreboard(): Promise<LiveMatch[]> {
  const res = await fetch(ESPN_SCOREBOARD_URL, {
    next: { revalidate: 0 },
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`ESPN API error: ${res.status}`);
  }

  const data = (await res.json()) as EspnScoreboard;
  return parseEspnScoreboard(data);
}

/** Historical backfill + today's live scoreboard merged */
export async function fetchAllEspnMatches(): Promise<LiveMatch[]> {
  const [rangeResult, todayResult] = await Promise.allSettled([
    fetchEspnScoreboardForDates(TOURNAMENT_START, TOURNAMENT_END),
    fetchEspnScoreboard(),
  ]);

  const all: LiveMatch[] = [];
  if (rangeResult.status === "fulfilled") {
    all.push(...rangeResult.value);
  }
  if (todayResult.status === "fulfilled") {
    all.push(...todayResult.value);
  }

  if (
    rangeResult.status === "rejected" ||
    (rangeResult.status === "fulfilled" && rangeResult.value.length === 0)
  ) {
    const chunkResults = await Promise.allSettled(
      getMonthChunks().map((chunk) =>
        fetchEspnScoreboardForDates(chunk.start, chunk.end)
      )
    );
    for (const result of chunkResults) {
      if (result.status === "fulfilled") {
        all.push(...result.value);
      }
    }
  }

  if (all.length === 0) {
    try {
      all.push(...(await fetchRecentEspnMatches()));
    } catch {
      /* recent window failed */
    }
  }

  if (all.length === 0) {
    const sealed = getSealedFallbackMatches();
    if (sealed.length > 0) {
      return sealed;
    }
    throw new Error("ESPN API returned no match data");
  }

  return mergeLiveMatches(all);
}

function findExistingMatch(
  existing: Awaited<ReturnType<typeof fetchMatches>>,
  team1: string,
  team2: string,
  group: string | null
) {
  return existing.find(
    (m) =>
      m.group_name === group &&
      ((m.team1 === team1 && m.team2 === team2) ||
        (m.team1 === team2 && m.team2 === team1))
  );
}

export async function syncLiveMatchesToSupabase(
  matches: LiveMatch[]
): Promise<number> {
  if (!isSupabaseConfigured()) return 0;

  const existing = await fetchMatches();
  let synced = 0;

  for (const match of matches) {
    if (match.status === "scheduled") continue;

    const found = findExistingMatch(
      existing,
      match.team1,
      match.team2,
      match.group
    );

    const result = await upsertMatch({
      id: found?.id,
      stage: match.stage,
      group_name: match.group,
      team1: match.team1,
      team2: match.team2,
      score1: match.score1,
      score2: match.score2,
      match_date: match.matchDate,
    });

    if (result) synced += 1;
  }

  return synced;
}

export async function getScoresWithSync(): Promise<ScoresResponse> {
  const { PLAYED_RESULTS } = await import("@/data/matchResults");
  const matches = PLAYED_RESULTS;
  const syncedCount = await syncLiveMatchesToSupabase(matches);

  return {
    matches,
    lastUpdated: new Date().toISOString(),
    hasLiveMatches: false,
    syncedCount,
    supabaseConfigured: isSupabaseConfigured(),
  };
}

export function getPollInterval(hasLiveMatches: boolean): number {
  return hasLiveMatches ? LIVE_POLL_MS : IDLE_POLL_MS;
}

/** Client-side fetch via Next.js API proxy */
export async function fetchScoresFromApi(): Promise<ScoresResponse> {
  const res = await fetch("/api/scores", { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Scores API error: ${res.status}`);
  }
  return res.json();
}

export function formatLastUpdated(iso: string, locale = "es"): string {
  return new Date(iso).toLocaleString(locale === "es" ? "es-ES" : "en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function getLiveMatches(matches: LiveMatch[]): LiveMatch[] {
  return matches.filter((m) => m.isLive);
}

export function getRecentMatches(matches: LiveMatch[]): LiveMatch[] {
  return matches.filter((m) => m.isLive || m.status === "final");
}
