"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { useLiveScores } from "@/hooks/useLiveScores";
import { useDailyRecap } from "@/hooks/useDailyRecap";
import {
  formatRecapDateLabel,
  type DailyRecap,
  type DailyRecapStory,
} from "@/lib/dailyRecap";
import { getCountryDisplayName } from "@/data/countries";
import { cn } from "@/lib/utils";

function shortTeam(name: string): string {
  return getCountryDisplayName(name, true);
}

function matchScoreLine(
  team1: string,
  score1: number,
  team2: string,
  score2: number
): string {
  return `${shortTeam(team1)} ${score1}–${score2} ${shortTeam(team2)}`;
}

function StoryBlock({
  story,
  t,
}: {
  story: DailyRecapStory;
  t: ReturnType<typeof useTranslations>;
}) {
  const accent =
    story.kind === "climber" || story.kind === "hot_streak"
      ? "border-pitch"
      : story.kind === "faller" || story.kind === "shutout" || story.kind === "everyone_wrong"
        ? "border-red-500"
        : story.kind === "headline"
          ? "border-gold"
          : "border-accent/60";

  const labelKey = `recap_kind_${story.kind}` as Parameters<typeof t>[0];

  return (
    <article
      className={cn(
        "border-l-4 bg-surface/80 py-3 pl-3 pr-2",
        accent
      )}
    >
      {story.kind !== "headline" && (
        <p className="label-caps text-muted">{t(labelKey)}</p>
      )}
      <StoryBody story={story} t={t} />
    </article>
  );
}

function StoryBody({
  story,
  t,
}: {
  story: DailyRecapStory;
  t: ReturnType<typeof useTranslations>;
}) {
  const d = story.data;

  switch (story.kind) {
    case "headline": {
      const variant = d.variant as string;
      if (variant === "climber" && d.mover) {
        const m = d.mover as { player: { name: string; captain: string }; delta: number };
        return (
          <p className="font-display text-2xl leading-tight tracking-wide text-heading md:text-3xl">
            {t("recap_headline_climber", {
              name: m.player.name,
              captain: m.player.captain,
              delta: m.delta,
            })}
          </p>
        );
      }
      if (variant === "multi_exact" && d.player) {
        const p = d.player as { name: string; captain: string };
        const exacts = d.exacts as number;
        return (
          <p className="font-display text-2xl leading-tight tracking-wide text-heading md:text-3xl">
            {t("recap_headline_multi_exact", {
              name: p.name,
              captain: p.captain,
              count: exacts,
            })}
          </p>
        );
      }
      if (d.players) {
        const players = d.players as { name: string; captain: string; points: number }[];
        const lead = players[0];
        return (
          <p className="font-display text-2xl leading-tight tracking-wide text-heading md:text-3xl">
            {t("recap_headline_top_scorer", {
              name: lead.name,
              captain: lead.captain,
              points: lead.points,
            })}
          </p>
        );
      }
      if (d.player && d.match) {
        const p = d.player as { name: string; captain: string };
        const m = d.match as { team1: string; team2: string; score1: number; score2: number };
        return (
          <p className="font-display text-2xl leading-tight tracking-wide text-heading md:text-3xl">
            {t("recap_headline_lone_wolf", {
              name: p.name,
              match: matchScoreLine(m.team1, m.score1, m.team2, m.score2),
            })}
          </p>
        );
      }
      return (
        <p className="font-display text-2xl leading-tight tracking-wide text-heading md:text-3xl">
          {t("recap_headline_default", { count: (d.matches as number) ?? 0 })}
        </p>
      );
    }

    case "match_results": {
      const matches = d.matches as {
        team1: string;
        score1: number;
        team2: string;
        score2: number;
        group: string | null;
        isGoleada: boolean;
      }[];
      return (
        <div className="mt-1 space-y-2">
          {matches.map((m, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-2 border-b border-border/50 py-1.5 last:border-0"
            >
              <span className="text-body font-semibold text-heading">
                {matchScoreLine(m.team1, m.score1, m.team2, m.score2)}
              </span>
              <span className="flex shrink-0 items-center gap-1.5 text-label text-muted">
                {m.group && <span>{t("recap_group_prefix")} {m.group}</span>}
                {m.isGoleada && (
                  <span className="bg-gold/20 px-1.5 py-0.5 font-semibold text-gold">
                    {t("goleada_short")}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      );
    }

    case "top_scorer": {
      const players = d.players as { name: string; captain: string; points: number; exacts: number }[];
      return (
        <div className="mt-1 space-y-1.5">
          {players.map((p) => (
            <p key={p.name} className="text-body text-primary-theme">
              <span className="font-semibold">{p.name}</span>
              <span className="text-muted"> ({p.captain})</span>
              {" — "}
              <span className="font-accent text-accent">
                {t("recap_points_day", { points: p.points })}
              </span>
              {p.exacts > 0 && (
                <span className="text-muted">
                  {" · "}
                  {t("recap_exacts_day", { count: p.exacts })}
                </span>
              )}
            </p>
          ))}
        </div>
      );
    }

    case "climber":
    case "faller": {
      const movers = d.movers as {
        player: { slug: string; name: string; captain: string };
        delta: number;
        direction: "up" | "down";
      }[];
      const up = story.kind === "climber";
      return (
        <ul className="mt-1 space-y-2">
          {movers.map((m) => (
            <li key={m.player.slug}>
              <Link
                href={`/quiniela/${m.player.slug}`}
                className="group flex items-baseline justify-between gap-2"
              >
                <span className="text-body group-hover:text-accent">
                  <span className="font-semibold">{m.player.name}</span>
                  <span className="text-muted"> ({m.player.captain})</span>
                </span>
                <span
                  className={cn(
                    "font-accent text-sm font-bold",
                    up ? "text-pitch" : "text-red-400"
                  )}
                >
                  {up ? "▲" : "▼"} {m.delta}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      );
    }

    case "multi_exact": {
      const players = d.players as { name: string; captain: string; exacts: number; points: number }[];
      return (
        <ul className="mt-1 space-y-1">
          {players.map((p) => (
            <li key={p.name} className="text-body">
              <span className="font-semibold">{p.name}</span>
              {" — "}
              {t("recap_multi_exact_detail", { count: p.exacts, points: p.points })}
            </li>
          ))}
        </ul>
      );
    }

    case "goleada_hit": {
      const match = d.match as { team1: string; team2: string; score1: number; score2: number };
      const players = d.players as { name: string }[];
      return (
        <p className="mt-1 text-body text-primary-theme">
          {t("recap_goleada_hit", {
            match: matchScoreLine(match.team1, match.score1, match.team2, match.score2),
            names: players.map((p) => p.name).join(", "),
          })}
        </p>
      );
    }

    case "goleada_miss": {
      const match = d.match as { team1: string; team2: string; score1: number; score2: number };
      const missCount = d.missCount as number;
      return (
        <p className="mt-1 text-body text-primary-theme">
          {t("recap_goleada_miss", {
            match: matchScoreLine(match.team1, match.score1, match.team2, match.score2),
            count: missCount,
          })}
        </p>
      );
    }

    case "everyone_wrong": {
      const match = d.match as { team1: string; team2: string; score1: number; score2: number };
      return (
        <p className="mt-1 text-body text-primary-theme">
          {t("recap_everyone_wrong", {
            match: matchScoreLine(match.team1, match.score1, match.team2, match.score2),
          })}
        </p>
      );
    }

    case "lone_wolf": {
      const match = d.match as { team1: string; team2: string; score1: number; score2: number };
      const player = d.player as { name: string; captain: string; slug: string };
      return (
        <p className="mt-1 text-body">
          <Link href={`/quiniela/${player.slug}`} className="font-semibold text-accent hover:underline">
            {player.name}
          </Link>
          {t("recap_lone_wolf", {
            match: matchScoreLine(match.team1, match.score1, match.team2, match.score2),
          })}
        </p>
      );
    }

    case "shutout": {
      const match = d.match as { team1: string; team2: string; score1: number; score2: number };
      return (
        <p className="mt-1 text-body text-primary-theme">
          {t("recap_shutout", {
            match: matchScoreLine(match.team1, match.score1, match.team2, match.score2),
          })}
        </p>
      );
    }

    case "consensus_hit": {
      const match = d.match as { team1: string; team2: string; score1: number; score2: number };
      return (
        <p className="mt-1 text-body text-primary-theme">
          {t("recap_consensus", {
            count: d.count as number,
            total: d.total as number,
            match: matchScoreLine(match.team1, match.score1, match.team2, match.score2),
          })}
        </p>
      );
    }

    case "hot_streak": {
      const player = d.player as { name: string; captain: string; slug: string };
      const points = d.points as number;
      return (
        <p className="mt-1 text-body">
          <Link href={`/quiniela/${player.slug}`} className="font-semibold text-pitch hover:underline">
            {player.name}
          </Link>
          {t("recap_hot_streak", { points, captain: player.captain })}
        </p>
      );
    }

    case "quiet_day":
      return (
        <p className="mt-1 text-body text-muted">{t("recap_quiet_day")}</p>
      );

    case "standings": {
      const leaders = d.leaders as {
        slug: string;
        name: string;
        captain: string;
        points: number;
        rank: number;
      }[];
      return (
        <ol className="mt-1 space-y-1">
          {leaders.map((l) => (
            <li key={l.slug} className="flex items-center justify-between text-body">
              <Link href={`/quiniela/${l.slug}`} className="hover:text-accent">
                <span className="font-display text-lg text-gold">{l.rank}.</span>{" "}
                <span className="font-semibold">{l.name}</span>
                <span className="text-muted"> ({l.captain})</span>
              </Link>
              <span className="font-accent text-accent">
                {l.points} {t("points_abbr")}
              </span>
            </li>
          ))}
        </ol>
      );
    }

    default:
      return null;
  }
}

function RecapPanel({
  recap,
  dateLabel,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  isUnread,
  onMarkRead,
}: {
  recap: DailyRecap;
  dateLabel: string;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  isUnread: boolean;
  onMarkRead: () => void;
}) {
  const t = useTranslations();

  useEffect(() => {
    if (isUnread) onMarkRead();
  }, [isUnread, onMarkRead, recap.date]);

  return (
    <div className="flex max-h-[min(85vh,640px)] flex-col overflow-hidden border border-border bg-page shadow-2xl">
      <div className="relative shrink-0 bg-gradient-to-r from-red-700 via-red-600 to-red-800 px-4 py-3 text-white">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="label-caps text-red-200">{t("recap_badge")}</p>
            <h2 className="font-display text-2xl tracking-wide md:text-3xl">
              {t("recap_title")}
            </h2>
            <p className="mt-0.5 text-sm text-red-100">{dateLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center text-white/80 hover:text-white"
            aria-label={t("recap_close")}
          >
            <X size={20} />
          </button>
        </div>
        {recap.matchCount > 0 && (
          <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-red-200">
            {t("recap_match_count", { count: recap.matchCount })}
          </p>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {recap.stories.map((story) => (
          <StoryBlock key={story.id} story={story} t={t} />
        ))}
      </div>

      {(hasPrev || hasNext) && (
        <div className="flex shrink-0 items-center justify-between border-t border-border bg-surface px-2 py-2">
          <button
            type="button"
            disabled={!hasPrev}
            onClick={onPrev}
            className="flex min-h-[44px] items-center gap-1 px-2 text-body text-secondary disabled:opacity-30"
          >
            <ChevronLeft size={18} />
            {t("recap_older")}
          </button>
          <button
            type="button"
            disabled={!hasNext}
            onClick={onNext}
            className="flex min-h-[44px] items-center gap-1 px-2 text-body text-secondary disabled:opacity-30"
          >
            {t("recap_newer")}
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function DailyRecapBell() {
  const t = useTranslations();
  const locale = useLocale();
  const { data } = useLiveScores();
  const {
    recaps,
    unreadCount,
    markRead,
    isRead,
    isWindowOpen,
  } = useDailyRecap(data?.matches ?? [], data?.lastUpdated);

  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selected = recaps[selectedIndex] ?? recaps[0];

  const openPanel = useCallback(() => {
    setSelectedIndex(0);
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        panelRef.current?.contains(target) ||
        buttonRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  if (recaps.length === 0) return null;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openPanel())}
        className={cn(
          "relative flex min-h-[44px] min-w-[44px] items-center justify-center border border-border bg-surface transition-colors hover:bg-hover",
          open && "border-accent/50 bg-hover"
        )}
        aria-label={t("recap_open")}
        aria-expanded={open}
      >
        <Bell size={20} className="text-secondary" strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center bg-red-600 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
        {!isWindowOpen && unreadCount === 0 && (
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-muted/40" />
        )}
      </button>

      {open && selected && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 md:hidden"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div
            ref={panelRef}
            className={cn(
              "z-50",
              "fixed inset-x-3 bottom-16 top-auto md:absolute md:inset-x-auto md:bottom-auto md:right-0 md:top-full md:mt-2 md:w-[min(100vw-2rem,420px)]"
            )}
          >
            <RecapPanel
              recap={selected.recap}
              dateLabel={formatRecapDateLabel(selected.date, locale)}
              onClose={() => setOpen(false)}
              hasPrev={selectedIndex < recaps.length - 1}
              hasNext={selectedIndex > 0}
              onPrev={
                selectedIndex < recaps.length - 1
                  ? () => setSelectedIndex((i) => i + 1)
                  : undefined
              }
              onNext={
                selectedIndex > 0
                  ? () => setSelectedIndex((i) => i - 1)
                  : undefined
              }
              isUnread={!isRead(selected.date)}
              onMarkRead={() => markRead(selected.date)}
            />
          </div>
        </>
      )}
    </div>
  );
}
