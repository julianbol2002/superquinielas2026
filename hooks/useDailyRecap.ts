"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildDailyRecap,
  getAvailableRecapDates,
  getLatestRecapDate,
  isRecapWindowOpen,
  type DailyRecap,
} from "@/lib/dailyRecap";
import {
  countUnreadRecaps,
  isRecapRead,
  markRecapRead,
} from "@/lib/dailyRecapState";
import { loadLocalMatches } from "@/lib/localMatchStore";
import type { LiveMatch } from "@/lib/liveScores";
import { useScores } from "@/components/ScoresProvider";

export function useDailyRecap(
  liveMatches: LiveMatch[] = [],
  scoresVersion?: string | null
) {
  const { pointsMap } = useScores();
  const [now, setNow] = useState(() => new Date());
  const [readVersion, setReadVersion] = useState(0);
  const [localVersion, setLocalVersion] = useState(0);

  useEffect(() => {
    const tick = () => setNow(new Date());
    const msUntilNextMinute = 60_000 - (Date.now() % 60_000);
    let interval: ReturnType<typeof setInterval> | undefined;
    const initial = setTimeout(() => {
      tick();
      interval = setInterval(tick, 60_000);
    }, msUntilNextMinute);
    return () => {
      clearTimeout(initial);
      if (interval) clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    setLocalVersion((v) => v + 1);
  }, [scoresVersion, liveMatches.length]);

  const localRows = useMemo(() => {
    void localVersion;
    return loadLocalMatches();
  }, [localVersion]);

  const availableDates = useMemo(
    () => getAvailableRecapDates(liveMatches, now, localRows),
    [liveMatches, now, localRows]
  );

  const recaps = useMemo(
    () =>
      availableDates.map((date) => ({
        date,
        recap: buildDailyRecap(date, liveMatches, localRows, pointsMap),
      })),
    [availableDates, liveMatches, localRows, pointsMap]
  );

  const latestDate = useMemo(() => getLatestRecapDate(now), [now]);
  const latestRecap = useMemo(
    () => recaps.find((r) => r.date === latestDate)?.recap ?? null,
    [recaps, latestDate]
  );

  const unreadCount = useMemo(() => {
    void readVersion;
    return countUnreadRecaps(availableDates);
  }, [availableDates, readVersion]);

  const markRead = useCallback((date: string) => {
    markRecapRead(date);
    setReadVersion((v) => v + 1);
  }, []);

  const isRead = useCallback(
    (date: string) => {
      void readVersion;
      return isRecapRead(date);
    },
    [readVersion]
  );

  return {
    now,
    isWindowOpen: isRecapWindowOpen(now),
    availableDates,
    recaps,
    latestDate,
    latestRecap,
    unreadCount,
    markRead,
    isRead,
  };
}

export type { DailyRecap };
