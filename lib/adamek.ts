import { getSupabaseServerClient } from "@/lib/site-settings";

export type MemoryDifficulty = "easy" | "medium" | "hard";

export type MemoryTheme = {
  id: string;
  name: string;
  images: string[];
};

type MemoryThemeRow = {
  id?: string | number | null;
  name?: string | null;
  images?: unknown;
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
