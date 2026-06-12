"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { getWinnerPredictions } from "@/data/quinielas";
import FlagChip from "./FlagChip";

export default function CountryPredictionsChart() {
  const t = useTranslations();
  const data = getWinnerPredictions();
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <section className="mb-8">
      <h2 className="mb-4 font-display text-xl tracking-wide">
        {t("country_predictions")}
      </h2>
      <div className="space-y-3">
        {data.map((item, i) => (
          <motion.div
            key={item.country}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3"
          >
            <FlagChip country={item.country} size={18} />
            <div className="flex-1">
              <div className="mb-1 flex justify-between text-sm">
                <span>{item.country}</span>
                <span className="font-accent font-bold text-pitch">× {item.count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10 light:bg-slate-200">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-pitch to-emerald-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.count / max) * 100}%` }}
                  transition={{ delay: i * 0.05 + 0.2, duration: 0.5 }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
