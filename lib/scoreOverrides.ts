import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

export interface ScoreOverrideRow {
  quiniela_name: string;
  official_points: number;
  synced_at: string;
}

export type ScoreOverrideMap = Record<
  string,
  { officialPoints: number; syncedAt: string }
>;

export interface ScoreSyncMeta {
  lastSyncedAt: string | null;
  overrideCount: number;
  source: "supabase" | "baseline";
}

export async function fetchScoreOverrides(): Promise<{
  overrides: ScoreOverrideMap;
  meta: ScoreSyncMeta;
}> {
  const client = getSupabase();
  if (!client) {
    return {
      overrides: {},
      meta: { lastSyncedAt: null, overrideCount: 0, source: "baseline" },
    };
  }

  const { data, error } = await client
    .from("score_overrides")
    .select("quiniela_name, official_points, synced_at")
    .order("quiniela_name");

  if (error || !data?.length) {
    console.error("fetchScoreOverrides:", error?.message ?? "no rows");
    return {
      overrides: {},
      meta: { lastSyncedAt: null, overrideCount: 0, source: "baseline" },
    };
  }

  const overrides: ScoreOverrideMap = {};
  let lastSyncedAt: string | null = null;

  for (const row of data as ScoreOverrideRow[]) {
    overrides[row.quiniela_name] = {
      officialPoints: row.official_points,
      syncedAt: row.synced_at,
    };
    if (!lastSyncedAt || row.synced_at > lastSyncedAt) {
      lastSyncedAt = row.synced_at;
    }
  }

  return {
    overrides,
    meta: {
      lastSyncedAt,
      overrideCount: data.length,
      source: "supabase",
    },
  };
}

export async function upsertScoreOverrides(
  scores: Record<string, number>
): Promise<{ written: number; syncedAt: string }> {
  const client = getSupabase();
  if (!client) {
    throw new Error("[SCRAPE ERROR] Supabase not configured — cannot write score_overrides");
  }

  const syncedAt = new Date().toISOString();
  const rows = Object.entries(scores).map(([quiniela_name, official_points]) => ({
    quiniela_name,
    official_points,
    synced_at: syncedAt,
  }));

  console.log(`[SCRAPE] Writing ${rows.length} rows to score_overrides…`);

  const { error } = await client.from("score_overrides").upsert(rows, {
    onConflict: "quiniela_name",
  });

  if (error) {
    console.error("[SCRAPE ERROR] Supabase write failed:", error.message);
    throw new Error(`[SCRAPE ERROR] Supabase write failed — ${error.message}`);
  }

  console.log(`[SCRAPE] Supabase write OK (${rows.length} rows)`);
  return { written: rows.length, syncedAt };
}

export function isScoreOverrideStorageReady(): boolean {
  return isSupabaseConfigured();
}
