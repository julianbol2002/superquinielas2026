"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  worldCupGroups,
  computeStandings,
  getGroupFixtures,
  getAllGroupFixtures,
  getCountryDisplayName,
  type WorldCupGroup,
} from "@/data/countries";
import { fetchAllMatchRows, saveMatchResult } from "@/lib/matchData";
import { isSupabaseConfigured, type MatchRow } from "@/lib/supabase";
import {
  formatLastUpdated,
  type LiveMatch,
} from "@/lib/liveScores";
import { useLiveScores } from "@/hooks/useLiveScores";
import { shouldShowLivePredictors } from "@/lib/livePredictors";
import { getGroupBorderColor } from "@/lib/groupColors";
import { PLAYED_MATCH_RESULTS } from "@/data/tournamentResults";
import FlagChip, { TeamFlagCell } from "./FlagChip";
import LivePredictorsPanel from "./LivePredictorsPanel";

export default function MatchGrid() {
  const t = useTranslations();
  const locale = useLocale();
  const [adminMode, setAdminMode] = useState(false);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: liveData } = useLiveScores();

  const loadMatches = useCallback(async () => {
    setLoading(true);
    const data = await fetchAllMatchRows();
    setMatches(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  useEffect(() => {
    if (liveData?.lastUpdated) {
      loadMatches();
    }
  }, [liveData?.lastUpdated, liveData?.syncedCount, loadMatches]);

  const liveByFixture = useMemo(() => {
    const map = new Map<string, LiveMatch>();
    for (const m of liveData?.matches ?? []) {
      if (!m.group) continue;
      const key = `${m.group}|${[m.team1, m.team2].sort().join("|")}`;
      const existing = map.get(key);
      if (
        !existing ||
        m.isLive ||
        (m.status === "final" && existing.status === "scheduled")
      ) {
        map.set(key, m);
      }
    }
    return map;
  }, [liveData?.matches]);

  const getLiveMatch = (team1: string, team2: string, group: string) => {
    const key = `${group}|${[team1, team2].sort().join("|")}`;
    return liveByFixture.get(key);
  };

  const getMatchResult = (team1: string, team2: string, group: string) => {
    const live = getLiveMatch(team1, team2, group);
    if (live && live.status !== "scheduled") {
      const score1 = live.team1 === team1 ? live.score1 : live.score2;
      const score2 = live.team1 === team1 ? live.score2 : live.score1;
      return {
        team1,
        team2,
        score1,
        score2,
        isLive: live.isLive,
        displayClock: live.displayClock,
        completedAt: live.finishedAt ?? null,
        isPlayedSealed: false,
      };
    }

    const db = matches.find(
      (m) =>
        m.group_name === group &&
        ((m.team1 === team1 && m.team2 === team2) ||
          (m.team1 === team2 && m.team2 === team1))
    );

    if (db && db.score1 != null && db.score2 != null) {
      const score1 = db.team1 === team1 ? db.score1 : db.score2;
      const score2 = db.team1 === team1 ? db.score2 : db.score1;
      return {
        team1,
        team2,
        score1,
        score2,
        isLive: false,
        displayClock: undefined,
        completedAt: db.updated_at,
        isPlayedSealed: false,
      };
    }

    const fixture = getAllGroupFixtures().find(
      (f) =>
        f.group === group &&
        ((f.team1 === team1 && f.team2 === team2) ||
          (f.team1 === team2 && f.team2 === team1))
    );
    if (fixture) {
      const key = `${fixture.group}-${fixture.team1}-${fixture.team2}` as keyof typeof PLAYED_MATCH_RESULTS;
      const played = PLAYED_MATCH_RESULTS[key];
      if (played) {
        const score1 = fixture.team1 === team1 ? played.score1 : played.score2;
        const score2 = fixture.team1 === team1 ? played.score2 : played.score1;
        return {
          team1,
          team2,
          score1,
          score2,
          isLive: false,
          displayClock: undefined,
          completedAt: null,
          isPlayedSealed: true,
        };
      }
    }

    if (db) {
      return {
        team1,
        team2,
        score1: db.team1 === team1 ? db.score1 : db.score2,
        score2: db.team1 === team1 ? db.score2 : db.score1,
        isLive: false,
        displayClock: undefined,
        completedAt: db.updated_at,
        isPlayedSealed: false,
      };
    }

    return undefined;
  };

  const saveScore = async (
    group: string,
    team1: string,
    team2: string,
    score1: number,
    score2: number
  ) => {
    const existing = matches.find(
      (m) =>
        m.group_name === group &&
        ((m.team1 === team1 && m.team2 === team2) ||
          (m.team1 === team2 && m.team2 === team1))
    );
    await saveMatchResult({
      id: existing?.id,
      stage: "group",
      group_name: group,
      team1,
      team2,
      score1,
      score2,
      match_date: new Date().toISOString().split("T")[0],
    });
    await loadMatches();
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-4 md:px-0">
        <div>
          <h1 className="font-display text-2xl tracking-wide text-primary-theme">{t("matches")}</h1>
          {liveData?.lastUpdated && (
            <p className="mt-1 text-label text-muted">
              {t("last_updated")}: {formatLastUpdated(liveData.lastUpdated, locale)}
            </p>
          )}
        </div>
        <button
          onClick={() => setAdminMode(!adminMode)}
          className={`min-h-[44px] border px-3 py-1.5 text-label font-medium transition-colors ${
            adminMode
              ? "border-accent bg-accent text-black"
              : "border-border bg-surface text-secondary hover:bg-hover"
          }`}
        >
          {t("admin_mode")}
        </button>
      </div>

      {adminMode && !isSupabaseConfigured() && (
        <p className="mb-4 text-xs text-muted">
          {t("supabase_not_configured")}
        </p>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-xl bg-white/5 light:bg-slate-200"
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 px-4 md:grid-cols-2 md:px-0">
          {worldCupGroups.map((group, gi) => (
            <GroupCard
              key={group.name}
              group={group}
              adminMode={adminMode}
              getMatchResult={getMatchResult}
              getLiveMatch={getLiveMatch}
              lastUpdated={liveData?.lastUpdated}
              onSave={saveScore}
              index={gi}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function GroupCard({
  group,
  adminMode,
  getMatchResult,
  getLiveMatch,
  lastUpdated,
  onSave,
  index,
}: {
  group: WorldCupGroup;
  adminMode: boolean;
  getMatchResult: (
    t1: string,
    t2: string,
    g: string
  ) =>
    | {
        team1: string;
        team2: string;
        score1: number | null;
        score2: number | null;
        isLive?: boolean;
        displayClock?: string;
        completedAt?: string | null;
        isPlayedSealed?: boolean;
      }
    | undefined;
  getLiveMatch: (t1: string, t2: string, g: string) => LiveMatch | undefined;
  lastUpdated?: string;
  onSave: (
    group: string,
    t1: string,
    t2: string,
    s1: number,
    s2: number
  ) => Promise<void>;
  index: number;
}) {
  const t = useTranslations();
  const fixtures = getGroupFixtures(group);

  const groupResults = fixtures.map((f) => {
    const m = getMatchResult(f.team1, f.team2, f.group);
    if (!m) return { team1: f.team1, team2: f.team2, score1: null, score2: null };
    if (m.team1 === f.team1) {
      return { team1: f.team1, team2: f.team2, score1: m.score1, score2: m.score2 };
    }
    return { team1: f.team1, team2: f.team2, score1: m.score2, score2: m.score1 };
  });

  const standings = computeStandings(group, groupResults);

  return (
    <div className="border border-border bg-surface p-4 md:rounded">
      <h2
        className="mb-3 inline-block border-l-[3px] bg-[#1a1a1a] px-2 py-1 label-caps"
        style={{ borderLeftColor: getGroupBorderColor(group.name) }}
      >
        {t("group")} {group.name}
      </h2>

      <div className="mb-4 grid grid-cols-2 justify-items-center gap-3 sm:grid-cols-4">
        {group.teams.map((team) => (
          <TeamFlagCell key={team.name} country={team.name} compact />
        ))}
      </div>

      <h3 className="mb-2 text-xs uppercase tracking-wide text-muted">
        {t("standings")}
      </h3>
      <div className="mb-4 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted">
              <th className="py-1 text-left">#</th>
              <th className="py-1 text-left">{t("standings_team")}</th>
              <th className="px-1 py-1">{t("standings_played")}</th>
              <th className="px-1 py-1">{t("standings_won")}</th>
              <th className="px-1 py-1">{t("standings_drawn")}</th>
              <th className="px-1 py-1">{t("standings_lost")}</th>
              <th className="px-1 py-1">{t("standings_gf")}</th>
              <th className="px-1 py-1">{t("standings_ga")}</th>
              <th className="px-1 py-1 font-bold">{t("standings_pts")}</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row, i) => (
              <tr key={row.team} className="border-t border-border">
                <td className="py-1.5 pr-1">{i + 1}</td>
                <td className="py-1.5">
                  <div className="flex min-w-[88px] items-center gap-1.5">
                    <FlagChip country={row.team} size={14} className="shrink-0" />
                    <span className="text-[11px] font-medium leading-tight text-secondary sm:text-xs">
                      {getCountryDisplayName(row.team, true)}
                    </span>
                  </div>
                </td>
                <td className="px-1 py-1.5 text-center">{row.played}</td>
                <td className="px-1 py-1.5 text-center">{row.won}</td>
                <td className="px-1 py-1.5 text-center">{row.drawn}</td>
                <td className="px-1 py-1.5 text-center">{row.lost}</td>
                <td className="px-1 py-1.5 text-center">{row.gf}</td>
                <td className="px-1 py-1.5 text-center">{row.ga}</td>
                <td className="px-1 py-1.5 text-center font-medium text-gold">
                  {row.pts}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="mb-2 text-xs uppercase tracking-wide text-muted">
        {t("fixtures")}
      </h3>
      <div className="space-y-2">
        {fixtures.map((f) => (
          <FixtureRow
            key={`${f.team1}-${f.team2}`}
            team1={f.team1}
            team2={f.team2}
            group={f.group}
            adminMode={adminMode}
            match={getMatchResult(f.team1, f.team2, f.group)}
            liveMatch={getLiveMatch(f.team1, f.team2, f.group)}
            lastUpdated={lastUpdated}
            onSave={onSave}
          />
        ))}
      </div>
    </div>
  );
}

function CompletedMatchScore({
  score1,
  score2,
}: {
  score1: number;
  score2: number;
}) {
  if (score1 === score2) {
    return (
      <span className="font-display text-2xl tabular-nums text-[#f5c518]">
        {score1} - {score2}
      </span>
    );
  }

  const team1Wins = score1 > score2;

  return (
    <span className="font-display text-2xl tabular-nums">
      <span className={team1Wins ? "text-accent" : "text-[#666666]"}>{score1}</span>
      <span className="text-muted"> - </span>
      <span className={!team1Wins ? "text-accent" : "text-[#666666]"}>{score2}</span>
    </span>
  );
}

function FixtureRow({
  team1,
  team2,
  group,
  adminMode,
  match,
  liveMatch,
  lastUpdated,
  onSave,
}: {
  team1: string;
  team2: string;
  group: string;
  adminMode: boolean;
  match?: {
    team1: string;
    team2: string;
    score1: number | null;
    score2: number | null;
    isLive?: boolean;
    displayClock?: string;
    completedAt?: string | null;
    isPlayedSealed?: boolean;
  };
  liveMatch?: LiveMatch;
  lastUpdated?: string;
  onSave: (
    group: string,
    t1: string,
    t2: string,
    s1: number,
    s2: number
  ) => Promise<void>;
}) {
  const t = useTranslations();
  const [s1, setS1] = useState(match?.score1 ?? 0);
  const [s2, setS2] = useState(match?.score2 ?? 0);

  useEffect(() => {
    setS1(match?.score1 ?? 0);
    setS2(match?.score2 ?? 0);
  }, [match?.score1, match?.score2]);

  const displayScore =
    match?.score1 != null && match?.score2 != null
      ? `${match.score1} - ${match.score2}`
      : "—";

  const isCompleted =
    match?.score1 != null &&
    match?.score2 != null &&
    !match.isLive;

  const showPredictors =
    !adminMode &&
    match?.score1 != null &&
    match?.score2 != null &&
    shouldShowLivePredictors(!!match.isLive, match.score1, match.score2, {
      liveMatch,
      completedAt: match.completedAt,
      isPlayedSealed: match.isPlayedSealed,
    });

  return (
    <div className="overflow-hidden border border-border bg-surface">
      <div className="flex min-h-[44px] items-center gap-2 px-3 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <FlagChip country={team1} size={14} className="shrink-0" />
          <span className="truncate text-label text-secondary">
            {getCountryDisplayName(team1, true)}
          </span>
        </div>

        {adminMode ? (
          <div className="flex shrink-0 items-center gap-1">
            <input
              type="number"
              min={0}
              max={20}
              value={s1}
              onChange={(e) => setS1(Number(e.target.value))}
              className="w-10 border border-border bg-page px-1 py-1 text-center text-body"
            />
            <span className="text-muted">-</span>
            <input
              type="number"
              min={0}
              max={20}
              value={s2}
              onChange={(e) => setS2(Number(e.target.value))}
              className="w-10 border border-border bg-page px-1 py-1 text-center text-body"
            />
            <button
              onClick={() => onSave(group, team1, team2, s1, s2)}
              className="ml-1 border border-accent bg-accent px-2 py-1 text-label font-medium text-black"
            >
              {t("save_score")}
            </button>
          </div>
        ) : (
          <div className="flex shrink-0 flex-col items-center px-2">
            {match?.isLive && (
              <span className="mb-0.5 inline-flex items-center gap-1 text-[10px] font-medium uppercase text-accent">
                <span className="live-dot" aria-hidden />
                {t("live_badge")}
              </span>
            )}
            {isCompleted ? (
              <CompletedMatchScore
                score1={match!.score1!}
                score2={match!.score2!}
              />
            ) : (
              <span className="font-display text-2xl tabular-nums text-primary-theme">
                {displayScore}
              </span>
            )}
            {match?.displayClock && match.isLive && (
              <span className="text-[10px] text-muted">{match.displayClock}</span>
            )}
          </div>
        )}

        <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
          <span className="truncate text-right text-label text-secondary">
            {getCountryDisplayName(team2, true)}
          </span>
          <FlagChip country={team2} size={14} className="shrink-0" />
        </div>
      </div>

      {showPredictors && (
        <LivePredictorsPanel
          group={group}
          team1={team1}
          team2={team2}
          score1={match!.score1!}
          score2={match!.score2!}
          isLive={!!match?.isLive}
          lastUpdated={lastUpdated}
        />
      )}
    </div>
  );
}
