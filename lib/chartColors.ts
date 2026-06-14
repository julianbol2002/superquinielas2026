import { quinielas } from "@/data/quinielas";

export const CHART_COLORS = [
  "#00ff87",
  "#4a9eff",
  "#f5c518",
  "#ff6b6b",
  "#c77dff",
  "#ff9f43",
  "#00d2d3",
  "#ff6b9d",
  "#48dbfb",
  "#ff9ff3",
] as const;

const SORTED_QUINIELA_NAMES = [...quinielas]
  .map((q) => q.name)
  .sort((a, b) => a.localeCompare(b, "es"));

export function getQuinielaChartColor(quinielaName: string): string {
  const index = SORTED_QUINIELA_NAMES.indexOf(quinielaName);
  if (index === -1) return CHART_COLORS[0];
  return CHART_COLORS[index % CHART_COLORS.length];
}

export function buildQuinielaColorMap(
  names: Record<string, string>
): Record<string, string> {
  const colors: Record<string, string> = {};
  for (const [slug, name] of Object.entries(names)) {
    colors[slug] = getQuinielaChartColor(name);
  }
  return colors;
}
