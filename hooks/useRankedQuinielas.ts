"use client";

import { useMemo } from "react";
import { getRankedQuinielas, type RankedQuiniela } from "@/data/quinielas";
import type { LiveMatch } from "@/lib/liveScores";
import { useScores } from "@/components/ScoresProvider";

export function useRankedQuinielas(liveMatches: LiveMatch[] = []): RankedQuiniela[] {
  const { pointsMap } = useScores();
  return useMemo(
    () => getRankedQuinielas(liveMatches, { pointsByQuiniela: pointsMap }),
    [liveMatches, pointsMap]
  );
}
