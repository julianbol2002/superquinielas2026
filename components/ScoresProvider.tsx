"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Score } from "@/lib/getScores";
import { scoresToMap } from "@/lib/getScores";

const CACHE_DURATION = 30 * 60 * 1000;

interface ScoresContextValue {
  scores: Score[];
  pointsMap: Record<string, number>;
  lastFetched: number;
  loading: boolean;
  refresh: (force?: boolean) => Promise<void>;
}

const ScoresContext = createContext<ScoresContextValue>({
  scores: [],
  pointsMap: {},
  lastFetched: 0,
  loading: false,
  refresh: async () => {},
});

export function ScoresProvider({
  children,
  initialScores,
  initialLastFetched,
}: {
  children: React.ReactNode;
  initialScores: Score[];
  initialLastFetched: number;
}) {
  const [scores, setScores] = useState<Score[]>(initialScores);
  const [lastFetched, setLastFetched] = useState(initialLastFetched);
  const [loading, setLoading] = useState(false);

  const pointsMap = useMemo(() => scoresToMap(scores), [scores]);

  const refresh = useCallback(async (force = false) => {
    if (!force && Date.now() - lastFetched < CACHE_DURATION && scores.length > 0) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/refresh-scores", {
        method: "POST",
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { scores: Score[]; lastFetched: number };
      setScores(data.scores ?? []);
      setLastFetched(data.lastFetched ?? Date.now());
    } finally {
      setLoading(false);
    }
  }, [lastFetched, scores.length]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastFetched >= CACHE_DURATION) {
        void refresh(true);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [lastFetched, refresh]);

  return (
    <ScoresContext.Provider
      value={{ scores, pointsMap, lastFetched, loading, refresh }}
    >
      {children}
    </ScoresContext.Provider>
  );
}

export function useScores() {
  return useContext(ScoresContext);
}
