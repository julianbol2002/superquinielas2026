"use client";

import { useTranslations } from "next-intl";
import {
  getQuinielasByCaptain,
  quinielaToSlug,
} from "@/data/quinielas";
import { useAppStore } from "@/lib/store";

export default function MyPositionFab() {
  const t = useTranslations();
  const activePlayer = useAppStore((s) => s.activePlayer);

  if (!activePlayer) return null;

  const scrollToMe = () => {
    const myQuinielas = getQuinielasByCaptain(activePlayer);
    for (const q of myQuinielas) {
      const el = document.getElementById(`quiniela-${quinielaToSlug(q.name)}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
    }
  };

  return (
    <button
      onClick={scrollToMe}
      className="fixed bottom-16 right-4 z-40 flex h-11 min-h-[44px] min-w-[44px] items-center justify-center border border-accent bg-accent text-label font-medium text-black transition-colors hover:bg-transparent hover:text-accent md:bottom-8"
      aria-label={t("my_position")}
    >
      {t("my_position").charAt(0)}
    </button>
  );
}
