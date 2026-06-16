"use client";

import { useTranslations } from "next-intl";
import type { AnalyticsSnapshot } from "@/lib/analytics";
import ShareableCallout from "./ShareableCallout";

export default function FunSummaryCallouts({
  snapshot,
}: {
  snapshot: AnalyticsSnapshot;
}) {
  const t = useTranslations();

  return (
    <section className="mb-8">
      <h2 className="mb-3 font-display text-xl tracking-wide">{t("stats_fun_summary")}</h2>
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto hide-scrollbar pb-2">
        {snapshot.summary.map((c) => (
          <ShareableCallout key={c.id} callout={c} />
        ))}
      </div>
    </section>
  );
}
