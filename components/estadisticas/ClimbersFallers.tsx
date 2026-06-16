"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { AnalyticsSnapshot } from "@/lib/analytics";
import { Link } from "@/i18n/routing";

export default function ClimbersFallers({
  snapshot,
}: {
  snapshot: AnalyticsSnapshot;
}) {
  const t = useTranslations();

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-pitch/30 bg-pitch/5 p-4"
      >
        <h3 className="mb-3 font-display text-lg text-pitch">{t("recap_kind_climber")}</h3>
        <div className="space-y-3">
          {snapshot.climbers.length === 0 ? (
            <p className="text-sm text-slate-400">{t("stats_no_data")}</p>
          ) : (
            snapshot.climbers.map((c, i) => (
              <motion.div
                key={c.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link href={`/quiniela/${c.slug}`} className="block hover:text-pitch">
                  <p className="font-semibold">
                    {i + 1}. {c.name}
                  </p>
                  <p className="text-xs text-slate-400">{c.captain}</p>
                  <p className="font-accent text-pitch">
                    ↑ {c.delta} {t("positions_up")}
                  </p>
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-red-500/30 bg-red-500/5 p-4"
      >
        <h3 className="mb-3 font-display text-lg text-red-400">{t("recap_kind_faller")}</h3>
        <div className="space-y-3">
          {snapshot.fallers.length === 0 ? (
            <p className="text-sm text-slate-400">{t("stats_no_data")}</p>
          ) : (
            snapshot.fallers.map((c, i) => (
              <motion.div
                key={c.slug}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link href={`/quiniela/${c.slug}`} className="block hover:text-red-400">
                  <p className="font-semibold">
                    {i + 1}. {c.name}
                  </p>
                  <p className="text-xs text-slate-400">{c.captain}</p>
                  <p className="font-accent text-red-400">
                    ↓ {c.delta} {t("positions_down")}
                  </p>
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
