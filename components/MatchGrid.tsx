"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  worldCupGroups,
  computeStandings,
  getGroupFixtures,
  type WorldCupGroup,
} from "@/data/countries";
import {
  fetchMatches,
  upsertMatch,
  isSupabaseConfigured,
  type MatchRow,
} from "@/lib/supabase";
import FlagChip from "./FlagChip";

export default function MatchGrid() {
  const t = useTranslations();
  const [adminMode, setAdminMode] = useState(false);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMatches = useCallback(async () => {
    setLoading(true);
    const data = await fetchMatches();
    setMatches(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const getMatchResult = (team1: string, team2: string, group: string) => {
    return matches.find(
      (m) =>
        m.group_name === group &&
        ((m.team1 === team1 && m.team2 === team2) ||
          (m.team1 === team2 && m.team2 === team1))
    );
  };

  const saveScore = async (
    group: string,
    team1: string,
    team2: string,
    score1: number,
    score2: number
  ) => {
    const existing = getMatchResult(team1, team2, group);
    await upsertMatch({
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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl tracking-wide">{t("matches")}</h1>
        <button
          onClick={() => setAdminMode(!adminMode)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            adminMode
              ? "bg-pitch text-black"
              : "bg-white/10 text-slate-300 light:bg-slate-200 light:text-slate-700"
          }`}
        >
          {t("admin_mode")}
        </button>
      </div>

      {!isSupabaseConfigured() && (
        <p className="mb-4 rounded-lg bg-amber-500/10 px-4 py-2 text-sm text-amber-400">
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
        <div className="grid gap-6 md:grid-cols-2">
          {worldCupGroups.map((group, gi) => (
            <GroupCard
              key={group.name}
              group={group}
              adminMode={adminMode}
              matches={matches}
              getMatchResult={getMatchResult}
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
  matches,
  getMatchResult,
  onSave,
  index,
}: {
  group: WorldCupGroup;
  adminMode: boolean;
  matches: MatchRow[];
  getMatchResult: (
    t1: string,
    t2: string,
    g: string
  ) => MatchRow | undefined;
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-xl border border-white/10 bg-stadium-card p-4 light:border-slate-200 light:bg-white light:shadow-sm"
    >
      <h2 className="mb-3 font-display text-xl text-pitch">
        {t("group")} {group.name}
      </h2>

      <div className="mb-4 flex flex-wrap gap-2">
        {group.teams.map((team) => (
          <FlagChip key={team.name} country={team.name} showLabel size={16} />
        ))}
      </div>

      <h3 className="mb-2 text-xs uppercase tracking-wide text-slate-400">
        {t("standings")}
      </h3>
      <div className="mb-4 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-500">
              <th className="py-1 text-left">#</th>
              <th className="py-1 text-left">{t("player")}</th>
              <th className="px-1 py-1">P</th>
              <th className="px-1 py-1">W</th>
              <th className="px-1 py-1">D</th>
              <th className="px-1 py-1">L</th>
              <th className="px-1 py-1">GF</th>
              <th className="px-1 py-1">GA</th>
              <th className="px-1 py-1 font-bold">{t("points")}</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row, i) => (
              <tr key={row.team} className="border-t border-white/5 light:border-slate-100">
                <td className="py-1">{i + 1}</td>
                <td className="py-1">
                  <FlagChip country={row.team} size={12} />
                </td>
                <td className="px-1 py-1 text-center">{row.played}</td>
                <td className="px-1 py-1 text-center">{row.won}</td>
                <td className="px-1 py-1 text-center">{row.drawn}</td>
                <td className="px-1 py-1 text-center">{row.lost}</td>
                <td className="px-1 py-1 text-center">{row.gf}</td>
                <td className="px-1 py-1 text-center">{row.ga}</td>
                <td className="px-1 py-1 text-center font-bold text-pitch">
                  {row.pts}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="mb-2 text-xs uppercase tracking-wide text-slate-400">
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
            onSave={onSave}
          />
        ))}
      </div>
    </motion.div>
  );
}

function FixtureRow({
  team1,
  team2,
  group,
  adminMode,
  match,
  onSave,
}: {
  team1: string;
  team2: string;
  group: string;
  adminMode: boolean;
  match?: MatchRow;
  onSave: (
    group: string,
    t1: string,
    t2: string,
    s1: number,
    s2: number
  ) => Promise<void>;
}) {
  const t = useTranslations();
  const [s1, setS1] = useState(match?.team1 === team1 ? match.score1 ?? 0 : match?.score2 ?? 0);
  const [s2, setS2] = useState(match?.team1 === team1 ? match.score2 ?? 0 : match?.score1 ?? 0);

  useEffect(() => {
    if (!match) {
      setS1(0);
      setS2(0);
      return;
    }
    if (match.team1 === team1) {
      setS1(match.score1 ?? 0);
      setS2(match.score2 ?? 0);
    } else {
      setS1(match.score2 ?? 0);
      setS2(match.score1 ?? 0);
    }
  }, [match, team1]);

  const displayScore =
    match?.score1 != null && match?.score2 != null
      ? match.team1 === team1
        ? `${match.score1} - ${match.score2}`
        : `${match.score2} - ${match.score1}`
      : "—";

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-white/5 px-2 py-2 text-sm light:bg-slate-50">
      <div className="flex min-w-0 flex-1 items-center gap-1">
        <FlagChip country={team1} size={14} />
        <span className="truncate text-xs">{team1.split(" ").pop()}</span>
      </div>

      {adminMode ? (
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={0}
            max={20}
            value={s1}
            onChange={(e) => setS1(Number(e.target.value))}
            className="w-10 rounded bg-stadium-dark px-1 py-0.5 text-center text-base light:bg-white light:border light:border-slate-200"
          />
          <span>-</span>
          <input
            type="number"
            min={0}
            max={20}
            value={s2}
            onChange={(e) => setS2(Number(e.target.value))}
            className="w-10 rounded bg-stadium-dark px-1 py-0.5 text-center text-base light:bg-white light:border light:border-slate-200"
          />
          <button
            onClick={() => onSave(group, team1, team2, s1, s2)}
            className="ml-1 rounded bg-pitch px-2 py-0.5 text-xs font-bold text-black"
          >
            {t("save_score")}
          </button>
        </div>
      ) : (
        <span className="font-accent font-bold">{displayScore}</span>
      )}

      <div className="flex min-w-0 flex-1 items-center justify-end gap-1">
        <span className="truncate text-xs">{team2.split(" ").pop()}</span>
        <FlagChip country={team2} size={14} />
      </div>
    </div>
  );
}
