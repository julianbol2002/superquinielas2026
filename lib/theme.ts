import type { Colorway, Theme } from "@/lib/cookies";
import { COLORWAYS } from "@/lib/cookies";

export interface ColorwayOption {
  id: Colorway;
  labelKey: string;
  swatch: string;
  swatchAlt: string;
}

export const COLORWAY_OPTIONS: ColorwayOption[] = [
  {
    id: "classic",
    labelKey: "colorway_classic",
    swatch: "#00D084",
    swatchAlt: "#FFD700",
  },
  {
    id: "ocean",
    labelKey: "colorway_ocean",
    swatch: "#06B6D4",
    swatchAlt: "#38BDF8",
  },
  {
    id: "sunset",
    labelKey: "colorway_sunset",
    swatch: "#F97316",
    swatchAlt: "#FBBF24",
  },
  {
    id: "royal",
    labelKey: "colorway_royal",
    swatch: "#A855F7",
    swatchAlt: "#EAB308",
  },
  {
    id: "rojo",
    labelKey: "colorway_rojo",
    swatch: "#EF4444",
    swatchAlt: "#FACC15",
  },
];

export function applyAppearance(theme: Theme, colorway: Colorway): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.classList.remove("dark", "light");
  root.classList.add(theme);

  for (const id of COLORWAYS) {
    root.classList.remove(`colorway-${id}`);
  }
  root.classList.add(`colorway-${colorway}`);
  root.dataset.colorway = colorway;
}
