"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  const lastFetchedRef = useRef(lastFetched);
  const scoresRef = useRef(scores);

  useEffect(() => {
    lastFetchedRef.current = lastFetched;
  }, [lastFetched]);

  useEffect(() => {
    scoresRef.current = scores;
  }, [scores]);

  const pointsMap = useMemo(() => scoresToMap(scores), [scores]);

  const refresh = useCallback(async (force = false) => {
    const fetchedAt = lastFetchedRef.current;
    const currentScores = scoresRef.current;

    if (!force && Date.now() - fetchedAt < CACHE_DURATION && currentScores.length > 0) {
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
      if (data.scores.length > 0) {
        setScores(data.scores);
        setLastFetched(data.lastFetched > 0 ? data.lastFetched : Date.now());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (Date.now() - initialLastFetched >= CACHE_DURATION) {
      void refresh(true);
    }

    const interval = setInterval(() => {
      void refresh(true);
    }, CACHE_DURATION);

    return () => clearInterval(interval);
  }, [initialLastFetched, refresh]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastFetchedRef.current >= CACHE_DURATION) {
        void refresh(true);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);

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
