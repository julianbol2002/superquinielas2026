import { create } from "zustand";
import type { Theme, Language, Colorway } from "@/lib/cookies";

interface AppState {
  theme: Theme;
  colorway: Colorway;
  language: Language;
  activePlayer: string | null;
  setTheme: (theme: Theme) => void;
  setColorway: (colorway: Colorway) => void;
  setLanguage: (language: Language) => void;
  setActivePlayer: (player: string | null) => void;
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: "dark",
  colorway: "classic",
  language: "es",
  activePlayer: null,
  hydrated: false,
  setTheme: (theme) => set({ theme }),
  setColorway: (colorway) => set({ colorway }),
  setLanguage: (language) => set({ language }),
  setActivePlayer: (activePlayer) => set({ activePlayer }),
  setHydrated: (hydrated) => set({ hydrated }),
}));
