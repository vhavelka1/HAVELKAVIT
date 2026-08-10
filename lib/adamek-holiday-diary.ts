import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/site-settings";

export type HolidayDiaryEntry = {
  id: string;
  entryDate: string;
  title: string;
  description: string;
  imageUrl: string;
  storagePath: string;
  imageWidth: number | null;
  imageHeight: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type HolidayDiaryEntryRow = {
  id?: string | number | null;
  entry_date?: string | null;
  title?: string | null;
  description?: string | null;
  image_url?: string | null;
  storage_path?: string | null;
  image_width?: number | null;
  image_height?: number | null;
  is_active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type HolidayDiaryLoadResult = {
  entries: HolidayDiaryEntry[];
  error?: string;
};

export const holidayDiaryBucket = "adamek-holiday-diary";

export async function getActiveHolidayDiaryEntries(): Promise<HolidayDiaryLoadResult> {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return { entries: [], error: "Supabase není nastavená." };
  }

  const { data, error } = await supabase
    .from("adamek_holiday_entries")
    .select("*")
    .eq("is_active", true)
    .order("entry_date", { ascending: true });

  if (error || !data) {
    return {
      entries: [],
      error: "Prázdninový deník se teď nepodařilo načíst.",
    };
  }

  return { entries: mapHolidayDiaryRows(data as HolidayDiaryEntryRow[]) };
}

export async function getAllHolidayDiaryEntries(): Promise<HolidayDiaryLoadResult> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return { entries: [], error: "Ukládání potřebuje SUPABASE_SERVICE_ROLE_KEY." };
  }

  const { data, error } = await supabase
    .from("adamek_holiday_entries")
    .select("*")
    .order("entry_date", { ascending: true });

  if (error || !data) {
    return {
      entries: [],
      error: error?.message ?? "Prázdninový deník se nepodařilo načíst.",
    };
  }

  return { entries: mapHolidayDiaryRows(data as HolidayDiaryEntryRow[]) };
}

export function isHolidayDiaryDate(value: string) {
  const date = parseHolidayDate(value);
  return Boolean(date && (date.getUTCMonth() === 6 || date.getUTCMonth() === 7));
}

export function holidayDiaryYears(entries: HolidayDiaryEntry[]) {
  const years = new Set<number>();
  const currentYear = new Date().getFullYear();
  years.add(currentYear);

  for (const entry of entries) {
    const year = Number(entry.entryDate.slice(0, 4));
    if (Number.isFinite(year)) {
      years.add(year);
    }
  }

  return Array.from(years).sort((a, b) => b - a);
}

export function formatCzechDate(value: string) {
  const date = parseHolidayDate(value);

  if (!date) {
    return value;
  }

  return new Intl.DateTimeFormat("cs-CZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function mapHolidayDiaryRows(rows: HolidayDiaryEntryRow[]) {
  return rows
    .map(mapHolidayDiaryRow)
    .filter((entry): entry is HolidayDiaryEntry => Boolean(entry));
}

function mapHolidayDiaryRow(row: HolidayDiaryEntryRow): HolidayDiaryEntry | undefined {
  const id = String(row.id ?? "").trim();
  const entryDate = String(row.entry_date ?? "").trim();
  const title = String(row.title ?? "").trim();

  if (!id || !entryDate || !title) {
    return undefined;
  }

  return {
    id,
    entryDate,
    title,
    description: String(row.description ?? "").trim() || title,
    imageUrl: String(row.image_url ?? "").trim(),
    storagePath: String(row.storage_path ?? "").trim(),
    imageWidth: row.image_width ?? null,
    imageHeight: row.image_height ?? null,
    isActive: row.is_active ?? true,
    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at ?? "",
  };
}

function parseHolidayDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}
