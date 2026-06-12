import { create } from "zustand";
import type { Theme, Language } from "@/lib/cookies";

interface AppState {
  theme: Theme;
  language: Language;
  activePlayer: string | null;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  setActivePlayer: (player: string | null) => void;
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: "dark",
  language: "es",
  activePlayer: null,
  hydrated: false,
  setTheme: (theme) => set({ theme }),
  setLanguage: (language) => set({ language }),
  setActivePlayer: (activePlayer) => set({ activePlayer }),
  setHydrated: (hydrated) => set({ hydrated }),
}));
