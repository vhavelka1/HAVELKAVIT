"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  adminCookieName,
  adminSessionValue,
  isAdminAuthenticated,
  isValidAdminLogin,
} from "@/lib/admin-auth";
import { defaultSiteSettings, getSupabaseAdminClient } from "@/lib/site-settings";

const realAdminPath = "/login/fake";

export async function loginAdmin(formData: FormData) {
  const username = String(formData.get("username") || "");
  const password = String(formData.get("password") || "");

  if (!isValidAdminLogin(username, password)) {
    redirect(`${realAdminPath}?error=login`);
  }

  const cookieStore = await cookies();
  cookieStore.set(adminCookieName, adminSessionValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  redirect(realAdminPath);
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete(adminCookieName);
  redirect(realAdminPath);
}

export async function saveSiteSettings(formData: FormData) {
  await requireAdmin();
  const supabase = requireSupabase();

  const payload = {
    id: "main",
    brand_label: readField(formData, "brand_label", defaultSiteSettings.brand_label),
    eyebrow_cs: readField(formData, "eyebrow_cs", defaultSiteSettings.eyebrow_cs),
    eyebrow_en: readField(formData, "eyebrow_en", defaultSiteSettings.eyebrow_en),
    headline_cs: readField(formData, "headline_cs", defaultSiteSettings.headline_cs),
    headline_en: readField(formData, "headline_en", defaultSiteSettings.headline_en),
    intro_cs: readField(formData, "intro_cs", defaultSiteSettings.intro_cs),
    intro_en: readField(formData, "intro_en", defaultSiteSettings.intro_en),
    login_label: readField(formData, "login_label", defaultSiteSettings.login_label),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("site_settings").upsert(payload, { onConflict: "id" });

  if (error) {
    redirect(`${realAdminPath}?error=save-settings`);
  }

  revalidatePath("/");
  revalidatePath(realAdminPath);
  redirect(`${realAdminPath}?saved=settings`);
}

export async function saveTopic(formData: FormData) {
  await requireAdmin();
  const supabase = requireSupabase();
  const id = String(formData.get("id") || "");
  const payload = {
    slug: readField(formData, "slug", ""),
    title_cs: readField(formData, "title_cs", ""),
    title_en: readField(formData, "title_en", ""),
    description_cs: readField(formData, "description_cs", ""),
    description_en: readField(formData, "description_en", ""),
    image_url: readField(formData, "image_url", ""),
    sort_order: Number(formData.get("sort_order") || 0),
  };

  const result = id
    ? await supabase.from("topics").update(payload).eq("id", id)
    : await supabase.from("topics").insert(payload);

  if (result.error) {
    redirect(`${realAdminPath}?error=save-topic`);
  }

  revalidatePath("/");
  revalidatePath(realAdminPath);
  redirect(`${realAdminPath}?saved=topic`);
}

export async function deleteTopic(formData: FormData) {
  await requireAdmin();
  const supabase = requireSupabase();
  const id = String(formData.get("id") || "");

  if (!id) {
    return;
  }

  const { error } = await supabase.from("topics").delete().eq("id", id);

  if (error) {
    redirect(`${realAdminPath}?error=delete-topic`);
  }

  revalidatePath("/");
  revalidatePath(realAdminPath);
  redirect(`${realAdminPath}?saved=delete-topic`);
}

export async function saveSectionPost(formData: FormData) {
  await requireAdmin();
  const supabase = requireSupabase();
  const id = String(formData.get("id") || "");
  const payload = {
    topic_slug: readField(formData, "topic_slug", ""),
    title: readField(formData, "title", ""),
    body: readField(formData, "body", ""),
    image_url: readField(formData, "image_url", ""),
    sort_order: Number(formData.get("sort_order") || 0),
    updated_at: new Date().toISOString(),
  };

  const result = id
    ? await supabase.from("section_posts").update(payload).eq("id", id)
    : await supabase.from("section_posts").insert(payload);

  if (result.error) {
    redirect(`${realAdminPath}?error=save-post`);
  }

  revalidatePath("/");
  revalidatePath(realAdminPath);
  redirect(`${realAdminPath}?saved=post`);
}

export async function deleteSectionPost(formData: FormData) {
  await requireAdmin();
  const supabase = requireSupabase();
  const id = String(formData.get("id") || "");

  if (!id) {
    return;
  }

  const { error } = await supabase.from("section_posts").delete().eq("id", id);

  if (error) {
    redirect(`${realAdminPath}?error=delete-post`);
  }

  revalidatePath("/");
  revalidatePath(realAdminPath);
  redirect(`${realAdminPath}?saved=delete-post`);
}

async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    redirect(realAdminPath);
  }
}

function requireSupabase() {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    redirect(`${realAdminPath}?error=supabase-admin-key`);
  }

  return supabase;
}

function readField(formData: FormData, key: string, fallback: string) {
  const value = String(formData.get(key) || "").trim();
  return value || fallback;
}
