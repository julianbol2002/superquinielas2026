import type { RankedQuiniela } from "@/data/quinielas";
import {
  computePredictionStats,
  getScoredPredictions,
} from "@/lib/predictionScoring";
import type { LiveMatch } from "@/lib/liveScores";

export interface PredictionHighlights {
  mostExact: RankedQuiniela | null;
  mostExactCount: number;
  longestStreak: RankedQuiniela | null;
  longestStreakCount: number;
}

export function getPredictionHighlights(
  entries: RankedQuiniela[],
  liveMatches: LiveMatch[] = []
): PredictionHighlights {
  let mostExact: RankedQuiniela | null = null;
  let mostExactCount = -1;
  let longestStreak: RankedQuiniela | null = null;
  let longestStreakCount = -1;

  for (const entry of entries) {
    const rows = getScoredPredictions(entry.slug, liveMatches);
    const stats = computePredictionStats(rows);

    if (
      stats.exactScores > mostExactCount ||
      (stats.exactScores === mostExactCount &&
        mostExact &&
        entry.name.localeCompare(mostExact.name, "es") < 0)
    ) {
      mostExactCount = stats.exactScores;
      mostExact = entry;
    }

    if (
      stats.currentHotStreak > longestStreakCount ||
      (stats.currentHotStreak === longestStreakCount &&
        longestStreak &&
        entry.name.localeCompare(longestStreak.name, "es") < 0)
    ) {
      longestStreakCount = stats.currentHotStreak;
      longestStreak = entry;
    }
  }

  return {
    mostExact: mostExactCount > 0 ? mostExact : null,
    mostExactCount: Math.max(0, mostExactCount),
    longestStreak: longestStreakCount > 0 ? longestStreak : null,
    longestStreakCount: Math.max(0, longestStreakCount),
  };
}
