"use client";

import {
  Calendar,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Heart,
  ImageIcon,
  Mountain,
  Smile,
  Sparkles,
  User,
  X,
  Zap,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import type { PhotoAlbum, PhotoCategory, PhotoItem } from "@/lib/photo-categories";

type PhotographyCloudProps = {
  categories: PhotoCategory[];
  albums: PhotoAlbum[];
  items: PhotoItem[];
};

const iconMap = {
  Calendar,
  Camera,
  Dumbbell,
  Heart,
  ImageIcon,
  Mountain,
  Smile,
  Sparkles,
  User,
  Zap,
};

export function PhotographyCloud({ categories, albums, items }: PhotographyCloudProps) {
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [showGallery, setShowGallery] = useState(false);
  const [activeAlbumId, setActiveAlbumId] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const albumsRef = useRef<HTMLDivElement>(null);
  const photosRef = useRef<HTMLDivElement>(null);
  const selectedCategories = categories.filter((category) => selectedSlugs.includes(category.slug));
  const selectedCategoryIds = selectedCategories.map((category) => category.id);
  const selectedAlbums = albums.filter((album) => selectedCategoryIds.includes(album.category_id));
  const selectedItems = items.filter((item) => selectedCategoryIds.includes(item.category_id));
  const visibleItems = activeAlbumId
    ? selectedItems.filter((item) => item.album_id === activeAlbumId)
    : selectedItems;
  const activeLightboxItem =
    lightboxIndex === null ? null : visibleItems[(lightboxIndex + visibleItems.length) % visibleItems.length] ?? null;

  const cloudItems = useMemo(() => {
    const count = Math.max(categories.length, 1);

    return categories.map((category, index) => {
      const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
      const radius = index % 3 === 0 ? 39 : index % 3 === 1 ? 31 : 23;

      return {
        category,
        x: 50 + Math.cos(angle) * radius,
        y: 50 + Math.sin(angle) * radius * 0.78,
        size: index % 4 === 0 ? "large" : index % 4 === 1 ? "small" : "medium",
      };
    });
  }, [categories]);

  function toggleCategory(slug: string) {
    setSelectedSlugs((current) =>
      current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug],
    );
    setShowGallery(false);
    setActiveAlbumId(null);
    setLightboxIndex(null);
  }

  function scrollRail(ref: RefObject<HTMLDivElement | null>, direction: -1 | 1) {
    ref.current?.scrollBy({ left: direction * Math.round(ref.current.clientWidth * 0.82), behavior: "smooth" });
  }

  function openLightbox(index: number) {
    setLightboxIndex(index);
  }

  function moveLightbox(direction: -1 | 1) {
    setLightboxIndex((current) => {
      if (current === null || visibleItems.length === 0) {
        return current;
      }

      return (current + direction + visibleItems.length) % visibleItems.length;
    });
  }

  useEffect(() => {
    if (lightboxIndex === null) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setLightboxIndex(null);
      }

      if (event.key === "ArrowLeft") {
        setLightboxIndex((current) =>
          current === null || visibleItems.length === 0
            ? current
            : (current - 1 + visibleItems.length) % visibleItems.length,
        );
      }

      if (event.key === "ArrowRight") {
        setLightboxIndex((current) =>
          current === null || visibleItems.length === 0
            ? current
            : (current + 1 + visibleItems.length) % visibleItems.length,
        );
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, visibleItems.length]);

  if (showGallery) {
    return (
      <section className="flex flex-1 flex-col gap-10 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-pink-200/75">
              vybrane kategorie
            </p>
            <h1 className="mt-3 text-4xl font-semibold leading-none text-white sm:text-6xl">
              Fotograficke vysledky
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300">
              Vyber album, nebo nech bez vyberu a prohlizej vsechny fotky z vybranych kategorii.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowGallery(false);
              setActiveAlbumId(null);
              setLightboxIndex(null);
            }}
            className="h-12 rounded-full border border-white/12 bg-white/8 px-5 text-sm font-bold text-zinc-100 backdrop-blur-md transition-colors hover:bg-white/14"
          >
            Zmenit vyber
          </button>
        </div>

        <section className="space-y-4">
          <GalleryRailHeader
            title="Alba"
            subtitle={`${selectedAlbums.length} aktivnich alb`}
            onPrev={() => scrollRail(albumsRef, -1)}
            onNext={() => scrollRail(albumsRef, 1)}
          />

          {selectedAlbums.length === 0 ? (
            <EmptyGalleryMessage text="Pro vybrane kategorie zatim nejsou aktivni alba." />
          ) : (
            <div
              ref={albumsRef}
              className="flex snap-x gap-5 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:thin] [scrollbar-color:rgba(94,234,212,0.35)_transparent]"
            >
              {selectedAlbums.map((album) => {
                const category = categories.find((item) => item.id === album.category_id);
                const albumItems = items.filter((item) => item.album_id === album.id && item.is_active);
                const cover = album.cover_image_url || albumItems[0]?.image_url || category?.image_url || "";
                const isActive = activeAlbumId === album.id;

                return (
                  <button
                    key={album.id}
                    type="button"
                    onClick={() => setActiveAlbumId(isActive ? null : album.id)}
                    className={`group relative h-72 w-[82vw] max-w-[28rem] shrink-0 snap-start overflow-hidden rounded-[1.75rem] border text-left shadow-2xl transition duration-300 hover:-translate-y-1 sm:w-[28rem] ${
                      isActive
                        ? "border-teal-200 shadow-teal-500/20"
                        : "border-white/12 shadow-black/35 hover:border-white/24"
                    }`}
                  >
                    {cover ? (
                      <Image
                        src={cover}
                        alt={album.title}
                        fill
                        sizes="(min-width: 640px) 28rem, 82vw"
                        className="object-cover transition duration-500 group-hover:scale-105"
                        unoptimized
                      />
                    ) : (
                      <Placeholder label={album.title} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/38 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-5">
                      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-teal-200">
                        {category?.name ?? "Fotografie"}
                      </p>
                      <h2 className="mt-2 text-3xl font-semibold text-white">{album.title}</h2>
                      {album.description ? (
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-200">{album.description}</p>
                      ) : null}
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <span className="rounded-full border border-white/14 bg-white/12 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
                          {albumItems.length} fotek
                        </span>
                        {isActive ? (
                          <span className="grid size-8 place-items-center rounded-full bg-teal-200 text-zinc-950">
                            <Check className="size-4" aria-hidden="true" />
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <GalleryRailHeader
            title="Fotografie"
            subtitle={activeAlbumId ? "fotky z vybraneho alba" : "vsechny fotky z vybranych kategorii"}
            onPrev={() => scrollRail(photosRef, -1)}
            onNext={() => scrollRail(photosRef, 1)}
          />

          {visibleItems.length === 0 ? (
            <EmptyGalleryMessage text="Pro aktualni vyber zatim nejsou aktivni fotky." />
          ) : (
            <div
              ref={photosRef}
              className="flex snap-x gap-4 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:thin] [scrollbar-color:rgba(94,234,212,0.35)_transparent]"
            >
              {visibleItems.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openLightbox(index)}
                  className="group relative h-[22rem] w-[78vw] max-w-[30rem] shrink-0 snap-start overflow-hidden rounded-[1.5rem] border border-white/12 bg-zinc-900 shadow-2xl shadow-black/35 transition duration-300 hover:-translate-y-1 hover:border-teal-200/70 sm:w-[25rem]"
                >
                  <Image
                    src={item.image_url}
                    alt={item.title || "Fotografie"}
                    fill
                    sizes="(min-width: 640px) 25rem, 78vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/68 via-transparent to-transparent opacity-80" />
                  {item.title || item.description ? (
                    <div className="absolute inset-x-0 bottom-0 p-4 text-left">
                      {item.title && item.album_id !== activeAlbumId ? (
                        <p className="font-semibold text-white">{item.title}</p>
                      ) : null}
                      {item.description ? (
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-200">{item.description}</p>
                      ) : null}
                    </div>
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </section>

        {activeLightboxItem && lightboxIndex !== null ? (
          <Lightbox
            item={activeLightboxItem}
            onClose={() => setLightboxIndex(null)}
            onPrev={() => moveLightbox(-1)}
            onNext={() => moveLightbox(1)}
          />
        ) : null}
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-8 py-10">
      <div className="max-w-3xl text-center">
        <p className="font-mono text-xs uppercase tracking-[0.32em] text-teal-200/75">
          kreativni vyber
        </p>
        <h1 className="mt-4 text-5xl font-semibold leading-none text-white sm:text-7xl">
          Fotografie
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-zinc-300 sm:text-lg">
          Vyber jednu nebo vice kategorii. Pak otevri galerii presne pro to, co te zajima.
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-[2rem] border border-white/12 bg-white/8 p-8 text-center text-zinc-300">
          Zatim neni zapnuta zadna fotograficka kategorie.
        </div>
      ) : (
        <div className="relative aspect-square w-full max-w-[760px]">
          <div className="pointer-events-none absolute inset-[8%] rounded-full border border-white/10" />
          <div className="pointer-events-none absolute inset-[22%] rounded-full border border-teal-200/12" />
          <div className="pointer-events-none absolute inset-[36%] rounded-full border border-pink-200/12" />

          {cloudItems.map(({ category, x, y, size }, index) => {
            const selected = selectedSlugs.includes(category.slug);
            const Icon = iconMap[category.icon as keyof typeof iconMap] ?? Camera;
            const dimensions =
              size === "large"
                ? "h-32 w-32 sm:h-40 sm:w-40"
                : size === "small"
                  ? "h-24 w-24 sm:h-[7.5rem] sm:w-[7.5rem]"
                  : "h-28 w-28 sm:h-[8.5rem] sm:w-[8.5rem]";

            return (
              <div
                key={category.slug}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleCategory(category.slug)}
                  className={`group flex flex-col items-center justify-center rounded-full border p-3 text-center shadow-2xl backdrop-blur-xl transition duration-300 hover:scale-105 ${
                    selected
                      ? "border-white bg-white/18 shadow-teal-300/30"
                      : "border-white/14 bg-zinc-950/72 shadow-black/35 hover:border-white/28"
                  } ${dimensions}`}
                  style={{
                    boxShadow: selected
                      ? `0 0 42px ${category.accent_color}66, 0 18px 45px rgba(0,0,0,0.35)`
                      : undefined,
                    animation: `photoFloat ${5 + (index % 4)}s ease-in-out infinite`,
                    animationDelay: `${index * -0.35}s`,
                  }}
                  aria-pressed={selected}
                >
                  <span
                    className="mb-2 grid size-9 place-items-center rounded-full border border-white/12 bg-white/10"
                    style={{ color: category.accent_color }}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="max-w-[9ch] text-sm font-bold leading-tight text-white sm:text-base">
                    {category.name}
                  </span>
                  {category.description ? (
                    <span className="mt-1 hidden max-w-[14ch] text-[11px] leading-4 text-zinc-300 sm:block">
                      {category.description}
                    </span>
                  ) : null}
                  {selected ? (
                    <span className="absolute right-3 top-3 grid size-7 place-items-center rounded-full bg-teal-200 text-zinc-950">
                      <Check className="size-4" aria-hidden="true" />
                    </span>
                  ) : null}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex w-full max-w-2xl flex-col items-center gap-4 rounded-[2rem] border border-white/12 bg-white/8 p-4 shadow-2xl shadow-black/30 backdrop-blur-xl sm:flex-row sm:justify-between">
        <p className="text-sm font-semibold text-zinc-200">
          Vybrano {selectedSlugs.length} / {categories.length} kategorii
        </p>
        <button
          type="button"
          disabled={selectedSlugs.length === 0}
          onClick={() => setShowGallery(true)}
          className="h-12 rounded-full bg-teal-200 px-6 text-sm font-black uppercase text-zinc-950 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:bg-white/12 disabled:text-zinc-500"
        >
          Zobrazit vysledky
        </button>
      </div>

      <style jsx>{`
        @keyframes photoFloat {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </section>
  );
}

function Placeholder({ label }: { label: string }) {
  return (
    <div className="grid h-full w-full place-items-center bg-[linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.03))]">
      <div className="text-center">
        <ImageIcon className="mx-auto size-9 text-white/42" aria-hidden="true" />
        <p className="mt-3 font-mono text-xs uppercase tracking-[0.22em] text-white/52">{label}</p>
      </div>
    </div>
  );
}

function GalleryRailHeader({
  title,
  subtitle,
  onPrev,
  onNext,
}: {
  title: string;
  subtitle: string;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-teal-200/70">
          {subtitle}
        </p>
        <h2 className="mt-1 text-3xl font-semibold text-white">{title}</h2>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onPrev}
          className="grid size-11 place-items-center rounded-full border border-white/12 bg-white/8 text-white shadow-xl shadow-black/25 backdrop-blur-md transition-colors hover:bg-white/14"
          aria-label={`${title} doleva`}
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onNext}
          className="grid size-11 place-items-center rounded-full border border-white/12 bg-white/8 text-white shadow-xl shadow-black/25 backdrop-blur-md transition-colors hover:bg-white/14"
          aria-label={`${title} doprava`}
        >
          <ChevronRight className="size-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function EmptyGalleryMessage({ text }: { text: string }) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-white/14 bg-white/6 p-8 text-center text-sm leading-7 text-zinc-300">
      {text}
    </div>
  );
}

function Lightbox({
  item,
  onClose,
  onPrev,
  onNext,
}: {
  item: PhotoItem;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/88 px-4 py-6 backdrop-blur-xl">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 grid size-11 place-items-center rounded-full border border-white/12 bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/18"
        aria-label="Zavrit lightbox"
      >
        <X className="size-5" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onPrev}
        className="absolute left-4 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full border border-white/12 bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/18"
        aria-label="Predchozi fotka"
      >
        <ChevronLeft className="size-7" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onNext}
        className="absolute right-4 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full border border-white/12 bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/18"
        aria-label="Dalsi fotka"
      >
        <ChevronRight className="size-7" aria-hidden="true" />
      </button>

      <div className="relative h-[78vh] w-full max-w-6xl overflow-hidden rounded-[1.75rem] border border-white/12 bg-zinc-950 shadow-2xl shadow-black">
        <Image
          src={item.image_url}
          alt={item.title || "Fotografie"}
          fill
          sizes="100vw"
          className="object-contain"
          unoptimized
          priority
        />
        {item.title || item.description ? (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/82 to-transparent p-5">
            {item.title ? <h3 className="text-2xl font-semibold text-white">{item.title}</h3> : null}
            {item.description ? (
              <p className="mt-2 max-w-3xl text-sm leading-7 text-zinc-200">{item.description}</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

