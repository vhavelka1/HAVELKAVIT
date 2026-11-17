import { NextResponse } from "next/server";
import {
  calculateTypingMetrics,
  getTypingResults,
  normalizeTypingDifficulty,
  typingRoundLength,
  type TypingPeriod,
} from "@/lib/marcelka";
import { getSupabaseAdminClient } from "@/lib/site-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const periods = ["today", "week", "all"] as const;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const difficulty = normalizeTypingDifficulty(url.searchParams.get("difficulty"));
  const period = normalizePeriod(url.searchParams.get("period"));
  const school = normalizeOptionalText(url.searchParams.get("school"), 60);
  const className = normalizeOptionalText(url.searchParams.get("className"), 30);

  const results = await getTypingResults({
    difficulty,
    period,
    school,
    className,
    limit: 50,
  });

  return NextResponse.json({ results });
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase admin client is not configured." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const playerName = normalizeRequiredText(body?.playerName, 40);
  const school = normalizeOptionalText(body?.school, 60);
  const className = normalizeOptionalText(body?.className, 30);
  const difficulty = normalizeTypingDifficulty(body?.difficulty);
  const elapsedMs = Number(body?.elapsedMs);
  const mistakes = Number(body?.mistakes);
  const maxCombo = Number(body?.maxCombo);

  if (
    !playerName ||
    !difficulty ||
    !Number.isInteger(elapsedMs) ||
    elapsedMs < 1000 ||
    elapsedMs > 1000 * 60 * 30 ||
    !Number.isInteger(mistakes) ||
    mistakes < 0 ||
    mistakes > 500 ||
    !Number.isInteger(maxCombo) ||
    maxCombo < 0 ||
    maxCombo > typingRoundLength
  ) {
    return NextResponse.json({ error: "Invalid typing result payload." }, { status: 400 });
  }

  const metrics = calculateTypingMetrics({
    difficulty,
    elapsedMs,
    mistakes,
    maxCombo,
  });

  const payload = {
    player_name: playerName,
    school,
    class_name: className,
    difficulty,
    points: metrics.points,
    elapsed_ms: elapsedMs,
    mistakes,
    accuracy: metrics.accuracy,
    max_combo: maxCombo,
    chars_per_minute: metrics.charsPerMinute,
  };

  const { data, error } = await supabase
    .from("marcelka_typing_results")
    .insert(payload)
    .select(
      "id, player_name, school, class_name, difficulty, points, elapsed_ms, mistakes, accuracy, max_combo, chars_per_minute, created_at",
    )
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Typing result could not be saved." }, { status: 500 });
  }

  const results = await getTypingResults({ difficulty, period: "all", limit: 50 });

  return NextResponse.json({
    result: {
      id: String(data.id),
      playerName: data.player_name,
      school: data.school ?? "",
      className: data.class_name ?? "",
      difficulty: data.difficulty,
      points: data.points,
      elapsedMs: data.elapsed_ms,
      mistakes: data.mistakes,
      accuracy: data.accuracy,
      maxCombo: data.max_combo,
      charsPerMinute: data.chars_per_minute,
      createdAt: data.created_at,
    },
    results,
  });
}

function normalizeRequiredText(value: unknown, maxLength: number) {
  const normalized = normalizeOptionalText(value, maxLength);
  return normalized || undefined;
}

function normalizeOptionalText(value: unknown, maxLength: number) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
}

function normalizePeriod(value: unknown): TypingPeriod {
  return periods.includes(value as TypingPeriod) ? (value as TypingPeriod) : "all";
}
