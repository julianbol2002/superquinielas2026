import {
  quinielas,
  quinielaToSlug,
} from "@/data/quinielas";
import { getPredictionsForSlug } from "@/data/predictions";
import type { LiveMatch } from "@/lib/liveScores";
import { scoreMatchPrediction } from "@/lib/quinielaScoring";

export interface LivePredictorEntry {
  slug: string;
  name: string;
  captain: string;
  /** Picked both teams in this fixture as their two finalists */
  bothMatchTeamsAsFinalists: boolean;
}

export interface LivePredictorsResult {
  exact: LivePredictorEntry[];
  correctResult: LivePredictorEntry[];
}

const MS_24H = 24 * 60 * 60 * 1000;

function sortEntries(entries: LivePredictorEntry[]): LivePredictorEntry[] {
  return [...entries].sort((a, b) => a.name.localeCompare(b.name, "es"));
}

function predictedBothMatchTeamsAsFinalists(
  quiniela: (typeof quinielas)[number],
  team1: string,
  team2: string
): boolean {
  const matchTeams = new Set([team1, team2]);
  return matchTeams.has(quiniela.finalist1) && matchTeams.has(quiniela.finalist2);
}

export function getLivePredictorsForMatch(
  group: string,
  team1: string,
  team2: string,
  actualScore1: number,
  actualScore2: number
): LivePredictorsResult {
  const matchId = `${group}-${team1}-${team2}`;
  const exact: LivePredictorEntry[] = [];
  const correctResult: LivePredictorEntry[] = [];

  for (const q of quinielas) {
    const slug = quinielaToSlug(q.name);
    const predictions = getPredictionsForSlug(slug);
    const pred = predictions?.[matchId] ?? null;
    if (!pred) continue;

    const scored = scoreMatchPrediction(pred, actualScore1, actualScore2);

    const entry: LivePredictorEntry = {
      slug,
      name: q.name,
      captain: q.captain,
      bothMatchTeamsAsFinalists: predictedBothMatchTeamsAsFinalists(q, team1, team2),
    };

    if (scored.exact) {
      exact.push(entry);
    } else if (scored.correctResult) {
      correctResult.push(entry);
    }
  }

  return {
    exact: sortEntries(exact),
    correctResult: sortEntries(correctResult),
  };
}

export function formatPredictorNameList(
  entries: LivePredictorEntry[],
  maxVisible = 2
): { names: string[]; overflow: number } {
  const all = entries.map((e) => e.name);
  return {
    names: all.slice(0, maxVisible),
    overflow: Math.max(0, all.length - maxVisible),
  };
}

export interface ShowLivePredictorsOptions {
  liveMatch?: LiveMatch | null;
  /** ISO timestamp when the result was saved or the match ended */
  completedAt?: string | null;
  /** Ground-truth played result with no ESPN/db timestamp */
  isPlayedSealed?: boolean;
}

export function shouldShowLivePredictors(
  isLive: boolean,
  score1: number | null,
  score2: number | null,
  options: ShowLivePredictorsOptions = {}
): boolean {
  if (score1 == null || score2 == null) return false;
  if (isLive) return true;

  const now = Date.now();
  const { liveMatch, completedAt, isPlayedSealed } = options;

  const within24h = (iso: string) =>
    now - new Date(iso).getTime() < MS_24H;

  if (liveMatch?.finishedAt && within24h(liveMatch.finishedAt)) return true;
  if (completedAt && within24h(completedAt)) return true;

  if (liveMatch?.status === "final" && liveMatch.matchDate) {
    const endOfDay = new Date(`${liveMatch.matchDate}T23:59:59`).getTime();
    if (now - endOfDay < MS_24H) return true;
  }

  if (isPlayedSealed) return true;

  return false;
}
