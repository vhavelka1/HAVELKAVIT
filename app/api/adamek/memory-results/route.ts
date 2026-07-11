import { NextResponse } from "next/server";
import { getMemoryDifficulty, getMemoryResults, normalizeDifficulty } from "@/lib/adamek";
import { getSupabaseAdminClient } from "@/lib/site-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase admin client is not configured." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const difficulty = normalizeDifficulty(body?.difficulty);
  const playerName = String(body?.playerName ?? "").trim().slice(0, 80);
  const themeName = String(body?.themeName ?? "").trim().slice(0, 120);
  const seconds = Number(body?.seconds);
  const moves = Number(body?.moves);

  if (
    !difficulty ||
    !playerName ||
    !themeName ||
    !Number.isInteger(seconds) ||
    seconds < 0 ||
    !Number.isInteger(moves) ||
    moves < 0
  ) {
    return NextResponse.json({ error: "Invalid result payload." }, { status: 400 });
  }

  const { error } = await supabase.from("adamek_memory_results").insert({
    player_name: playerName,
    difficulty,
    theme_name: themeName,
    seconds,
    moves,
    pairs: getMemoryDifficulty(difficulty).pairs,
  });

  if (error) {
    return NextResponse.json({ error: "Result could not be saved." }, { status: 500 });
  }

  return NextResponse.json({ results: await getMemoryResults() });
}
