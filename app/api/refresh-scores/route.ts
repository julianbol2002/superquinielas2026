import { NextResponse } from "next/server";
import { getLastFetched, getScores } from "@/lib/getScores";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60;

async function refreshScores() {
  const scores = await getScores(true);
  return NextResponse.json(
    { scores, lastFetched: getLastFetched() },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}

export async function GET() {
  try {
    return await refreshScores();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown refresh error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST() {
  try {
    return await refreshScores();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown refresh error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
