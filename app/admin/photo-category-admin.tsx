"use client";

import Image from "next/image";
import { FormEvent, useRef, useState } from "react";
import type { PhotoCategory, PhotoImage } from "@/lib/photo-categories";
import {
  deletePhotoCategory,
  deletePhotoImage,
  savePhotoCategory,
  savePhotoImage,
  uploadPhotoImages,
} from "./actions";
import { AdminArea, AdminField } from "./admin-forms";

type PhotoCategoryAdminProps = {
  categories: PhotoCategory[];
  images: PhotoImage[];
};

export function PhotoCategoryAdmin({ categories, images }: PhotoCategoryAdminProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingImageId, setEditingImageId] = useState<string | null>(null);

  return (
    <section
      id="fotografie-kategorie"
      className="mb-8 rounded-[2rem] border border-white/12 bg-zinc-950/78 p-6 shadow-2xl shadow-black/40 backdrop-blur-2xl"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-teal-200">
            fotografie
          </p>
          <h2 className="mt-2 text-3xl font-semibold">Fotografie - kategorie</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            Kategorie pro verejnou stranku /fotografie. Aktivni kategorie se zobrazi v orbitalnim vyberu.
          </p>
        </div>
        <span className="rounded-full bg-white/8 px-3 py-1 text-sm text-zinc-300">
          {categories.length} kategorii
        </span>
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
        <h3 className="text-xl font-semibold text-white">Pridat kategorii</h3>
        <PhotoCategoryForm actionLabel="Pridat kategorii" />
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
        <h3 className="text-xl font-semibold text-white">Nahrat fotky do galerie</h3>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Vyber kategorii a oznac vice fotek najednou. Fotky se ulozi do Supabase Storage a do galerie.
        </p>
        <PhotoUploadForm categories={categories} />
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
        {categories.length === 0 ? (
          <p className="p-4 text-sm text-zinc-400">Zatim nejsou zadne fotograficke kategorie.</p>
        ) : null}
        {categories.map((category) => {
          const isEditing = editingId === category.id;

          return (
            <div key={category.id} className="border-b border-white/10 last:border-b-0">
              <div className="grid gap-4 bg-white/5 p-4 lg:grid-cols-[88px_1fr_auto] lg:items-center">
                <div className="relative h-22 w-22 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                  {category.image_url ? (
                    <Image
                      src={category.image_url}
                      alt={category.name}
                      fill
                      sizes="88px"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-xs text-zinc-500">foto</div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-xs uppercase tracking-[0.18em] text-zinc-500">
                    {category.slug} | order {category.sort_order} | {category.is_active ? "aktivni" : "vypnuto"}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-semibold text-white">{category.name}</h3>
                    <span
                      className="rounded-full px-2 py-1 text-xs font-bold text-zinc-950"
                      style={{ backgroundColor: category.accent_color }}
                    >
                      {category.icon}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-zinc-400">{category.description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingId(isEditing ? null : category.id)}
                    className="h-9 rounded-full bg-teal-200 px-4 text-sm font-bold text-zinc-950"
                  >
                    {isEditing ? "Zavrit" : "Upravit"}
                  </button>
                  <form action={deletePhotoCategory}>
                    <input type="hidden" name="id" value={category.id} />
                    <button className="h-9 rounded-full bg-pink-300 px-4 text-sm font-bold text-pink-950">
                      Smazat
                    </button>
                  </form>
                </div>
              </div>
              {isEditing ? (
                <div className="bg-black/20 p-4">
                  <PhotoCategoryForm category={category} actionLabel="Ulozit kategorii" />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white/5 p-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-zinc-500">
              galerie
            </p>
            <h3 className="text-xl font-semibold text-white">Fotky v kategoriich</h3>
          </div>
          <span className="rounded-full bg-white/8 px-3 py-1 text-sm text-zinc-300">
            {images.length} fotek
          </span>
        </div>
        {images.length === 0 ? (
          <p className="p-4 text-sm text-zinc-400">Zatim nejsou nahrane zadne fotky.</p>
        ) : null}
        <div className="grid gap-px bg-white/10 md:grid-cols-2 xl:grid-cols-3">
          {images.map((image) => {
            const category = categories.find((item) => item.id === image.category_id);
            const isEditing = editingImageId === image.id;

            return (
              <div key={image.id} className="bg-zinc-950 p-4">
                <div className="relative h-44 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                  <Image
                    src={image.image_url}
                    alt={image.title || category?.name || "Fotka"}
                    fill
                    sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <p className="mt-3 font-mono text-xs uppercase tracking-[0.18em] text-zinc-500">
                  {category?.name ?? "Bez kategorie"} | order {image.sort_order} |{" "}
                  {image.is_active ? "aktivni" : "vypnuto"}
                </p>
                <h4 className="mt-1 truncate text-lg font-semibold text-white">
                  {image.title || "Bez nazvu"}
                </h4>
                {image.description ? (
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-zinc-400">
                    {image.description}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingImageId(isEditing ? null : image.id)}
                    className="h-9 rounded-full bg-teal-200 px-4 text-sm font-bold text-zinc-950"
                  >
                    {isEditing ? "Zavrit" : "Upravit"}
                  </button>
                  <form action={deletePhotoImage}>
                    <input type="hidden" name="id" value={image.id} />
                    <button className="h-9 rounded-full bg-pink-300 px-4 text-sm font-bold text-pink-950">
                      Smazat
                    </button>
                  </form>
                </div>
                {isEditing ? <PhotoImageForm image={image} /> : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PhotoUploadForm({ categories }: { categories: PhotoCategory[] }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const preparedSubmitRef = useRef(false);
  const [resizeMessage, setResizeMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (preparedSubmitRef.current) {
      preparedSubmitRef.current = false;
      return;
    }

    const form = event.currentTarget;
    const input = fileInputRef.current;
    const files = Array.from(input?.files ?? []);

    if (files.length === 0) {
      return;
    }

    event.preventDefault();
    setResizeMessage("Zmensuji fotky pred nahranim...");

    try {
      const resizedFiles = await Promise.all(files.map(safeResizeImageForUpload));
      const transfer = typeof DataTransfer === "undefined" ? null : new DataTransfer();

      if (transfer && input) {
        resizedFiles.forEach((file) => transfer.items.add(file));
        input.files = transfer.files;
      }

      preparedSubmitRef.current = true;
      setResizeMessage("Hotovo, nahravam do Supabase...");
      form.requestSubmit();
    } catch {
      preparedSubmitRef.current = true;
      setResizeMessage("Zmenseni se nepovedlo, nahravam puvodni fotky...");
      form.requestSubmit();
    }
  }

  return (
    <form
      action={uploadPhotoImages}
      onSubmit={(event) => void handleSubmit(event)}
      className="mt-5 grid gap-4 lg:grid-cols-2"
    >
      <label className="grid gap-2">
        <span className="font-mono text-xs uppercase tracking-[0.18em] text-violet-200">
          Kategorie
        </span>
        <select name="category_id" className="admin-input" defaultValue={categories[0]?.id ?? ""}>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <AdminField label="Pocatecni poradi" name="sort_order" defaultValue="0" />
      <AdminField label="Spolecny nazev" name="title" defaultValue="" />
      <AdminField label="Spolecny popis" name="description" defaultValue="" />
      <label className="grid gap-2 lg:col-span-2">
        <span className="font-mono text-xs uppercase tracking-[0.18em] text-violet-200">
          Fotky
        </span>
        <input
          ref={fileInputRef}
          name="image_files"
          type="file"
          accept="image/*"
          multiple
          className="admin-input file:mr-4 file:rounded-full file:border-0 file:bg-teal-200 file:px-4 file:py-2 file:text-sm file:font-bold file:text-zinc-950"
        />
        <span className="text-xs font-semibold text-zinc-500">
          Fotky se pred uploadem automaticky zmensi na Full HD. Najednou nahraj maximalne zhruba 75 MB puvodnich fotek.
        </span>
        {resizeMessage ? (
          <span className="rounded-2xl border border-teal-200/20 bg-teal-200/10 px-3 py-2 text-xs font-semibold text-teal-50">
            {resizeMessage}
          </span>
        ) : null}
      </label>
      <div className="lg:col-span-2">
        <button className="h-12 rounded-full bg-teal-200 px-6 text-sm font-bold text-zinc-950 transition-colors hover:bg-white">
          Nahrat vybrane fotky
        </button>
      </div>
    </form>
  );
}

async function safeResizeImageForUpload(file: File) {
  try {
    return await resizeImageForUpload(file);
  } catch {
    return file;
  }
}

async function resizeImageForUpload(file: File) {
  const supportedRasterTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];

  if (!supportedRasterTypes.includes(file.type)) {
    return file;
  }

  const { image, url } = await loadImage(file);
  const maxSize = 1920;
  const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.round(image.naturalWidth * scale);
  const height = Math.round(image.naturalHeight * scale);

  if (scale === 1 && file.type === "image/jpeg" && file.size < 900 * 1024) {
    URL.revokeObjectURL(url);
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) {
    URL.revokeObjectURL(url);
    return file;
  }

  context.drawImage(image, 0, 0, width, height);
  URL.revokeObjectURL(url);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.86);
  });

  if (!blob) {
    return file;
  }

  return new File([blob], jpegFileName(file.name), {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

function loadImage(file: File) {
  return new Promise<{ image: HTMLImageElement; url: string }>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => resolve({ image, url });
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image could not be loaded."));
    };
    image.src = url;
  });
}

function jpegFileName(name: string) {
  const cleanName = name.replace(/\.[^.]+$/, "");
  return `${cleanName || "fotka"}.jpg`;
}

function PhotoImageForm({ image }: { image: PhotoImage }) {
  return (
    <form action={savePhotoImage} className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
      <input type="hidden" name="id" value={image.id} />
      <AdminField label="Nazev" name="title" defaultValue={image.title} />
      <AdminField label="Poradi" name="sort_order" defaultValue={String(image.sort_order)} />
      <AdminArea label="Popis" name="description" defaultValue={image.description} />
      <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
        <input
          name="is_active"
          type="checkbox"
          defaultChecked={image.is_active}
          className="size-5 accent-teal-200"
        />
        <span className="text-sm font-semibold text-zinc-200">Aktivni fotka</span>
      </label>
      <button className="h-10 rounded-full bg-teal-200 px-5 text-sm font-bold text-zinc-950 transition-colors hover:bg-white">
        Ulozit fotku
      </button>
    </form>
  );
}

function PhotoCategoryForm({
  category,
  actionLabel,
}: {
  category?: PhotoCategory;
  actionLabel: string;
}) {
  return (
    <form action={savePhotoCategory} className="mt-5 grid gap-4 lg:grid-cols-2">
      <input type="hidden" name="id" value={category?.id ?? ""} />
      <AdminField label="Nazev" name="name" defaultValue={category?.name ?? ""} />
      <AdminField label="Slug" name="slug" defaultValue={category?.slug ?? ""} />
      <AdminField label="Ikonka" name="icon" defaultValue={category?.icon ?? "Camera"} />
      <AdminField label="Barva / accent color" name="accent_color" defaultValue={category?.accent_color ?? "#5eead4"} />
      <AdminField label="Poradi" name="sort_order" defaultValue={String(category?.sort_order ?? 0)} />
      <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
        <input
          name="is_active"
          type="checkbox"
          defaultChecked={category?.is_active ?? true}
          className="size-5 accent-teal-200"
        />
        <span className="text-sm font-semibold text-zinc-200">Aktivni kategorie</span>
      </label>
      <AdminArea label="Kratky popis" name="description" defaultValue={category?.description ?? ""} />
      <AdminArea label="Delsi popis" name="long_description" defaultValue={category?.long_description ?? ""} />
      <ImageUploadField currentUrl={category?.image_url ?? ""} />
      <div className="lg:col-span-2">
        <button className="h-12 rounded-full bg-teal-200 px-6 text-sm font-bold text-zinc-950 transition-colors hover:bg-white">
          {actionLabel}
        </button>
      </div>
    </form>
  );
}

function ImageUploadField({ currentUrl }: { currentUrl: string }) {
  return (
    <label className="grid gap-2 lg:col-span-2">
      <span className="font-mono text-xs uppercase tracking-[0.18em] text-violet-200">
        Hero obrazek / nahledovy obrazek
      </span>
      <input type="hidden" name="existing_image_url" value={currentUrl} />
      <input
        name="image_file"
        type="file"
        accept="image/*"
        className="admin-input file:mr-4 file:rounded-full file:border-0 file:bg-teal-200 file:px-4 file:py-2 file:text-sm file:font-bold file:text-zinc-950"
      />
      {currentUrl ? (
        <span className="truncate text-xs font-semibold text-zinc-400">
          Aktualni obrazek: {currentUrl}
        </span>
      ) : null}
    </label>
  );
}
