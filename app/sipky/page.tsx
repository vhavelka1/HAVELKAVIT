import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowUpRight, Target } from "lucide-react";

export default function DartsPage() {
  return <main className="min-h-screen bg-[#101513] px-5 py-8 text-white sm:px-10">
    <div className="mx-auto max-w-6xl">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-300 hover:text-white"><ArrowLeft size={17}/> Zpět na hlavní stránku</Link>
      <div className="mt-20 max-w-2xl"><p className="text-sm font-bold uppercase tracking-[.3em] text-emerald-400">Havelka Vít / Šipky</p><h1 className="mt-4 text-6xl font-black sm:text-7xl">Šipky</h1><p className="mt-5 text-lg leading-8 text-zinc-400">Soutěže, výsledky a vše kolem hry. Vyberte si ligu, kterou chcete sledovat.</p></div>
      <Link href="/sipky/hrusovanska-liga" className="group mt-12 flex max-w-xl items-center gap-5 rounded-3xl border border-white/10 bg-[#1a2420] p-6 transition hover:border-emerald-400/60 hover:bg-[#202e27]">
        <Image src="/hrusovanska-liga-logo.jpg" alt="Logo Hrušovanské ligy" width={96} height={96} className="size-24 rounded-2xl object-cover" />
        <span className="flex-1"><span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-400"><Target size={15}/> Liga jednotlivců</span><span className="mt-2 block text-2xl font-bold">Hrušovanská liga</span><span className="mt-2 block text-sm text-zinc-400">Tabulka, výsledky a rozpis zápasů</span></span><ArrowUpRight className="text-emerald-400 transition group-hover:translate-x-1 group-hover:-translate-y-1" />
      </Link>
    </div>
  </main>;
}
