import { getSupabaseServerClient } from "@/lib/site-settings";

export type SectionPost = {
  id: string;
  topic_slug: string;
  title: string;
  body: string;
  image_url: string;
  sort_order: number;
};

type SectionPostRow = {
  id?: string | number | null;
  topic_slug?: string | null;
  title?: string | null;
  body?: string | null;
  image_url?: string | null;
  sort_order?: number | null;
};

export async function getSectionPosts() {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase.from("section_posts").select("*").order("sort_order", {
    ascending: true,
  });

  if (error || !data) {
    return [];
  }

  return (data as SectionPostRow[]).map(mapSectionPost).filter(Boolean) as SectionPost[];
}

export function mapSectionPost(row: SectionPostRow): SectionPost | undefined {
  if (!row.topic_slug || !row.title) {
    return undefined;
  }

  return {
    id: String(row.id ?? `${row.topic_slug}-${row.sort_order ?? 0}`),
    topic_slug: row.topic_slug,
    title: row.title,
    body: row.body ?? "",
    image_url: row.image_url ?? "",
    sort_order: Number(row.sort_order ?? 0),
  };
}
