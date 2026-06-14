export const CHART_GRID = "var(--border)";
export const CHART_TEXT = "var(--text-muted)";
export const CHART_SURFACE = "var(--surface)";
export const CHART_BORDER = "var(--border)";

export const chartMargin = { top: 8, right: 8, left: 0, bottom: 0 };

export const chartAxisTick = { fill: CHART_TEXT, fontSize: 10 };

export const chartTooltipStyle = {
  backgroundColor: CHART_SURFACE,
  border: `1px solid ${CHART_BORDER}`,
  borderRadius: 4,
  boxShadow: "none",
  fontSize: 12,
  color: "var(--text-primary)",
};
