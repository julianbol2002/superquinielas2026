"use client";

import { motion } from "framer-motion";
import type { AnalyticsSnapshot } from "@/lib/analytics";
import { Link } from "@/i18n/routing";

export default function GoleadaDetector({
  snapshot,
}: {
  snapshot: AnalyticsSnapshot;
}) {
  if (snapshot.goleadas.length === 0) {
    return (
      <p className="rounded-xl border border-white/10 bg-stadium-card p-6 text-center text-sm text-slate-400 light:bg-white">
        Ninguna goleada de escándalo (4+ goles) registrada aún. 🔥
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {snapshot.goleadas.map(({ match, hit, missed }, i) => (
        <motion.div
          key={match.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.08 }}
          className="rounded-xl border border-orange-500/40 bg-gradient-to-r from-orange-500/10 to-red-500/10 p-4"
        >
          <div className="mb-2 flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <div>
              <p className="font-display text-lg text-orange-400">Goleada de escándalo</p>
              <p className="text-sm font-semibold">{match.label}</p>
            </div>
          </div>
          {hit.length > 0 && (
            <div className="mb-2">
              <p className="text-xs uppercase text-pitch">Acertaron el bonus (+3)</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {hit.map((h) => (
                  <Link
                    key={h.slug}
                    href={`/quiniela/${h.slug}`}
                    className="rounded-full bg-pitch/20 px-2 py-0.5 text-xs font-medium text-pitch"
                  >
                    {h.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
          {missed.length > 0 && (
            <div>
              <p className="text-xs uppercase text-slate-400">Se lo perdieron</p>
              <p className="mt-1 text-xs text-slate-500">
                {missed.length} quiniela{missed.length !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
