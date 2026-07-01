"use client";

import { useTranslations } from "next-intl";
import { usePathname, Link } from "@/i18n/routing";
import {
  Trophy,
  CircleDot,
  LayoutGrid,
  Table2,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const tabs: {
  href: string;
  icon: LucideIcon;
  labelKey: "nav_home" | "nav_matches" | "nav_quinielas" | "nav_picks" | "nav_settings";
}[] = [
  { href: "/", icon: Trophy, labelKey: "nav_home" },
  { href: "/partidos", icon: CircleDot, labelKey: "nav_matches" },
  { href: "/quinielas", icon: LayoutGrid, labelKey: "nav_quinielas" },
  { href: "/picks", icon: Table2, labelKey: "nav_picks" },
  { href: "/ajustes", icon: Settings, labelKey: "nav_settings" },
];

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export default function BottomNav() {
  const t = useTranslations();
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-14 border-t border-border bg-surface safe-bottom md:hidden">
      <div className="flex h-14 items-stretch">
        {tabs.map((tab) => {
          const active = isNavActive(pathname, tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5"
            >
              <Icon
                size={18}
                strokeWidth={1.75}
                className={cn(active ? "text-espn-red" : "text-muted")}
              />
              <span
                className={cn(
                  "text-[11px] font-medium",
                  active ? "text-espn-red" : "text-muted"
                )}
              >
                {t(tab.labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
