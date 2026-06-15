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

export const PODIUM_PLACE_STYLES: Record<
  1 | 2 | 3,
  { border: string; bg: string; pedestalBg: string; pedestalHeight: string }
> = {
  1: {
    border: "#f5c518",
    bg: "#f5c51808",
    pedestalBg: "#f5c51814",
    pedestalHeight: "h-24",
  },
  2: {
    border: "#c0c0c0",
    bg: "#c0c0c008",
    pedestalBg: "#c0c0c014",
    pedestalHeight: "h-16",
  },
  3: {
    border: "#cd7f32",
    bg: "#cd7f3208",
    pedestalBg: "#cd7f3214",
    pedestalHeight: "h-12",
  },
};
