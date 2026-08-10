"use client";

import { CalendarDays, ImagePlus, Pencil, Trash2, X } from "lucide-react";
import Image from "next/image";
import { FormEvent, useMemo, useRef, useState } from "react";
import { formatCzechDate, type HolidayDiaryEntry } from "@/lib/adamek-holiday-diary";
import { deleteHolidayDiaryEntry, saveHolidayDiaryEntry } from "./actions";

type MonthFilter = "all" | "7" | "8";

type PreparedImage = {
  url: string;
  originalWidth: number;
  originalHeight: number;
  width: number;
  height: number;
  size: number;
};

export function HolidayDiaryAdmin({ entries }: { entries: HolidayDiaryEntry[] }) {
  const [monthFilter, setMonthFilter] = useState<MonthFilter>("all");
  const [editingId, setEditingId] = useState<string | null>(null);

  const filteredEntries = useMemo(() => {
    if (monthFilter === "all") {
      return entries;
    }

    return entries.filter((entry) => entry.entryDate.slice(5, 7) === monthFilter.padStart(2, "0"));
  }, [entries, monthFilter]);

  return (
    <section
      id="prazdninovy-denik"
      className="mt-8 rounded-[2rem] border border-white/12 bg-slate-950/72 p-6 shadow-2xl shadow-black/40 backdrop-blur-2xl"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-lime-200">
            Adámek - Prázdninový deník
          </p>
          <h2 className="mt-2 text-3xl font-black">Zážitky z prázdnin</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-sky-100/80">
            Každý den v červenci nebo srpnu může mít jeden zážitek. Aktivní zážitky se ukážou ve veřejném kalendáři.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-lime-200 px-4 py-2 text-sm font-black text-lime-950">
          <CalendarDays className="size-4" />
          {entries.length} záznamů
        </span>
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/6 p-4">
        <h3 className="text-2xl font-black text-white">Přidat zážitek</h3>
        <HolidayDiaryForm actionLabel="Uložit zážitek" />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-sky-200">
            seznam
          </p>
          <h3 className="mt-1 text-2xl font-black text-white">Všechny zážitky</h3>
        </div>
        <div className="flex rounded-full border border-white/12 bg-white/8 p-1">
          {[
            ["all", "Vše"],
            ["7", "Červenec"],
            ["8", "Srpen"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setMonthFilter(value as MonthFilter)}
              className={`h-10 rounded-full px-4 text-sm font-black transition ${
                monthFilter === value
                  ? "bg-yellow-200 text-yellow-950"
                  : "text-zinc-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        {filteredEntries.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/14 bg-black/20 p-5 text-sm text-zinc-300">
            Pro tento filtr zatím nejsou žádné zážitky.
          </p>
        ) : null}

        {filteredEntries.map((entry) => {
          const isEditing = editingId === entry.id;

          return (
            <article key={entry.id} className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/6">
              <div className="grid gap-4 p-4 lg:grid-cols-[140px_1fr_auto] lg:items-center">
                <div className="relative h-32 overflow-hidden rounded-3xl border border-white/10 bg-sky-950/55">
                  {entry.imageUrl ? (
                    <Image
                      src={entry.imageUrl}
                      alt={entry.title}
                      fill
                      sizes="140px"
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-4xl">☀️</div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-xs uppercase tracking-[0.18em] text-yellow-200">
                    {formatCzechDate(entry.entryDate)} | {entry.isActive ? "aktivní" : "skryté"}
                  </p>
                  <h4 className="mt-1 text-2xl font-black text-white">{entry.title}</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingId(isEditing ? null : entry.id)}
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-yellow-200 px-4 text-sm font-black text-yellow-950"
                  >
                    {isEditing ? <X className="size-4" /> : <Pencil className="size-4" />}
                    {isEditing ? "Zavřít" : "Upravit"}
                  </button>
                  <form action={deleteHolidayDiaryEntry}>
                    <input type="hidden" name="id" value={entry.id} />
                    <input type="hidden" name="storage_path" value={entry.storagePath} />
                    <button className="inline-flex h-10 items-center gap-2 rounded-full bg-pink-300 px-4 text-sm font-black text-pink-950">
                      <Trash2 className="size-4" />
                      Smazat
                    </button>
                  </form>
                </div>
              </div>

              {isEditing ? (
                <div className="border-t border-white/10 bg-black/20 p-4">
                  <HolidayDiaryForm entry={entry} actionLabel="Uložit změny" />
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function HolidayDiaryForm({
  entry,
  actionLabel,
}: {
  entry?: HolidayDiaryEntry;
  actionLabel: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const widthInputRef = useRef<HTMLInputElement>(null);
  const heightInputRef = useRef<HTMLInputElement>(null);
  const preparedSubmitRef = useRef(false);
  const previewUrlRef = useRef<string | null>(null);
  const [preparedImage, setPreparedImage] = useState<PreparedImage | null>(null);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (preparedSubmitRef.current) {
      preparedSubmitRef.current = false;
      return;
    }

    const form = event.currentTarget;
    const input = fileInputRef.current;
    const file = input?.files?.[0];

    if (!file || file.size === 0) {
      return;
    }

    event.preventDefault();
    setMessage("Připravuji fotku před nahráním...");

    try {
      const resized = await resizeDiaryImage(file);
      const transfer = typeof DataTransfer === "undefined" ? null : new DataTransfer();

      if (transfer && input) {
        transfer.items.add(resized.file);
        input.files = transfer.files;
      }

      if (widthInputRef.current) {
        widthInputRef.current.value = String(resized.width);
      }

      if (heightInputRef.current) {
        heightInputRef.current.value = String(resized.height);
      }

      setMessage("Fotka je připravená, ukládám...");
      preparedSubmitRef.current = true;
      form.requestSubmit();
    } catch {
      setMessage("Fotku se nepodařilo připravit. Zkus prosím JPG, PNG nebo WEBP.");
    }
  }

  async function handlePreview(file: File | undefined) {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    if (!file) {
      setPreparedImage(null);
      return;
    }

    try {
      const resized = await resizeDiaryImage(file);
      const url = URL.createObjectURL(resized.file);
      previewUrlRef.current = url;
      setPreparedImage({
        url,
        originalWidth: resized.originalWidth,
        originalHeight: resized.originalHeight,
        width: resized.width,
        height: resized.height,
        size: resized.file.size,
      });
      setMessage("Náhled je připravený. Původní velká fotka se do Supabase neuloží.");
    } catch {
      setPreparedImage(null);
      setMessage("Fotku se nepodařilo připravit. Zkus prosím JPG, PNG nebo WEBP.");
    }
  }

  return (
    <form action={saveHolidayDiaryEntry} onSubmit={(event) => void handleSubmit(event)} className="mt-5 grid gap-4 lg:grid-cols-2">
      <input type="hidden" name="id" value={entry?.id ?? ""} />
      <input type="hidden" name="existing_image_url" value={entry?.imageUrl ?? ""} />
      <input type="hidden" name="existing_storage_path" value={entry?.storagePath ?? ""} />
      <input ref={widthInputRef} type="hidden" name="image_width" defaultValue={entry?.imageWidth ?? ""} />
      <input ref={heightInputRef} type="hidden" name="image_height" defaultValue={entry?.imageHeight ?? ""} />

      <label className="grid gap-2">
        <span className="font-mono text-xs uppercase tracking-[0.18em] text-violet-200">
          Datum
        </span>
        <input
          name="entry_date"
          type="date"
          defaultValue={entry?.entryDate ?? ""}
          required
          className="admin-input"
        />
        <span className="text-xs font-semibold text-zinc-400">Povolený je pouze červenec a srpen.</span>
      </label>

      <label className="grid gap-2">
        <span className="font-mono text-xs uppercase tracking-[0.18em] text-violet-200">
          Název zážitku
        </span>
        <input name="title" defaultValue={entry?.title ?? ""} required className="admin-input" />
      </label>

      <label className="grid gap-2 lg:col-span-2">
        <span className="font-mono text-xs uppercase tracking-[0.18em] text-violet-200">
          Fotografie
        </span>
        <input
          ref={fileInputRef}
          name="image_file"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => void handlePreview(event.currentTarget.files?.[0])}
          className="admin-input file:mr-4 file:rounded-full file:border-0 file:bg-yellow-200 file:px-4 file:py-2 file:text-sm file:font-black file:text-yellow-950"
        />
        <span className="text-xs font-semibold text-zinc-400">
          Fotka se před uložením zmenší na max 1920 × 1080 px a převede na WebP.
        </span>
      </label>

      {entry?.imageUrl || preparedImage ? (
        <div className="grid gap-4 rounded-3xl border border-white/10 bg-slate-950/55 p-4 lg:col-span-2 md:grid-cols-[220px_1fr]">
          <div className="relative h-44 overflow-hidden rounded-2xl bg-sky-950/60">
            <Image
              src={preparedImage?.url || entry?.imageUrl || ""}
              alt="Náhled fotky"
              fill
              unoptimized
              className="object-cover"
            />
          </div>
          <div className="grid content-center gap-3 text-sm text-sky-100/80">
            {preparedImage ? (
              <>
                <p>
                  Původní rozměr: <strong>{preparedImage.originalWidth} × {preparedImage.originalHeight}px</strong>
                </p>
                <p>
                  Výsledný rozměr: <strong>{preparedImage.width} × {preparedImage.height}px</strong>
                </p>
                <p>
                  Výsledná velikost: <strong>{Math.max(1, Math.round(preparedImage.size / 1024))} kB</strong>
                </p>
              </>
            ) : (
              <p>
                Aktuální fotka: <strong>{entry?.imageWidth || "?"} × {entry?.imageHeight || "?"}px</strong>
              </p>
            )}

            {entry?.imageUrl ? (
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <input name="remove_image" type="checkbox" className="size-5 accent-pink-300" />
                <span className="font-semibold text-zinc-200">Odstranit fotografii</span>
              </label>
            ) : null}
          </div>
        </div>
      ) : null}

      <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
        <input name="is_active" type="checkbox" defaultChecked={entry?.isActive ?? true} className="size-5 accent-lime-200" />
        <span className="text-sm font-semibold text-zinc-200">Aktivní zážitek</span>
      </label>

      {message ? (
        <div className="rounded-2xl border border-sky-200/20 bg-sky-200/10 px-4 py-3 text-sm font-semibold text-sky-50 lg:col-span-2">
          {message}
        </div>
      ) : null}

      <div className="lg:col-span-2">
        <button className="inline-flex h-12 items-center gap-2 rounded-full bg-lime-200 px-6 text-sm font-black text-lime-950 transition-colors hover:bg-white">
          <ImagePlus className="size-4" />
          {actionLabel}
        </button>
      </div>
    </form>
  );
}

async function resizeDiaryImage(file: File) {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (!allowedTypes.includes(file.type)) {
    throw new Error("Unsupported image type");
  }

  const { image, url } = await loadImage(file);
  const originalWidth = image.naturalWidth;
  const originalHeight = image.naturalHeight;
  const scale = Math.min(1, 1920 / originalWidth, 1080 / originalHeight);
  const width = Math.max(1, Math.round(originalWidth * scale));
  const height = Math.max(1, Math.round(originalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    URL.revokeObjectURL(url);
    throw new Error("Canvas is not available");
  }

  context.drawImage(image, 0, 0, width, height);
  URL.revokeObjectURL(url);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", 0.86);
  });

  if (!blob) {
    throw new Error("Image conversion failed");
  }

  return {
    file: new File([blob], webpFileName(file.name), {
      type: "image/webp",
      lastModified: Date.now(),
    }),
    originalWidth,
    originalHeight,
    width,
    height,
  };
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

function webpFileName(name: string) {
  const cleanName = name.replace(/\.[^.]+$/, "");
  return `${cleanName || "zazitek"}.webp`;
}
