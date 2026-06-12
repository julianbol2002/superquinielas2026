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

export interface PlayerAggregate {
  captain: string;
  slug: string;
  totalPoints: number;
  quinielaCount: number;
  totalBet: number;
  betBreakdown: { bet25: number; bet50: number; bet100: number };
  highestSingleScore: number;
  correctWinners: number;
  predictedFinalists: string[];
  quinielas: Quiniela[];
  rank: number;
  previousRank: number;
  rankChange: number;
  onFire: boolean;
  perfectStreak: boolean;
}

export function captainToSlug(captain: string): string {
  return captain
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function slugToCaptain(slug: string): string | undefined {
  const captains = [...new Set(quinielas.map((q) => q.captain))];
  return captains.find((c) => captainToSlug(c) === slug);
}

export function getCaptains(): string[] {
  return [...new Set(quinielas.map((q) => q.captain))].sort((a, b) =>
    a.localeCompare(b, "es")
  );
}

/** Simulated previous ranks for rank change indicators */
const PREVIOUS_RANKS: Record<string, number> = {
  "Isabella Bolanos": 2,
  Oly: 1,
  Camilo: 4,
  "Spongebob Squarepants": 5,
  "Alex Bolanos": 3,
  "Andres Martino": 6,
  "Jeb Corliss": 8,
  Juanillo: 7,
  "Mario Van Severen": 9,
  "Mauricio 1": 10,
  Anita: 12,
  "Federico Bolanos Jr": 11,
  Gerardo: 13,
  "Gloria Panamá": 14,
  "Rodrigo Bolanos": 15,
  Adriano: 16,
  "Ana Luz": 17,
  "Cam Bolanos": 18,
  "Federico Bolanos": 19,
  "Francesca Panko": 20,
  Alex: 21,
  "Carlos Panama Diaz": 22,
  "Daniella Bolanos": 23,
  "Julian Bolanos": 24,
};

export function aggregatePlayers(
  previousRanks: Record<string, number> = PREVIOUS_RANKS
): PlayerAggregate[] {
  const map = new Map<string, PlayerAggregate>();

  for (const q of quinielas) {
    const existing = map.get(q.captain);
    const finalists = new Set(existing?.predictedFinalists ?? []);

    if (!existing) {
      map.set(q.captain, {
        captain: q.captain,
        slug: captainToSlug(q.captain),
        totalPoints: q.points,
        quinielaCount: 1,
        totalBet: q.bet,
        betBreakdown: {
          bet25: q.bet === 25 ? 1 : 0,
          bet50: q.bet === 50 ? 1 : 0,
          bet100: q.bet === 100 ? 1 : 0,
        },
        highestSingleScore: q.points,
        correctWinners: q.winner === ACTUAL_WINNER ? 1 : 0,
        predictedFinalists: [q.finalist1, q.finalist2, q.winner],
        quinielas: [q],
        rank: 0,
        previousRank: previousRanks[q.captain] ?? 99,
        rankChange: 0,
        onFire: q.points >= 4,
        perfectStreak: q.points >= 5,
      });
    } else {
      existing.totalPoints += q.points;
      existing.quinielaCount += 1;
      existing.totalBet += q.bet;
      if (q.bet === 25) existing.betBreakdown.bet25 += 1;
      if (q.bet === 50) existing.betBreakdown.bet50 += 1;
      if (q.bet === 100) existing.betBreakdown.bet100 += 1;
      existing.highestSingleScore = Math.max(existing.highestSingleScore, q.points);
      if (q.winner === ACTUAL_WINNER) existing.correctWinners += 1;
      existing.predictedFinalists.push(q.finalist1, q.finalist2, q.winner);
      existing.quinielas.push(q);
      existing.onFire = existing.quinielas.some((x) => x.points >= 4);
      existing.perfectStreak = existing.quinielas.some((x) => x.points >= 5);
    }

    finalists.add(q.finalist1);
    finalists.add(q.finalist2);
    finalists.add(q.winner);
  }

  const players = [...map.values()].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    return b.totalBet - a.totalBet;
  });

  players.forEach((p, i) => {
    p.rank = i + 1;
    p.rankChange = p.previousRank - p.rank;
    p.predictedFinalists = [...new Set(p.predictedFinalists)];
  });

  return players;
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

export function getGroupAveragePoints(): number {
  const players = aggregatePlayers();
  if (players.length === 0) return 0;
  return players.reduce((sum, p) => sum + p.totalPoints, 0) / players.length;
}

export function getStatHighlights(players: PlayerAggregate[]) {
  const leader = players[0];
  const biggestClimber = [...players].sort((a, b) => b.rankChange - a.rankChange)[0];
  const biggestFaller = [...players].sort((a, b) => a.rankChange - b.rankChange)[0];
  const mostAccurate = [...players].sort(
    (a, b) => b.correctWinners - a.correctWinners
  )[0];
  const biggestBet = [...players].sort((a, b) => b.totalBet - a.totalBet)[0];
  const perfectStreak = players.filter((p) =>
    p.quinielas.some((q) => q.points >= 5)
  );

  return { leader, biggestClimber, biggestFaller, mostAccurate, biggestBet, perfectStreak };
}

export function filterPlayersByBet(
  players: PlayerAggregate[],
  tier: "all" | 25 | 50 | 100
): PlayerAggregate[] {
  if (tier === "all") return players;
  return players
    .map((p) => ({
      ...p,
      quinielas: p.quinielas.filter((q) => q.bet === tier),
    }))
    .filter((p) => p.quinielas.length > 0)
    .map((p) => ({
      ...p,
      totalPoints: p.quinielas.reduce((s, q) => s + q.points, 0),
      totalBet: p.quinielas.reduce((s, q) => s + q.bet, 0),
      quinielaCount: p.quinielas.length,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((p, i) => ({ ...p, rank: i + 1 }));
}
