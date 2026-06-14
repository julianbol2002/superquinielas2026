"use client";

import { useTranslations } from "next-intl";
import { getWinnerPredictions } from "@/data/quinielas";
import FlagChip from "./FlagChip";

export default function CountryPredictionsChart() {
  const t = useTranslations();
  const data = getWinnerPredictions();
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <section className="mb-8 px-4 md:px-0">
      <h2 className="mb-4 label-caps">{t("country_predictions")}</h2>
      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.country} className="flex items-center gap-3">
            <FlagChip country={item.country} size={18} />
            <div className="flex-1">
              <div className="mb-1 flex justify-between text-body">
                <span className="text-primary-theme">{item.country}</span>
                <span className="text-gold">× {item.count}</span>
              </div>
              <div className="h-1 overflow-hidden bg-border">
                <div
                  className="h-full bg-accent"
                  style={{ width: `${(item.count / max) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
