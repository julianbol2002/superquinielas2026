"use client";

import { useMemo } from "react";
import { getRankedQuinielas, type RankedQuiniela } from "@/data/quinielas";
import type { LiveMatch } from "@/lib/liveScores";
import { useScoreOverrides } from "@/components/ScoreOverridesProvider";

export function useRankedQuinielas(liveMatches: LiveMatch[] = []): RankedQuiniela[] {
  const { overrides } = useScoreOverrides();
  return useMemo(
    () => getRankedQuinielas(liveMatches, { scoreOverrides: overrides }),
    [liveMatches, overrides]
  );
}
