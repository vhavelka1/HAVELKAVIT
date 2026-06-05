"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { defaultSiteSettings, getSupabaseAdminClient } from "@/lib/site-settings";
import { getSupabaseAuthServerClient, isAdminAuthenticated } from "@/lib/supabase-auth";

const realAdminPath = "/login/fake";
const adminImagesBucket = "admin-images";

export async function loginAdmin(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const supabase = await getSupabaseAuthServerClient();

  if (!supabase || !email || !password) {
    redirect(`${realAdminPath}?error=login`);
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`${realAdminPath}?error=login`);
  }

  redirect(realAdminPath);
}

export async function logoutAdmin() {
  const supabase = await getSupabaseAuthServerClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

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
  const imageUrl = await uploadAdminImage(formData, "topics", supabase);
  const payload = {
    slug: readField(formData, "slug", ""),
    title_cs: readField(formData, "title_cs", ""),
    title_en: readField(formData, "title_en", ""),
    description_cs: readField(formData, "description_cs", ""),
    description_en: readField(formData, "description_en", ""),
    image_url: imageUrl,
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
  const imageUrl = await uploadAdminImage(formData, "section-posts", supabase);
  const payload = {
    topic_slug: readField(formData, "topic_slug", ""),
    title: readField(formData, "title", ""),
    body: readField(formData, "body", ""),
    image_url: imageUrl,
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

async function uploadAdminImage(
  formData: FormData,
  folder: string,
  supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
) {
  const existingImageUrl = readField(formData, "existing_image_url", "");
  const file = formData.get("image_file");

  if (!(file instanceof File) || file.size === 0) {
    return existingImageUrl;
  }

  if (!file.type.startsWith("image/")) {
    redirect(`${realAdminPath}?error=upload-image`);
  }

  const bucketReady = await ensureAdminImagesBucket(supabase);

  if (!bucketReady) {
    redirect(`${realAdminPath}?error=upload-image`);
  }

  const extension = extensionFromFile(file);
  const path = `${folder}/${Date.now()}-${randomUUID()}${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage.from(adminImagesBucket).upload(path, bytes, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    redirect(`${realAdminPath}?error=upload-image`);
  }

  const { data } = supabase.storage.from(adminImagesBucket).getPublicUrl(path);

  return data.publicUrl;
}

async function ensureAdminImagesBucket(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
) {
  const { error: getError } = await supabase.storage.getBucket(adminImagesBucket);

  if (!getError) {
    return true;
  }

  const { error: createError } = await supabase.storage.createBucket(adminImagesBucket, {
    public: true,
    fileSizeLimit: "10MB",
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"],
  });

  return !createError;
}

function extensionFromFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension && /^[a-z0-9]+$/.test(extension)) {
    return `.${extension}`;
  }

  if (file.type === "image/png") return ".png";
  if (file.type === "image/webp") return ".webp";
  if (file.type === "image/gif") return ".gif";
  if (file.type === "image/avif") return ".avif";

  return ".jpg";
}
