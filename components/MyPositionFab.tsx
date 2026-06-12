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
      className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-pitch text-lg font-bold text-black shadow-lg shadow-pitch/30 transition hover:scale-105 md:bottom-8"
      aria-label={t("my_position")}
    >
      📍
    </button>
  );
}
