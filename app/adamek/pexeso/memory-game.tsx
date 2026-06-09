"use client";

import { ArrowLeft, RotateCcw, Sparkles, Trophy } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  getMemoryDifficulty,
  memoryDifficulties,
  type MemoryDifficulty,
  type MemoryTheme,
} from "@/lib/adamek";

type GameCard = {
  id: string;
  pairId: string;
  image: string;
  matched: boolean;
};

type GameState = "setup" | "playing" | "finished";

export function MemoryGame({ themes }: { themes: MemoryTheme[] }) {
  const [themeId, setThemeId] = useState(themes[0]?.id ?? "");
  const [difficulty, setDifficulty] = useState<MemoryDifficulty>("easy");
  const [cards, setCards] = useState<GameCard[]>([]);
  const [flippedIds, setFlippedIds] = useState<string[]>([]);
  const [state, setState] = useState<GameState>("setup");
  const [seconds, setSeconds] = useState(0);
  const [message, setMessage] = useState("");

  const selectedTheme = themes.find((theme) => theme.id === themeId) ?? themes[0];
  const selectedDifficulty = getMemoryDifficulty(difficulty);
  const matchedPairs = cards.filter((card) => card.matched).length / 2;
  const isBusy = flippedIds.length === 2;

  useEffect(() => {
    if (state !== "playing") {
      return;
    }

    const timer = window.setInterval(() => setSeconds((current) => current + 1), 1000);
    return () => window.clearInterval(timer);
  }, [state]);

  useEffect(() => {
    if (state !== "playing" || cards.length === 0 || matchedPairs !== selectedDifficulty.pairs) {
      return;
    }

    window.setTimeout(() => {
      setState("finished");
      playVictorySound();
    }, 0);
  }, [cards.length, matchedPairs, selectedDifficulty.pairs, state]);

  useEffect(() => {
    if (flippedIds.length !== 2) {
      return;
    }

    const [firstId, secondId] = flippedIds;
    const first = cards.find((card) => card.id === firstId);
    const second = cards.find((card) => card.id === secondId);

    if (!first || !second) {
      window.setTimeout(() => setFlippedIds([]), 0);
      return;
    }

    if (first.pairId === second.pairId) {
      window.setTimeout(() => {
        setCards((current) =>
          current.map((card) =>
            card.pairId === first.pairId ? { ...card, matched: true } : card,
          ),
        );
        setFlippedIds([]);
      }, 260);
      return;
    }

    const timeout = window.setTimeout(() => setFlippedIds([]), 850);
    return () => window.clearTimeout(timeout);
  }, [cards, flippedIds]);

  const gridColumns = useMemo(() => {
    if (selectedDifficulty.pairs >= 30) return "repeat(auto-fit, minmax(clamp(3.4rem, 10vw, 5.2rem), 1fr))";
    if (selectedDifficulty.pairs >= 15) return "repeat(auto-fit, minmax(clamp(4rem, 13vw, 6.4rem), 1fr))";
    return "repeat(auto-fit, minmax(clamp(4.8rem, 18vw, 7.5rem), 1fr))";
  }, [selectedDifficulty.pairs]);

  function startGame() {
    if (!selectedTheme) {
      setMessage("Nejdřív vytvoř téma v administraci.");
      return;
    }

    if (selectedTheme.images.length < selectedDifficulty.pairs) {
      setMessage(
        `Téma ${selectedTheme.name} zatím nemá dost obrázků. Pro ${selectedDifficulty.label} potřebuje ${selectedDifficulty.pairs} obrázků.`,
      );
      return;
    }

    setCards(createDeck(selectedTheme, selectedDifficulty.pairs));
    setFlippedIds([]);
    setSeconds(0);
    setMessage("");
    setState("playing");
  }

  function restartGame() {
    setState("setup");
    setCards([]);
    setFlippedIds([]);
    setSeconds(0);
    setMessage("");
  }

  function flipCard(card: GameCard) {
    if (state !== "playing" || isBusy || card.matched || flippedIds.includes(card.id)) {
      return;
    }

    setFlippedIds((current) => [...current, card.id]);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#07111f] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(250,204,21,0.25),transparent_24rem),radial-gradient(circle_at_86%_20%,rgba(56,189,248,0.24),transparent_28rem),radial-gradient(circle_at_50%_96%,rgba(244,114,182,0.2),transparent_30rem)]" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/adamek"
            className="inline-flex h-12 items-center gap-2 rounded-full border border-white/14 bg-white/10 px-4 text-sm font-bold text-white shadow-xl shadow-black/25 backdrop-blur-md transition-colors hover:bg-white/16"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
            Zpět
          </Link>
          <div className="flex flex-wrap items-center gap-2 rounded-full border border-white/12 bg-white/10 px-4 py-2 text-sm font-black text-sky-50 backdrop-blur-md">
            <span>Čas: {formatTime(seconds)}</span>
            <span className="text-white/35">|</span>
            <span>Dvojice: {matchedPairs}/{selectedDifficulty.pairs}</span>
          </div>
        </header>

        {state === "setup" ? (
          <SetupScreen
            themes={themes}
            themeId={themeId}
            difficulty={difficulty}
            message={message}
            onThemeChange={setThemeId}
            onDifficultyChange={setDifficulty}
            onStart={startGame}
          />
        ) : (
          <section className="flex flex-1 flex-col py-6">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-yellow-200">
                  {selectedTheme?.name ?? "Pexeso"}
                </p>
                <h1 className="mt-2 text-4xl font-black text-white sm:text-6xl">
                  Adamovo pexeso
                </h1>
              </div>
              <button
                type="button"
                onClick={restartGame}
                className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-5 text-sm font-black text-slate-950 shadow-xl shadow-black/20"
              >
                <RotateCcw className="size-5" aria-hidden="true" />
                Nová hra
              </button>
            </div>

            <div
              className="grid flex-1 content-center gap-2 sm:gap-3"
              style={{ gridTemplateColumns: gridColumns }}
            >
              {cards.map((card) => (
                <MemoryCard
                  key={card.id}
                  card={card}
                  open={card.matched || flippedIds.includes(card.id)}
                  onClick={() => flipCard(card)}
                />
              ))}
            </div>

            {state === "finished" ? (
              <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/70 px-4 backdrop-blur-sm">
                <div className="w-full max-w-xl rounded-[2rem] border border-yellow-200/40 bg-slate-950 p-7 text-center shadow-2xl shadow-yellow-950/30">
                  <div className="mx-auto grid size-20 place-items-center rounded-[1.5rem] bg-gradient-to-br from-yellow-300 to-pink-300 text-slate-950">
                    <Trophy className="size-11" aria-hidden="true" />
                  </div>
                  <h2 className="mt-5 text-4xl font-black text-white">Skvělá práce!</h2>
                  <p className="mt-3 text-lg leading-8 text-sky-50">
                    Našel jsi všech {selectedDifficulty.pairs} dvojic za {formatTime(seconds)}.
                  </p>
                  <button
                    type="button"
                    onClick={restartGame}
                    className="mt-6 h-14 rounded-full bg-gradient-to-r from-yellow-300 to-pink-300 px-8 text-lg font-black text-slate-950"
                  >
                    Hrát znovu
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        )}
      </div>
    </main>
  );
}

function SetupScreen({
  themes,
  themeId,
  difficulty,
  message,
  onThemeChange,
  onDifficultyChange,
  onStart,
}: {
  themes: MemoryTheme[];
  themeId: string;
  difficulty: MemoryDifficulty;
  message: string;
  onThemeChange: (value: string) => void;
  onDifficultyChange: (value: MemoryDifficulty) => void;
  onStart: () => void;
}) {
  return (
    <section className="flex flex-1 items-center justify-center py-10">
      <div className="w-full max-w-4xl rounded-[2.5rem] border border-white/14 bg-white/10 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-9">
        <div className="mx-auto grid size-20 place-items-center rounded-[1.75rem] bg-gradient-to-br from-yellow-300 via-orange-300 to-pink-300 text-4xl shadow-xl shadow-black/20">
          🙂
        </div>
        <p className="mt-7 text-center font-mono text-xs uppercase tracking-[0.32em] text-yellow-200">
          první hra
        </p>
        <h1 className="mt-3 text-center text-5xl font-black leading-none text-white drop-shadow-[0_5px_0_rgba(14,165,233,0.35)] sm:text-7xl">
          Adamovo pexeso
        </h1>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <label className="grid gap-3">
            <span className="text-lg font-black text-white">Vyber téma</span>
            <select
              value={themeId}
              onChange={(event) => onThemeChange(event.target.value)}
              className="h-14 rounded-2xl border border-white/14 bg-slate-950/70 px-4 text-lg font-bold text-white outline-none focus:ring-2 focus:ring-yellow-200"
            >
              {themes.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.name} ({theme.images.length} obrázků)
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-3">
            <span className="text-lg font-black text-white">Vyber obtížnost</span>
            <div className="grid gap-3 sm:grid-cols-3">
              {memoryDifficulties.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onDifficultyChange(item.id)}
                  className={`rounded-2xl border p-4 text-left transition-transform hover:-translate-y-1 ${
                    difficulty === item.id
                      ? "border-yellow-200 bg-white/18"
                      : "border-white/12 bg-slate-950/45"
                  }`}
                >
                  <span
                    className={`inline-flex rounded-full bg-gradient-to-r px-3 py-1 text-xs font-black ${item.tone}`}
                  >
                    {item.label}
                  </span>
                  <span className="mt-3 block text-sm font-bold text-sky-50">
                    {item.pairs} dvojic
                  </span>
                  <span className="text-sm text-sky-100/75">{item.cards} karet</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {message ? (
          <p className="mt-6 rounded-2xl border border-amber-200/30 bg-amber-200/12 px-4 py-3 text-center text-sm font-bold text-amber-50">
            {message}
          </p>
        ) : null}

        <button
          type="button"
          onClick={onStart}
          className="mt-8 inline-flex h-16 w-full items-center justify-center gap-3 rounded-[1.5rem] bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300 text-xl font-black text-slate-950 shadow-2xl shadow-orange-950/30 transition-transform hover:-translate-y-1"
        >
          <Sparkles className="size-6" aria-hidden="true" />
          Spustit hru
        </button>
      </div>
    </section>
  );
}

function MemoryCard({
  card,
  open,
  onClick,
}: {
  card: GameCard;
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={card.matched}
      className="group aspect-square min-h-0 rounded-2xl outline-none [perspective:900px] focus-visible:ring-4 focus-visible:ring-yellow-200"
      aria-label={open ? "Odkrytá karta" : "Zakrytá karta"}
    >
      <span
        className={`relative block size-full rounded-2xl transition-transform duration-300 [transform-style:preserve-3d] ${
          open ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        <span className="absolute inset-0 overflow-hidden rounded-2xl border-4 border-violet-200/40 bg-violet-700 shadow-xl shadow-black/30 [backface-visibility:hidden] group-hover:scale-[1.03]">
          <Image
            src="/adamek/card-back.svg"
            alt=""
            fill
            sizes="120px"
            className="object-cover"
            draggable={false}
          />
        </span>
        <span className="absolute inset-0 overflow-hidden rounded-2xl border-4 border-white/70 bg-white p-2 shadow-xl shadow-black/30 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <Image
            src={card.image}
            alt=""
            fill
            sizes="120px"
            unoptimized
            className="rounded-xl object-contain p-2"
            draggable={false}
          />
        </span>
      </span>
    </button>
  );
}

function createDeck(theme: MemoryTheme, pairs: number): GameCard[] {
  const selectedImages = shuffle(theme.images).slice(0, pairs);
  const cards = selectedImages.flatMap((image, index) => {
    const pairId = `${theme.id}-${index}`;

    return [
      { id: `${pairId}-a`, pairId, image, matched: false },
      { id: `${pairId}-b`, pairId, image, matched: false },
    ];
  });

  return shuffle(cards);
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function playVictorySound() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    return;
  }

  const context = new AudioContextClass();
  const notes = [523.25, 659.25, 783.99, 1046.5];

  notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = frequency;
    oscillator.type = "sine";
    gain.gain.setValueAtTime(0.0001, context.currentTime + index * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.2, context.currentTime + index * 0.12 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + index * 0.12 + 0.28);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(context.currentTime + index * 0.12);
    oscillator.stop(context.currentTime + index * 0.12 + 0.3);
  });
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
