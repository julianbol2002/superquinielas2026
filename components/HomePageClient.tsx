"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  filterQuinielasByBet,
} from "@/data/quinielas";
import { useRankedQuinielas } from "@/hooks/useRankedQuinielas";
import { useLiveScores } from "@/hooks/useLiveScores";
import { recordRankSnapshot, hasReliableRankHistory } from "@/lib/rankHistory";
import { computeLeaderboardBadges } from "@/lib/badges";
import { loadLocalMatches } from "@/lib/localMatchStore";
import { useScoreOverrides } from "@/components/ScoreOverridesProvider";
import Hero from "@/components/Hero";
import LiveScoresPanel from "@/components/LiveScoresPanel";
import PlayerPodium from "@/components/PlayerPodium";
import StatCards from "@/components/StatCards";
import LiveMatchLeaderboardBanner from "@/components/LiveMatchLeaderboardBanner";
import Leaderboard from "@/components/Leaderboard";
import OfficialSyncStatus from "@/components/OfficialSyncStatus";
import CountryPredictionsChart from "@/components/CountryPredictionsChart";
import MyPositionFab from "@/components/MyPositionFab";
import { cn } from "@/lib/utils";

export default function HomePageClient() {
  const t = useTranslations();
  const [betFilter, setBetFilter] = useState<"all" | 25 | 50 | 100>("all");

  const { data: liveData } = useLiveScores();
  const { overrides } = useScoreOverrides();

  const allEntries = useRankedQuinielas(liveData?.matches ?? []);

  const [rankHistoryReady, setRankHistoryReady] = useState(false);

  const lastRecordedSync = useRef<string | null>(null);
  useEffect(() => {
    setRankHistoryReady(hasReliableRankHistory());
  }, []);

  useEffect(() => {
    if (!liveData?.lastUpdated || allEntries.length === 0) return;
    if (lastRecordedSync.current === liveData.lastUpdated) return;
    lastRecordedSync.current = liveData.lastUpdated;
    recordRankSnapshot(allEntries);
    setRankHistoryReady(hasReliableRankHistory());
  }, [liveData?.lastUpdated, allEntries]);
  const entries = useMemo(
    () => filterQuinielasByBet(allEntries, betFilter),
    [allEntries, betFilter]
  );

  const localRows = useMemo(
    () => loadLocalMatches(),
    [liveData?.lastUpdated]
  );

  const badgeBoard = useMemo(
    () => computeLeaderboardBadges(allEntries, liveData?.matches ?? [], localRows, overrides),
    [allEntries, liveData?.matches, localRows, overrides]
  );

  const betTabs: { key: typeof betFilter; label: string }[] = [
    { key: "all", label: t("all") },
    { key: 25, label: "$25" },
    { key: 50, label: "$50" },
    { key: 100, label: "$100" },
  ];

  return (
    <>
      <Hero />
      <LiveScoresPanel />
      <PlayerPodium entries={allEntries} />
      <StatCards
        entries={allEntries}
        liveMatches={liveData?.matches ?? []}
        rankHistoryReady={rankHistoryReady}
      />

      <LiveMatchLeaderboardBanner
        matches={liveData?.matches ?? []}
        lastUpdated={liveData?.lastUpdated}
      />

      <div className="mb-1 flex items-center justify-between px-4 md:px-0">
        <h2 className="font-display text-2xl tracking-wide text-section">{t("leaderboard")}</h2>
        <div className="flex gap-1 overflow-x-auto hide-scrollbar">
          {betTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setBetFilter(tab.key)}
              className={cn(
                "min-h-[44px] flex-shrink-0 border px-3 py-1.5 text-label font-medium transition-colors",
                betFilter === tab.key
                  ? "border-accent bg-accent text-black"
                  : "border-border bg-surface text-secondary hover:bg-hover"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <OfficialSyncStatus />

      <div className="mb-4 px-4 md:px-0">
        <Leaderboard entries={entries} badgesBySlug={badgeBoard.bySlug} />
      </div>
      <div className="mt-8">
        <CountryPredictionsChart />
      </div>
      <MyPositionFab />
    </>
  );
}
