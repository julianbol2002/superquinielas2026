import { quinielas } from "@/data/quinielas";
import { ORIGINAL_SITE_POINTS } from "@/data/expectedPoints";
import { CookieJar, fetchWithJar } from "@/lib/httpCookieJar";

export interface Score {
  quiniela: string;
  points: number;
}

const ORIGINAL_SITE_BASE = "https://superquinielawc2026.azurewebsites.net";
const QUINIELAS_PATH = "/MemberPages/Quinielas";
const LOGIN_PATH = "/Account/Login";

let cachedScores: Score[] = [];
let lastFetched = 0;
const CACHE_DURATION = 30 * 60 * 1000;

let inFlight: Promise<Score[]> | null = null;

function logEnvCredentials(): void {
  const email = process.env.ORIGINAL_SITE_EMAIL ?? "";
  const password = process.env.ORIGINAL_SITE_PASSWORD;
  console.log(
    `[SCORES] Email: ${email || "(not set)"}, Password: set=${password ? "yes" : "no"}`
  );
}

function redirectPath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

function maskToken(token: string | null): string {
  if (!token) return "(none)";
  if (token.length <= 8) return token;
  return `${token.slice(0, 8)}...`;
}

export function getLastFetched(): number {
  return lastFetched;
}

export function clearScoresCache(): void {
  lastFetched = 0;
}

export function scoresToMap(scores: Score[]): Record<string, number> {
  return Object.fromEntries(scores.map((s) => [s.quiniela, s.points]));
}

function fallbackScores(): Score[] {
  return quinielas.map((q) => ({
    quiniela: q.name,
    points: ORIGINAL_SITE_POINTS[q.name] ?? 0,
  }));
}

/** Reference totals when Azure scrape is unavailable */
export function getBundledScores(): Score[] {
  return fallbackScores();
}

function useFallbackScores(reason: string): Score[] {
  console.warn(`[SCORES] ${reason} — using bundled reference scores`);
  const fallback = fallbackScores();
  cachedScores = fallback;
  lastFetched = Date.now();
  return fallback;
}

function validateScrapedScores(scores: Score[]): Score[] {
  const byName = new Map(scores.map((s) => [s.quiniela, s.points]));
  const merged: Score[] = [];
  const missing: string[] = [];

  for (const q of quinielas) {
    const scraped = byName.get(q.name);
    if (scraped === undefined) {
      missing.push(q.name);
      merged.push({
        quiniela: q.name,
        points: ORIGINAL_SITE_POINTS[q.name] ?? 0,
      });
    } else {
      merged.push({ quiniela: q.name, points: scraped });
    }
  }

  if (missing.length > 0) {
    console.warn(
      `[SCORES] Scrape missing ${missing.length} quiniela(s), filled from reference: ${missing.join(", ")}`
    );
  }

  return merged;
}

export async function getScores(force = false): Promise<Score[]> {
  if (!force && Date.now() - lastFetched < CACHE_DURATION && cachedScores.length > 0) {
    return cachedScores;
  }

  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const fresh = validateScrapedScores(await scrapeAzureSite());
      if (fresh.length === 0) {
        throw new Error("Scrape returned zero scores");
      }
      cachedScores = fresh;
      lastFetched = Date.now();
      return fresh;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[SCORES] getScores failed:", message);
      if (cachedScores.length > 0) {
        console.warn("[SCORES] Returning last cached scores");
        return cachedScores;
      }
      return useFallbackScores("Azure scrape unavailable");
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

function decodeHtml(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function stripTags(html: string): string {
  return decodeHtml(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function extractFormValue(html: string, name: string): string | null {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<input[^>]*name=["']${escaped}["'][^>]*value=["']([^"']*)["']`, "i"),
    new RegExp(`<input[^>]*value=["']([^"']*)["'][^>]*name=["']${escaped}["']`, "i"),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1] !== undefined) return m[1];
  }
  return null;
}

function extractFormAction(html: string, pageUrl: string, fallback: string): string {
  const m = html.match(/<form[^>]*action=["']([^"']*)["']/i);
  if (!m?.[1]) return fallback;
  return new URL(m[1], pageUrl).href;
}

function isLoginPage(html: string, finalUrl: string): boolean {
  if (finalUrl.toLowerCase().includes("/account/login")) return true;
  return (
    /name=["']ctl00\$MainContent\$Email["']/i.test(html) &&
    /name=["']ctl00\$MainContent\$Password["']/i.test(html)
  );
}

function normalizeQuinielaName(raw: string): string | null {
  const cleaned = raw.replace(/\s+/g, " ").trim();
  if (!cleaned) return null;

  const exact = quinielas.find((q) => q.name.toLowerCase() === cleaned.toLowerCase());
  if (exact) return exact.name;

  const byLength = [...quinielas].sort((a, b) => b.name.length - a.name.length);
  const contains = byLength.find((q) =>
    cleaned.toLowerCase().includes(q.name.toLowerCase())
  );
  return contains?.name ?? null;
}

function parseQuinielasTable(html: string): Score[] {
  const scores: Score[] = [];
  const tables = html.match(/<table[\s\S]*?<\/table>/gi) ?? [];

  const tableFound = tables.length > 0;
  console.log(`[SCORES] Table found: ${tableFound ? "yes" : "no"}`);

  if (!tableFound) {
    console.log("[SCORES] Quinielas page HTML preview (first 2000 chars):");
    console.log(html.slice(0, 2000));
    throw new Error("[SCORES] No table on quinielas page");
  }

  let bestTable: string | null = null;
  let bestCount = 0;

  for (const table of tables) {
    let count = 0;
    const rows = table.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];
    for (const row of rows) {
      const cells = row.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi);
      if (!cells || cells.length < 3) continue;
      const values = cells.map((cell) => stripTags(cell));
      const pts = values[values.length - 1];
      const name = normalizeQuinielaName(values[1] ?? "");
      if (name && /^\d+$/.test(pts)) count++;
    }
    if (count > bestCount) {
      bestCount = count;
      bestTable = table;
    }
  }

  if (!bestTable) {
    console.log("[SCORES] Quinielas page HTML preview (first 2000 chars):");
    console.log(html.slice(0, 2000));
    throw new Error("[SCORES] No quiniela rows in table");
  }

  const rows = bestTable.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];
  let rowNum = 0;

  for (const row of rows) {
    const cells = row.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi);
    if (!cells || cells.length < 3) continue;

    const values = cells.map((cell) => stripTags(cell));
    const pointsStr = values[values.length - 1];
    if (!/^\d+$/.test(pointsStr)) continue;

    const name = normalizeQuinielaName(values[1] ?? "");
    if (!name) continue;

    rowNum++;
    const points = parseInt(pointsStr, 10);
    scores.push({ quiniela: name, points });
    console.log(`[SCORES] Row ${rowNum}: "${name}" → ${points}`);
  }

  console.log(`[SCORES] Rows found: ${rowNum}`);

  const deduped = new Map<string, number>();
  for (const row of scores) {
    deduped.set(row.quiniela, row.points);
  }

  if (deduped.size === 0) {
    console.log("[SCORES] Quinielas page HTML preview (first 2000 chars):");
    console.log(html.slice(0, 2000));
    throw new Error("[SCORES] Parsed zero rows from quinielas table");
  }

  if (deduped.size < quinielas.length) {
    console.warn(
      `[SCORES] Partial scrape: ${deduped.size}/${quinielas.length} quinielas — reference will fill gaps`
    );
  }

  return [...deduped.entries()].map(([quiniela, points]) => ({ quiniela, points }));
}

async function scrapeAzureSite(): Promise<Score[]> {
  console.log("[SCORES] Starting scrape...");
  logEnvCredentials();

  const email = process.env.ORIGINAL_SITE_EMAIL;
  const password = process.env.ORIGINAL_SITE_PASSWORD;

  if (!email || !password) {
    throw new Error("[SCORES] ORIGINAL_SITE_EMAIL / ORIGINAL_SITE_PASSWORD not set");
  }

  const jar = new CookieJar();
  const loginGetUrl = `${ORIGINAL_SITE_BASE}${LOGIN_PATH}`;

  console.log("[SCORES] Fetching login page...");
  const loginPage = await fetchWithJar(loginGetUrl, jar);
  console.log(`[SCORES] Login page status: ${loginPage.status}`);

  const viewState = extractFormValue(loginPage.html, "__VIEWSTATE");
  const viewStateGenerator = extractFormValue(loginPage.html, "__VIEWSTATEGENERATOR");
  const eventValidation = extractFormValue(loginPage.html, "__EVENTVALIDATION");

  console.log(
    `[SCORES] CSRF token found: ${viewState ? "yes" : "no"} — value: ${maskToken(viewState)}`
  );
  if (!viewState || !eventValidation) {
    throw new Error("[SCORES] WebForms tokens not found on login page");
  }

  const postUrl = extractFormAction(loginPage.html, loginPage.url, loginGetUrl);

  const formData = new URLSearchParams();
  formData.set("__EVENTTARGET", "");
  formData.set("__EVENTARGUMENT", "");
  formData.set("__VIEWSTATE", viewState);
  if (viewStateGenerator) formData.set("__VIEWSTATEGENERATOR", viewStateGenerator);
  formData.set("__EVENTVALIDATION", eventValidation);
  formData.set("ctl00$MainContent$Email", email);
  formData.set("ctl00$MainContent$Password", password);
  formData.set("ctl00$MainContent$RememberMe", "true");
  formData.set("ctl00$MainContent$ctl05", "Log in");

  console.log("[SCORES] Posting login...");
  const loginRes = await fetchWithJar(postUrl, jar, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Origin: ORIGINAL_SITE_BASE,
      Referer: loginGetUrl,
    },
    body: formData.toString(),
  });

  console.log(`[SCORES] Login response status: ${loginRes.status}`);
  console.log(`[SCORES] Login redirect URL: ${redirectPath(loginRes.url)}`);

  const loginSuccess =
    loginRes.status >= 200 &&
    loginRes.status < 400 &&
    !isLoginPage(loginRes.html, loginRes.url);
  console.log(`[SCORES] Login success: ${loginSuccess ? "yes" : "no"}`);

  if (!loginSuccess) {
    throw new Error("[SCORES] Login failed — check credentials");
  }

  let quinielasHtml = loginRes.html;
  if (!loginRes.url.includes(QUINIELAS_PATH)) {
    const quinielasUrl = `${ORIGINAL_SITE_BASE}${QUINIELAS_PATH}`;
    console.log("[SCORES] Fetching quinielas page...");
    const page = await fetchWithJar(quinielasUrl, jar);
    quinielasHtml = page.html;

    if (isLoginPage(quinielasHtml, page.url)) {
      console.log("[SCORES] Quinielas page HTML preview (first 2000 chars):");
      console.log(quinielasHtml.slice(0, 2000));
      throw new Error("[SCORES] Quinielas page requires login");
    }
  }

  console.log(`[SCORES] Quinielas page length: ${quinielasHtml.length} chars`);
  const scores = parseQuinielasTable(quinielasHtml);
  console.log(`[SCORES] Scrape complete. Returning ${scores.length} scores.`);
  return scores;
}
