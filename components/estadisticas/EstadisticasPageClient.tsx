"use client";

import { Suspense, lazy, useMemo, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { buildAnalytics } from "@/lib/analytics";
import { useLiveScores } from "@/hooks/useLiveScores";
import FunSummaryCallouts from "./FunSummaryCallouts";

const PointsTimelineChart = lazy(() => import("./PointsTimelineChart"));
const RankBumpChart = lazy(() => import("./RankBumpChart"));
const ClimbersFallers = lazy(() => import("./ClimbersFallers"));
const AccuracyHeatmap = lazy(() => import("./AccuracyHeatmap"));
const HotStreaksChart = lazy(() => import("./HotStreaksChart"));
const HeadToHeadMatrix = lazy(() => import("./HeadToHeadMatrix"));
const ManOfTheMatchFeed = lazy(() => import("./ManOfTheMatchFeed"));
const CountryPopularityChart = lazy(() => import("./CountryPopularityChart"));
const GoleadaDetector = lazy(() => import("./GoleadaDetector"));

function ChartSkeleton() {
  return (
    <div className="flex h-[280px] animate-pulse items-center justify-center rounded-xl bg-white/5 light:bg-slate-100">
      <span className="text-sm text-slate-500">Cargando gráfico…</span>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 font-display text-xl tracking-wide text-pitch">{title}</h2>
      {children}
    </section>
  );
}

export default function EstadisticasPageClient() {
  const t = useTranslations();
  const { data: liveData } = useLiveScores();
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const snapshot = useMemo(
    () => buildAnalytics(liveData?.matches ?? []),
    [liveData?.lastUpdated, liveData?.matches]
  );

  return (
    <div className="pb-8">
      <h1 className="mb-2 font-display text-3xl tracking-wide">
        {t("nav_stats")}
      </h1>
      <p className="mb-6 text-sm text-slate-400">{t("stats_subtitle")}</p>

      <FunSummaryCallouts snapshot={snapshot} />

      <Section title={t("stats_timeline")}>
        <Suspense fallback={<ChartSkeleton />}>
          <PointsTimelineChart snapshot={snapshot} />
        </Suspense>
      </Section>

      <Section title={t("stats_rank_movement")}>
        <Suspense fallback={<ChartSkeleton />}>
          <RankBumpChart snapshot={snapshot} mobile={mobile} />
        </Suspense>
      </Section>

      <Section title={t("stats_climbers")}>
        <Suspense fallback={<ChartSkeleton />}>
          <ClimbersFallers snapshot={snapshot} />
        </Suspense>
      </Section>

      <Section title={t("stats_heatmap")}>
        <Suspense fallback={<ChartSkeleton />}>
          <AccuracyHeatmap snapshot={snapshot} mobile={mobile} />
        </Suspense>
      </Section>

      <Section title={t("stats_streaks")}>
        <Suspense fallback={<ChartSkeleton />}>
          <HotStreaksChart snapshot={snapshot} />
        </Suspense>
      </Section>

      <Section title={t("stats_head_to_head")}>
        <Suspense fallback={<ChartSkeleton />}>
          <HeadToHeadMatrix snapshot={snapshot} mobile={mobile} />
        </Suspense>
      </Section>

      <Section title={t("stats_man_of_match")}>
        <Suspense fallback={<ChartSkeleton />}>
          <ManOfTheMatchFeed snapshot={snapshot} />
        </Suspense>
      </Section>

      <Section title={t("stats_country_pop")}>
        <Suspense fallback={<ChartSkeleton />}>
          <CountryPopularityChart snapshot={snapshot} />
        </Suspense>
      </Section>

      <Section title={t("stats_goleada")}>
        <Suspense fallback={<ChartSkeleton />}>
          <GoleadaDetector snapshot={snapshot} />
        </Suspense>
      </Section>
    </div>
  );
}
