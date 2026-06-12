"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  getRankedQuinielas,
  filterQuinielasByBet,
} from "@/data/quinielas";
import Hero from "@/components/Hero";
import LiveScoresPanel from "@/components/LiveScoresPanel";
import PlayerPodium from "@/components/PlayerPodium";
import StatCards from "@/components/StatCards";
import Leaderboard from "@/components/Leaderboard";
import CountryPredictionsChart from "@/components/CountryPredictionsChart";
import MyPositionFab from "@/components/MyPositionFab";
import { cn } from "@/lib/utils";

export default function HomePageClient() {
  const t = useTranslations();
  const [betFilter, setBetFilter] = useState<"all" | 25 | 50 | 100>("all");

  const allEntries = useMemo(() => getRankedQuinielas(), []);
  const entries = useMemo(
    () => filterQuinielasByBet(allEntries, betFilter),
    [allEntries, betFilter]
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
      <StatCards entries={allEntries} />

      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl tracking-wide">{t("leaderboard")}</h2>
        <div className="flex gap-1 overflow-x-auto hide-scrollbar">
          {betTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setBetFilter(tab.key)}
              className={cn(
                "flex-shrink-0 rounded-full px-3 py-1 text-sm font-medium transition",
                betFilter === tab.key
                  ? "bg-pitch text-black"
                  : "bg-white/10 text-slate-300 light:bg-slate-200 light:text-slate-600"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <Leaderboard entries={entries} />
      <div className="mt-8">
        <CountryPredictionsChart />
      </div>
      <MyPositionFab />
    </>
  );
}
