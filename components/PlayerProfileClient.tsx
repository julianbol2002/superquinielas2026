"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import {
  slugToQuiniela,
  getQuinielaAveragePoints,
} from "@/data/quinielas";
import { getPrizeForQuiniela } from "@/lib/prizes";
import { useRankedQuinielas } from "@/hooks/useRankedQuinielas";
import { useLiveScores } from "@/hooks/useLiveScores";
import { useScoreOverrides } from "@/components/ScoreOverridesProvider";
import PlayerAvatar from "@/components/PlayerAvatar";
import QuinielaCard from "@/components/QuinielaCard";
import ShareCard from "@/components/ShareCard";
import AvatarUpload from "@/components/AvatarUpload";
import CountUp from "@/components/CountUp";
import FlagChip from "@/components/FlagChip";

export default function PlayerProfileClient({ slug }: { slug: string }) {
  const t = useTranslations();
  const quiniela = slugToQuiniela(slug);
  const { data: liveData } = useLiveScores();
  const { overrides } = useScoreOverrides();
  const allEntries = useRankedQuinielas(liveData?.matches ?? []);

  const entry = useMemo(() => {
    if (!quiniela) return null;
    return allEntries.find((q) => q.slug === slug) ?? null;
  }, [quiniela, slug, allEntries]);

  const prize = useMemo(
    () => (entry ? getPrizeForQuiniela(entry.slug, overrides) : undefined),
    [entry, overrides]
  );

  if (!quiniela || !entry) {
    notFound();
  }

  const avg = getQuinielaAveragePoints(liveData?.matches ?? [], overrides);
  const pct = avg > 0 ? Math.min(100, (entry.points / avg) * 50) : 50;

  return (
    <div className="pb-8">
      <Link
        href="/"
        className="mb-4 inline-block text-sm text-slate-400 hover:text-pitch"
      >
        ← {t("back")}
      </Link>

      <div className="mb-8 flex flex-col items-center text-center">
        <PlayerAvatar captain={entry.captain} size={120} />
        <h1 className="mt-4 font-display text-3xl">{entry.name}</h1>
        <p className="mt-1 text-slate-400">
          {t("captain")}: {entry.captain}
        </p>
        <div className="mt-4 flex items-center gap-4">
          <div>
            <p className="font-accent text-sm text-gold">#{entry.rank}</p>
            <p className="text-xs text-slate-400">{t("rank")}</p>
          </div>
          <div>
            <p className="font-display text-3xl text-pitch">
              <CountUp value={entry.points} />
            </p>
            <p className="text-xs text-slate-400">{t("points")}</p>
          </div>
          <div>
            <p className="font-accent text-lg">${entry.bet}</p>
            <p className="text-xs text-slate-400">{t("bet")}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <FlagChip country={entry.finalist1} showLabel size={14} />
          <FlagChip country={entry.finalist2} showLabel size={14} />
          <FlagChip country={entry.winner} showLabel size={14} />
        </div>
        <div className="mt-4">
          <AvatarUpload captain={entry.captain} />
        </div>
      </div>

      <div className="mb-8 rounded-xl border border-white/10 bg-stadium-card p-4 light:border-slate-200 light:bg-white">
        <p className="mb-2 text-sm text-slate-400">{t("vs_average")}</p>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <div className="h-24 overflow-hidden rounded-lg bg-white/5 light:bg-slate-100">
              <div
                className="w-full rounded-t-lg bg-gradient-to-t from-pitch to-emerald-400 transition-all"
                style={{ height: `${pct}%`, marginTop: `${100 - pct}%` }}
              />
            </div>
            <p className="mt-1 text-center text-sm font-bold">{entry.points}</p>
          </div>
          <div className="flex-1 opacity-50">
            <div className="h-24 overflow-hidden rounded-lg bg-white/5 light:bg-slate-100">
              <div
                className="w-full rounded-t-lg bg-slate-500"
                style={{ height: "50%", marginTop: "50%" }}
              />
            </div>
            <p className="mt-1 text-center text-sm">
              {avg.toFixed(1)} {t("profile_avg_label")}
            </p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <p className="font-bold text-pitch">{entry.points}</p>
            <p className="text-slate-400">{t("points")}</p>
          </div>
          <div>
            <p className="font-bold">{entry.correctWinner ? "✓" : "—"}</p>
            <p className="text-slate-400">{t("accuracy")}</p>
          </div>
          <div>
            <p className="font-bold">
              {prize ? `$${prize.estimatedPayout}` : "—"}
            </p>
            <p className="text-slate-400">{t("profile_bet_tier")}</p>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <QuinielaCard quiniela={entry} />
      </div>

      <ShareCard entry={entry} />
    </div>
  );
}
