import type { LiveMatch } from "@/lib/liveScores";

/**
 * Group-stage results. The group phase is sealed ("fase terminada") and is NOT
 * carried per-game in the Google Sheet, so these stay static here.
 * Knockout results, by contrast, are read live from the sheet's "Eliminatorias"
 * tab at runtime — see lib/knockoutResults.ts. The array below is only the
 * offline fallback used when the sheet can't be reached.
 */
export const GROUP_RESULTS: LiveMatch[] = [
  { espnId: "G01", team1: "Mexico", team2: "South Africa", score1: 2, score2: 0, group: "A", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G02", team1: "South Korea", team2: "Czechia", score1: 2, score2: 1, group: "A", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G03", team1: "Canada", team2: "Bosnia and Herzegovina", score1: 1, score2: 1, group: "B", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G04", team1: "United States", team2: "Paraguay", score1: 4, score2: 1, group: "D", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G05", team1: "Qatar", team2: "Switzerland", score1: 1, score2: 1, group: "B", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G06", team1: "Brazil", team2: "Morocco", score1: 1, score2: 1, group: "C", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G07", team1: "Haiti", team2: "Scotland", score1: 0, score2: 1, group: "C", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G08", team1: "Australia", team2: "Turkey", score1: 2, score2: 0, group: "D", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G09", team1: "Germany", team2: "Curaçao", score1: 7, score2: 1, group: "E", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G10", team1: "Netherlands", team2: "Japan", score1: 2, score2: 2, group: "F", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G11", team1: "Ivory Coast", team2: "Ecuador", score1: 1, score2: 0, group: "E", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G12", team1: "Sweden", team2: "Tunisia", score1: 5, score2: 1, group: "F", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G13", team1: "Spain", team2: "Cabo Verde", score1: 0, score2: 0, group: "H", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G14", team1: "Belgium", team2: "Egypt", score1: 1, score2: 1, group: "G", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G15", team1: "Saudi Arabia", team2: "Uruguay", score1: 1, score2: 1, group: "H", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G16", team1: "Iran", team2: "New Zealand", score1: 2, score2: 2, group: "G", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G17", team1: "France", team2: "Senegal", score1: 3, score2: 1, group: "I", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G18", team1: "Iraq", team2: "Norway", score1: 1, score2: 2, group: "I", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G19", team1: "Argentina", team2: "Algeria", score1: 3, score2: 0, group: "J", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G20", team1: "Austria", team2: "Jordan", score1: 3, score2: 1, group: "J", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G21", team1: "Portugal", team2: "DR Congo", score1: 1, score2: 1, group: "K", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G22", team1: "England", team2: "Croatia", score1: 4, score2: 2, group: "L", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G23", team1: "Ghana", team2: "Panama", score1: 1, score2: 0, group: "L", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G24", team1: "Uzbekistan", team2: "Colombia", score1: 1, score2: 3, group: "K", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G25", team1: "Czechia", team2: "South Africa", score1: 1, score2: 1, group: "A", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G26", team1: "Switzerland", team2: "Bosnia and Herzegovina", score1: 4, score2: 1, group: "B", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G27", team1: "Canada", team2: "Qatar", score1: 6, score2: 0, group: "B", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G28", team1: "Mexico", team2: "South Korea", score1: 1, score2: 0, group: "A", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G29", team1: "United States", team2: "Australia", score1: 2, score2: 0, group: "D", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G30", team1: "Scotland", team2: "Morocco", score1: 0, score2: 1, group: "C", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G31", team1: "Brazil", team2: "Haiti", score1: 3, score2: 0, group: "C", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G32", team1: "Turkey", team2: "Paraguay", score1: 0, score2: 1, group: "D", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G33", team1: "Netherlands", team2: "Sweden", score1: 5, score2: 1, group: "F", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G34", team1: "Germany", team2: "Ivory Coast", score1: 2, score2: 1, group: "E", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G35", team1: "Ecuador", team2: "Curaçao", score1: 0, score2: 0, group: "E", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G36", team1: "Tunisia", team2: "Japan", score1: 0, score2: 4, group: "F", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G37", team1: "Spain", team2: "Saudi Arabia", score1: 4, score2: 0, group: "H", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G38", team1: "Belgium", team2: "Iran", score1: 0, score2: 0, group: "G", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G39", team1: "Uruguay", team2: "Cabo Verde", score1: 2, score2: 2, group: "H", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G40", team1: "New Zealand", team2: "Egypt", score1: 1, score2: 3, group: "G", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G41", team1: "Argentina", team2: "Austria", score1: 2, score2: 0, group: "J", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G42", team1: "France", team2: "Iraq", score1: 3, score2: 0, group: "I", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G43", team1: "Norway", team2: "Senegal", score1: 3, score2: 2, group: "I", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G44", team1: "Jordan", team2: "Algeria", score1: 1, score2: 2, group: "J", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G45", team1: "Portugal", team2: "Uzbekistan", score1: 5, score2: 0, group: "K", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G46", team1: "England", team2: "Ghana", score1: 0, score2: 0, group: "L", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G47", team1: "Panama", team2: "Croatia", score1: 0, score2: 1, group: "L", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G48", team1: "Colombia", team2: "DR Congo", score1: 1, score2: 0, group: "K", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G49", team1: "Switzerland", team2: "Canada", score1: 2, score2: 1, group: "B", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G50", team1: "Bosnia and Herzegovina", team2: "Qatar", score1: 3, score2: 1, group: "B", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G51", team1: "Scotland", team2: "Brazil", score1: 0, score2: 3, group: "C", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G52", team1: "Morocco", team2: "Haiti", score1: 4, score2: 2, group: "C", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G53", team1: "Czechia", team2: "Mexico", score1: 0, score2: 3, group: "A", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G54", team1: "South Africa", team2: "South Korea", score1: 1, score2: 0, group: "A", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G55", team1: "Curaçao", team2: "Ivory Coast", score1: 0, score2: 2, group: "E", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G56", team1: "Ecuador", team2: "Germany", score1: 2, score2: 1, group: "E", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G57", team1: "Japan", team2: "Sweden", score1: 1, score2: 1, group: "F", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G58", team1: "Tunisia", team2: "Netherlands", score1: 1, score2: 3, group: "F", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G59", team1: "Turkey", team2: "United States", score1: 3, score2: 2, group: "D", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G60", team1: "Paraguay", team2: "Australia", score1: 0, score2: 0, group: "D", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G61", team1: "Norway", team2: "France", score1: 1, score2: 4, group: "I", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G62", team1: "Senegal", team2: "Iraq", score1: 5, score2: 0, group: "I", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G63", team1: "Cabo Verde", team2: "Saudi Arabia", score1: 0, score2: 0, group: "H", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G64", team1: "Uruguay", team2: "Spain", score1: 0, score2: 1, group: "H", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G65", team1: "Egypt", team2: "Iran", score1: 1, score2: 1, group: "G", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G66", team1: "New Zealand", team2: "Belgium", score1: 1, score2: 5, group: "G", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G67", team1: "Panama", team2: "England", score1: 0, score2: 2, group: "L", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G68", team1: "Croatia", team2: "Ghana", score1: 2, score2: 1, group: "L", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G69", team1: "Colombia", team2: "Portugal", score1: 0, score2: 0, group: "K", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G70", team1: "DR Congo", team2: "Uzbekistan", score1: 3, score2: 1, group: "K", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G71", team1: "Algeria", team2: "Austria", score1: 3, score2: 3, group: "J", stage: "group", status: "final", isLive: false, matchDate: "" },
  { espnId: "G72", team1: "Jordan", team2: "Argentina", score1: 1, score2: 3, group: "J", stage: "group", status: "final", isLive: false, matchDate: "" },
];

/**
 * Offline fallback for knockout results. The live source is the sheet's
 * "Eliminatorias" tab (lib/knockoutResults.ts); this is only used when that
 * fetch fails. Kept roughly in sync so the site degrades gracefully.
 */
export const KNOCKOUT_RESULTS_FALLBACK: LiveMatch[] = [
  { espnId: "R32-01", team1: "South Africa", team2: "Canada", score1: 0, score2: 1, group: null, stage: "r32", status: "final", isLive: false, matchDate: "" },
  { espnId: "R32-02", team1: "Brazil", team2: "Japan", score1: 2, score2: 1, group: null, stage: "r32", status: "final", isLive: false, matchDate: "" },
  { espnId: "R32-03", team1: "Germany", team2: "Paraguay", score1: 1, score2: 1, group: null, stage: "r32", status: "final", isLive: false, matchDate: "" },
  { espnId: "R32-04", team1: "Netherlands", team2: "Morocco", score1: 1, score2: 1, group: null, stage: "r32", status: "final", isLive: false, matchDate: "" },
  { espnId: "R32-05", team1: "Ivory Coast", team2: "Norway", score1: 1, score2: 2, group: null, stage: "r32", status: "final", isLive: false, matchDate: "" },
  { espnId: "R32-06", team1: "France", team2: "Sweden", score1: 3, score2: 0, group: null, stage: "r32", status: "final", isLive: false, matchDate: "" },
  { espnId: "R32-07", team1: "Mexico", team2: "Ecuador", score1: 2, score2: 0, group: null, stage: "r32", status: "final", isLive: false, matchDate: "" },
  { espnId: "R32-08", team1: "England", team2: "DR Congo", score1: 2, score2: 1, group: null, stage: "r32", status: "final", isLive: false, matchDate: "" },
  { espnId: "R32-09", team1: "Belgium", team2: "Senegal", score1: 3, score2: 2, group: null, stage: "r32", status: "final", isLive: false, matchDate: "" },
  { espnId: "R32-10", team1: "United States", team2: "Bosnia and Herzegovina", score1: 2, score2: 0, group: null, stage: "r32", status: "final", isLive: false, matchDate: "" },
];

/** Bundled snapshot of everything (group + fallback knockout) — offline fallback. */
export const PLAYED_RESULTS: LiveMatch[] = [
  ...GROUP_RESULTS,
  ...KNOCKOUT_RESULTS_FALLBACK,
];
