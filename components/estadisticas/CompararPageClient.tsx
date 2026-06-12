"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { buildAnalytics } from "@/lib/analytics";
import { getRankedQuinielas } from "@/data/quinielas";
import { useLiveScores } from "@/hooks/useLiveScores";

function CompararContent() {
  const t = useTranslations();
  const router = useRouter();
  const params = useSearchParams();
  const slugA = params.get("a") ?? "";
  const slugB = params.get("b") ?? "";
  const { data: liveData } = useLiveScores();
  const snapshot = useMemo(
    () => buildAnalytics(liveData?.matches ?? []),
    [liveData?.lastUpdated, liveData?.matches]
  );

  const all = getRankedQuinielas();
  const entryA = all.find((q) => q.slug === slugA);
  const entryB = all.find((q) => q.slug === slugB);
  const h2h = entryA && entryB ? snapshot.headToHead[slugA]?.[slugB] ?? 0 : 0;

  return (
    <div className="pb-8">
      <Link href="/estadisticas" className="mb-4 inline-block text-sm text-muted hover:text-pitch">
        ← {t("nav_stats")}
      </Link>
      <h1 className="mb-6 font-display text-3xl">{t("stats_compare")}</h1>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <select
          className="rounded-lg border border-white/10 bg-stadium-card px-3 py-2 text-sm light:bg-white"
          value={slugA}
          onChange={(e) => {
            router.push(`/comparar?a=${e.target.value}&b=${slugB}`);
          }}
        >
          <option value="">{t("compare_quiniela_a")}</option>
          {all.map((q) => (
            <option key={q.slug} value={q.slug}>
              {q.name} ({q.captain})
            </option>
          ))}
        </select>
        <select
          className="rounded-lg border border-white/10 bg-stadium-card px-3 py-2 text-sm light:bg-white"
          value={slugB}
          onChange={(e) => {
            router.push(`/comparar?a=${slugA}&b=${e.target.value}`);
          }}
        >
          <option value="">{t("compare_quiniela_b")}</option>
          {all.map((q) => (
            <option key={q.slug} value={q.slug}>
              {q.name} ({q.captain})
            </option>
          ))}
        </select>
      </div>

      {entryA && entryB ? (
        <div className="rounded-xl border border-white/10 bg-stadium-card p-6 light:bg-white">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="text-center">
              <p className="font-display text-xl">{entryA.name}</p>
              <p className="text-sm text-muted">{entryA.captain}</p>
              <p className="font-display text-3xl text-pitch">
                {entryA.points} {t("points_abbr")}
              </p>
            </div>
            <div className="text-center">
              <p className="font-display text-xl">{entryB.name}</p>
              <p className="text-sm text-muted">{entryB.captain}</p>
              <p className="font-display text-3xl text-pitch">
                {entryB.points} {t("points_abbr")}
              </p>
            </div>
          </div>
          <p className="mt-6 text-center text-lg">
            {t("compare_h2h")}:{" "}
            <span className="font-bold text-pitch">
              {h2h > 0
                ? `${entryA.name} +${h2h}`
                : h2h < 0
                  ? `${entryB.name} +${Math.abs(h2h)}`
                  : t("compare_tie")}
            </span>
          </p>
          <p className="mt-2 text-center text-xs text-muted">
            {t("compare_h2h_desc")}
          </p>
        </div>
      ) : (
        <p className="text-muted">{t("compare_select_two")}</p>
      )}
    </div>
  );
}

export default function CompararPageClient() {
  const t = useTranslations();
  return (
    <Suspense fallback={<div className="py-12 text-center text-muted">{t("loading")}</div>}>
      <CompararContent />
    </Suspense>
  );
}
