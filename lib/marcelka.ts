import { getSupabaseServerClient } from "@/lib/site-settings";

export type TypingDifficulty = "beginner" | "advanced" | "master";
export type TypingPeriod = "today" | "week" | "all";

export type TypingResult = {
  id: string;
  playerName: string;
  school: string;
  className: string;
  difficulty: TypingDifficulty;
  points: number;
  elapsedMs: number;
  mistakes: number;
  accuracy: number;
  maxCombo: number;
  charsPerMinute: number;
  createdAt: string;
};

type TypingResultRow = {
  id?: string | number | null;
  player_name?: string | null;
  school?: string | null;
  class_name?: string | null;
  difficulty?: string | null;
  points?: number | null;
  elapsed_ms?: number | null;
  mistakes?: number | null;
  accuracy?: number | null;
  max_combo?: number | null;
  chars_per_minute?: number | null;
  created_at?: string | null;
};

export const typingRoundLength = 30;

export const typingDifficulties: Array<{
  id: TypingDifficulty;
  label: string;
  shortLabel: string;
  description: string;
  tone: string;
  targetCharsPerMinute: number;
  characters: string[];
}> = [
  {
    id: "beginner",
    label: "Začátečník",
    shortLabel: "1",
    description: "Malá písmena bez diakritiky.",
    tone: "from-emerald-300 via-lime-200 to-yellow-200 text-emerald-950",
    targetCharsPerMinute: 45,
    characters: Array.from("abcdefghijklmnopqrstuvwxyz"),
  },
  {
    id: "advanced",
    label: "Pokročilý",
    shortLabel: "2",
    description: "Malá a velká písmena včetně české diakritiky.",
    tone: "from-sky-300 via-cyan-200 to-emerald-200 text-sky-950",
    targetCharsPerMinute: 38,
    characters: Array.from(
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZáčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ",
    ),
  },
  {
    id: "master",
    label: "Mistr klávesnice",
    shortLabel: "3",
    description: "Písmena, číslice a běžné speciální znaky české klávesnice.",
    tone: "from-fuchsia-300 via-rose-200 to-orange-200 text-fuchsia-950",
    targetCharsPerMinute: 34,
    characters: Array.from(
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZáčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ0123456789.,-+*/=?!:;_()[]{}<>@#$%&",
    ),
  },
];

export const typingPeriods: Array<{ id: TypingPeriod; label: string }> = [
  { id: "today", label: "Dnes" },
  { id: "week", label: "Tento týden" },
  { id: "all", label: "Celkem" },
];

export function normalizeTypingDifficulty(value: unknown): TypingDifficulty | undefined {
  if (value === "beginner" || value === "advanced" || value === "master") {
    return value;
  }

  return undefined;
}

export function getTypingDifficulty(id: TypingDifficulty) {
  return typingDifficulties.find((difficulty) => difficulty.id === id) ?? typingDifficulties[0];
}

export function createTypingChallenge(difficulty: TypingDifficulty, length = typingRoundLength) {
  const characters = getTypingDifficulty(difficulty).characters;

  return Array.from({ length }, () => characters[Math.floor(Math.random() * characters.length)]);
}

export function calculateTypingMetrics({
  difficulty,
  elapsedMs,
  mistakes,
  maxCombo,
}: {
  difficulty: TypingDifficulty;
  elapsedMs: number;
  mistakes: number;
  maxCombo: number;
}) {
  const correct = typingRoundLength;
  const safeElapsedMs = Math.max(1, elapsedMs);
  const accuracy = roundToOne((correct / Math.max(correct + mistakes, 1)) * 100);
  const charsPerMinute = roundToOne(correct / (safeElapsedMs / 60000));
  const targetSpeed = getTypingDifficulty(difficulty).targetCharsPerMinute;
  const speedRatio = Math.min(charsPerMinute / targetSpeed, 1.4);
  const speedPoints = Math.round(Math.max(0, speedRatio) * 900);
  const accuracyPoints = Math.round((accuracy / 100) * 1500);
  const comboPoints = Math.round((Math.min(maxCombo, correct) / correct) * 600);
  const mistakePenalty = mistakes * 12;
  const points = Math.max(0, speedPoints + accuracyPoints + comboPoints - mistakePenalty);

  return {
    points,
    accuracy,
    charsPerMinute,
  };
}

export function getTypingMedal(points: number, accuracy: number) {
  if (points >= 2750 && accuracy >= 96) {
    return { label: "Zlatá medaile", tone: "from-yellow-200 to-amber-400 text-amber-950" };
  }

  if (points >= 2200 && accuracy >= 90) {
    return { label: "Stříbrná medaile", tone: "from-slate-100 to-slate-300 text-slate-950" };
  }

  return { label: "Bronzová medaile", tone: "from-orange-200 to-amber-700 text-orange-950" };
}

export async function getTypingResults({
  difficulty,
  period = "all",
  school,
  className,
  limit = 50,
}: {
  difficulty?: TypingDifficulty;
  period?: TypingPeriod;
  school?: string;
  className?: string;
  limit?: number;
} = {}): Promise<TypingResult[]> {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  let query = supabase
    .from("marcelka_typing_results")
    .select(
      "id, player_name, school, class_name, difficulty, points, elapsed_ms, mistakes, accuracy, max_combo, chars_per_minute, created_at",
    )
    .order("points", { ascending: false })
    .order("elapsed_ms", { ascending: true })
    .order("accuracy", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 100));

  if (difficulty) {
    query = query.eq("difficulty", difficulty);
  }

  const createdAfter = getPeriodStart(period);

  if (createdAfter) {
    query = query.gte("created_at", createdAfter.toISOString());
  }

  if (school) {
    query = query.ilike("school", `%${escapeLikePattern(school)}%`);
  }

  if (className) {
    query = query.ilike("class_name", `%${escapeLikePattern(className)}%`);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return (data as TypingResultRow[])
    .map(mapTypingResultRow)
    .filter((result): result is TypingResult => Boolean(result));
}

function mapTypingResultRow(row: TypingResultRow): TypingResult | undefined {
  const difficulty = normalizeTypingDifficulty(row.difficulty);
  const id = String(row.id ?? "").trim();
  const playerName = String(row.player_name ?? "").trim();
  const points = Number(row.points);
  const elapsedMs = Number(row.elapsed_ms);
  const mistakes = Number(row.mistakes);
  const accuracy = Number(row.accuracy);
  const maxCombo = Number(row.max_combo);
  const charsPerMinute = Number(row.chars_per_minute);

  if (
    !id ||
    !playerName ||
    !difficulty ||
    !Number.isFinite(points) ||
    !Number.isFinite(elapsedMs) ||
    !Number.isFinite(mistakes) ||
    !Number.isFinite(accuracy) ||
    !Number.isFinite(maxCombo) ||
    !Number.isFinite(charsPerMinute)
  ) {
    return undefined;
  }

  return {
    id,
    playerName,
    school: String(row.school ?? ""),
    className: String(row.class_name ?? ""),
    difficulty,
    points,
    elapsedMs,
    mistakes,
    accuracy,
    maxCombo,
    charsPerMinute,
    createdAt: row.created_at ?? "",
  };
}

function getPeriodStart(period: TypingPeriod) {
  if (period === "all") {
    return undefined;
  }

  const now = new Date();
  const parts = getPragueDateParts(now);

  if (period === "today") {
    return pragueLocalDateToUtc(parts.year, parts.month, parts.day);
  }

  const currentDay = new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
  const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
  const monday = new Date(Date.UTC(parts.year, parts.month - 1, parts.day - daysFromMonday));

  return pragueLocalDateToUtc(
    monday.getUTCFullYear(),
    monday.getUTCMonth() + 1,
    monday.getUTCDate(),
  );
}

function getPragueDateParts(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Prague",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
  };
}

function pragueLocalDateToUtc(year: number, month: number, day: number) {
  const guess = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Prague",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(formatter.formatToParts(guess).map((part) => [part.type, part.value]));
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  const offset = asUtc - guess.getTime();

  return new Date(guess.getTime() - offset);
}

function roundToOne(value: number) {
  return Math.round(value * 10) / 10;
}

function escapeLikePattern(value: string) {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}
