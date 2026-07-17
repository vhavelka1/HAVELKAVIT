import Link from "next/link";
import { getActiveHolidayDiaryEntries, holidayDiaryYears } from "@/lib/adamek-holiday-diary";
import { HolidayDiaryCalendar } from "./holiday-diary-calendar";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Prázdninový deník | Adámek",
  description: "Letní kalendář Adámkových zážitků z července a srpna.",
};

export default async function HolidayDiaryPage() {
  const { entries, error } = await getActiveHolidayDiaryEntries();
  const years = holidayDiaryYears(entries);

  return (
    <main className="min-h-screen overflow-hidden bg-[#06233d] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(250,204,21,0.28),transparent_20rem),radial-gradient(circle_at_85%_18%,rgba(56,189,248,0.24),transparent_24rem),radial-gradient(circle_at_52%_92%,rgba(132,204,22,0.18),transparent_30rem)]" />
      <div className="pointer-events-none fixed inset-x-0 bottom-0 h-48 bg-[linear-gradient(135deg,rgba(14,165,233,0.18)_25%,transparent_25%),linear-gradient(225deg,rgba(14,165,233,0.18)_25%,transparent_25%)] bg-[length:80px_80px]" />

      <div className="relative z-10 mx-auto min-h-screen w-full max-w-7xl px-5 py-6 sm:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/adamek"
            className="inline-flex h-12 items-center rounded-full border border-white/16 bg-white/12 px-5 text-sm font-black text-white shadow-xl shadow-black/25 backdrop-blur-md transition-colors hover:bg-white/20"
          >
            Zpět na Adámka
          </Link>
          <div className="rounded-full border border-yellow-200/25 bg-yellow-200/15 px-4 py-2 text-sm font-black text-yellow-50">
            ☀️ léto v kalendáři
          </div>
        </header>

        <section className="py-10">
          <p className="font-mono text-xs uppercase tracking-[0.32em] text-yellow-200">
            Adámkův svět
          </p>
          <h1 className="mt-4 max-w-4xl text-5xl font-black leading-none text-white drop-shadow-[0_6px_0_rgba(14,165,233,0.35)] sm:text-7xl">
            Prázdninový deník
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-sky-50">
            Klikni na barevný den a otevři si letní zážitek s fotkou. Červenec a srpen jsou tady jako mapa prázdnin.
          </p>
        </section>

        {error ? (
          <div className="mb-8 rounded-[2rem] border border-yellow-200/25 bg-yellow-200/12 px-5 py-4 text-sm font-bold text-yellow-50">
            {error}
          </div>
        ) : null}

        <HolidayDiaryCalendar entries={entries} years={years} />
      </div>
    </main>
  );
}
