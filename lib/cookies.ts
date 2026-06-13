import Cookies from "js-cookie";

export type Theme = "dark" | "light";
export type Language = "es" | "en";
export type Colorway = "classic" | "ocean" | "sunset" | "royal" | "rojo";

export const COLORWAYS: Colorway[] = [
  "classic",
  "ocean",
  "sunset",
  "royal",
  "rojo",
];

export const COOKIE_KEYS = {
  activePlayer: "active_player",
  theme: "theme",
  language: "language",
  colorway: "colorway",
} as const;

export function getCookie(name: string): string | undefined {
  if (typeof window === "undefined") return undefined;
  return Cookies.get(name);
}

export function setCookie(name: string, value: string, days = 365): void {
  Cookies.set(name, value, { expires: days, sameSite: "lax" });
}

export function removeCookie(name: string): void {
  Cookies.remove(name);
}

export function getThemeFromCookie(): Theme {
  const v = getCookie(COOKIE_KEYS.theme);
  return v === "light" ? "light" : "dark";
}

export function getColorwayFromCookie(): Colorway {
  const v = getCookie(COOKIE_KEYS.colorway);
  return COLORWAYS.includes(v as Colorway) ? (v as Colorway) : "classic";
}

export function getLanguageFromCookie(): Language {
  const v = getCookie(COOKIE_KEYS.language);
  return v === "en" ? "en" : "es";
}

export function getActivePlayerFromCookie(): string | undefined {
  return getCookie(COOKIE_KEYS.activePlayer);
}

export function clearAllCookies(): void {
  Object.values(COOKIE_KEYS).forEach(removeCookie);
}
