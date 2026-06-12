"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";

export default function Hero() {
  const t = useTranslations();
  const locale = useLocale();
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      setTime(
        new Date().toLocaleString(locale === "es" ? "es-ES" : "en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [locale]);

  useEffect(() => {
    let cancelled = false;
    import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return;
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.2, x: 0.5 },
        colors: ["#00D084", "#FFD700", "#ffffff"],
        ticks: 80,
        gravity: 1.2,
        scalar: 0.65,
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="relative mb-4 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-r from-stadium-card via-stadium-navy to-stadium-dark px-3 py-2.5 light:border-slate-200 light:from-white light:via-slate-50 light:to-slate-100 sm:px-4 sm:py-3">
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-pitch/10 blur-2xl" />

      <div className="relative flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <motion.span
            className="trophy-float shrink-0 text-2xl sm:text-3xl"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 14 }}
          >
            🏆
          </motion.span>
          <div className="min-w-0 text-left">
            <h1 className="font-display text-2xl leading-none tracking-wide text-primary-theme sm:text-3xl">
              {t("site_name")}
            </h1>
            <p className="mt-0.5 truncate text-xs text-muted sm:text-sm">
              {t("tagline")}
            </p>
          </div>
        </div>
        <p className="shrink-0 text-left text-[10px] font-accent uppercase tracking-wider text-pitch sm:text-right sm:text-xs">
          {t("live_time")}: {time}
        </p>
      </div>
    </section>
  );
}
