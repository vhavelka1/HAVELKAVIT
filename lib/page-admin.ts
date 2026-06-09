import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { getSupabaseAdminClient } from "@/lib/site-settings";

export type PageAdminId = "emicka" | "adamek";

export type PageAdminSetting = {
  page_id: PageAdminId;
  label: string;
  has_password: boolean;
  updated_at?: string | null;
};

type PageAdminRow = {
  page_id: PageAdminId;
  label?: string | null;
  password_hash?: string | null;
  password_salt?: string | null;
  updated_at?: string | null;
};

export const pageAdminDefaults: Array<{ page_id: PageAdminId; label: string }> = [
  { page_id: "emicka", label: "Emička" },
  { page_id: "adamek", label: "Adámek" },
];

export async function getPageAdminSettings(): Promise<PageAdminSetting[]> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return pageAdminDefaults.map((item) => ({ ...item, has_password: false }));
  }

  const { data, error } = await supabase
    .from("page_admin_passwords")
    .select("page_id, label, password_hash, updated_at")
    .order("page_id", { ascending: true });

  if (error || !data) {
    return pageAdminDefaults.map((item) => ({ ...item, has_password: false }));
  }

  const rows = data as PageAdminRow[];

  return pageAdminDefaults.map((item) => {
    const row = rows.find((candidate) => candidate.page_id === item.page_id);

    return {
      page_id: item.page_id,
      label: row?.label || item.label,
      has_password: Boolean(row?.password_hash),
      updated_at: row?.updated_at ?? null,
    };
  });
}

export async function savePageAdminPassword(pageId: PageAdminId, password: string) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return { ok: false, error: "supabase-admin-key" };
  }

  const config = pageAdminDefaults.find((item) => item.page_id === pageId);
  const trimmedPassword = password.trim();

  if (!config || !trimmedPassword) {
    return { ok: false, error: "page-password" };
  }

  const salt = randomBytes(16).toString("hex");
  const passwordHash = hashPassword(trimmedPassword, salt);
  const { error } = await supabase.from("page_admin_passwords").upsert(
    {
      page_id: pageId,
      label: config.label,
      password_hash: passwordHash,
      password_salt: salt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "page_id" },
  );

  return error ? { ok: false, error: "page-password" } : { ok: true };
}

export async function verifyPageAdminPassword(pageId: PageAdminId, password: string) {
  const supabase = getSupabaseAdminClient();

  if (!supabase || !password.trim()) {
    return false;
  }

  const { data, error } = await supabase
    .from("page_admin_passwords")
    .select("page_id, password_hash, password_salt")
    .eq("page_id", pageId)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  const row = data as PageAdminRow;

  if (!row.password_hash || !row.password_salt) {
    return false;
  }

  const expected = Buffer.from(row.password_hash, "hex");
  const actual = Buffer.from(hashPassword(password.trim(), row.password_salt), "hex");

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function isPageAdminAuthenticated(pageId: PageAdminId) {
  const cookieStore = await cookies();
  const token = cookieStore.get(pageAdminCookieName(pageId))?.value ?? "";

  return token === signPageAdminCookie(pageId);
}

export async function setPageAdminSession(pageId: PageAdminId) {
  const cookieStore = await cookies();
  cookieStore.set(pageAdminCookieName(pageId), signPageAdminCookie(pageId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: `/${pageId}/admin`,
    maxAge: 60 * 60 * 8,
  });
}

export async function clearPageAdminSession(pageId: PageAdminId) {
  const cookieStore = await cookies();
  cookieStore.delete(pageAdminCookieName(pageId));
}

function hashPassword(password: string, salt: string) {
  return scryptSync(password, salt, 64).toString("hex");
}

function pageAdminCookieName(pageId: PageAdminId) {
  return `havelkavit-${pageId}-admin`;
}

function signPageAdminCookie(pageId: PageAdminId) {
  return createHmac("sha256", cookieSecret()).update(`page-admin:${pageId}`).digest("hex");
}

function cookieSecret() {
  return (
    process.env.PAGE_ADMIN_COOKIE_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "local-page-admin-secret"
  );
}
