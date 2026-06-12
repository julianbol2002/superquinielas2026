"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useAppStore } from "@/lib/store";
import { getQuinielasByCaptain, quinielaToSlug } from "@/data/quinielas";
import PlayerAvatar from "./PlayerAvatar";

const navLinks = [
  { href: "/", labelKey: "nav_home" as const },
  { href: "/partidos", labelKey: "nav_matches" as const },
  { href: "/quinielas", labelKey: "nav_quinielas" as const },
  { href: "/estadisticas", labelKey: "nav_stats" as const },
  { href: "/ajustes", labelKey: "nav_settings" as const },
];

export default function Header() {
  const t = useTranslations();
  const activePlayer = useAppStore((s) => s.activePlayer);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-stadium-dark/90 backdrop-blur-md dark:border-white/10 light:border-slate-200 light:bg-white/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <Link href="/" className="flex flex-col">
          <span className="font-display text-2xl tracking-wider text-pitch md:text-3xl">
            {t("site_name")}
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-300 transition hover:text-pitch light:text-slate-600 light:hover:text-pitch"
            >
              {t(link.labelKey)}
            </Link>
          ))}
        </nav>

        {activePlayer && (() => {
          const top = getQuinielasByCaptain(activePlayer)[0];
          if (!top) return null;
          return (
          <Link
            href={`/quiniela/${quinielaToSlug(top.name)}`}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-stadium-card px-2 py-1 light:border-slate-200 light:bg-white"
          >
            <PlayerAvatar captain={activePlayer} size={32} />
            <span className="hidden max-w-[100px] truncate text-sm font-medium sm:inline">
              {activePlayer.split(" ")[0]}
            </span>
          </Link>
          );
        })()}
      </div>
    </header>
  );
}
