"use client";

import { ImagePlus, Pencil, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { MemoryTheme } from "@/lib/adamek";
import { addThemeImages, deleteMemoryTheme, deleteThemeImage, saveMemoryTheme } from "./actions";

export function MemoryThemeAdmin({ themes }: { themes: MemoryTheme[] }) {
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);

  return (
    <div className="grid gap-8">
      <section className="rounded-[2rem] border border-white/12 bg-slate-950/72 p-6 shadow-2xl shadow-black/40 backdrop-blur-2xl">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-yellow-200">
          nové téma
        </p>
        <h2 className="mt-2 text-3xl font-black">Vytvořit téma</h2>
        <ThemeForm actionLabel="Přidat téma" />
      </section>

      <section className="rounded-[2rem] border border-white/12 bg-slate-950/72 p-5 shadow-2xl shadow-black/40 backdrop-blur-2xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-sky-200">
              témata pexesa
            </p>
            <h2 className="mt-1 text-3xl font-black">Seznam témat</h2>
          </div>
          <span className="rounded-full bg-white/8 px-4 py-2 text-sm font-bold text-zinc-200">
            {themes.length}
          </span>
        </div>

        <div className="grid gap-4">
          {themes.map((theme) => {
            const isEditing = editingThemeId === theme.id;

            return (
              <article
                key={theme.id}
                className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/6"
              >
                <div className="grid gap-4 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div className="min-w-0">
                    <p className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-400">
                      {theme.id}
                    </p>
                    <h3 className="mt-1 text-2xl font-black text-white">{theme.name}</h3>
                    <p className="mt-1 text-sm font-semibold text-sky-100">
                      {theme.images.length} obrázků
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingThemeId(isEditing ? null : theme.id)}
                      className="inline-flex h-10 items-center gap-2 rounded-full bg-yellow-200 px-4 text-sm font-black text-yellow-950"
                    >
                      {isEditing ? <X className="size-4" /> : <Pencil className="size-4" />}
                      {isEditing ? "Zavřít" : "Upravit"}
                    </button>
                    <form action={deleteMemoryTheme}>
                      <input type="hidden" name="id" value={theme.id} />
                      <button className="inline-flex h-10 items-center gap-2 rounded-full bg-pink-300 px-4 text-sm font-black text-pink-950">
                        <Trash2 className="size-4" />
                        Smazat
                      </button>
                    </form>
                  </div>
                </div>

                {isEditing ? (
                  <div className="grid gap-5 border-t border-white/10 bg-black/20 p-4">
                    <ThemeForm theme={theme} actionLabel="Uložit název" />
                    <ImageUploadForm theme={theme} />
                    <ImageGallery theme={theme} />
                  </div>
                ) : (
                  <PreviewStrip images={theme.images} />
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function ThemeForm({
  theme,
  actionLabel,
}: {
  theme?: MemoryTheme;
  actionLabel: string;
}) {
  return (
    <form action={saveMemoryTheme} className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
      <input type="hidden" name="id" value={theme?.id ?? ""} />
      <label className="grid gap-2">
        <span className="font-mono text-xs uppercase tracking-[0.18em] text-violet-200">
          Název tématu
        </span>
        <input
          name="name"
          defaultValue={theme?.name ?? ""}
          className="admin-input"
          placeholder="Například Zvířata"
          required
        />
      </label>
      <button className="h-12 rounded-full bg-yellow-200 px-6 text-sm font-black text-yellow-950 transition-colors hover:bg-white">
        {actionLabel}
      </button>
    </form>
  );
}

function ImageUploadForm({ theme }: { theme: MemoryTheme }) {
  return (
    <form action={addThemeImages} className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
      <input type="hidden" name="id" value={theme.id} />
      <input type="hidden" name="images" value={JSON.stringify(theme.images)} />
      <label className="grid gap-2">
        <span className="font-mono text-xs uppercase tracking-[0.18em] text-violet-200">
          Nahrát obrázky
        </span>
        <input
          name="images_file"
          type="file"
          accept="image/*"
          multiple
          className="admin-input file:mr-4 file:rounded-full file:border-0 file:bg-yellow-200 file:px-4 file:py-2 file:text-sm file:font-black file:text-yellow-950"
        />
      </label>
      <button className="inline-flex h-12 w-fit items-center gap-2 rounded-full bg-sky-200 px-5 text-sm font-black text-sky-950">
        <ImagePlus className="size-4" />
        Přidat obrázky
      </button>
    </form>
  );
}

function PreviewStrip({ images }: { images: string[] }) {
  if (images.length === 0) {
    return <p className="border-t border-white/10 p-4 text-sm text-zinc-400">Zatím tu nejsou žádné obrázky.</p>;
  }

  return (
    <div className="flex gap-2 overflow-x-auto border-t border-white/10 p-4">
      {images.slice(0, 12).map((image) => (
        <Image
          key={image}
          src={image}
          alt=""
          width={64}
          height={64}
          unoptimized
          className="size-16 shrink-0 rounded-2xl border border-white/10 bg-white object-contain p-1"
        />
      ))}
    </div>
  );
}

function ImageGallery({ theme }: { theme: MemoryTheme }) {
  if (theme.images.length === 0) {
    return (
      <p className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
        Zatím tu nejsou žádné obrázky.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">
      {theme.images.map((image) => (
        <div key={image} className="rounded-2xl border border-white/10 bg-slate-950/55 p-2">
          <Image
            src={image}
            alt=""
            width={160}
            height={160}
            unoptimized
            className="aspect-square w-full rounded-xl bg-white object-contain p-2"
          />
          <form action={deleteThemeImage} className="mt-2">
            <input type="hidden" name="id" value={theme.id} />
            <input type="hidden" name="image_url" value={image} />
            <input type="hidden" name="images" value={JSON.stringify(theme.images)} />
            <button className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-full bg-pink-300 px-3 text-xs font-black text-pink-950">
              <Trash2 className="size-3.5" />
              Smazat
            </button>
          </form>
        </div>
      ))}
    </div>
  );
}
