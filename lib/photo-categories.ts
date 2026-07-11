import { getSupabaseServerClient } from "@/lib/site-settings";

export type PhotoCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  long_description: string;
  icon: string;
  accent_color: string;
  image_url: string;
  is_active: boolean;
  sort_order: number;
};

export type PhotoImage = {
  id: string;
  category_id: string;
  image_url: string;
  title: string;
  description: string;
  is_active: boolean;
  sort_order: number;
};

export type PhotoAlbum = {
  id: string;
  category_id: string;
  title: string;
  slug: string;
  description: string;
  cover_image_url: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

export type PhotoItem = {
  id: string;
  category_id: string;
  album_id: string;
  image_url: string;
  title: string;
  description: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

type PhotoCategoryRow = {
  id?: string | number | null;
  name?: string | null;
  slug?: string | null;
  description?: string | null;
  long_description?: string | null;
  icon?: string | null;
  accent_color?: string | null;
  image_url?: string | null;
  is_active?: boolean | null;
  sort_order?: number | null;
};

type PhotoImageRow = {
  id?: string | number | null;
  category_id?: string | number | null;
  image_url?: string | null;
  title?: string | null;
  description?: string | null;
  is_active?: boolean | null;
  sort_order?: number | null;
};

type PhotoAlbumRow = {
  id?: string | number | null;
  category_id?: string | number | null;
  title?: string | null;
  slug?: string | null;
  description?: string | null;
  cover_image_url?: string | null;
  is_active?: boolean | null;
  sort_order?: number | null;
  created_at?: string | null;
};

type PhotoItemRow = {
  id?: string | number | null;
  category_id?: string | number | null;
  album_id?: string | number | null;
  image_url?: string | null;
  title?: string | null;
  description?: string | null;
  is_active?: boolean | null;
  sort_order?: number | null;
  created_at?: string | null;
};

export const defaultPhotoCategories: PhotoCategory[] = [
  {
    id: "sport",
    name: "Sport",
    slug: "sport",
    description: "Akce, pohyb, emoce a soustredeni v jednom zaberu.",
    long_description: "Sportovni foceni plne energie, detailu, vykonu a okamziku, ktere se neopakuji.",
    icon: "Zap",
    accent_color: "#5eead4",
    image_url: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80",
    is_active: true,
    sort_order: 10,
  },
  {
    id: "svatby",
    name: "Svatby",
    slug: "svatby",
    description: "Prirozene emoce, detaily a atmosfera svatebniho dne.",
    long_description: "Svatby zachycene nenapadne a citlive, aby zustal pribeh dne opravdovy.",
    icon: "Heart",
    accent_color: "#f9a8d4",
    image_url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80",
    is_active: true,
    sort_order: 20,
  },
  {
    id: "spolecenske-akce",
    name: "Spolecenske akce",
    slug: "spolecenske-akce",
    description: "Lide, svetlo a atmosfera udalosti.",
    long_description: "Reportazni fotografie z akci, ktere zachyti hosty, prostor i naladu vecera.",
    icon: "Sparkles",
    accent_color: "#facc15",
    image_url: "https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=1200&q=80",
    is_active: true,
    sort_order: 30,
  },
  {
    id: "rodiny",
    name: "Rodiny",
    slug: "rodiny",
    description: "Pohoda, smich a prirozene rodinne chvile.",
    long_description: "Rodinne foceni postavene na klidu, hre, blizkosti a okamzicich bez nuceneho pozovani.",
    icon: "Smile",
    accent_color: "#38bdf8",
    image_url: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1200&q=80",
    is_active: true,
    sort_order: 40,
  },
  {
    id: "portrety",
    name: "Portrety",
    slug: "portrety",
    description: "Svetlo, vyraz a osobnost cloveka.",
    long_description: "Portretni fotografie pro osobni prezentaci, socialni site i vzpominky.",
    icon: "User",
    accent_color: "#c4b5fd",
    image_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1200&q=80",
    is_active: true,
    sort_order: 50,
  },
  {
    id: "fitness-bodybuilding",
    name: "Fitness & Bodybuilding",
    slug: "fitness-bodybuilding",
    description: "Forma, kontrast, sila a detail postavy.",
    long_description: "Fitness a bodybuilding foceni s durazem na svetlo, strukturu, vykon a charakter.",
    icon: "Dumbbell",
    accent_color: "#fb7185",
    image_url: "https://images.unsplash.com/photo-1571019613914-85f342c6a11e?auto=format&fit=crop&w=1200&q=80",
    is_active: true,
    sort_order: 60,
  },
  {
    id: "krajina",
    name: "Krajina",
    slug: "krajina",
    description: "Svetlo, prostor, priroda a klid.",
    long_description: "Krajinarina pro momenty, kdy priroda sama kresli scenu.",
    icon: "Mountain",
    accent_color: "#86efac",
    image_url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    is_active: true,
    sort_order: 70,
  },
  {
    id: "eventy",
    name: "Eventy",
    slug: "eventy",
    description: "Firemni i verejne udalosti s jasnym pribehem.",
    long_description: "Eventove foceni zachycuje prubeh, hosty, detaily i vystupy tak, aby akce zustala ziva.",
    icon: "Calendar",
    accent_color: "#60a5fa",
    image_url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80",
    is_active: true,
    sort_order: 80,
  },
];

export async function getPhotoCategories(options: { activeOnly?: boolean } = {}) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return filterCategories(defaultPhotoCategories, options.activeOnly);
  }

  let query = supabase
    .from("photo_categories")
    .select("id, name, slug, description, long_description, icon, accent_color, image_url, is_active, sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (options.activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error || !data) {
    return filterCategories(defaultPhotoCategories, options.activeOnly);
  }

  const categories = (data as PhotoCategoryRow[])
    .map(mapPhotoCategoryRow)
    .filter((category): category is PhotoCategory => Boolean(category));

  return categories.length > 0 ? categories : filterCategories(defaultPhotoCategories, options.activeOnly);
}

export async function getPhotoImages(options: { activeOnly?: boolean } = {}) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  let query = supabase
    .from("photo_images")
    .select("id, category_id, image_url, title, description, is_active, sort_order")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (options.activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error || !data) {
    return getStoragePhotoImages();
  }

  return (data as PhotoImageRow[])
    .map(mapPhotoImageRow)
    .filter((image): image is PhotoImage => Boolean(image));
}

export async function getPhotoAlbums(options: { activeOnly?: boolean } = {}) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  let query = supabase
    .from("photo_albums")
    .select("id, category_id, title, slug, description, cover_image_url, is_active, sort_order, created_at")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (options.activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error || !data) {
    return getLegacyPhotoAlbums();
  }

  const albums = (data as PhotoAlbumRow[])
    .map(mapPhotoAlbumRow)
    .filter((album): album is PhotoAlbum => Boolean(album));

  return albums.length > 0 ? albums : getLegacyPhotoAlbums();
}

export async function getPhotoItems(options: { activeOnly?: boolean } = {}) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  let query = supabase
    .from("photo_items")
    .select("id, category_id, album_id, image_url, title, description, is_active, sort_order, created_at")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (options.activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error || !data) {
    return getLegacyPhotoItems();
  }

  const items = (data as PhotoItemRow[])
    .map(mapPhotoItemRow)
    .filter((item): item is PhotoItem => Boolean(item));

  return items.length > 0 ? items : getLegacyPhotoItems();
}

async function getLegacyPhotoAlbums() {
  const [categories, images] = await Promise.all([
    getPhotoCategories({ activeOnly: true }),
    getPhotoImages({ activeOnly: true }),
  ]);
  const albumGroups = groupLegacyImagesByAlbum(images);

  return Array.from(albumGroups.values()).map((categoryImages) => {
    const firstImage = categoryImages[0];
    const category = categories.find((item) => item.id === firstImage?.category_id);
    const title = legacyAlbumTitle(firstImage);

    return {
      id: legacyAlbumId(firstImage?.category_id ?? "", title),
      category_id: firstImage?.category_id ?? "",
      title,
      slug: slugify(title),
      description: firstImage?.description || category?.description || "",
      cover_image_url: firstImage?.image_url || category?.image_url || "",
      is_active: true,
      sort_order: firstImage?.sort_order ?? category?.sort_order ?? 0,
      created_at: "",
    } satisfies PhotoAlbum;
  });
}

async function getLegacyPhotoItems() {
  const images = await getPhotoImages({ activeOnly: true });

  return images.map((image) => ({
    id: image.id,
    category_id: image.category_id,
    album_id: legacyAlbumId(image.category_id, legacyAlbumTitle(image)),
    image_url: image.image_url,
    title: image.title,
    description: image.description,
    is_active: image.is_active,
    sort_order: image.sort_order,
    created_at: "",
  }) satisfies PhotoItem);
}

function groupLegacyImagesByAlbum(images: PhotoImage[]) {
  return images.reduce((groups, image) => {
    const key = legacyAlbumId(image.category_id, legacyAlbumTitle(image));
    const current = groups.get(key) ?? [];
    current.push(image);
    groups.set(key, current);
    return groups;
  }, new Map<string, PhotoImage[]>());
}

function legacyAlbumTitle(image?: PhotoImage) {
  return image?.title?.trim() || "Bez alba";
}

function legacyAlbumId(categoryId: string, title: string) {
  return `legacy-${categoryId}-${slugify(title)}`;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "bez-alba";
}

async function getStoragePhotoImages() {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  const categories = await getPhotoCategories();
  const images = await Promise.all(
    categories.map(async (category) => {
      const { data, error } = await supabase.storage
        .from("admin-images")
        .list(`photo-gallery/${category.id}`, {
          limit: 100,
          sortBy: { column: "name", order: "asc" },
        });

      if (error || !data) {
        return [];
      }

      return data
        .filter((item) => item.name && !item.name.endsWith("/"))
        .map((item, index) => {
          const path = `photo-gallery/${category.id}/${item.name}`;
          const { data: publicUrl } = supabase.storage.from("admin-images").getPublicUrl(path);

          return {
            id: `${category.id}-${item.name}`,
            category_id: category.id,
            image_url: publicUrl.publicUrl,
            title: category.name,
            description: "",
            is_active: true,
            sort_order: index,
          } satisfies PhotoImage;
        });
    }),
  );

  return images.flat();
}

function filterCategories(categories: PhotoCategory[], activeOnly?: boolean) {
  return categories
    .filter((category) => !activeOnly || category.is_active)
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
}

function mapPhotoCategoryRow(row: PhotoCategoryRow): PhotoCategory | undefined {
  const id = String(row.id ?? "").trim();
  const name = String(row.name ?? "").trim();
  const slug = String(row.slug ?? "").trim();

  if (!id || !name || !slug) {
    return undefined;
  }

  return {
    id,
    name,
    slug,
    description: String(row.description ?? "").trim(),
    long_description: String(row.long_description ?? "").trim(),
    icon: String(row.icon ?? "Camera").trim() || "Camera",
    accent_color: String(row.accent_color ?? "#5eead4").trim() || "#5eead4",
    image_url: String(row.image_url ?? "").trim(),
    is_active: row.is_active !== false,
    sort_order: Number(row.sort_order ?? 0),
  };
}

function mapPhotoImageRow(row: PhotoImageRow): PhotoImage | undefined {
  const id = String(row.id ?? "").trim();
  const categoryId = String(row.category_id ?? "").trim();
  const imageUrl = String(row.image_url ?? "").trim();

  if (!id || !categoryId || !imageUrl) {
    return undefined;
  }

  return {
    id,
    category_id: categoryId,
    image_url: imageUrl,
    title: String(row.title ?? "").trim(),
    description: String(row.description ?? "").trim(),
    is_active: row.is_active !== false,
    sort_order: Number(row.sort_order ?? 0),
  };
}

function mapPhotoAlbumRow(row: PhotoAlbumRow): PhotoAlbum | undefined {
  const id = String(row.id ?? "").trim();
  const categoryId = String(row.category_id ?? "").trim();
  const title = String(row.title ?? "").trim();

  if (!id || !categoryId || !title) {
    return undefined;
  }

  return {
    id,
    category_id: categoryId,
    title,
    slug: String(row.slug ?? "").trim(),
    description: String(row.description ?? "").trim(),
    cover_image_url: String(row.cover_image_url ?? "").trim(),
    is_active: row.is_active !== false,
    sort_order: Number(row.sort_order ?? 0),
    created_at: String(row.created_at ?? ""),
  };
}

function mapPhotoItemRow(row: PhotoItemRow): PhotoItem | undefined {
  const id = String(row.id ?? "").trim();
  const categoryId = String(row.category_id ?? "").trim();
  const albumId = String(row.album_id ?? "").trim();
  const imageUrl = String(row.image_url ?? "").trim();

  if (!id || !categoryId || !imageUrl) {
    return undefined;
  }

  return {
    id,
    category_id: categoryId,
    album_id: albumId,
    image_url: imageUrl,
    title: String(row.title ?? "").trim(),
    description: String(row.description ?? "").trim(),
    is_active: row.is_active !== false,
    sort_order: Number(row.sort_order ?? 0),
    created_at: String(row.created_at ?? ""),
  };
}
