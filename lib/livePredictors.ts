import {
  quinielas,
  quinielaToSlug,
} from "@/data/quinielas";
import { getPredictionsForSlug } from "@/data/predictions";
import { ACTUAL_FINALISTS } from "@/data/tournamentResults";
import type { LiveMatch } from "@/lib/liveScores";
import { scoreMatchPrediction } from "@/lib/quinielaScoring";

export interface LivePredictorEntry {
  slug: string;
  name: string;
  captain: string;
  bothFinalistsCorrect: boolean;
}

export interface LivePredictorsResult {
  exact: LivePredictorEntry[];
  correctResult: LivePredictorEntry[];
}

const MS_24H = 24 * 60 * 60 * 1000;

function sortEntries(entries: LivePredictorEntry[]): LivePredictorEntry[] {
  return [...entries].sort((a, b) => a.name.localeCompare(b.name, "es"));
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
    const picks = new Set([q.finalist1, q.finalist2]);
    const bothFinalistsCorrect = ACTUAL_FINALISTS.every((f) => picks.has(f));

    const entry: LivePredictorEntry = {
      slug,
      name: q.name,
      captain: q.captain,
      bothFinalistsCorrect,
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

export function shouldShowLivePredictors(
  isLive: boolean,
  score1: number | null,
  score2: number | null,
  liveMatch?: LiveMatch | null,
  lastUpdated?: string
): boolean {
  if (score1 == null || score2 == null) return false;
  if (isLive) return true;

  const now = Date.now();

  if (liveMatch?.finishedAt) {
    return now - new Date(liveMatch.finishedAt).getTime() < MS_24H;
  }

  if (liveMatch?.status === "final" && liveMatch.matchDate) {
    const endOfDay = new Date(`${liveMatch.matchDate}T23:59:59`).getTime();
    return now - endOfDay < MS_24H;
  }

  if (lastUpdated) {
    return now - new Date(lastUpdated).getTime() < MS_24H;
  }

  return false;
}
