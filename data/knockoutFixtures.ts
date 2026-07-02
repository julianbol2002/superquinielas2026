/**
 * Round of 32 pairings, in bracket order. Teams are listed in the same order as
 * the sheet's "Eliminatorias" tab, so results (keyed by sorted team-pair) and
 * picks (from KNOCKOUT_PICKS) line up by orientation. Results live in the sheet
 * (lib/knockoutResults.ts); picks in data/knockoutPicks.ts.
 */
export const R32_FIXTURES: [string, string][] = [
  ["South Africa", "Canada"],
  ["Brazil", "Japan"],
  ["Germany", "Paraguay"],
  ["Netherlands", "Morocco"],
  ["Ivory Coast", "Norway"],
  ["France", "Sweden"],
  ["Mexico", "Ecuador"],
  ["England", "DR Congo"],
  ["Belgium", "Senegal"],
  ["United States", "Bosnia and Herzegovina"],
  ["Spain", "Austria"],
  ["Portugal", "Croatia"],
  ["Switzerland", "Algeria"],
  ["Egypt", "Australia"],
  ["Argentina", "Cabo Verde"],
  ["Colombia", "Ghana"],
];

/** Empty knockout rounds after the R32, in bracket order (teams TBD until played). */
export const KNOCKOUT_ROUND_SIZES: { phase: "r16" | "quarter" | "semi" | "final"; label: string; count: number }[] = [
  { phase: "r16", label: "R16", count: 8 },
  { phase: "quarter", label: "QF", count: 4 },
  { phase: "semi", label: "SF", count: 2 },
  { phase: "final", label: "Final", count: 1 },
];
