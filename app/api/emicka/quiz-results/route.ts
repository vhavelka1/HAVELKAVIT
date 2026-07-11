import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/site-settings";

const difficulties = ["easy", "medium", "hard"] as const;
const answerLetters = ["A", "B", "C", "D"] as const;
const difficultyOrder: Record<string, number> = { easy: 0, medium: 1, hard: 2 };
const topicOrder = [
  "animals",
  "world",
  "body",
  "ocean",
  "dinosaurs",
  "space",
  "insects",
  "plants",
  "records",
];

type TimedResultRow = {
  nickname: string | null;
  topic_slug: string | null;
  difficulty: string | null;
  score: number | null;
  total_questions: number | null;
  points_awarded: number | null;
  elapsed_ms: number | null;
  created_at: string | null;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase admin client is not configured." }, { status: 503 });
  }

  const { rows, error } = await loadQuizResults(supabase);

  if (error) {
    return NextResponse.json({ error: "Quiz results could not be loaded." }, { status: 500 });
  }

  return NextResponse.json({
    overall: groupOverallResults(rows),
    timedByQuiz: groupTimedResults(rows),
  });
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase admin client is not configured." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const nickname = String(body?.nickname ?? "").trim().slice(0, 80) || "Hrac";
  const topicSlug = String(body?.topicSlug ?? "").trim().slice(0, 80);
  const difficulty = String(body?.difficulty ?? "").trim();
  const score = Number(body?.score);
  const totalQuestions = Number(body?.totalQuestions);
  const pointsAwarded = Number(body?.pointsAwarded);
  const elapsedMs = normalizeElapsedMs(body?.elapsedMs);
  const answers = normalizeAnswers(body?.answers);

  if (
    !topicSlug ||
    !difficulties.includes(difficulty as (typeof difficulties)[number]) ||
    !Number.isInteger(score) ||
    !Number.isInteger(totalQuestions) ||
    !Number.isInteger(pointsAwarded) ||
    score < 0 ||
    totalQuestions < 1 ||
    score > totalQuestions ||
    pointsAwarded < 0 ||
    elapsedMs === undefined
  ) {
    return NextResponse.json({ error: "Invalid quiz result payload." }, { status: 400 });
  }

  const payload = {
    nickname,
    topic_slug: topicSlug,
    difficulty,
    score,
    total_questions: totalQuestions,
    points_awarded: pointsAwarded,
    completed_perfect: score === totalQuestions,
    answers,
    elapsed_ms: elapsedMs,
  };

  let { error } = await supabase.from("quiz_results").insert(payload);

  if (isMissingColumnError(error, "elapsed_ms")) {
    const legacyPayload = {
      nickname: payload.nickname,
      topic_slug: payload.topic_slug,
      difficulty: payload.difficulty,
      score: payload.score,
      total_questions: payload.total_questions,
      points_awarded: payload.points_awarded,
      completed_perfect: payload.completed_perfect,
      answers: payload.answers,
    };
    const fallbackResult = await supabase.from("quiz_results").insert(legacyPayload);
    error = fallbackResult.error;
  }

  if (error) {
    return NextResponse.json({ error: "Quiz result could not be saved." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

async function loadQuizResults(supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>) {
  const result = await supabase
    .from("quiz_results")
    .select("nickname, topic_slug, difficulty, score, total_questions, points_awarded, elapsed_ms, created_at")
    .order("created_at", { ascending: false })
    .limit(2000);

  if (!isMissingColumnError(result.error, "elapsed_ms")) {
    return {
      rows: (result.data ?? []) as TimedResultRow[],
      error: result.error,
    };
  }

  const fallbackResult = await supabase
    .from("quiz_results")
    .select("nickname, topic_slug, difficulty, score, total_questions, points_awarded, created_at")
    .order("created_at", { ascending: false })
    .limit(2000);

  return {
    rows: ((fallbackResult.data ?? []) as Array<Omit<TimedResultRow, "elapsed_ms">>).map((row) => ({
      ...row,
      elapsed_ms: null,
    })),
    error: fallbackResult.error,
  };
}

function groupOverallResults(rows: TimedResultRow[]) {
  const players = new Map<string, {
    nickname: string;
    points: number;
    completed_quizzes: number;
    badges: string[];
    completedKeys: Set<string>;
  }>();

  for (const row of rows) {
    const nickname = String(row.nickname ?? "").trim() || "Hrac";
    const player = players.get(nickname) ?? {
      nickname,
      points: 0,
      completed_quizzes: 0,
      badges: [],
      completedKeys: new Set<string>(),
    };
    const points = Number(row.points_awarded ?? 0);

    if (Number.isFinite(points) && points > 0) {
      player.points += points;
    }

    if (row.score === row.total_questions) {
      const key = `${row.topic_slug ?? ""}:${row.difficulty ?? ""}`;

      if (key !== ":" && !player.completedKeys.has(key)) {
        player.completedKeys.add(key);
        player.completed_quizzes += 1;
      }
    }

    players.set(nickname, player);
  }

  return Array.from(players.values())
    .map((player) => ({
      nickname: player.nickname,
      points: player.points,
      completed_quizzes: player.completed_quizzes,
      badges: player.badges,
    }))
    .sort((a, b) => b.points - a.points || b.completed_quizzes - a.completed_quizzes || a.nickname.localeCompare(b.nickname))
    .slice(0, 10);
}

function groupTimedResults(rows: TimedResultRow[]) {
  const groups = new Map<string, {
    topicSlug: string;
    difficulty: string;
    results: Array<{
      nickname: string;
      score: number;
      totalQuestions: number;
      elapsedMs: number;
      createdAt: string;
    }>;
  }>();

  const normalizedRows = rows
    .map((row) => ({
      nickname: String(row.nickname ?? "").trim() || "Hrac",
      topicSlug: String(row.topic_slug ?? "").trim(),
      difficulty: String(row.difficulty ?? "").trim(),
      score: Number(row.score ?? 0),
      totalQuestions: Number(row.total_questions ?? 0),
      elapsedMs: Number(row.elapsed_ms ?? 0),
      createdAt: String(row.created_at ?? ""),
    }))
    .filter((row) =>
      row.topicSlug &&
      difficulties.includes(row.difficulty as (typeof difficulties)[number]) &&
      Number.isFinite(row.score) &&
      Number.isFinite(row.totalQuestions) &&
      Number.isFinite(row.elapsedMs) &&
      row.elapsedMs > 0
    )
    .sort((a, b) =>
      b.score - a.score ||
      a.elapsedMs - b.elapsedMs ||
      Date.parse(b.createdAt) - Date.parse(a.createdAt)
    );

  for (const row of normalizedRows) {
    const key = `${row.topicSlug}:${row.difficulty}`;
    const group = groups.get(key) ?? {
      topicSlug: row.topicSlug,
      difficulty: row.difficulty,
      results: [],
    };

    if (group.results.length < 5) {
      group.results.push({
        nickname: row.nickname,
        score: row.score,
        totalQuestions: row.totalQuestions,
        elapsedMs: row.elapsedMs,
        createdAt: row.createdAt,
      });
    }

    groups.set(key, group);
  }

  return Array.from(groups.values()).sort((a, b) =>
    (topicOrder.indexOf(a.topicSlug) === -1 ? 999 : topicOrder.indexOf(a.topicSlug)) -
      (topicOrder.indexOf(b.topicSlug) === -1 ? 999 : topicOrder.indexOf(b.topicSlug)) ||
    (difficultyOrder[a.difficulty] ?? 999) - (difficultyOrder[b.difficulty] ?? 999)
  );
}

function normalizeElapsedMs(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const elapsedMs = Number(value);

  if (!Number.isInteger(elapsedMs) || elapsedMs < 0 || elapsedMs > 1000 * 60 * 60 * 6) {
    return undefined;
  }

  return elapsedMs;
}

function isMissingColumnError(error: { message?: string | null } | null, column: string) {
  return Boolean(error?.message?.includes(column));
}

function normalizeAnswers(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((answer) => {
      if (!answer || typeof answer !== "object") {
        return undefined;
      }

      const row = answer as Record<string, unknown>;
      const selectedOption = normalizeAnswerLetter(row.selected_option);
      const correctOption = normalizeAnswerLetter(row.correct_option);

      return {
        question_id: String(row.question_id ?? "").trim().slice(0, 80),
        selected_option: selectedOption,
        correct_option: correctOption,
        is_correct: Boolean(row.is_correct),
      };
    })
    .filter((answer) => answer?.question_id);
}

function normalizeAnswerLetter(value: unknown) {
  const letter = String(value ?? "").trim().toUpperCase();
  return answerLetters.includes(letter as (typeof answerLetters)[number]) ? letter : "";
}
