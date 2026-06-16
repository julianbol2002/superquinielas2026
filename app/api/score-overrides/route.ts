import { NextResponse } from "next/server";
import { fetchScoreOverrides } from "@/lib/scoreOverrides";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const { overrides, meta } = await fetchScoreOverrides();
  return NextResponse.json(
    { overrides, meta },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
