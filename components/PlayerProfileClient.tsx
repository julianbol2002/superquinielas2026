"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import {
  aggregatePlayers,
  slugToCaptain,
  getGroupAveragePoints,
} from "@/data/quinielas";
import PlayerAvatar from "@/components/PlayerAvatar";
import QuinielaCard from "@/components/QuinielaCard";
import ShareCard from "@/components/ShareCard";
import AvatarUpload from "@/components/AvatarUpload";
import CountUp from "@/components/CountUp";

export default function PlayerProfileClient({ slug }: { slug: string }) {
  const t = useTranslations();
  const captain = slugToCaptain(slug);

  const player = useMemo(() => {
    if (!captain) return null;
    return aggregatePlayers().find((p) => p.slug === slug) ?? null;
  }, [captain, slug]);

  if (!captain || !player) {
    notFound();
  }

  const avg = getGroupAveragePoints();
  const topWinner =
    player.quinielas.sort((a, b) => b.points - a.points)[0]?.winner ?? "Spain";
  const pct = avg > 0 ? Math.min(100, (player.totalPoints / avg) * 50) : 50;

  return (
    <div className="pb-8">
      <Link
        href="/"
        className="mb-4 inline-block text-sm text-slate-400 hover:text-pitch"
      >
        ← {t("back")}
      </Link>

      <div className="mb-8 flex flex-col items-center text-center">
        <PlayerAvatar captain={captain} size={120} />
        <h1 className="mt-4 font-display text-3xl">{captain}</h1>
        <div className="mt-2 flex items-center gap-4">
          <div>
            <p className="font-accent text-sm text-gold">#{player.rank}</p>
            <p className="text-xs text-slate-400">{t("rank")}</p>
          </div>
          <div>
            <p className="font-display text-3xl text-pitch">
              <CountUp value={player.totalPoints} />
            </p>
            <p className="text-xs text-slate-400">{t("points")}</p>
          </div>
          <div>
            <p className="font-accent text-lg">${player.totalBet}</p>
            <p className="text-xs text-slate-400">{t("total_bet")}</p>
          </div>
        </div>
        <div className="mt-4">
          <AvatarUpload captain={captain} />
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
            <p className="mt-1 text-center text-sm font-bold">{player.totalPoints}</p>
          </div>
          <div className="flex-1 opacity-50">
            <div className="h-24 overflow-hidden rounded-lg bg-white/5 light:bg-slate-100">
              <div
                className="w-full rounded-t-lg bg-slate-500"
                style={{ height: "50%", marginTop: "50%" }}
              />
            </div>
            <p className="mt-1 text-center text-sm">{avg.toFixed(1)} avg</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <p className="font-bold text-pitch">{player.highestSingleScore}</p>
            <p className="text-slate-400">{t("highest_score")}</p>
          </div>
          <div>
            <p className="font-bold">{player.correctWinners}</p>
            <p className="text-slate-400">{t("accuracy")}</p>
          </div>
          <div>
            <p className="font-bold">{player.quinielaCount}</p>
            <p className="text-slate-400">{t("quiniela_count")}</p>
          </div>
        </div>
      </div>

      <h2 className="mb-4 font-display text-xl">{t("my_quinielas")}</h2>
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        {player.quinielas.map((q) => (
          <QuinielaCard key={q.name} quiniela={q} />
        ))}
      </div>

      <ShareCard player={player} topWinner={topWinner} />
    </div>
  );
}
