/** Minimal cookie jar for ASP.NET login redirect chains. */

export class CookieJar {
  private jar = new Map<string, string>();

  absorb(headers: string | string[] | null | undefined): void {
    const list = normalizeSetCookie(headers);
    for (const part of list) {
      const [pair] = part.split(";");
      const eq = pair.indexOf("=");
      if (eq <= 0) continue;
      const name = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1).trim();
      if (!name) continue;
      if (value === "" && part.toLowerCase().includes("max-age=0")) {
        this.jar.delete(name);
      } else {
        this.jar.set(name, value);
      }
    }
  }

  toHeader(): string {
    return [...this.jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }
}

function normalizeSetCookie(headers: string | string[] | null | undefined): string[] {
  if (!headers) return [];
  if (Array.isArray(headers)) return headers;
  return headers.split(/,(?=\s*[^;]+=)/).map((c) => c.trim());
}

export async function fetchWithJar(
  url: string,
  jar: CookieJar,
  init?: RequestInit
): Promise<{ html: string; url: string; status: number }> {
  let currentUrl = url;
  let method = init?.method ?? "GET";
  let body = init?.body;
  const baseHeaders: Record<string, string> = {
    "User-Agent": "Mozilla/5.0 (compatible; SuperQuinielasSync/1.1)",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    ...(init?.headers as Record<string, string> | undefined),
  };

  for (let hop = 0; hop < 12; hop++) {
    const res = await fetch(currentUrl, {
      ...init,
      method,
      body,
      redirect: "manual",
      headers: {
        ...baseHeaders,
        Cookie: jar.toHeader(),
      },
    });

    const setCookie =
      typeof res.headers.getSetCookie === "function"
        ? res.headers.getSetCookie()
        : res.headers.get("set-cookie");
    jar.absorb(setCookie);

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) {
        const html = await res.text();
        return { html, url: currentUrl, status: res.status };
      }
      currentUrl = new URL(location, currentUrl).href;
      method = "GET";
      body = undefined;
      continue;
    }

    const html = await res.text();
    return { html, url: currentUrl, status: res.status };
  }

  throw new Error("[SCRAPE ERROR] Too many redirects");
}
