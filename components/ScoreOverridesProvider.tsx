"use client";



import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

import { OFFICIAL_SYNC_STALE_MS } from "@/data/expectedPoints";

import type { ScoreOverrideMap, ScoreSyncMeta } from "@/lib/scoreOverrides";



const OVERRIDE_POLL_MS = 10 * 60 * 1000;



interface ScoreOverridesContextValue {

  overrides: ScoreOverrideMap;

  meta: ScoreSyncMeta;

  loading: boolean;

  refresh: () => Promise<ScoreSyncMeta | undefined>;

}



const defaultMeta: ScoreSyncMeta = {

  lastSyncedAt: null,

  overrideCount: 0,

  source: "baseline",

};



const ScoreOverridesContext = createContext<ScoreOverridesContextValue>({

  overrides: {},

  meta: defaultMeta,

  loading: true,

  refresh: async () => undefined,

});



export function ScoreOverridesProvider({

  children,

}: {

  children: React.ReactNode;

}) {

  const [overrides, setOverrides] = useState<ScoreOverrideMap>({});

  const [meta, setMeta] = useState<ScoreSyncMeta>(defaultMeta);

  const [loading, setLoading] = useState(true);

  const syncRequested = useRef(false);



  const refresh = useCallback(async () => {

    try {

      const res = await fetch("/api/score-overrides", { cache: "no-store" });

      if (!res.ok) return;

      const data = await res.json();

      const nextMeta = (data.meta ?? defaultMeta) as ScoreSyncMeta;

      setOverrides(data.overrides ?? {});

      setMeta(nextMeta);

      return nextMeta;
    } catch {

      /* keep baseline */

    } finally {

      setLoading(false);

    }

  }, []);



  const requestSyncIfStale = useCallback(async () => {

    if (syncRequested.current) return;

    if (typeof window === "undefined") return;



    const lastAttempt = sessionStorage.getItem("official_sync_attempt_at");

    if (lastAttempt) {

      const elapsed = Date.now() - Number(lastAttempt);

      if (elapsed < OFFICIAL_SYNC_STALE_MS) return;

    }



    syncRequested.current = true;

    sessionStorage.setItem("official_sync_attempt_at", String(Date.now()));



    try {

      await fetch("/api/sync-original-scores", { method: "POST", cache: "no-store" });

      await refresh();

    } catch {

      /* cron or deploy will catch up */

    }

  }, [refresh]);



  useEffect(() => {

    refresh().then((fetchedMeta) => {
      if (!fetchedMeta?.lastSyncedAt) {

        void requestSyncIfStale();

        return;

      }

      const stale =

        Date.now() - new Date(fetchedMeta.lastSyncedAt).getTime() >

        OFFICIAL_SYNC_STALE_MS;

      if (stale) void requestSyncIfStale();

    });



    const poll = setInterval(() => {

      void refresh();

    }, OVERRIDE_POLL_MS);



    return () => clearInterval(poll);

  }, [refresh, requestSyncIfStale]);



  return (

    <ScoreOverridesContext.Provider value={{ overrides, meta, loading, refresh }}>

      {children}

    </ScoreOverridesContext.Provider>

  );

}



export function useScoreOverrides() {

  return useContext(ScoreOverridesContext);

}


