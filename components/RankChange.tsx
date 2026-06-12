"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

export default function RankChange({ change }: { change: number }) {
  const t = useTranslations();

  if (change === 0) {
    return (
      <span className="font-accent text-xs text-slate-500" title={t("no_change")}>
        —
      </span>
    );
  }

  const up = change > 0;

  return (
    <motion.span
      initial={{ opacity: 0, y: up ? 10 : -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`inline-flex items-center gap-0.5 font-accent text-sm font-bold ${
        up ? "text-pitch" : "text-red-400"
      }`}
      title={`${Math.abs(change)} ${up ? t("positions_up") : t("positions_down")}`}
    >
      {up ? "↑" : "↓"}
      {Math.abs(change)}
    </motion.span>
  );
}
