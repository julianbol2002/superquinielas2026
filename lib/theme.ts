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
    swatch: "#CC0000",
    swatchAlt: "#000000",
  },
  {
    id: "ocean",
    labelKey: "colorway_ocean",
    swatch: "#0891B2",
    swatchAlt: "#0284C7",
  },
  {
    id: "sunset",
    labelKey: "colorway_sunset",
    swatch: "#EA580C",
    swatchAlt: "#F59E0B",
  },
  {
    id: "royal",
    labelKey: "colorway_royal",
    swatch: "#7C3AED",
    swatchAlt: "#A855F7",
  },
  {
    id: "rojo",
    labelKey: "colorway_rojo",
    swatch: "#E11D48",
    swatchAlt: "#F43F5E",
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
