"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { getRankedQuinielas, type RankedQuiniela } from "@/data/quinielas";
import { useLiveScores } from "@/hooks/useLiveScores";
import FlagChip from "./FlagChip";
import { cn } from "@/lib/utils";

type SortKey = keyof RankedQuiniela | "none";
type SortDir = "asc" | "desc";

function pointClass(points: number) {
  if (points >= 6) return "point-badge-6";
  if (points >= 5) return "point-badge-5";
  if (points >= 4) return "point-badge-4";
  if (points >= 3) return "point-badge-3";
  if (points >= 2) return "point-badge-2";
  return "point-badge-1";
}

export default function QuinielasTable() {
  const t = useTranslations();
  const { data: liveData } = useLiveScores();
  const [search, setSearch] = useState("");
  const [betFilter, setBetFilter] = useState<"all" | 25 | 50 | 100>("all");
  const [sortKey, setSortKey] = useState<SortKey>("points");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const rows = useMemo(
    () => getRankedQuinielas(liveData?.matches ?? []),
    [liveData?.matches]
  );

  const filtered = useMemo(() => {
    let list = [...rows];

    if (betFilter !== "all") {
      list = list.filter((q) => q.bet === betFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.captain.toLowerCase().includes(q) ||
          r.name.toLowerCase().includes(q)
      );
    }

    if (sortKey !== "none") {
      list.sort((a, b) => {
        const av = a[sortKey as keyof RankedQuiniela];
        const bv = b[sortKey as keyof RankedQuiniela];
        if (typeof av === "number" && typeof bv === "number") {
          return sortDir === "asc" ? av - bv : bv - av;
        }
        return sortDir === "asc"
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av));
      });
    }

    return list;
  }, [rows, search, betFilter, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const betTabs: { key: typeof betFilter; label: string }[] = [
    { key: "all", label: t("all") },
    { key: 25, label: "$25" },
    { key: 50, label: "$50" },
    { key: 100, label: "$100" },
  ];

  return (
    <div>
      <h1 className="mb-4 font-display text-3xl tracking-wide">
        {t("my_quinielas")}
      </h1>

      <input
        type="search"
        placeholder={t("search")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full rounded-lg border border-white/10 bg-stadium-card px-4 py-3 text-base outline-none focus:border-pitch light:border-slate-200 light:bg-white"
      />

      <div className="mb-4 flex gap-2 overflow-x-auto hide-scrollbar">
        {betTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setBetFilter(tab.key)}
            className={cn(
              "flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition",
              betFilter === tab.key
                ? "bg-pitch text-black"
                : "bg-white/10 text-slate-300 light:bg-slate-200 light:text-slate-600"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 light:border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-stadium-navy/50 text-xs uppercase text-slate-400 light:border-slate-200 light:bg-slate-50">
                {[
                  { key: "captain" as SortKey, label: t("captain") },
                  { key: "name" as SortKey, label: t("quiniela_name") },
                  { key: "bet" as SortKey, label: t("bet") },
                  { key: "finalist1" as SortKey, label: `${t("finalist")} 1` },
                  { key: "finalist2" as SortKey, label: `${t("finalist")} 2` },
                  { key: "winner" as SortKey, label: t("winner") },
                  { key: "points" as SortKey, label: t("points") },
                ].map((col) => (
                  <th
                    key={col.key}
                    className="cursor-pointer px-3 py-3 text-left hover:text-pitch"
                    onClick={() => toggleSort(col.key)}
                  >
                    {col.label}
                    {sortKey === col.key && (sortDir === "asc" ? " ↑" : " ↓")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((q, i) => (
                <motion.tr
                  key={`${q.captain}-${q.name}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-white/5 light:border-slate-100"
                >
                  <td className="px-3 py-3 font-medium">{q.captain}</td>
                  <td className="px-3 py-3">{q.name}</td>
                  <td className="px-3 py-3">${q.bet}</td>
                  <td className="px-3 py-3">
                    <motion.div
                      initial={{ rotateY: 90, opacity: 0 }}
                      animate={{ rotateY: 0, opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <FlagChip country={q.finalist1} size={16} />
                    </motion.div>
                  </td>
                  <td className="px-3 py-3">
                    <FlagChip country={q.finalist2} size={16} />
                  </td>
                  <td className="px-3 py-3">
                    <FlagChip country={q.winner} size={16} />
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={cn(
                        "inline-block rounded-lg px-2 py-1 font-accent",
                        pointClass(q.points)
                      )}
                    >
                      {q.points}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
