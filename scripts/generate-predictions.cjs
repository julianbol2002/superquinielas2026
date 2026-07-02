/**
 * Parses public/Quiniela_TodasLasQuinielas_Export.pdf and writes data/predictions.ts
 */
const fs = require("fs");
const path = require("path");
const { PDFParse } = require("pdf-parse");

const TEAM_ALIASES = {
  Congo: "DR Congo",
  Curacao: "Curaçao",
};

function normalizeTeam(name) {
  const trimmed = name.trim();
  return TEAM_ALIASES[trimmed] ?? trimmed;
}

function matchKey(team1, team2) {
  return [normalizeTeam(team1), normalizeTeam(team2)].sort().join("|");
}

/** Mirror of data/countries.ts group fixtures */
const worldCupGroups = [
  { name: "A", teams: ["Mexico", "South Korea", "South Africa", "Czechia"] },
  { name: "B", teams: ["Canada", "Switzerland", "Qatar", "Bosnia and Herzegovina"] },
  { name: "C", teams: ["Brazil", "Morocco", "Scotland", "Haiti"] },
  { name: "D", teams: ["United States", "Australia", "Paraguay", "Turkey"] },
  { name: "E", teams: ["Germany", "Ecuador", "Ivory Coast", "Curaçao"] },
  { name: "F", teams: ["Netherlands", "Japan", "Sweden", "Tunisia"] },
  { name: "G", teams: ["Belgium", "Iran", "Egypt", "New Zealand"] },
  { name: "H", teams: ["Spain", "Uruguay", "Saudi Arabia", "Cabo Verde"] },
  { name: "I", teams: ["France", "Senegal", "Norway", "Iraq"] },
  { name: "J", teams: ["Argentina", "Algeria", "Austria", "Jordan"] },
  { name: "K", teams: ["Portugal", "Colombia", "Uzbekistan", "DR Congo"] },
  { name: "L", teams: ["England", "Croatia", "Ghana", "Panama"] },
];

const fixtures = [];
for (const group of worldCupGroups) {
  const teams = group.teams;
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      fixtures.push({
        id: `${group.name}-${teams[i]}-${teams[j]}`,
        group: group.name,
        team1: teams[i],
        team2: teams[j],
        key: matchKey(teams[i], teams[j]),
      });
    }
  }
}

const keyToId = new Map(fixtures.map((f) => [f.key, f.id]));

const quinielas = [
  { captain: "Isabella Bolanos", name: "Barquito de papel" },
  { captain: "Oly", name: "Oly54" },
  { captain: "Camilo", name: "Camb" },
  { captain: "Spongebob Squarepants", name: "The Krusty Krab" },
  { captain: "Alex Bolanos", name: "Panoramix" },
  { captain: "Andres Martino", name: "Martino" },
  { captain: "Jeb Corliss", name: "Jeb Corliss" },
  { captain: "Juanillo", name: "Que Finta" },
  { captain: "Mario Van Severen", name: "Panzer" },
  { captain: "Mauricio 1", name: "It's coming Home" },
  { captain: "Anita", name: "Ana X" },
  { captain: "Federico Bolanos Jr", name: "Fede" },
  { captain: "Gerardo", name: "G1" },
  { captain: "Gloria Panamá", name: "Gloria Gana" },
  { captain: "Rodrigo Bolanos", name: "Quiniela Pupusera" },
  { captain: "Spongebob Squarepants", name: "Marco Bolanos" },
  { captain: "Adriano", name: "MARADRIANO" },
  { captain: "Ana Luz", name: "Abuela" },
  { captain: "Cam Bolanos", name: "Cam Bolanos" },
  { captain: "Federico Bolanos", name: "Lico BP" },
  { captain: "Francesca Panko", name: "Francesca Panko" },
  { captain: "Alex", name: "MISTER SHIT" },
  { captain: "Cam Bolanos", name: "C2" },
  { captain: "Carlos Panama Diaz", name: "Duo Dinamico Iron Beagle" },
  { captain: "Daniella Bolanos", name: "Dani Bolanos" },
  { captain: "Federico Bolanos", name: "Tessa" },
  { captain: "Julian Bolanos", name: "juliquini" },
];

// Some quinielas were renamed after this PDF was exported. The PDF still uses
// the old names (left column), but the app slugs come from the current names
// (right column). Map old export slug \u2192 current app slug so the output matches
// data/quinielas.ts.
const SLUG_OVERRIDES = {
  oly54: "oly-con-todo",
  fede: "corre-como-el-viento-tiro-al-blanco",
  g1: "soquenla",
  "gloria-gana": "mosquito-letal",
  "francesca-panko": "estrella-psiquica",
};

function toSlug(value) {
  const raw = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return SLUG_OVERRIDES[raw] ?? raw;
}

const nameToSlug = new Map(quinielas.map((q) => [q.name, toSlug(q.name)]));

function decodeHtml(s) {
  return s.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function parseSections(text) {
  const cleaned = decodeHtml(text)
    .replace(/\r\n/g, "\n")
    .replace(/Resumen[\s\S]*?Julian Bolanos juliquini[^\n]*\n\n/, "");

  const lines = cleaned.split("\n");
  const bySlug = {};
  let currentSlug = null;

  // Captain may be empty when it wrapped onto a previous line/page (e.g. "-Panzer").
  const headerRe = /^(.*?)\s*-\s*(.+?)$/;
  const matchRe = /^1\s+(.+?)\s+vs\s+(.+?)(?:\s+(\d+)\s*-\s*(\d+))?\s*$/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith("--")) continue;

    if (line === "Fase Equipos Pronostico") continue;
    if (line.startsWith("Capitan ")) continue;

    const next = lines[i + 1]?.trim();
    if (next === "Fase Equipos Pronostico") {
      const headerMatch = line.match(headerRe);
      if (headerMatch) {
        const quinielaName = headerMatch[2].trim();
        const slug = nameToSlug.get(quinielaName);
        if (slug) {
          currentSlug = slug;
          if (!bySlug[slug]) bySlug[slug] = {};
        }
      }
      continue;
    }

    const match = line.match(matchRe);
    if (match && currentSlug) {
      const team1 = match[1].trim();
      const team2 = match[2].trim();
      const score1 = match[3] !== undefined ? Number(match[3]) : null;
      const score2 = match[4] !== undefined ? Number(match[4]) : null;
      const id = keyToId.get(matchKey(team1, team2));
      if (!id) {
        console.warn(`Unknown fixture: ${team1} vs ${team2}`);
        continue;
      }
      bySlug[currentSlug][id] =
        score1 === null || score2 === null ? null : { score1, score2 };
    }
  }

  return bySlug;
}

function serializePredictions(bySlug) {
  const lines = [
    "/** Auto-generated from public/Quiniela_TodasLasQuinielas_Export.pdf — do not edit */",
    "",
    "export type PredictionScore = { score1: number; score2: number } | null;",
    "export type QuinielaPredictionMap = Record<string, PredictionScore>;",
    "",
    "export const predictionsBySlug: Record<string, QuinielaPredictionMap> = {",
  ];

  const slugs = Object.keys(bySlug).sort();
  for (const slug of slugs) {
    lines.push(`  "${slug}": {`);
    const entries = Object.entries(bySlug[slug]).sort(([a], [b]) => a.localeCompare(b));
    for (const [id, score] of entries) {
      if (score === null) {
        lines.push(`    "${id}": null,`);
      } else {
        lines.push(`    "${id}": { score1: ${score.score1}, score2: ${score.score2} },`);
      }
    }
    lines.push("  },");
  }
  lines.push("};");
  lines.push("");
  lines.push("export function getPredictionsForSlug(slug: string): QuinielaPredictionMap | undefined {");
  lines.push("  return predictionsBySlug[slug];");
  lines.push("}");
  lines.push("");
  lines.push(`export const PREDICTION_QUINIELA_COUNT = ${slugs.length};`);
  lines.push(`export const GROUP_MATCH_COUNT = ${fixtures.length};`);
  lines.push("");

  return lines.join("\n");
}

async function main() {
  const pdfPath = path.join(process.cwd(), "public/Quiniela_TodasLasQuinielas_Export.pdf");
  const buf = fs.readFileSync(pdfPath);
  const parser = new PDFParse({ data: buf });
  const result = await parser.getText();
  const bySlug = parseSections(result.text);

  for (const q of quinielas) {
    const slug = toSlug(q.name);
    if (!bySlug[slug]) {
      console.warn(`Missing predictions for ${q.name} (${slug})`);
      bySlug[slug] = {};
    }
    for (const f of fixtures) {
      if (!(f.id in bySlug[slug])) {
        bySlug[slug][f.id] = null;
      }
    }
  }

  const outPath = path.join(process.cwd(), "data/predictions.ts");
  fs.writeFileSync(outPath, serializePredictions(bySlug));
  console.log(`Wrote ${outPath} (${quinielas.length} quinielas, ${fixtures.length} group matches each)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
