import { quinielas } from "@/data/quinielas";
import { upsertScoreOverrides } from "@/lib/scoreOverrides";

const ORIGINAL_SITE_BASE = "https://superquinielawc2026.azurewebsites.net";
const QUINIELAS_PATH = "/MemberPages/Quinielas";
const LOGIN_PATH = "/Account/Login";

export interface SyncOriginalScoresResult {
  ok: boolean;
  scores: Record<string, number>;
  syncedAt: string;
  rowCount: number;
  source: "scrape" | "skipped";
  error?: string;
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
  const match = html.match(
    new RegExp(`<input[^>]*name=["']${escaped}["'][^>]*value=["']([^"']*)["']`, "i")
  );
  return match?.[1] ?? null;
}

function parseSetCookie(header: string | null): string[] {
  if (!header) return [];
  return header.split(/,(?=\s*[^;]+=)/).map((c) => c.split(";")[0].trim());
}

function mergeCookies(existing: string, additions: string[]): string {
  const jar = new Map<string, string>();
  for (const part of existing.split(";").map((s) => s.trim()).filter(Boolean)) {
    const [k, ...v] = part.split("=");
    if (k) jar.set(k, v.join("="));
  }
  for (const part of additions) {
    const [k, ...v] = part.split("=");
    if (k) jar.set(k, v.join("="));
  }
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

function isLoginPage(html: string, finalUrl: string): boolean {
  return (
    finalUrl.toLowerCase().includes("/account/login") ||
    /iniciar sesion/i.test(html) ||
    /<form[^>]*login/i.test(html)
  );
}

function normalizeQuinielaName(raw: string): string | null {
  const cleaned = raw.replace(/\s+/g, " ").trim();
  if (!cleaned) return null;

  const exact = quinielas.find((q) => q.name.toLowerCase() === cleaned.toLowerCase());
  if (exact) return exact.name;

  const contains = quinielas.find((q) =>
    cleaned.toLowerCase().includes(q.name.toLowerCase())
  );
  return contains?.name ?? null;
}

export function parseQuinielaScoresFromHtml(html: string): Record<string, number> {
  const scores: Record<string, number> = {};

  const tableMatch = html.match(/<table[\s\S]*?<\/table>/gi);
  if (!tableMatch?.length) {
    throw new Error("[SCRAPE ERROR] Table not found — page structure may have changed");
  }

  let parsedAny = false;

  for (const table of tableMatch) {
    const rows = table.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];
    for (const row of rows) {
      const cells = row.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi);
      if (!cells || cells.length < 2) continue;

      const values = cells.map((cell) => stripTags(cell));
      const pointCell = values.find((v) => /^\d+$/.test(v));
      if (!pointCell) continue;

      const points = parseInt(pointCell, 10);
      if (Number.isNaN(points)) continue;

      for (const value of values) {
        if (/^\d+$/.test(value)) continue;
        const name = normalizeQuinielaName(value);
        if (name) {
          scores[name] = points;
          parsedAny = true;
          console.log(`[SCRAPE] Found: "${name}" → ${points} pts`);
          break;
        }
      }
    }
  }

  if (!parsedAny || Object.keys(scores).length === 0) {
    throw new Error("[SCRAPE ERROR] Table not found — page structure may have changed");
  }

  return scores;
}

async function fetchWithCookies(
  url: string,
  cookies: string,
  init?: RequestInit
): Promise<{ html: string; cookies: string; url: string }> {
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Cookie: cookies,
      "User-Agent": "SuperQuinielasSync/1.0",
    },
    redirect: "follow",
  });

  const newCookies = parseSetCookie(res.headers.get("set-cookie"));
  const html = await res.text();
  return {
    html,
    cookies: mergeCookies(cookies, newCookies),
    url: res.url,
  };
}

export async function syncOriginalScores(): Promise<SyncOriginalScoresResult> {
  const email = process.env.ORIGINAL_SITE_EMAIL;
  const password = process.env.ORIGINAL_SITE_PASSWORD;

  if (!email || !password) {
    console.warn("[SCRAPE] Skipped — ORIGINAL_SITE_EMAIL / ORIGINAL_SITE_PASSWORD not set");
    return {
      ok: false,
      scores: {},
      syncedAt: new Date().toISOString(),
      rowCount: 0,
      source: "skipped",
      error: "Credentials not configured",
    };
  }

  console.log("[SCRAPE] Starting sync from Azure original site…");

  const loginUrl = `${ORIGINAL_SITE_BASE}${LOGIN_PATH}?ReturnUrl=${encodeURIComponent(QUINIELAS_PATH)}`;
  console.log("[SCRAPE] Fetching login page…");
  const loginPage = await fetchWithCookies(loginUrl, "");

  const token =
    extractFormValue(loginPage.html, "__RequestVerificationToken") ??
    extractFormValue(loginPage.html, "RequestVerificationToken");

  const formData = new URLSearchParams();
  formData.set("Email", email);
  formData.set("Password", password);
  formData.set("RememberMe", "true");
  if (token) formData.set("__RequestVerificationToken", token);

  console.log("[SCRAPE] Login attempt…");
  const loginRes = await fetchWithCookies(loginUrl, loginPage.cookies, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Origin: ORIGINAL_SITE_BASE,
      Referer: loginUrl,
    },
    body: formData.toString(),
  });

  const quinielasUrl = `${ORIGINAL_SITE_BASE}${QUINIELAS_PATH}`;
  console.log("[SCRAPE] Fetching quinielas page…");
  const page =
    loginRes.url.includes(QUINIELAS_PATH) && !isLoginPage(loginRes.html, loginRes.url)
      ? loginRes
      : await fetchWithCookies(quinielasUrl, loginRes.cookies);

  if (isLoginPage(page.html, page.url)) {
    throw new Error("[SCRAPE ERROR] Login failed — check credentials");
  }

  const scores = parseQuinielaScoresFromHtml(page.html);
  console.log(`[SCRAPE] Parsed ${Object.keys(scores).length} quiniela scores`);

  const { written, syncedAt } = await upsertScoreOverrides(scores);

  return {
    ok: true,
    scores,
    syncedAt,
    rowCount: written,
    source: "scrape",
  };
}

let deploySyncTriggered = false;

/** Fire-and-forget sync once per server process (deploy / cold start). */
export function triggerDeployScoreSync(): void {
  if (deploySyncTriggered) return;
  deploySyncTriggered = true;

  syncOriginalScores().catch((err) => {
    console.error("[SCRAPE] Deploy sync failed:", err instanceof Error ? err.message : err);
  });
}
