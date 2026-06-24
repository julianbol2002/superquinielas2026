import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  sanitizeSupabaseKey,
  validateSupabaseKey,
  friendlySupabaseError,
} from "@/lib/supabaseKeys";

export interface MatchRow {
  id: string;
  stage: string;
  group_name: string | null;
  team1: string;
  team2: string;
  score1: number | null;
  score2: number | null;
  match_date: string | null;
  updated_at: string;
}

export interface PlayerRankRow {
  id: string;
  captain_name: string;
  rank: number;
  points: number;
  recorded_at: string;
}

let supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = sanitizeSupabaseKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (!url || !key || validateSupabaseKey(key)) return null;
  if (!supabase) {
    supabase = createClient(url, key);
  }
  return supabase;
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = sanitizeSupabaseKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return Boolean(url && key && !validateSupabaseKey(key));
}

/** True when profile photo upload/display can work (needs project URL at minimum). */
export function isAvatarUploadAvailable(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export async function fetchMatches(): Promise<MatchRow[]> {
  const client = getSupabase();
  if (!client) return [];
  const { data, error } = await client
    .from("matches")
    .select("*")
    .order("match_date", { ascending: true });
  if (error) {
    console.error("fetchMatches:", error.message);
    return [];
  }
  return data ?? [];
}

export async function upsertMatch(
  match: Omit<MatchRow, "id" | "updated_at"> & { id?: string }
): Promise<MatchRow | null> {
  const client = getSupabase();
  if (!client) return null;
  const { data, error } = await client
    .from("matches")
    .upsert({ ...match, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) {
    console.error("upsertMatch:", error.message);
    return null;
  }
  return data;
}

export async function fetchPreviousRanks(): Promise<
  Record<string, number>
> {
  const client = getSupabase();
  if (!client) return {};
  const { data, error } = await client
    .from("player_ranks")
    .select("captain_name, rank")
    .order("recorded_at", { ascending: false });
  if (error || !data) return {};

  const ranks: Record<string, number> = {};
  for (const row of data as PlayerRankRow[]) {
    if (!ranks[row.captain_name]) {
      ranks[row.captain_name] = row.rank;
    }
  }
  return ranks;
}

export function getAvatarBaseUrl(slug: string): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url) return null;
  return `${url}/storage/v1/object/public/avatars/${slug}.webp`;
}

/** SSR-safe base URL — cache busting is applied client-side only. */
export function getAvatarUrl(slug: string): string | null {
  return getAvatarBaseUrl(slug);
}

export type UploadAvatarResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function uploadAvatar(
  slug: string,
  file: Blob
): Promise<UploadAvatarResult> {
  try {
    const formData = new FormData();
    formData.append("slug", slug);
    formData.append("file", file, `${slug}.webp`);

    const res = await fetch("/api/upload-avatar", {
      method: "POST",
      body: formData,
    });

    const body = (await res.json()) as { url?: string; error?: string };

    if (!res.ok) {
      return {
        ok: false,
        error: friendlySupabaseError(
          body.error ?? `Upload failed (${res.status})`
        ),
      };
    }

    if (!body.url) {
      return { ok: false, error: "Upload succeeded but no URL returned" };
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(`avatar-v:${slug}`, String(Date.now()));
      window.dispatchEvent(
        new CustomEvent("avatar-updated", { detail: { slug } })
      );
    }

    return { ok: true, url: body.url };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error";
    console.error("uploadAvatar:", message);
    return { ok: false, error: message };
  }
}
