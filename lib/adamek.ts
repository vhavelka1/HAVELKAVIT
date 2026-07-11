import { getSupabaseServerClient } from "@/lib/site-settings";

export type MemoryDifficulty = "easy" | "medium" | "hard";

export type MemoryTheme = {
  id: string;
  name: string;
  images: string[];
};

export type MemoryResult = {
  id: string;
  playerName: string;
  difficulty: MemoryDifficulty;
  themeName: string;
  seconds: number;
  moves: number;
  pairs: number;
  createdAt: string;
};

type MemoryThemeRow = {
  id?: string | number | null;
  name?: string | null;
  images?: unknown;
};

type MemoryResultRow = {
  id?: string | number | null;
  player_name?: string | null;
  difficulty?: string | null;
  theme_name?: string | null;
  seconds?: number | null;
  moves?: number | null;
  pairs?: number | null;
  created_at?: string | null;
};

export const memoryDifficulties: Array<{
  id: MemoryDifficulty;
  label: string;
  pairs: number;
  cards: number;
  tone: string;
}> = [
  {
    id: "easy",
    label: "Easy",
    pairs: 10,
    cards: 20,
    tone: "from-emerald-300 to-lime-300 text-emerald-950",
  },
  {
    id: "medium",
    label: "Medium",
    pairs: 15,
    cards: 30,
    tone: "from-yellow-300 to-orange-300 text-orange-950",
  },
  {
    id: "hard",
    label: "Hard",
    pairs: 30,
    cards: 60,
    tone: "from-rose-400 to-fuchsia-400 text-white",
  },
];

const foodImageSlugs = [
  "jablko",
  "banan",
  "jahoda",
  "mrkev",
  "syr",
  "pizza",
  "zmrzlina",
  "dort",
  "kobliha",
  "meloun",
  "hrozny",
  "citron",
  "hruska",
  "rajce",
  "brambora",
  "chleba",
  "croissant",
  "vejce",
  "palacinka",
  "susenka",
  "cokolada",
  "popcorn",
  "med",
  "salat",
  "tacos",
  "hamburger",
  "hranolky",
  "ryba",
  "sushi",
  "kukurice",
];

export const defaultMemoryThemes: MemoryTheme[] = [
  {
    id: "jidlo",
    name: "Jídlo",
    images: foodImageSlugs.map((slug) => `/adamek/food/${slug}.svg`),
  },
];

export async function getMemoryThemes(): Promise<MemoryTheme[]> {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return defaultMemoryThemes;
  }

  const { data, error } = await supabase
    .from("adamek_memory_themes")
    .select("id, name, images")
    .order("name", { ascending: true });

  if (error || !data) {
    return defaultMemoryThemes;
  }

  const themes = (data as MemoryThemeRow[])
    .map(mapMemoryThemeRow)
    .filter((theme): theme is MemoryTheme => Boolean(theme));

  return themes.length > 0 ? themes : defaultMemoryThemes;
}

export function getMemoryDifficulty(id: MemoryDifficulty) {
  return memoryDifficulties.find((difficulty) => difficulty.id === id) ?? memoryDifficulties[0];
}

export async function getMemoryResults(): Promise<MemoryResult[]> {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const resultGroups = await Promise.all(
    memoryDifficulties.map(async ({ id }) => {
      const { data, error } = await supabase
        .from("adamek_memory_results")
        .select("id, player_name, difficulty, theme_name, seconds, moves, pairs, created_at")
        .eq("difficulty", id)
        .order("seconds", { ascending: true })
        .order("moves", { ascending: true })
        .order("created_at", { ascending: true })
        .limit(5);

      return error || !data ? [] : data;
    }),
  );

  return resultGroups
    .flat()
    .map((row) => mapMemoryResultRow(row as MemoryResultRow))
    .filter((result): result is MemoryResult => Boolean(result));
}

function mapMemoryThemeRow(row: MemoryThemeRow): MemoryTheme | undefined {
  const id = String(row.id ?? "").trim();
  const name = String(row.name ?? "").trim();

  if (!id || !name) {
    return undefined;
  }

  return {
    id,
    name,
    images: normalizeImages(row.images),
  };
}

function normalizeImages(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
}

function mapMemoryResultRow(row: MemoryResultRow): MemoryResult | undefined {
  const difficulty = normalizeDifficulty(row.difficulty);
  const id = String(row.id ?? "").trim();
  const playerName = String(row.player_name ?? "").trim();
  const themeName = String(row.theme_name ?? "").trim();
  const seconds = Number(row.seconds);
  const moves = Number(row.moves);
  const pairs = Number(row.pairs);

  if (
    !id ||
    !playerName ||
    !difficulty ||
    !themeName ||
    !Number.isFinite(seconds) ||
    !Number.isFinite(moves) ||
    !Number.isFinite(pairs)
  ) {
    return undefined;
  }

  return {
    id,
    playerName,
    difficulty,
    themeName,
    seconds,
    moves,
    pairs,
    createdAt: row.created_at ?? "",
  };
}

export function normalizeDifficulty(value: unknown): MemoryDifficulty | undefined {
  if (value === "easy" || value === "medium" || value === "hard") {
    return value;
  }

  return undefined;
}
