"use client";

import Image from "next/image";
import { FormEvent, useMemo, useRef, useState } from "react";
import type { PhotoCategory, PhotoImage } from "@/lib/photo-categories";
import {
  deletePhotoAlbum,
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

type AdminPhotoAlbum = {
  key: string;
  rawTitle: string;
  title: string;
  description: string;
  category: PhotoCategory;
  images: PhotoImage[];
  sortOrder: number;
};

export function PhotoCategoryAdmin({ categories, images }: PhotoCategoryAdminProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedAlbumKey, setSelectedAlbumKey] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState(false);
  const [editingImageId, setEditingImageId] = useState<string | null>(null);

  const albums = useMemo(() => groupAlbums(categories, images), [categories, images]);
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId) ?? null;
  const categoryAlbums = selectedCategory
    ? albums.filter((album) => album.category.id === selectedCategory.id)
    : [];
  const selectedAlbum = categoryAlbums.find((album) => album.key === selectedAlbumKey) ?? null;

  function openCategory(categoryId: string) {
    setSelectedCategoryId(categoryId);
    setSelectedAlbumKey(null);
    setEditingCategory(false);
    setEditingImageId(null);
  }

  function backToCategories() {
    setSelectedCategoryId(null);
    setSelectedAlbumKey(null);
    setEditingCategory(false);
    setEditingImageId(null);
  }

  function backToAlbums() {
    setSelectedAlbumKey(null);
    setEditingImageId(null);
  }

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
            Sprava je rozdelena na kategorie, alba a fotky, aby se v galerii dalo rychle zorientovat.
          </p>
        </div>
        <span className="rounded-full bg-white/8 px-3 py-1 text-sm text-zinc-300">
          {categories.length} kategorii / {albums.length} alb
        </span>
      </div>

      {!selectedCategory ? (
        <CategoryOverview
          categories={categories}
          albums={albums}
          onOpenCategory={openCategory}
        />
      ) : selectedAlbum ? (
        <AlbumDetail
          album={selectedAlbum}
          onBack={backToAlbums}
          editingImageId={editingImageId}
          onToggleEditImage={(id) => setEditingImageId((current) => (current === id ? null : id))}
        />
      ) : (
        <CategoryDetail
          category={selectedCategory}
          albums={categoryAlbums}
          editingCategory={editingCategory}
          onToggleEditingCategory={() => setEditingCategory((current) => !current)}
          onBack={backToCategories}
          onOpenAlbum={setSelectedAlbumKey}
        />
      )}
    </section>
  );
}

function CategoryOverview({
  categories,
  albums,
  onOpenCategory,
}: {
  categories: PhotoCategory[];
  albums: AdminPhotoAlbum[];
  onOpenCategory: (categoryId: string) => void;
}) {
  return (
    <>
      <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
        <h3 className="text-xl font-semibold text-white">Pridat kategorii</h3>
        <PhotoCategoryForm actionLabel="Pridat kategorii" />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => {
          const categoryAlbums = albums.filter((album) => album.category.id === category.id);
          const photoCount = categoryAlbums.reduce((total, album) => total + album.images.length, 0);

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onOpenCategory(category.id)}
              className="group overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/5 text-left shadow-xl shadow-black/25 transition duration-300 hover:-translate-y-1 hover:border-teal-200/45"
            >
              <div className="relative h-40 bg-black/30">
                {category.image_url ? (
                  <Image
                    src={category.image_url}
                    alt={category.name}
                    fill
                    sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover opacity-80 transition duration-500 group-hover:scale-105"
                    unoptimized
                  />
                ) : (
                  <div className="grid h-full place-items-center text-sm text-zinc-500">bez fotky</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />
              </div>
              <div className="p-4">
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-zinc-500">
                  order {category.sort_order} | {category.is_active ? "aktivni" : "vypnuto"}
                </p>
                <h3 className="mt-1 text-2xl font-semibold text-white">{category.name}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-400">
                  {category.description || category.long_description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
                  <span className="rounded-full bg-teal-200 px-3 py-1 text-zinc-950">
                    {categoryAlbums.length} alb
                  </span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-zinc-200">
                    {photoCount} fotek
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

function CategoryDetail({
  category,
  albums,
  editingCategory,
  onToggleEditingCategory,
  onBack,
  onOpenAlbum,
}: {
  category: PhotoCategory;
  albums: AdminPhotoAlbum[];
  editingCategory: boolean;
  onToggleEditingCategory: () => void;
  onBack: () => void;
  onOpenAlbum: (albumKey: string) => void;
}) {
  const photoCount = albums.reduce((total, album) => total + album.images.length, 0);

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-4 h-10 rounded-full border border-white/12 bg-white/8 px-4 text-sm font-semibold text-zinc-200 hover:bg-white/14"
          >
            Zpet na kategorie
          </button>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-teal-200">
            kategorie
          </p>
          <h3 className="mt-1 text-3xl font-semibold text-white">{category.name}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
            {category.long_description || category.description}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded-full bg-teal-200 px-3 py-1 text-zinc-950">
              {albums.length} alb
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-zinc-200">
              {photoCount} fotek
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onToggleEditingCategory}
            className="h-10 rounded-full bg-teal-200 px-4 text-sm font-bold text-zinc-950"
          >
            {editingCategory ? "Zavrit upravu" : "Upravit kategorii"}
          </button>
          <form action={deletePhotoCategory}>
            <input type="hidden" name="id" value={category.id} />
            <button className="h-10 rounded-full bg-pink-300 px-4 text-sm font-bold text-pink-950">
              Smazat kategorii
            </button>
          </form>
        </div>
      </div>

      {editingCategory ? (
        <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
          <PhotoCategoryForm category={category} actionLabel="Ulozit kategorii" />
        </div>
      ) : null}

      <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
        <h3 className="text-xl font-semibold text-white">Vytvorit nove album</h3>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Nazev alba je uroven, ktera se zobrazuje jako karta ve verejne galerii.
        </p>
        <PhotoUploadForm fixedCategory={category} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {albums.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/12 bg-black/20 p-5 text-sm text-zinc-400 md:col-span-2 xl:col-span-3">
            V teto kategorii zatim nejsou zadna alba.
          </p>
        ) : null}
        {albums.map((album) => (
          <AlbumCard key={album.key} album={album} onOpen={() => onOpenAlbum(album.key)} />
        ))}
      </div>
    </div>
  );
}

function AlbumCard({ album, onOpen }: { album: AdminPhotoAlbum; onOpen: () => void }) {
  const cover = album.images[0]?.image_url || album.category.image_url;

  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/5 shadow-xl shadow-black/25">
      <button type="button" onClick={onOpen} className="group block w-full text-left">
        <div className="relative h-44 bg-black/30">
          {cover ? (
            <Image
              src={cover}
              alt={album.title}
              fill
              sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
              className="object-cover transition duration-500 group-hover:scale-105"
              unoptimized
            />
          ) : (
            <div className="grid h-full place-items-center text-sm text-zinc-500">album</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />
        </div>
        <div className="p-4">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-teal-200">
            {album.category.name}
          </p>
          <h4 className="mt-1 text-2xl font-semibold text-white">{album.title}</h4>
          {album.description ? (
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-400">{album.description}</p>
          ) : null}
          <span className="mt-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-zinc-200">
            {album.images.length} fotek
          </span>
        </div>
      </button>
      <form action={deletePhotoAlbum} className="border-t border-white/10 p-4">
        <input type="hidden" name="category_id" value={album.category.id} />
        <input type="hidden" name="album_title" value={album.rawTitle} />
        <button className="h-9 rounded-full bg-pink-300 px-4 text-sm font-bold text-pink-950">
          Smazat album
        </button>
      </form>
    </article>
  );
}

function AlbumDetail({
  album,
  onBack,
  editingImageId,
  onToggleEditImage,
}: {
  album: AdminPhotoAlbum;
  onBack: () => void;
  editingImageId: string | null;
  onToggleEditImage: (id: string) => void;
}) {
  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
        <button
          type="button"
          onClick={onBack}
          className="mb-4 h-10 rounded-full border border-white/12 bg-white/8 px-4 text-sm font-semibold text-zinc-200 hover:bg-white/14"
        >
          Zpet na alba
        </button>
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-teal-200">
          {album.category.name}
        </p>
        <h3 className="mt-1 text-3xl font-semibold text-white">{album.title}</h3>
        {album.description ? (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">{album.description}</p>
        ) : null}
        <p className="mt-3 text-sm font-semibold text-zinc-300">{album.images.length} fotek v albu</p>
      </div>

      <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
        <h3 className="text-xl font-semibold text-white">Pridat fotky do alba</h3>
        <PhotoUploadForm
          fixedCategory={album.category}
          fixedAlbumTitle={album.rawTitle}
          defaultDescription={album.description}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {album.images.map((image) => {
          const isEditing = editingImageId === image.id;

          return (
            <article key={image.id} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
              <div className="relative h-48 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                <Image
                  src={image.image_url}
                  alt={image.title || album.title}
                  fill
                  sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                  unoptimized
                />
              </div>
              <p className="mt-3 font-mono text-xs uppercase tracking-[0.18em] text-zinc-500">
                order {image.sort_order} | {image.is_active ? "aktivni" : "vypnuto"}
              </p>
              {image.description ? (
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-zinc-400">{image.description}</p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onToggleEditImage(image.id)}
                  className="h-9 rounded-full bg-teal-200 px-4 text-sm font-bold text-zinc-950"
                >
                  {isEditing ? "Zavrit" : "Upravit"}
                </button>
                <form action={deletePhotoImage}>
                  <input type="hidden" name="id" value={image.id} />
                  <button className="h-9 rounded-full bg-pink-300 px-4 text-sm font-bold text-pink-950">
                    Smazat fotku
                  </button>
                </form>
              </div>
              {isEditing ? <PhotoImageForm image={image} /> : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function PhotoUploadForm({
  fixedCategory,
  fixedAlbumTitle,
  defaultDescription = "",
}: {
  fixedCategory: PhotoCategory;
  fixedAlbumTitle?: string;
  defaultDescription?: string;
}) {
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
      <input type="hidden" name="category_id" value={fixedCategory.id} />
      <label className="grid gap-2">
        <span className="font-mono text-xs uppercase tracking-[0.18em] text-violet-200">
          Kategorie
        </span>
        <input value={fixedCategory.name} readOnly className="admin-input" />
      </label>
      <AdminField label="Pocatecni poradi" name="sort_order" defaultValue="0" />
      {fixedAlbumTitle === undefined ? (
        <AdminField label="Nazev alba" name="title" defaultValue="" />
      ) : (
        <>
          <input type="hidden" name="title" value={fixedAlbumTitle} />
          <label className="grid gap-2">
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-violet-200">
              Album
            </span>
            <input value={displayAlbumTitle(fixedAlbumTitle)} readOnly className="admin-input" />
          </label>
        </>
      )}
      <AdminField label="Popis alba / fotek" name="description" defaultValue={defaultDescription} />
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
          Fotky se pred uploadem automaticky zmensi na Full HD. Vetsi album nahraj po davkach.
        </span>
        {resizeMessage ? (
          <span className="rounded-2xl border border-teal-200/20 bg-teal-200/10 px-3 py-2 text-xs font-semibold text-teal-50">
            {resizeMessage}
          </span>
        ) : null}
      </label>
      <div className="lg:col-span-2">
        <button className="h-12 rounded-full bg-teal-200 px-6 text-sm font-bold text-zinc-950 transition-colors hover:bg-white">
          {fixedAlbumTitle === undefined ? "Vytvorit album" : "Pridat fotky do alba"}
        </button>
      </div>
    </form>
  );
}

function PhotoImageForm({ image }: { image: PhotoImage }) {
  return (
    <form action={savePhotoImage} className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
      <input type="hidden" name="id" value={image.id} />
      <AdminField label="Nazev" name="title" defaultValue={image.title} />
      <AdminField label="Poradi" name="sort_order" defaultValue={String(image.sort_order)} />
      <AdminArea label="Popis" name="description" defaultValue={image.description} />
      <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
        <input name="is_active" type="checkbox" defaultChecked={image.is_active} className="size-5 accent-teal-200" />
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
      <AdminField label="Ikonka" name="icon" defaultValue={category?.icon ?? ""} />
      <AdminField label="Accent color" name="accent_color" defaultValue={category?.accent_color ?? "#5eead4"} />
      <AdminField label="Poradi" name="sort_order" defaultValue={String(category?.sort_order ?? 0)} />
      <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
        <input name="is_active" type="checkbox" defaultChecked={category?.is_active ?? true} className="size-5 accent-teal-200" />
        <span className="text-sm font-semibold text-zinc-200">Aktivni kategorie</span>
      </label>
      <AdminArea label="Kratky popis" name="description" defaultValue={category?.description ?? ""} />
      <AdminArea label="Delsi popis" name="long_description" defaultValue={category?.long_description ?? ""} />
      <ImageUploadField label="Hero / nahledovy obrazek" currentUrl={category?.image_url ?? ""} />
      <div className="lg:col-span-2">
        <button className="h-12 rounded-full bg-teal-200 px-6 text-sm font-bold text-zinc-950 transition-colors hover:bg-white">
          {actionLabel}
        </button>
      </div>
    </form>
  );
}

function ImageUploadField({ label, currentUrl }: { label: string; currentUrl: string }) {
  return (
    <label className="grid gap-2 lg:col-span-2">
      <span className="font-mono text-xs uppercase tracking-[0.18em] text-violet-200">{label}</span>
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

function groupAlbums(categories: PhotoCategory[], images: PhotoImage[]) {
  const categoriesById = new Map(categories.map((category) => [category.id, category]));
  const groups = new Map<string, AdminPhotoAlbum>();

  for (const image of images) {
    const category = categoriesById.get(image.category_id);

    if (!category) {
      continue;
    }

    const rawTitle = image.title.trim();
    const key = albumKey(image.category_id, rawTitle);
    const existing = groups.get(key);

    if (existing) {
      existing.images.push(image);
      existing.sortOrder = Math.min(existing.sortOrder, image.sort_order);

      if (!existing.description && image.description) {
        existing.description = image.description;
      }

      continue;
    }

    groups.set(key, {
      key,
      rawTitle,
      title: displayAlbumTitle(rawTitle),
      description: image.description,
      category,
      images: [image],
      sortOrder: image.sort_order,
    });
  }

  return Array.from(groups.values())
    .map((album) => ({
      ...album,
      images: [...album.images].sort((a, b) => a.sort_order - b.sort_order),
    }))
    .sort(
      (a, b) =>
        a.category.sort_order - b.category.sort_order ||
        a.sortOrder - b.sortOrder ||
        a.title.localeCompare(b.title),
    );
}

function albumKey(categoryId: string, rawTitle: string) {
  return `${categoryId}::${rawTitle}`;
}

function displayAlbumTitle(rawTitle: string) {
  return rawTitle.trim() || "Bez alba";
}

async function safeResizeImageForUpload(file: File) {
  try {
    return await resizeImageForUpload(file);
  } catch {
    return file;
  }
}

async function resizeImageForUpload(file: File) {
  if (!file.type.startsWith("image/")) {
    return file;
  }

  const maxSide = 1920;
  const { image, url } = await loadImage(file);
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));

  if (scale >= 1 && file.type === "image/jpeg" && file.size < 1_800_000) {
    URL.revokeObjectURL(url);
    return file;
  }

  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
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
      reject(new Error("Image load failed"));
    };
    image.src = url;
  });
}

function jpegFileName(name: string) {
  const cleanName = name.replace(/\.[^.]+$/, "");
  return `${cleanName || "fotka"}.jpg`;
}
