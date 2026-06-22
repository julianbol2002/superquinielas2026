import {
  getRankedQuinielas,
  type RankedQuiniela,
  type Quiniela,
} from "@/data/quinielas";

export interface QuinielaPrizeEntry {
  quinielaName: string;
  captain: string;
  slug: string;
  bet: Quiniela["bet"];
  points: number;
  rank: number;
  /** This entry's share of its bet-tier pool (by rank within tier) */
  tierPoolShare: number;
  /** Estimated payout for this individual entry */
  estimatedPayout: number;
}

export interface BetTierPool {
  tier: 25 | 50 | 100;
  totalPool: number;
  entryCount: number;
  entries: QuinielaPrizeEntry[];
}

/** Total money collected — each quiniela entry pays its own bet independently */
export function getTotalPool(pointsByQuiniela?: Record<string, number>): number {
  return getRankedQuinielas([], { pointsByQuiniela }).reduce((sum, q) => sum + q.bet, 0);
}

function rankWithinTier(entries: RankedQuiniela[], tier: 25 | 50 | 100) {
  return entries
    .filter((q) => q.bet === tier)
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return a.captain.localeCompare(b.captain, "es");
    });
}

/**
 * Prize pools are calculated per bet tier ($25 / $50 / $100).
 * Each quiniela entry competes only within its tier; payout weights favor higher ranks.
 */
export function calculatePrizesByTier(
  pointsByQuiniela?: Record<string, number>
): BetTierPool[] {
  const ranked = getRankedQuinielas([], { pointsByQuiniela });
  const tiers: (25 | 50 | 100)[] = [25, 50, 100];

  return tiers.map((tier) => {
    const tierEntries = rankWithinTier(ranked, tier);
    const totalPool = tierEntries.reduce((sum, q) => sum + q.bet, 0);
    const weightSum = tierEntries.reduce(
      (sum, _, i) => sum + Math.max(1, tierEntries.length - i),
      0
    );

    const entries: QuinielaPrizeEntry[] = tierEntries.map((q, i) => {
      const weight = Math.max(1, tierEntries.length - i);
      const tierPoolShare = weightSum > 0 ? weight / weightSum : 0;
      const estimatedPayout = Math.round(totalPool * tierPoolShare * 100) / 100;

      return {
        quinielaName: q.name,
        captain: q.captain,
        slug: q.slug,
        bet: q.bet,
        points: q.points,
        rank: i + 1,
        tierPoolShare,
        estimatedPayout,
      };
    });

    return {
      tier,
      totalPool,
      entryCount: tierEntries.length,
      entries,
    };
  });
}

/** All prize rows flattened — one row per quiniela entry */
export function getAllQuinielaPrizes(
  pointsByQuiniela?: Record<string, number>
): QuinielaPrizeEntry[] {
  return calculatePrizesByTier(pointsByQuiniela).flatMap((pool) => pool.entries);
}

export function getPrizeForQuiniela(
  slug: string,
  pointsByQuiniela?: Record<string, number>
): QuinielaPrizeEntry | undefined {
  return getAllQuinielaPrizes(pointsByQuiniela).find((p) => p.slug === slug);
}
