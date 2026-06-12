"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchScoresFromApi,
  getPollInterval,
  type ScoresResponse,
} from "@/lib/liveScores";
import { syncEspnToLocalStore } from "@/lib/matchData";

export function useLiveScores() {
  const [data, setData] = useState<ScoresResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const result = await fetchScoresFromApi();
      if (result && !result.supabaseConfigured) {
        syncEspnToLocalStore(result.matches);
      }
      setData(result);
      setError(null);
      return result;
    } catch {
      setError("fetch_failed");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const scheduleNext = (result: ScoresResponse | null) => {
      if (cancelled) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      const interval = getPollInterval(result?.hasLiveMatches ?? false);
      timerRef.current = setTimeout(async () => {
        const next = await refresh();
        if (!cancelled) scheduleNext(next);
      }, interval);
    };

    refresh().then((result) => {
      if (!cancelled) scheduleNext(result);
    });

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [refresh]);

  return { data, loading, error, refresh };
}
