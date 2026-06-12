"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

export default function Hero() {
  const t = useTranslations();
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      setTime(
        new Date().toLocaleString(undefined, {
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
  }, []);

  useEffect(() => {
    let cancelled = false;
    import("canvas-confetti").then(({ default: confetti }) => {
      if (cancelled) return;
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.3, x: 0.5 },
        colors: ["#00D084", "#FFD700", "#ffffff"],
        ticks: 120,
        gravity: 1.2,
        scalar: 0.8,
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="relative mb-6 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-stadium-card via-stadium-navy to-stadium-dark p-6 light:border-slate-200 light:from-white light:via-slate-50 light:to-slate-100">
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-pitch/10 blur-3xl" />
      <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-gold/10 blur-2xl" />

      <div className="relative flex flex-col items-center text-center">
        <motion.span
          className="trophy-float mb-2 text-5xl"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 12 }}
        >
          🏆
        </motion.span>
        <h1 className="font-display text-5xl tracking-widest text-white light:text-slate-900 md:text-7xl">
          {t("site_name")}
        </h1>
        <p className="mt-2 text-sm text-slate-400 light:text-slate-600 md:text-base">
          {t("tagline")}
        </p>
        <p className="mt-3 font-accent text-xs uppercase tracking-widest text-pitch">
          {t("live_time")}: {time}
        </p>
      </div>
    </section>
  );
}
