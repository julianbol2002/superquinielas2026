"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";

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

  return (
    <section className="hero-radial mb-4 border-b border-border px-4 pb-4 md:px-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 text-left">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="game-chip">
              <span aria-hidden>🏆</span>
              WC 2026
            </span>
            <span className="game-chip-live">
              <span className="live-dot" aria-hidden />
              {t("live_badge")}
            </span>
          </div>
          <h1 className="font-display text-3xl leading-none tracking-wide text-heading md:text-4xl">
            {t("site_name")}
          </h1>
          <p className="mt-1.5 label-caps">{t("tagline")}</p>
        </div>
        <p className="shrink-0 text-right text-label text-muted">{time}</p>
      </div>
    </section>
  );
}
