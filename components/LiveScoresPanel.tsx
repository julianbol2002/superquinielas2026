"use client";

import { useTranslations, useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@/i18n/routing";
import {
  formatLastUpdated,
  getLiveMatches,
} from "@/lib/liveScores";
import { useLiveScores } from "@/hooks/useLiveScores";
import FlagChip from "./FlagChip";
import { getCountryDisplayName } from "@/data/countries";
import { cn } from "@/lib/utils";

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-pitch/20 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-pitch">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pitch opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-pitch" />
      </span>
      EN VIVO
    </span>
  );
}

export default function LiveScoresPanel() {
  const t = useTranslations();
  const locale = useLocale();
  const { data, loading, error } = useLiveScores();
  const liveMatches = data ? getLiveMatches(data.matches) : [];

  if (loading && !data) {
    return (
      <section className="mb-6 rounded-xl border border-white/10 bg-stadium-card p-4 light:border-slate-200 light:bg-white">
        <div className="h-20 animate-pulse rounded-lg bg-white/5 light:bg-slate-100" />
      </section>
    );
  }

  if (error && !data) return null;

  return (
    <section className="mb-4 rounded-xl border border-pitch/30 bg-gradient-to-br from-stadium-card to-stadium-navy/80 p-3 light:border-pitch/40 light:from-white light:to-slate-50">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg tracking-wide text-pitch">
          {t("live_scores")}
        </h2>
        {data?.lastUpdated && (
          <p className="text-xs text-slate-400 light:text-slate-500">
            {t("last_updated")}:{" "}
            <span className="font-medium text-slate-300 light:text-slate-600">
              {formatLastUpdated(data.lastUpdated, locale)}
            </span>
          </p>
        )}
      </div>

      <AnimatePresence mode="popLayout">
        {liveMatches.length === 0 ? (
          <motion.p
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-slate-400 light:text-slate-500"
          >
            {t("no_live_matches")}
          </motion.p>
        ) : (
          <div key="list" className="space-y-2">
            {liveMatches.map((match) => (
              <motion.div
                key={match.espnId}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-lg border border-pitch/20 bg-black/20 px-3 py-3 light:border-pitch/30 light:bg-slate-50",
                  match.isLive && "shadow-[0_0_20px_rgba(0,208,132,0.15)]"
                )}
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <FlagChip country={match.team1} size={18} />
                  <span className="text-sm font-semibold leading-tight">
                    {getCountryDisplayName(match.team1, true)}
                  </span>
                </div>

                <div className="flex flex-col items-center px-2">
                  <LiveBadge />
                  <span className="mt-1 font-display text-2xl tabular-nums">
                    {match.score1} - {match.score2}
                  </span>
                  {match.displayClock && (
                    <span className="font-accent text-xs text-pitch">
                      {match.displayClock}
                    </span>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
                  <span className="text-right text-sm font-semibold leading-tight">
                    {getCountryDisplayName(match.team2, true)}
                  </span>
                  <FlagChip country={match.team2} size={18} />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {data && data.matches.some((m) => m.status === "final") && (
        <div className="mt-4 border-t border-white/10 pt-3 light:border-slate-200">
          <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">
            {t("recent_results")}
          </p>
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {data.matches
              .filter((m) => m.status === "final")
              .slice(0, 6)
              .map((match) => (
                <div
                  key={`final-${match.espnId}`}
                  className="flex-shrink-0 rounded-lg bg-white/5 px-3 py-2 text-center text-xs light:bg-slate-100"
                >
                  <div className="mb-1 flex justify-center gap-1">
                    <FlagChip country={match.team1} size={12} />
                    <FlagChip country={match.team2} size={12} />
                  </div>
                  <span className="font-accent font-bold">
                    {match.score1} - {match.score2}
                  </span>
                  {match.group && (
                    <p className="text-slate-500">
                      {t("group")} {match.group}
                    </p>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      <Link
        href="/partidos"
        className="mt-3 inline-block text-sm text-pitch hover:underline"
      >
        {t("view_all_matches")} →
      </Link>
    </section>
  );
}
