"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { AnalyticsSnapshot } from "@/lib/analytics";
import { Link } from "@/i18n/routing";
import PlayerAvatar from "@/components/PlayerAvatar";

export default function ManOfTheMatchFeed({
  snapshot,
}: {
  snapshot: AnalyticsSnapshot;
}) {
  const t = useTranslations();
  const feed = [...snapshot.manOfTheMatch].reverse();

  if (feed.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted">
        {t("man_of_match_empty")}
      </p>
    );
  }

  return (
    <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto hide-scrollbar pb-2">
      {feed.map(({ match, winners }, i) => (
        <motion.div
          key={match.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="min-w-[220px] flex-shrink-0 snap-start rounded-xl border border-white/10 bg-stadium-card p-4 light:border-slate-200 light:bg-white"
        >
          <p className="mb-2 text-xs font-medium text-pitch">
            {t("match_number", { number: match.matchNumber })}
          </p>
          <p className="mb-3 line-clamp-2 text-sm font-semibold text-primary-theme">
            {match.label}
          </p>
          {winners.length === 0 ? (
            <p className="text-xs text-muted">{t("no_points_match")}</p>
          ) : (
            winners.slice(0, 2).map((w) => (
              <Link
                key={w.slug}
                href={`/quiniela/${w.slug}`}
                className="mb-2 flex items-center gap-2 rounded-lg bg-white/5 p-2 hover:bg-pitch/10 light:bg-slate-50"
              >
                <PlayerAvatar captain={w.captain} size={36} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{w.name}</p>
                  <p className="text-xs text-muted">{w.captain}</p>
                  <p className="font-accent text-pitch">
                    +{w.pointsEarned} {t("points_abbr")}
                    {w.exactScore && ` · ${t("exact_badge")} 🎯`}
                    {w.goleadaBonus && ` · ${t("goleada_short")} 🔥`}
                  </p>
                </div>
              </Link>
            ))
          )}
        </motion.div>
      ))}
    </div>
  );
}
