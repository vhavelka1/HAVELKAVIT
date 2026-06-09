"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isPageAdminAuthenticated } from "@/lib/page-admin";
import { getSupabaseAdminClient } from "@/lib/site-settings";

const adminPath = "/adamek/admin";
const bucketName = "adamek-memory";

export async function saveMemoryTheme(formData: FormData) {
  await requireAdmin();
  const supabase = requireSupabase();
  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim();

  if (!name) {
    redirect(`${adminPath}?error=theme-name`);
  }

  const payload = {
    name,
    updated_at: new Date().toISOString(),
  };
  const result = id
    ? await supabase.from("adamek_memory_themes").update(payload).eq("id", id)
    : await supabase.from("adamek_memory_themes").insert({ ...payload, images: [] });

  if (result.error) {
    redirect(`${adminPath}?error=save-theme`);
  }

  revalidateAdamek();
  redirect(`${adminPath}?saved=theme`);
}

export async function deleteMemoryTheme(formData: FormData) {
  await requireAdmin();
  const supabase = requireSupabase();
  const id = String(formData.get("id") || "").trim();

  if (!id) {
    redirect(adminPath);
  }

  const { error } = await supabase.from("adamek_memory_themes").delete().eq("id", id);

  if (error) {
    redirect(`${adminPath}?error=delete-theme`);
  }

  revalidateAdamek();
  redirect(`${adminPath}?saved=delete-theme`);
}

export async function addThemeImages(formData: FormData) {
  await requireAdmin();
  const supabase = requireSupabase();
  const id = String(formData.get("id") || "").trim();
  const currentImages = readImages(formData);

  if (!id) {
    redirect(`${adminPath}?error=save-image`);
  }

  const uploadedImages = await uploadThemeImages(formData, supabase);
  const images = [...currentImages, ...uploadedImages];
  const { error } = await supabase
    .from("adamek_memory_themes")
    .update({ images, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    redirect(`${adminPath}?error=save-image`);
  }

  revalidateAdamek();
  redirect(`${adminPath}?saved=image`);
}

export async function deleteThemeImage(formData: FormData) {
  await requireAdmin();
  const supabase = requireSupabase();
  const id = String(formData.get("id") || "").trim();
  const imageUrl = String(formData.get("image_url") || "").trim();
  const images = readImages(formData).filter((image) => image !== imageUrl);

  if (!id || !imageUrl) {
    redirect(adminPath);
  }

  const { error } = await supabase
    .from("adamek_memory_themes")
    .update({ images, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    redirect(`${adminPath}?error=delete-image`);
  }

  await removeStorageImage(imageUrl, supabase);
  revalidateAdamek();
  redirect(`${adminPath}?saved=delete-image`);
}

async function requireAdmin() {
  if (!(await isPageAdminAuthenticated("adamek"))) {
    redirect(adminPath);
  }
}

function requireSupabase() {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    redirect(`${adminPath}?error=supabase-admin-key`);
  }

  return supabase;
}

function readImages(formData: FormData) {
  try {
    const parsed = JSON.parse(String(formData.get("images") || "[]"));
    return Array.isArray(parsed)
      ? parsed.map((item) => String(item ?? "").trim()).filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

async function uploadThemeImages(
  formData: FormData,
  supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
) {
  const files = formData
    .getAll("images_file")
    .filter((file): file is File => file instanceof File && file.size > 0);

  if (files.length === 0) {
    return [];
  }

  const bucketReady = await ensureBucket(supabase);

  if (!bucketReady) {
    redirect(`${adminPath}?error=save-image`);
  }

  const publicUrls: string[] = [];

  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      redirect(`${adminPath}?error=save-image`);
    }

    const path = `themes/${Date.now()}-${randomUUID()}${extensionFromFile(file)}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    const { error } = await supabase.storage.from(bucketName).upload(path, bytes, {
      contentType: file.type,
      upsert: false,
    });

    if (error) {
      redirect(`${adminPath}?error=save-image`);
    }

    const { data } = supabase.storage.from(bucketName).getPublicUrl(path);
    publicUrls.push(data.publicUrl);
  }

  return publicUrls;
}

async function ensureBucket(supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>) {
  const { error: getError } = await supabase.storage.getBucket(bucketName);

  if (!getError) {
    return true;
  }

  const { error: createError } = await supabase.storage.createBucket(bucketName, {
    public: true,
    fileSizeLimit: "10MB",
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/svg+xml"],
  });

  return !createError;
}

async function removeStorageImage(
  imageUrl: string,
  supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
) {
  const marker = `/storage/v1/object/public/${bucketName}/`;
  const markerIndex = imageUrl.indexOf(marker);

  if (markerIndex === -1) {
    return;
  }

  const path = decodeURIComponent(imageUrl.slice(markerIndex + marker.length));
  await supabase.storage.from(bucketName).remove([path]);
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
  if (file.type === "image/svg+xml") return ".svg";

  return ".jpg";
}

function revalidateAdamek() {
  revalidatePath("/");
  revalidatePath("/adamek");
  revalidatePath("/adamek/pexeso");
  revalidatePath(adminPath);
}
