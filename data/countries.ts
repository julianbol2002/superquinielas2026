/** Country name → ISO 3166-1 alpha-2 code for react-world-flags */
export const countryToCode: Record<string, string> = {
  Spain: "ES",
  France: "FR",
  Argentina: "AR",
  Brazil: "BR",
  Portugal: "PT",
  Netherlands: "NL",
  England: "GB",
  Germany: "DE",
  Australia: "AU",
  Mexico: "MX",
  "South Korea": "KR",
  "South Africa": "ZA",
  Czechia: "CZ",
  Canada: "CA",
  Switzerland: "CH",
  Qatar: "QA",
  "Bosnia and Herzegovina": "BA",
  Morocco: "MA",
  Scotland: "GB",
  Haiti: "HT",
  "United States": "US",
  Paraguay: "PY",
  Turkey: "TR",
  Ecuador: "EC",
  "Ivory Coast": "CI",
  "Curaçao": "CW",
  Japan: "JP",
  Sweden: "SE",
  Tunisia: "TN",
  Belgium: "BE",
  Iran: "IR",
  Egypt: "EG",
  "New Zealand": "NZ",
  Uruguay: "UY",
  "Saudi Arabia": "SA",
  "Cabo Verde": "CV",
  Senegal: "SN",
  Norway: "NO",
  Iraq: "IQ",
  Algeria: "DZ",
  Austria: "AT",
  Jordan: "JO",
  Colombia: "CO",
  Uzbekistan: "UZ",
  "DR Congo": "CD",
  Croatia: "HR",
  Ghana: "GH",
  Panama: "PA",
  Honduras: "HN",
};

export function getCountryCode(country: string): string {
  return countryToCode[country] ?? "UN";
}

/** Compact labels for tight fixture rows (~390px mobile) */
export const countryShortNames: Record<string, string> = {
  "Bosnia and Herzegovina": "Bosnia & Herz.",
  "Ivory Coast": "Ivory Coast",
  "United States": "USA",
  "South Korea": "S. Korea",
  "South Africa": "S. Africa",
  "New Zealand": "New Zealand",
  "Saudi Arabia": "Saudi Arabia",
  "DR Congo": "DR Congo",
  "Curaçao": "Curaçao",
};

export function getCountryDisplayName(country: string, compact = false): string {
  if (!compact) return country;
  return countryShortNames[country] ?? country;
}

export interface GroupTeam {
  name: string;
  code: string;
}

export interface WorldCupGroup {
  name: string;
  teams: GroupTeam[];
}

/** Official FIFA World Cup 2026 group draw (playoff winners resolved where known) */
export const worldCupGroups: WorldCupGroup[] = [
  {
    name: "A",
    teams: [
      { name: "Mexico", code: "MX" },
      { name: "South Korea", code: "KR" },
      { name: "South Africa", code: "ZA" },
      { name: "Czechia", code: "CZ" },
    ],
  },
  {
    name: "B",
    teams: [
      { name: "Canada", code: "CA" },
      { name: "Switzerland", code: "CH" },
      { name: "Qatar", code: "QA" },
      { name: "Bosnia and Herzegovina", code: "BA" },
    ],
  },
  {
    name: "C",
    teams: [
      { name: "Brazil", code: "BR" },
      { name: "Morocco", code: "MA" },
      { name: "Scotland", code: "GB" },
      { name: "Haiti", code: "HT" },
    ],
  },
  {
    name: "D",
    teams: [
      { name: "United States", code: "US" },
      { name: "Australia", code: "AU" },
      { name: "Paraguay", code: "PY" },
      { name: "Turkey", code: "TR" },
    ],
  },
  {
    name: "E",
    teams: [
      { name: "Germany", code: "DE" },
      { name: "Ecuador", code: "EC" },
      { name: "Ivory Coast", code: "CI" },
      { name: "Curaçao", code: "CW" },
    ],
  },
  {
    name: "F",
    teams: [
      { name: "Netherlands", code: "NL" },
      { name: "Japan", code: "JP" },
      { name: "Sweden", code: "SE" },
      { name: "Tunisia", code: "TN" },
    ],
  },
  {
    name: "G",
    teams: [
      { name: "Belgium", code: "BE" },
      { name: "Iran", code: "IR" },
      { name: "Egypt", code: "EG" },
      { name: "New Zealand", code: "NZ" },
    ],
  },
  {
    name: "H",
    teams: [
      { name: "Spain", code: "ES" },
      { name: "Uruguay", code: "UY" },
      { name: "Saudi Arabia", code: "SA" },
      { name: "Cabo Verde", code: "CV" },
    ],
  },
  {
    name: "I",
    teams: [
      { name: "France", code: "FR" },
      { name: "Senegal", code: "SN" },
      { name: "Norway", code: "NO" },
      { name: "Iraq", code: "IQ" },
    ],
  },
  {
    name: "J",
    teams: [
      { name: "Argentina", code: "AR" },
      { name: "Algeria", code: "DZ" },
      { name: "Austria", code: "AT" },
      { name: "Jordan", code: "JO" },
    ],
  },
  {
    name: "K",
    teams: [
      { name: "Portugal", code: "PT" },
      { name: "Colombia", code: "CO" },
      { name: "Uzbekistan", code: "UZ" },
      { name: "DR Congo", code: "CD" },
    ],
  },
  {
    name: "L",
    teams: [
      { name: "England", code: "GB" },
      { name: "Croatia", code: "HR" },
      { name: "Ghana", code: "GH" },
      { name: "Panama", code: "PA" },
    ],
  },
];

/** Generate round-robin group stage fixtures */
export function getGroupFixtures(group: WorldCupGroup) {
  const teams = group.teams;
  const fixtures: { team1: string; team2: string; group: string }[] = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      fixtures.push({
        team1: teams[i].name,
        team2: teams[j].name,
        group: group.name,
      });
    }
  }
  return fixtures;
}

export function getAllGroupFixtures() {
  return worldCupGroups.flatMap((g) => getGroupFixtures(g));
}

export interface StandingsRow {
  team: string;
  code: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
}

export function computeStandings(
  group: WorldCupGroup,
  results: { team1: string; team2: string; score1: number | null; score2: number | null }[]
): StandingsRow[] {
  const rows = new Map<string, StandingsRow>();

  for (const t of group.teams) {
    rows.set(t.name, {
      team: t.name,
      code: t.code,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      pts: 0,
    });
  }

  for (const r of results) {
    if (r.score1 === null || r.score2 === null) continue;
    const a = rows.get(r.team1);
    const b = rows.get(r.team2);
    if (!a || !b) continue;

    a.played += 1;
    b.played += 1;
    a.gf += r.score1;
    a.ga += r.score2;
    b.gf += r.score2;
    b.ga += r.score1;

    if (r.score1 > r.score2) {
      a.won += 1;
      b.lost += 1;
      a.pts += 3;
    } else if (r.score2 > r.score1) {
      b.won += 1;
      a.lost += 1;
      b.pts += 3;
    } else {
      a.drawn += 1;
      b.drawn += 1;
      a.pts += 1;
      b.pts += 1;
    }
  }

  return [...rows.values()]
    .map((r) => ({ ...r, gd: r.gf - r.ga }))
    .sort((x, y) => y.pts - x.pts || y.gd - x.gd || y.gf - x.gf);
}
