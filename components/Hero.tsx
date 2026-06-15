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
    <section className="hero-radial mb-4 border-b border-border px-4 pb-3 md:px-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 text-left">
          <h1 className="font-display text-2xl leading-none tracking-wide text-heading md:text-[28px]">
            {t("site_name")}
          </h1>
          <p className="mt-1 label-caps">{t("tagline")}</p>
        </div>
        <p className="shrink-0 text-right text-label text-muted">{time}</p>
      </div>
    </section>
  );
}
