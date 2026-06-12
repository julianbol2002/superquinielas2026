import { NextResponse } from "next/server";
import { getScoresWithSync } from "@/lib/liveScores";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const data = await getScoresWithSync();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("/api/scores:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch live scores",
        matches: [],
        lastUpdated: new Date().toISOString(),
        hasLiveMatches: false,
        syncedCount: 0,
        supabaseConfigured: false,
      },
      { status: 502 }
    );
  }
}
