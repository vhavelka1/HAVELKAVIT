import { createClient } from "@supabase/supabase-js";

export type SiteSettings = {
  id: string;
  brand_label: string;
  eyebrow_cs: string;
  eyebrow_en: string;
  headline_cs: string;
  headline_en: string;
  intro_cs: string;
  intro_en: string;
  login_label: string;
};

export const defaultSiteSettings: SiteSettings = {
  id: "main",
  brand_label: "Havelka Vitek",
  eyebrow_cs: "osobni mapa",
  eyebrow_en: "personal map",
  headline_cs: "Veci, ktere me drzi v pohybu.",
  headline_en: "Things that keep me moving.",
  intro_cs: "Interaktivni sit zajmu, prace a remesel. Vyber uzel a otevri detail.",
  intro_en: "An interactive network of interests, work, and craft. Pick a node to open the detail.",
  login_label: "Login",
};

export function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
}

export function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return defaultSiteSettings;
  }

  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", "main")
    .maybeSingle();

  if (error || !data) {
    return defaultSiteSettings;
  }

  return {
    ...defaultSiteSettings,
    ...data,
    id: "main",
  };
}
