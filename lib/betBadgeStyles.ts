const BET_BADGE_STYLES: Record<25 | 50 | 100, string> = {
  25: "bg-[#1a3a5c] text-[#4a9eff]",
  50: "bg-[#1a3d2a] text-[#00cc66]",
  100: "bg-[#3d2a00] text-[#f5c518]",
};

export function betBadgeClass(bet: 25 | 50 | 100): string {
  return BET_BADGE_STYLES[bet];
}
