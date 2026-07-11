import Link from "next/link";
import { getPhotoAlbums, getPhotoCategories, getPhotoItems } from "@/lib/photo-categories";
import { PhotographyCloud } from "./photography-cloud";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Fotografie | HAVELKAVIT",
  description: "Vyber fotograficke kategorie a otevri galerii HAVELKAVIT.",
};

export default async function PhotographyPage() {
  const [categories, albums, items] = await Promise.all([
    getPhotoCategories({ activeOnly: true }),
    getPhotoAlbums({ activeOnly: true }),
    getPhotoItems({ activeOnly: true }),
  ]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#050507] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(94,234,212,0.18),transparent_28rem),radial-gradient(circle_at_78%_18%,rgba(249,168,212,0.16),transparent_26rem),radial-gradient(circle_at_50%_92%,rgba(250,204,21,0.12),transparent_30rem)]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:72px_72px] opacity-25" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-full border border-white/12 bg-white/8 px-4 text-sm font-semibold text-zinc-200 shadow-xl shadow-black/20 backdrop-blur-md transition-colors hover:bg-white/14 hover:text-white"
          >
            Zpet na hlavni stranku
          </Link>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-teal-200/75">
            HAVELKAVIT / fotografie
          </p>
        </header>

        <PhotographyCloud categories={categories} albums={albums} items={items} />
      </div>
    </main>
  );
}
