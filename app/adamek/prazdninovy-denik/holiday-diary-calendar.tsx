"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { formatCzechDate, type HolidayDiaryEntry } from "@/lib/adamek-holiday-diary";

const months = [
  { value: 7, label: "Červenec", tone: "from-yellow-200 via-orange-200 to-sky-200" },
  { value: 8, label: "Srpen", tone: "from-sky-200 via-lime-200 to-yellow-100" },
] as const;

const dayLabels = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];

export function HolidayDiaryCalendar({
  entries,
  years,
}: {
  entries: HolidayDiaryEntry[];
  years: number[];
}) {
  const [selectedMonth, setSelectedMonth] = useState<7 | 8>(7);
  const [selectedYear, setSelectedYear] = useState(years[0] ?? new Date().getFullYear());
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);

  const entriesByDate = useMemo(() => {
    return new Map(entries.map((entry) => [entry.entryDate, entry]));
  }, [entries]);

  const visibleEntries = useMemo(() => {
    const prefix = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;
    return entries.filter((entry) => entry.entryDate.startsWith(prefix));
  }, [entries, selectedMonth, selectedYear]);

  const activeEntry = entries.find((entry) => entry.id === activeEntryId) ?? null;
  const activeIndex = activeEntry ? entries.findIndex((entry) => entry.id === activeEntry.id) : -1;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!activeEntry) {
        return;
      }

      if (event.key === "Escape") {
        setActiveEntryId(null);
      }

      if (event.key === "ArrowLeft") {
        setActiveEntryId(entries[Math.max(0, activeIndex - 1)]?.id ?? activeEntry.id);
      }

      if (event.key === "ArrowRight") {
        setActiveEntryId(entries[Math.min(entries.length - 1, activeIndex + 1)]?.id ?? activeEntry.id);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeEntry, activeIndex, entries]);

  return (
    <>
      <section className="rounded-[2.5rem] border border-white/16 bg-white/12 p-4 shadow-2xl shadow-sky-950/35 backdrop-blur-xl sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex rounded-full border border-white/18 bg-white/12 p-1">
            {months.map((month) => (
              <button
                key={month.value}
                type="button"
                onClick={() => setSelectedMonth(month.value)}
                className={`h-11 rounded-full px-5 text-sm font-black transition ${
                  selectedMonth === month.value
                    ? "bg-white text-sky-950 shadow-lg"
                    : "text-sky-50 hover:bg-white/12"
                }`}
              >
                {month.label}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-3 rounded-full border border-white/16 bg-white/12 px-4 py-2 text-sm font-black text-sky-50">
            Rok
            <select
              value={selectedYear}
              onChange={(event) => setSelectedYear(Number(event.currentTarget.value))}
              className="rounded-full border border-white/10 bg-sky-950 px-3 py-2 text-white outline-none"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-yellow-100">
              {visibleEntries.length} zážitků
            </p>
            <h2 className="mt-2 text-4xl font-black">
              {months.find((month) => month.value === selectedMonth)?.label} {selectedYear}
            </h2>
          </div>
          <p className="max-w-lg text-sm leading-6 text-sky-50/78">
            Barevné dny mají uložený zážitek. Šedé dny jsou zatím volné a čekají na nové prázdninové dobrodružství.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-7 gap-2 text-center text-xs font-black uppercase tracking-[0.16em] text-sky-100/70">
          {dayLabels.map((label) => (
            <div key={label} className="rounded-2xl bg-white/8 py-2">
              {label}
            </div>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-2">
          {buildCalendarDays(selectedYear, selectedMonth).map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="min-h-24 rounded-3xl bg-white/4 sm:min-h-32" />;
            }

            const dateKey = toDateKey(selectedYear, selectedMonth, day);
            const entry = entriesByDate.get(dateKey);
            const isToday = dateKey === todayKey();

            return (
              <button
                key={dateKey}
                type="button"
                disabled={!entry}
                onClick={() => entry && setActiveEntryId(entry.id)}
                className={`group relative min-h-24 overflow-hidden rounded-3xl border p-2 text-left transition sm:min-h-32 sm:p-3 ${
                  entry
                    ? "border-yellow-100/45 bg-gradient-to-br from-yellow-200/90 via-orange-200/85 to-sky-200/85 text-sky-950 shadow-xl shadow-sky-950/20 hover:-translate-y-1 hover:shadow-yellow-300/20"
                    : "border-white/8 bg-white/6 text-sky-100/45"
                } ${isToday ? "ring-2 ring-lime-200 ring-offset-2 ring-offset-[#06233d]" : ""}`}
              >
                <span className="relative z-10 inline-grid size-8 place-items-center rounded-full bg-white/75 text-sm font-black text-sky-950">
                  {day}
                </span>

                {entry?.imageUrl ? (
                  <Image
                    src={entry.imageUrl}
                    alt={entry.title}
                    fill
                    sizes="(min-width: 768px) 14vw, 25vw"
                    unoptimized
                    className="object-cover opacity-55 transition duration-300 group-hover:scale-105"
                  />
                ) : null}

                {entry ? <div className="absolute inset-0 bg-gradient-to-t from-white/85 via-white/25 to-transparent" /> : null}

                <div className="relative z-10 mt-4">
                  {entry ? (
                    <>
                      <p className="line-clamp-2 text-sm font-black leading-5">{entry.title}</p>
                      <p className="mt-1 hidden line-clamp-2 text-xs font-bold text-sky-950/72 sm:block">
                        {entry.description}
                      </p>
                    </>
                  ) : (
                    <span className="text-xs font-bold">volno</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {activeEntry ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-sky-950/88 p-4 backdrop-blur-xl">
          <div className="relative max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/18 bg-white text-sky-950 shadow-2xl shadow-black/45">
            <div className="grid max-h-[92vh] overflow-y-auto lg:grid-cols-[1.1fr_0.9fr]">
              <div className="relative min-h-72 bg-sky-100 lg:min-h-[620px]">
                {activeEntry.imageUrl ? (
                  <Image
                    src={activeEntry.imageUrl}
                    alt={activeEntry.title}
                    fill
                    sizes="(min-width: 1024px) 55vw, 100vw"
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="grid h-full min-h-72 place-items-center bg-gradient-to-br from-yellow-100 via-sky-100 to-lime-100 text-8xl">
                    ☀️
                  </div>
                )}
              </div>

              <div className="flex flex-col p-6 sm:p-8">
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-orange-500">
                  {formatCzechDate(activeEntry.entryDate)}
                </p>
                <h3 className="mt-3 text-4xl font-black leading-tight">{activeEntry.title}</h3>
                <p className="mt-5 whitespace-pre-line text-base leading-8 text-sky-950/78">
                  {activeEntry.description}
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={activeIndex <= 0}
                    onClick={() => setActiveEntryId(entries[activeIndex - 1]?.id ?? activeEntry.id)}
                    className="inline-flex h-12 items-center gap-2 rounded-full bg-sky-950 px-5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <ChevronLeft className="size-4" />
                    Předchozí
                  </button>
                  <button
                    type="button"
                    disabled={activeIndex >= entries.length - 1}
                    onClick={() => setActiveEntryId(entries[activeIndex + 1]?.id ?? activeEntry.id)}
                    className="inline-flex h-12 items-center gap-2 rounded-full bg-yellow-300 px-5 text-sm font-black text-yellow-950 disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    Další
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveEntryId(null)}
              className="absolute right-4 top-4 grid size-12 place-items-center rounded-full bg-sky-950 text-white shadow-xl"
              aria-label="Zavřít"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function buildCalendarDays(year: number, month: 7 | 8) {
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const mondayOffset = (firstDay.getUTCDay() + 6) % 7;
  const cells: Array<number | null> = Array.from({ length: mondayOffset }, () => null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(day);
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function toDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function todayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
