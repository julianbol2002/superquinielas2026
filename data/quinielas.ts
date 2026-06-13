import { computeQuinielaScore, type QuinielaScoreBreakdown } from "@/lib/quinielaScoring";
import type { LiveMatch } from "@/lib/liveScores";
import { getPreviousRanksFromHistory } from "@/lib/rankHistory";

export interface Quiniela {
  captain: string;
  name: string;
  bet: 25 | 50 | 100;
  finalist1: string;
  finalist2: string;
  winner: string;
}

export const quinielas: Quiniela[] = [
  { captain: "Isabella Bolanos", name: "Barquito de papel", bet: 25, finalist1: "Spain", finalist2: "France", winner: "Spain" },
  { captain: "Oly", name: "Oly54", bet: 25, finalist1: "France", finalist2: "Netherlands", winner: "France" },
  { captain: "Camilo", name: "Camb", bet: 100, finalist1: "France", finalist2: "Portugal", winner: "France" },
  { captain: "Spongebob Squarepants", name: "The Krusty Krab", bet: 50, finalist1: "France", finalist2: "England", winner: "France" },
  { captain: "Alex Bolanos", name: "Panoramix", bet: 25, finalist1: "Spain", finalist2: "France", winner: "Spain" },
  { captain: "Andres Martino", name: "Martino", bet: 50, finalist1: "Spain", finalist2: "Germany", winner: "Spain" },
  { captain: "Jeb Corliss", name: "Jeb Corliss", bet: 50, finalist1: "Argentina", finalist2: "Spain", winner: "Spain" },
  { captain: "Juanillo", name: "Que Finta", bet: 50, finalist1: "France", finalist2: "Spain", winner: "France" },
  { captain: "Mario Van Severen", name: "Panzer", bet: 100, finalist1: "Netherlands", finalist2: "Portugal", winner: "Netherlands" },
  { captain: "Mauricio 1", name: "It's coming Home", bet: 100, finalist1: "Portugal", finalist2: "England", winner: "England" },
  { captain: "Anita", name: "Ana X", bet: 25, finalist1: "Argentina", finalist2: "Australia", winner: "Argentina" },
  { captain: "Federico Bolanos Jr", name: "Fede", bet: 25, finalist1: "France", finalist2: "Spain", winner: "Spain" },
  { captain: "Gerardo", name: "G1", bet: 100, finalist1: "Argentina", finalist2: "Spain", winner: "Spain" },
  { captain: "Gloria Panamá", name: "Gloria Gana", bet: 25, finalist1: "Spain", finalist2: "Portugal", winner: "Spain" },
  { captain: "Rodrigo Bolanos", name: "Quiniela Pupusera", bet: 25, finalist1: "Argentina", finalist2: "France", winner: "Argentina" },
  { captain: "Spongebob Squarepants", name: "Marco Bolanos", bet: 50, finalist1: "France", finalist2: "Portugal", winner: "Portugal" },
  { captain: "Adriano", name: "MARADRIANO", bet: 100, finalist1: "Argentina", finalist2: "France", winner: "Argentina" },
  { captain: "Ana Luz", name: "Abuela", bet: 25, finalist1: "Brazil", finalist2: "France", winner: "Brazil" },
  { captain: "Cam Bolanos", name: "Cam Bolanos", bet: 100, finalist1: "France", finalist2: "Portugal", winner: "France" },
  { captain: "Federico Bolanos", name: "Lico BP", bet: 100, finalist1: "Argentina", finalist2: "Spain", winner: "Argentina" },
  { captain: "Francesca Panko", name: "Francesca Panko", bet: 50, finalist1: "Spain", finalist2: "Argentina", winner: "Spain" },
  { captain: "Alex", name: "MISTER SHIT", bet: 25, finalist1: "Spain", finalist2: "Portugal", winner: "Portugal" },
  { captain: "Cam Bolanos", name: "C2", bet: 25, finalist1: "Brazil", finalist2: "Spain", winner: "Brazil" },
  { captain: "Carlos Panama Diaz", name: "Duo Dinamico Iron Beagle", bet: 100, finalist1: "England", finalist2: "France", winner: "England" },
  { captain: "Daniella Bolanos", name: "Dani Bolanos", bet: 25, finalist1: "Argentina", finalist2: "Spain", winner: "Argentina" },
  { captain: "Federico Bolanos", name: "Tessa", bet: 50, finalist1: "Argentina", finalist2: "Spain", winner: "Argentina" },
  { captain: "Julian Bolanos", name: "juliquini", bet: 25, finalist1: "Argentina", finalist2: "France", winner: "Argentina" },
];

/** Actual tournament winner for accuracy checks (update as tournament progresses) */
export const ACTUAL_WINNER = "Spain";

export interface RankedQuiniela extends Quiniela {
  slug: string;
  points: number;
  scoreBreakdown: QuinielaScoreBreakdown;
  rank: number;
  previousRank: number;
  rankChange: number;
  onFire: boolean;
  correctWinner: boolean;
}

export function toSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function quinielaToSlug(name: string): string {
  return toSlug(name);
}

export function slugToQuiniela(slug: string): Quiniela | undefined {
  return quinielas.find((q) => quinielaToSlug(q.name) === slug);
}

/** Captain slug — used for avatar storage only */
export function captainToSlug(captain: string): string {
  return toSlug(captain);
}

export function getCaptains(): string[] {
  return [...new Set(quinielas.map((q) => q.captain))].sort((a, b) =>
    a.localeCompare(b, "es")
  );
}

export function getQuinielasByCaptain(captain: string): Quiniela[] {
  return quinielas.filter((q) => q.captain === captain);
}

export function formatQuinielaLabel(
  entry: Pick<Quiniela, "name" | "captain">
): string {
  return `${entry.name} (${entry.captain})`;
}

function sortQuinielas(entries: RankedQuiniela[]): RankedQuiniela[] {
  return [...entries].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return a.captain.localeCompare(b.captain, "es");
  });
}

export function getRankedQuinielas(
  liveMatches: LiveMatch[] = [],
  previousRanksOverride?: Record<string, number>
): RankedQuiniela[] {
  const previousRanks =
    previousRanksOverride ??
    (typeof window !== "undefined" ? getPreviousRanksFromHistory() : null);

  const withScores: RankedQuiniela[] = quinielas.map((q) => {
    const scoreBreakdown = computeQuinielaScore(q, liveMatches);
    const matchPoints = scoreBreakdown.matchPoints;
    return {
      ...q,
      points: matchPoints,
      scoreBreakdown,
      slug: quinielaToSlug(q.name),
      rank: 0,
      previousRank: 0,
      rankChange: 0,
      onFire: matchPoints >= 4,
      correctWinner: q.winner === ACTUAL_WINNER,
    };
  });

  const sorted = sortQuinielas(withScores);

  return sorted.map((q, i) => {
    const rank = i + 1;
    const previousRank = previousRanks?.[q.name] ?? rank;
    return {
      ...q,
      rank,
      previousRank,
      rankChange: previousRank - rank,
    };
  });
}

export function filterQuinielasByBet(
  entries: RankedQuiniela[],
  tier: "all" | 25 | 50 | 100
): RankedQuiniela[] {
  const filtered =
    tier === "all" ? entries : entries.filter((q) => q.bet === tier);

  return filtered.map((q, i) => ({ ...q, rank: i + 1 }));
}

export function getWinnerPredictions(): { country: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const q of quinielas) {
    counts.set(q.winner, (counts.get(q.winner) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count);
}

export function getQuinielaAveragePoints(liveMatches: LiveMatch[] = []): number {
  const ranked = getRankedQuinielas(liveMatches);
  if (ranked.length === 0) return 0;
  return ranked.reduce((sum, q) => sum + q.points, 0) / ranked.length;
}

export function getStatHighlights(entries: RankedQuiniela[]) {
  const leader = entries[0];
  const climberCandidates = entries.filter((q) => q.rankChange > 0);
  const fallerCandidates = entries.filter((q) => q.rankChange < 0);
  const biggestClimber =
    climberCandidates.sort((a, b) => b.rankChange - a.rankChange)[0] ?? null;
  const biggestFaller =
    fallerCandidates.sort((a, b) => a.rankChange - b.rankChange)[0] ?? null;
  const mostAccurate = [...entries]
    .filter((q) => q.correctWinner)
    .sort((a, b) => b.points - a.points)[0];
  const biggestBet = [...entries].sort((a, b) => b.bet - a.bet)[0];
  const perfectStreak = entries.filter((q) => q.points >= 4);

  return {
    leader,
    biggestClimber,
    biggestFaller,
    mostAccurate,
    biggestBet,
    perfectStreak,
  };
}
