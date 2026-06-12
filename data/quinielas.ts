export interface Quiniela {
  captain: string;
  name: string;
  bet: 25 | 50 | 100;
  finalist1: string;
  finalist2: string;
  winner: string;
  points: number;
}

export const quinielas: Quiniela[] = [
  { captain: "Isabella Bolanos", name: "Barquito de papel", bet: 25, finalist1: "Spain", finalist2: "France", winner: "Spain", points: 6 },
  { captain: "Oly", name: "Oly54", bet: 25, finalist1: "France", finalist2: "Netherlands", winner: "France", points: 6 },
  { captain: "Camilo", name: "Camb", bet: 100, finalist1: "France", finalist2: "Portugal", winner: "France", points: 5 },
  { captain: "Spongebob Squarepants", name: "The Krusty Krab", bet: 50, finalist1: "France", finalist2: "England", winner: "France", points: 5 },
  { captain: "Alex Bolanos", name: "Panoramix", bet: 25, finalist1: "Spain", finalist2: "France", winner: "Spain", points: 4 },
  { captain: "Andres Martino", name: "Martino", bet: 50, finalist1: "Spain", finalist2: "Germany", winner: "Spain", points: 4 },
  { captain: "Jeb Corliss", name: "Jeb Corliss", bet: 50, finalist1: "Argentina", finalist2: "Spain", winner: "Spain", points: 4 },
  { captain: "Juanillo", name: "Que Finta", bet: 50, finalist1: "France", finalist2: "Spain", winner: "France", points: 4 },
  { captain: "Mario Van Severen", name: "Panzer", bet: 100, finalist1: "Netherlands", finalist2: "Portugal", winner: "Netherlands", points: 4 },
  { captain: "Mauricio 1", name: "It's coming Home", bet: 100, finalist1: "Portugal", finalist2: "England", winner: "England", points: 4 },
  { captain: "Anita", name: "Ana X", bet: 25, finalist1: "Argentina", finalist2: "Australia", winner: "Argentina", points: 3 },
  { captain: "Federico Bolanos Jr", name: "Fede", bet: 25, finalist1: "France", finalist2: "Spain", winner: "Spain", points: 3 },
  { captain: "Gerardo", name: "G1", bet: 100, finalist1: "Argentina", finalist2: "Spain", winner: "Spain", points: 3 },
  { captain: "Gloria Panamá", name: "Gloria Gana", bet: 25, finalist1: "Spain", finalist2: "Portugal", winner: "Spain", points: 3 },
  { captain: "Rodrigo Bolanos", name: "Quiniela Pupusera", bet: 25, finalist1: "Argentina", finalist2: "France", winner: "Argentina", points: 3 },
  { captain: "Spongebob Squarepants", name: "Marco Bolanos", bet: 50, finalist1: "France", finalist2: "Portugal", winner: "Portugal", points: 3 },
  { captain: "Adriano", name: "MARADRIANO", bet: 100, finalist1: "Argentina", finalist2: "France", winner: "Argentina", points: 2 },
  { captain: "Ana Luz", name: "Abuela", bet: 25, finalist1: "Brazil", finalist2: "France", winner: "Brazil", points: 2 },
  { captain: "Cam Bolanos", name: "Cam Bolanos", bet: 100, finalist1: "France", finalist2: "Portugal", winner: "France", points: 2 },
  { captain: "Federico Bolanos", name: "Lico BP", bet: 100, finalist1: "Argentina", finalist2: "Spain", winner: "Argentina", points: 2 },
  { captain: "Francesca Panko", name: "Francesca Panko", bet: 50, finalist1: "Spain", finalist2: "Argentina", winner: "Spain", points: 2 },
  { captain: "Alex", name: "MISTER SHIT", bet: 25, finalist1: "Spain", finalist2: "Portugal", winner: "Portugal", points: 1 },
  { captain: "Cam Bolanos", name: "C2", bet: 25, finalist1: "Brazil", finalist2: "Spain", winner: "Brazil", points: 1 },
  { captain: "Carlos Panama Diaz", name: "Duo Dinamico Iron Beagle", bet: 100, finalist1: "England", finalist2: "France", winner: "England", points: 1 },
  { captain: "Daniella Bolanos", name: "Dani Bolanos", bet: 25, finalist1: "Argentina", finalist2: "Spain", winner: "Argentina", points: 1 },
  { captain: "Federico Bolanos", name: "Tessa", bet: 50, finalist1: "Argentina", finalist2: "Spain", winner: "Argentina", points: 1 },
  { captain: "Julian Bolanos", name: "juliquini", bet: 25, finalist1: "Argentina", finalist2: "France", winner: "Argentina", points: 1 },
];

/** Actual tournament winner for accuracy checks (update as tournament progresses) */
export const ACTUAL_WINNER = "Spain";

export interface RankedQuiniela extends Quiniela {
  slug: string;
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

/** Simulated previous ranks per quiniela entry (not per captain) */
const PREVIOUS_QUINIELA_RANKS: Record<string, number> = {
  "Barquito de papel": 2,
  Oly54: 1,
  Camb: 4,
  "The Krusty Krab": 3,
  Panoramix: 5,
  Martino: 6,
  "Jeb Corliss": 8,
  "Que Finta": 7,
  Panzer: 9,
  "It's coming Home": 10,
  "Ana X": 12,
  Fede: 11,
  G1: 13,
  "Gloria Gana": 14,
  "Quiniela Pupusera": 15,
  "Marco Bolanos": 16,
  MARADRIANO: 17,
  Abuela: 18,
  "Cam Bolanos": 19,
  "Lico BP": 20,
  "Francesca Panko": 21,
  "MISTER SHIT": 22,
  C2: 23,
  "Duo Dinamico Iron Beagle": 24,
  "Dani Bolanos": 25,
  Tessa: 26,
  juliquini: 27,
};

function sortQuinielas(entries: Quiniela[]): Quiniela[] {
  return [...entries].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.bet !== a.bet) return b.bet - a.bet;
    return a.name.localeCompare(b.name, "es");
  });
}

export function getRankedQuinielas(
  previousRanks: Record<string, number> = PREVIOUS_QUINIELA_RANKS
): RankedQuiniela[] {
  const sorted = sortQuinielas(quinielas);

  return sorted.map((q, i) => {
    const rank = i + 1;
    const previousRank = previousRanks[q.name] ?? 99;
    return {
      ...q,
      slug: quinielaToSlug(q.name),
      rank,
      previousRank,
      rankChange: previousRank - rank,
      onFire: q.points >= 4,
      correctWinner: q.winner === ACTUAL_WINNER,
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

export function getQuinielaAveragePoints(): number {
  if (quinielas.length === 0) return 0;
  return quinielas.reduce((sum, q) => sum + q.points, 0) / quinielas.length;
}

export function getStatHighlights(entries: RankedQuiniela[]) {
  const leader = entries[0];
  const biggestClimber = [...entries].sort(
    (a, b) => b.rankChange - a.rankChange
  )[0];
  const biggestFaller = [...entries].sort(
    (a, b) => a.rankChange - b.rankChange
  )[0];
  const mostAccurate = [...entries]
    .filter((q) => q.correctWinner)
    .sort((a, b) => b.points - a.points)[0];
  const biggestBet = [...entries].sort((a, b) => b.bet - a.bet)[0];
  const perfectStreak = entries.filter((q) => q.points >= 5);

  return {
    leader,
    biggestClimber,
    biggestFaller,
    mostAccurate,
    biggestBet,
    perfectStreak,
  };
}
