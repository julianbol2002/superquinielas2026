"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { AnalyticsSnapshot } from "@/lib/analytics";
import { Link } from "@/i18n/routing";
import MatchTeamsRow from "@/components/MatchTeamsRow";

export default function GoleadaDetector({
  snapshot,
}: {
  snapshot: AnalyticsSnapshot;
}) {
  const t = useTranslations();

  if (snapshot.goleadas.length === 0) {
    return (
      <p className="rounded-xl border border-white/10 bg-stadium-card p-6 text-center text-sm text-slate-400 light:bg-white">
        Ninguna goleada de escándalo (4+ goles) registrada aún. 🔥
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {snapshot.goleadas.map(({ match, hit, missed }, i) => {
        const actualScore =
          match.score1 !== null && match.score2 !== null
            ? `${match.score1} - ${match.score2}`
            : undefined;

        return (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-xl border border-orange-500/40 bg-gradient-to-r from-orange-500/10 to-red-500/10 p-4"
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="text-2xl">🔥</span>
              <p className="font-display text-lg text-orange-400">
                Goleada de escándalo
              </p>
            </div>

            <MatchTeamsRow
              team1={match.team1}
              team2={match.team2}
              scoreLine={actualScore}
              showGoleadaBadge
              goleadaLabel={t("goleada_short")}
              compactNames
            />

            {hit.length > 0 && (
              <div className="mt-4 border-t border-orange-500/20 pt-3">
                <p className="mb-2 text-xs uppercase text-pitch">
                  Acertaron el bonus (+3)
                </p>
                <div className="space-y-3">
                  {hit.map((h) => (
                    <div
                      key={h.slug}
                      className="rounded-lg bg-black/20 p-3 light:bg-slate-50"
                    >
                      <Link
                        href={`/quiniela/${h.slug}`}
                        className="mb-2 block text-sm font-semibold text-pitch hover:underline"
                      >
                        {h.name}
                      </Link>
                      <MatchTeamsRow
                        team1={match.team1}
                        team2={match.team2}
                        scoreLine={`${h.predictedScore1} - ${h.predictedScore2}`}
                        showGoleadaBadge
                        goleadaLabel={t("goleada_short")}
                        compactNames
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {missed.length > 0 && (
              <div className="mt-3">
                <p className="text-xs uppercase text-slate-400">Se lo perdieron</p>
                <p className="mt-1 text-xs text-slate-500">
                  {missed.length} quiniela{missed.length !== 1 ? "s" : ""}
                </p>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
