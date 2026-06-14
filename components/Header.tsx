"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { useAppStore } from "@/lib/store";
import { getQuinielasByCaptain, quinielaToSlug } from "@/data/quinielas";
import { cn } from "@/lib/utils";
import PlayerAvatar from "./PlayerAvatar";

const navLinks = [
  { href: "/", labelKey: "nav_home" as const },
  { href: "/partidos", labelKey: "nav_matches" as const },
  { href: "/quinielas", labelKey: "nav_quinielas" as const },
  { href: "/estadisticas", labelKey: "nav_stats" as const },
  { href: "/ajustes", labelKey: "nav_settings" as const },
];

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export default function Header() {
  const t = useTranslations();
  const pathname = usePathname();
  const activePlayer = useAppStore((s) => s.activePlayer);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-page">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5 md:px-6">
        <Link href="/" className="flex min-h-[44px] items-center gap-2">
          <Image
            src="/icon.png"
            alt="Super Quinielas"
            width={28}
            height={28}
            priority
            className="flex-shrink-0"
          />
          <span className="font-display text-xl tracking-wide text-primary-theme md:text-2xl">
            {t("site_name")}
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => {
            const active = isNavActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative pb-0.5 text-body transition-colors hover:text-accent",
                  active ? "nav-link-active" : "text-secondary"
                )}
              >
                {t(link.labelKey)}
              </Link>
            );
          })}
        </nav>

        {activePlayer && (() => {
          const top = getQuinielasByCaptain(activePlayer)[0];
          if (!top) return null;
          return (
            <Link
              href={`/quiniela/${quinielaToSlug(top.name)}`}
              className="flex min-h-[44px] items-center gap-2 border border-border bg-surface px-2 py-1"
            >
              <PlayerAvatar captain={activePlayer} size={28} />
              <span className="hidden max-w-[100px] truncate text-body font-medium text-primary-theme sm:inline">
                {activePlayer.split(" ")[0]}
              </span>
            </Link>
          );
        })()}
      </div>
    </header>
  );
}
