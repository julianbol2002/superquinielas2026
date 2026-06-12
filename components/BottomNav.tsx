"use client";

import { useTranslations } from "next-intl";
import { usePathname, Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", icon: "🏆", labelKey: "nav_home" as const },
  { href: "/partidos", icon: "⚽", labelKey: "nav_matches" as const },
  { href: "/quinielas", icon: "🃏", labelKey: "nav_quinielas" as const },
  { href: "/ajustes", icon: "⚙️", labelKey: "nav_settings" as const },
];

export default function BottomNav() {
  const t = useTranslations();
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-stadium-dark/95 backdrop-blur-lg safe-bottom md:hidden dark:border-white/10 light:border-slate-200 light:bg-white/95">
      <div className="flex items-stretch justify-around">
        {tabs.map((tab) => {
          const active =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition",
                active ? "text-pitch" : "text-slate-400 light:text-slate-500"
              )}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="font-medium">{t(tab.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
