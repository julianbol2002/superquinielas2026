import { createClient, SupabaseClient } from "@supabase/supabase-js";

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
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!supabase) {
    supabase = createClient(url, key);
  }
  return supabase;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
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

export function getAvatarUrl(slug: string): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  return `${url}/storage/v1/object/public/avatars/${slug}.webp`;
}

export async function uploadAvatar(
  slug: string,
  file: Blob
): Promise<string | null> {
  const client = getSupabase();
  if (!client) return null;

  const { error } = await client.storage
    .from("avatars")
    .upload(`${slug}.webp`, file, {
      upsert: true,
      contentType: "image/webp",
    });

  if (error) {
    console.error("uploadAvatar:", error.message);
    return null;
  }

  return getAvatarUrl(slug);
}
