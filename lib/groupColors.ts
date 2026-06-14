/** Consistent left-border accent per World Cup group A–L */
export const GROUP_BORDER_COLORS: Record<string, string> = {
  A: "#4a6670",
  B: "#4a7058",
  C: "#705a4a",
  D: "#5a4a70",
  E: "#70704a",
  F: "#4a5870",
  G: "#704a5a",
  H: "#58704a",
  I: "#6a5080",
  J: "#508068",
  K: "#806050",
  L: "#506880",
};

export function getGroupBorderColor(groupName: string): string {
  return GROUP_BORDER_COLORS[groupName] ?? "#444444";
}
