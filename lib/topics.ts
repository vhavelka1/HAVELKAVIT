import { createClient } from "@supabase/supabase-js";

export type Language = "cs" | "en";

export type Topic = {
  id: string;
  slug: string;
  title_cs: string;
  title_en: string;
  description_cs: string;
  description_en: string;
  image_url: string;
  sort_order?: number;
};

type SupabaseTopicRow = {
  id?: string | number | null;
  slug?: string | null;
  label?: string | null;
  title_cs?: string | null;
  title_en?: string | null;
  description_cs?: string | null;
  description_en?: string | null;
  image_url?: string | null;
  image?: string | null;
  sort_order?: number | null;
};

export const topicSeeds: Topic[] = [
  {
    id: "photography",
    slug: "photography",
    title_cs: "Fotografie",
    title_en: "Photography",
    description_cs: "Zachycovani svetla, detailu a atmosfery mist, ktera stoji za druhy pohled.",
    description_en: "Capturing light, detail, and the atmosphere of places worth a second look.",
    image_url:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "resin-art",
    slug: "resin-art",
    title_cs: "Resin Art",
    title_en: "Resin Art",
    description_cs: "Leskle vrstvy, pigmenty a struktury, kde se remeslo potkava s experimentem.",
    description_en: "Glossy layers, pigments, and textures where craft meets experiment.",
    image_url:
      "https://images.unsplash.com/photo-1618172193763-c511deb635ca?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "bookbinding",
    slug: "bookbinding",
    title_cs: "Knihvazba",
    title_en: "Bookbinding",
    description_cs: "Rucni prace s papirem, platnem a trpelivosti, ktera dava vecem pevny tvar.",
    description_en: "Hand work with paper, cloth, and patience that gives ideas a durable form.",
    image_url:
      "https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "vineyard",
    slug: "vineyard",
    title_cs: "Vinice",
    title_en: "Vineyard",
    description_cs: "Rytmus roku, pudy a pocasí v praci, ktera se neda uspechat.",
    description_en: "The rhythm of seasons, soil, and weather in work that cannot be rushed.",
    image_url:
      "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "programming",
    slug: "programming",
    title_cs: "Programovani",
    title_en: "Programming",
    description_cs: "Stavba webu, nastroju a systemu, ktere maji byt rychle, ciste a uzitecne.",
    description_en: "Building websites, tools, and systems that should feel fast, clean, and useful.",
    image_url:
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "dhl",
    slug: "dhl",
    title_cs: "DHL",
    title_en: "DHL",
    description_cs: "Operativa, presnost a kazdodenni rozhodovani v prostredi, kde zalezi na case.",
    description_en: "Operations, precision, and everyday decisions in an environment where time matters.",
    image_url:
      "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "foot-tennis",
    slug: "foot-tennis",
    title_cs: "Nohejbal",
    title_en: "Foot Tennis",
    description_cs: "Rychle reakce, cit pro mic a tymova hra s poradnou davkou soustredeni.",
    description_en: "Fast reactions, ball control, and team play with a serious dose of focus.",
    image_url:
      "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "table-tennis",
    slug: "table-tennis",
    title_cs: "Stolni tenis",
    title_en: "Table Tennis",
    description_cs: "Tempo, rotace a kratke vymeny, kde milimetry meni cely bod.",
    description_en: "Tempo, spin, and short rallies where millimeters can change the whole point.",
    image_url:
      "https://images.unsplash.com/photo-1611251135345-18c56206b863?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "emicka",
    slug: "emicka",
    title_cs: "Emička",
    title_en: "Emicka",
    description_cs:
      "Hriste pro Emiciny napady, male projekty, kresleni, pokusy a vsechno, co si zaslouzi vlastni prostor.",
    description_en:
      "A playground for Emicka's ideas, small projects, drawings, experiments, and everything that deserves its own space.",
    image_url:
      "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "adamek",
    slug: "adamek",
    title_cs: "Adámek",
    title_en: "Adamek",
    description_cs:
      "Adamův playground pro malé hry, objevování, pexeso a další nápady, které si časem najdou vlastní místo.",
    description_en:
      "Adam's playground for small games, discovery, memory cards, and future ideas that deserve their own place.",
    image_url:
      "https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?auto=format&fit=crop&w=1200&q=80",
  },
];

const slugAliases = new Map<string, string>(
  topicSeeds.flatMap((topic) => [
    [topic.slug, topic.slug],
    [slugify(topic.title_en), topic.slug],
    [slugify(topic.title_cs), topic.slug],
  ]),
);

export async function getTopics(): Promise<Topic[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return topicSeeds;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase.from("topics").select("*").order("sort_order", {
    ascending: true,
  });

  if (error || !data) {
    return topicSeeds;
  }

  const mapped = (data as SupabaseTopicRow[])
    .map(mapTopicRow)
    .filter((topic): topic is Topic => Boolean(topic));

  return mapped.length > 0 ? mergeRequiredSeeds(mapped) : topicSeeds;
}

export function mapTopicRow(row: SupabaseTopicRow): Topic | undefined {
  const slug = resolveTopicSlug(row) || (row.slug ? slugify(row.slug) : undefined);

  if (!slug) {
    return undefined;
  }

  const seed = topicSeeds.find((topic) => topic.slug === slug);

  return {
    id: String(row.id ?? slug),
    slug,
    title_cs: row.title_cs || seed?.title_cs || row.label || slug,
    title_en: row.title_en || row.label || seed?.title_en || slug,
    description_cs: row.description_cs || seed?.description_cs || "",
    description_en: row.description_en || seed?.description_en || "",
    image_url: row.image_url || row.image || seed?.image_url || "",
    sort_order: Number(row.sort_order ?? 0),
  };
}

function resolveTopicSlug(row: SupabaseTopicRow): string | undefined {
  const candidates = [row.slug, row.label, row.title_en, row.title_cs]
    .filter(Boolean)
    .map((value) => slugify(String(value)));

  for (const candidate of candidates) {
    const slug = slugAliases.get(candidate);

    if (slug) {
      return slug;
    }
  }

  return undefined;
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function mergeRequiredSeeds(topics: Topic[]) {
  const requiredSlugs = ["emicka", "adamek"];
  const merged = [...topics];

  for (const slug of requiredSlugs) {
    if (!merged.some((topic) => topic.slug === slug)) {
      const seed = topicSeeds.find((topic) => topic.slug === slug);

      if (seed) {
        merged.push({ ...seed, sort_order: merged.length + 1 });
      }
    }
  }

  return merged.sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));
}
