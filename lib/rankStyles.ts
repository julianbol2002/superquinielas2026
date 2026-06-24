export const RANK_MEDAL_COLORS: Record<1 | 2 | 3, string> = {
  1: "#f5c518",
  2: "#c0c0c0",
  3: "#cd7f32",
};

export function rankNumberClass(rank: number): string {
  if (rank === 1) return "text-[#f5c518]";
  if (rank === 2) return "text-[#c0c0c0]";
  if (rank === 3) return "text-[#cd7f32]";
  return "text-primary-theme";
}

export function rankMedalEmoji(rank: number): string | null {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return null;
}

export function leaderboardRowClass(rank: number): string {
  if (rank === 1) return "leaderboard-row-gold";
  if (rank === 2) return "leaderboard-row-silver";
  if (rank === 3) return "leaderboard-row-bronze";
  return "";
}

export const PODIUM_PLACE_STYLES: Record<
  1 | 2 | 3,
  {
    border: string;
    bg: string;
    pedestalBg: string;
    pedestalHeight: string;
    cardClass: string;
    pedestalClass: string;
    glow: string;
  }
> = {
  1: {
    border: "#f5c518",
    bg: "color-mix(in srgb, #f5c518 10%, var(--surface))",
    pedestalBg: "color-mix(in srgb, #f5c518 16%, var(--surface))",
    pedestalHeight: "h-24",
    cardClass: "podium-card-gold",
    pedestalClass: "podium-pedestal-gold",
    glow: "0 0 14px color-mix(in srgb, #f5c518 14%, transparent)",
  },
  2: {
    border: "#c0c0c0",
    bg: "color-mix(in srgb, #c0c0c0 8%, var(--surface))",
    pedestalBg: "color-mix(in srgb, #c0c0c0 14%, var(--surface))",
    pedestalHeight: "h-16",
    cardClass: "podium-card-silver",
    pedestalClass: "podium-pedestal-silver",
    glow: "0 0 10px color-mix(in srgb, #c0c0c0 10%, transparent)",
  },
  3: {
    border: "#cd7f32",
    bg: "color-mix(in srgb, #cd7f32 9%, var(--surface))",
    pedestalBg: "color-mix(in srgb, #cd7f32 14%, var(--surface))",
    pedestalHeight: "h-12",
    cardClass: "podium-card-bronze",
    pedestalClass: "podium-pedestal-bronze",
    glow: "0 0 10px color-mix(in srgb, #cd7f32 10%, transparent)",
  },
};
