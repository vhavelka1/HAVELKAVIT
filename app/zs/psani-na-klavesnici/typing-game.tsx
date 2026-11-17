"use client";

import {
  ArrowLeft,
  BarChart3,
  Keyboard,
  Medal,
  Play,
  RotateCcw,
  Timer,
  Trophy,
  X,
} from "lucide-react";
import Link from "next/link";
import { inappropriateNicknameMessage, isInappropriateNickname } from "@/lib/nickname";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  calculateTypingMetrics,
  createTypingChallenge,
  getTypingMedal,
  typingDifficulties,
  typingPeriods,
  typingRoundLength,
  type TypingDifficulty,
  type TypingPeriod,
  type TypingResult,
} from "@/lib/marcelka";

type GameState = "setup" | "playing" | "finished";
type FlashState = "correct" | "wrong" | undefined;

const playerNameStorageKey = "marcelkaTypingPlayerName";
const schoolStorageKey = "marcelkaTypingSchool";
const classStorageKey = "marcelkaTypingClass";
const ignoredKeys = new Set([
  "Shift",
  "Control",
  "Alt",
  "AltGraph",
  "Meta",
  "CapsLock",
  "Tab",
  "Escape",
  "Enter",
  "Backspace",
  "Delete",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Home",
  "End",
  "PageUp",
  "PageDown",
]);

export function KeyboardTypingGame({ initialResults }: { initialResults: TypingResult[] }) {
  const [playerName, setPlayerName] = useState(() =>
    typeof window === "undefined" ? "" : window.localStorage.getItem(playerNameStorageKey) ?? "",
  );
  const [school, setSchool] = useState(() =>
    typeof window === "undefined" ? "" : window.localStorage.getItem(schoolStorageKey) ?? "",
  );
  const [className, setClassName] = useState(() =>
    typeof window === "undefined" ? "" : window.localStorage.getItem(classStorageKey) ?? "",
  );
  const [difficulty, setDifficulty] = useState<TypingDifficulty>("beginner");
  const [state, setState] = useState<GameState>("setup");
  const [challenge, setChallenge] = useState<string[]>([]);
  const [position, setPosition] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finishedElapsedMs, setFinishedElapsedMs] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [flash, setFlash] = useState<FlashState>();
  const [message, setMessage] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [lastResult, setLastResult] = useState<TypingResult | null>(null);
  const [results, setResults] = useState<TypingResult[]>(initialResults);
  const [leaderboardDifficulty, setLeaderboardDifficulty] =
    useState<TypingDifficulty>("beginner");
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<TypingPeriod>("all");
  const [schoolFilter, setSchoolFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const gameAreaRef = useRef<HTMLDivElement>(null);

  const currentCharacter = challenge[position] ?? "";
  const liveElapsedMs = state === "finished" ? finishedElapsedMs : elapsedMs;

  useEffect(() => {
    if (state !== "playing" || startedAt === null) {
      return;
    }

    const timer = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 100);

    return () => window.clearInterval(timer);
  }, [startedAt, state]);

  useEffect(() => {
    if (state !== "playing") {
      return;
    }

    gameAreaRef.current?.focus();
  }, [state]);

  const finishGame = useCallback(
    (finalElapsedMs: number, finalMistakes: number, finalMaxCombo: number) => {
      const metrics = calculateTypingMetrics({
        difficulty,
        elapsedMs: finalElapsedMs,
        mistakes: finalMistakes,
        maxCombo: finalMaxCombo,
      });
      const result: TypingResult = {
        id: `local-${Date.now()}`,
        playerName: playerName.trim(),
        school: school.trim(),
        className: className.trim(),
        difficulty,
        points: metrics.points,
        elapsedMs: finalElapsedMs,
        mistakes: finalMistakes,
        accuracy: metrics.accuracy,
        maxCombo: finalMaxCombo,
        charsPerMinute: metrics.charsPerMinute,
        createdAt: new Date().toISOString(),
      };

      setFinishedElapsedMs(finalElapsedMs);
      setElapsedMs(finalElapsedMs);
      setLastResult(result);
      setState("finished");
      setSaveMessage("Ukládám výsledek...");
      void saveResult(result)
        .then(({ result: savedResult, results: nextResults }) => {
          setLastResult(savedResult);
          setResults(nextResults.length > 0 ? nextResults : [savedResult, ...results]);
          setSaveMessage("");
        })
        .catch(() => {
          setResults((current) => [result, ...current]);
          setSaveMessage("Výsledek se nepodařilo uložit do databáze.");
        });
    },
    [difficulty, playerName, school, className, results],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (state !== "playing" || event.repeat || ignoredKeys.has(event.key)) {
        return;
      }

      if (event.key.length !== 1) {
        return;
      }

      event.preventDefault();

      const startTime = startedAt ?? Date.now();

      if (startedAt === null) {
        setStartedAt(startTime);
        setElapsedMs(0);
      }

      if (event.key === currentCharacter) {
        const nextPosition = position + 1;
        const nextCombo = combo + 1;
        const nextMaxCombo = Math.max(maxCombo, nextCombo);
        const finalElapsedMs = Date.now() - startTime;

        setFlash("correct");
        window.setTimeout(() => setFlash(undefined), 180);
        setCombo(nextCombo);
        setMaxCombo(nextMaxCombo);
        setPosition(nextPosition);

        if (nextPosition >= typingRoundLength) {
          finishGame(finalElapsedMs, mistakes, nextMaxCombo);
        }

        return;
      }

      setFlash("wrong");
      window.setTimeout(() => setFlash(undefined), 220);
      setMistakes((value) => value + 1);
      setCombo(0);
    },
    [
      combo,
      currentCharacter,
      finishGame,
      maxCombo,
      mistakes,
      position,
      startedAt,
      state,
    ],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (!showLeaderboard && state !== "setup" && state !== "finished") {
      return;
    }

    const params = new URLSearchParams({
      difficulty: leaderboardDifficulty,
      period: leaderboardPeriod,
    });

    if (schoolFilter.trim()) {
      params.set("school", schoolFilter.trim());
    }

    if (classFilter.trim()) {
      params.set("className", classFilter.trim());
    }

    void fetch(`/api/zs/typing-results?${params.toString()}`)
      .then((response) => (response.ok ? response.json() : undefined))
      .then((payload: { results?: TypingResult[] } | undefined) => {
        if (Array.isArray(payload?.results)) {
          setResults(payload.results);
        }
      })
      .catch(() => undefined);
  }, [
    classFilter,
    leaderboardDifficulty,
    leaderboardPeriod,
    schoolFilter,
    showLeaderboard,
    state,
  ]);

  function startGame() {
    const cleanName = playerName.trim();

    if (!cleanName) {
      setMessage("Nejdříve napiš jméno nebo přezdívku.");
      return;
    }

    if (isInappropriateNickname(cleanName)) {
      setMessage(inappropriateNicknameMessage);
      return;
    }

    window.localStorage.setItem(playerNameStorageKey, cleanName);
    window.localStorage.setItem(schoolStorageKey, school.trim());
    window.localStorage.setItem(classStorageKey, className.trim());
    setChallenge(createTypingChallenge(difficulty));
    setPosition(0);
    setMistakes(0);
    setCombo(0);
    setMaxCombo(0);
    setStartedAt(null);
    setFinishedElapsedMs(0);
    setElapsedMs(0);
    setFlash(undefined);
    setMessage("");
    setSaveMessage("");
    setLastResult(null);
    setLeaderboardDifficulty(difficulty);
    setShowLeaderboard(false);
    setState("playing");
  }

  function restartGame() {
    setState("setup");
    setChallenge([]);
    setPosition(0);
    setMistakes(0);
    setCombo(0);
    setMaxCombo(0);
    setStartedAt(null);
    setFinishedElapsedMs(0);
    setElapsedMs(0);
    setFlash(undefined);
    setMessage("");
    setSaveMessage("");
  }

  function openLeaderboard() {
    setLeaderboardDifficulty(difficulty);
    setShowLeaderboard(true);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#081225] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_14%_16%,rgba(45,212,191,0.26),transparent_24rem),radial-gradient(circle_at_84%_18%,rgba(250,204,21,0.23),transparent_28rem),radial-gradient(circle_at_52%_94%,rgba(244,114,182,0.2),transparent_32rem)]" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/zs"
            className="inline-flex h-12 items-center gap-2 rounded-full border border-white/14 bg-white/10 px-4 text-sm font-bold text-white shadow-xl shadow-black/25 backdrop-blur-md transition-colors hover:bg-white/16"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
            Zpět
          </Link>
          <div className="flex flex-wrap items-center gap-2 rounded-full border border-white/12 bg-white/10 px-4 py-2 text-sm font-black text-cyan-50 backdrop-blur-md">
            <Timer className="size-4" aria-hidden="true" />
            <span>{formatTime(liveElapsedMs)}</span>
            <span className="text-white/35">|</span>
            <span>
              {position}/{typingRoundLength}
            </span>
            <span className="text-white/35">|</span>
            <span>Chyby: {mistakes}</span>
            <span className="text-white/35">|</span>
            <span>Combo: {combo}</span>
          </div>
        </header>

        {state === "setup" ? (
          <SetupScreen
            playerName={playerName}
            school={school}
            className={className}
            difficulty={difficulty}
            message={message}
            results={results}
            leaderboardDifficulty={leaderboardDifficulty}
            leaderboardPeriod={leaderboardPeriod}
            schoolFilter={schoolFilter}
            classFilter={classFilter}
            onPlayerNameChange={setPlayerName}
            onSchoolChange={setSchool}
            onClassNameChange={setClassName}
            onDifficultyChange={setDifficulty}
            onLeaderboardDifficultyChange={setLeaderboardDifficulty}
            onLeaderboardPeriodChange={setLeaderboardPeriod}
            onSchoolFilterChange={setSchoolFilter}
            onClassFilterChange={setClassFilter}
            onStart={startGame}
          />
        ) : state === "playing" ? (
          <section
            ref={gameAreaRef}
            tabIndex={-1}
            className="flex flex-1 flex-col justify-center py-8 outline-none"
          >
            <div className="mx-auto w-full max-w-4xl text-center">
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-lime-200">
                České rozložení klávesnice
              </p>
              <h1 className="mt-3 text-4xl font-black leading-none text-white sm:text-6xl">
                Napiš znak na klávesnici
              </h1>
              <div
                className={`mx-auto mt-10 grid aspect-square w-full max-w-[22rem] place-items-center rounded-[2rem] border-4 text-[8rem] font-black leading-none shadow-2xl transition-all sm:max-w-[28rem] sm:text-[11rem] ${
                  flash === "correct"
                    ? "scale-105 border-lime-200 bg-lime-300 text-lime-950 shadow-lime-950/30"
                    : flash === "wrong"
                      ? "scale-95 border-rose-200 bg-rose-400 text-white shadow-rose-950/35"
                      : "border-white/18 bg-white/12 text-white shadow-black/35"
                }`}
              >
                {currentCharacter}
              </div>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={restartGame}
                  className="inline-flex h-13 items-center gap-2 rounded-full bg-white px-5 text-sm font-black text-slate-950 shadow-xl shadow-black/20"
                >
                  <X className="size-5" aria-hidden="true" />
                  Ukončit
                </button>
                <button
                  type="button"
                  onClick={restartGame}
                  className="inline-flex h-13 items-center gap-2 rounded-full border border-white/14 bg-white/10 px-5 text-sm font-black text-white shadow-xl shadow-black/20 backdrop-blur-md"
                >
                  <RotateCcw className="size-5" aria-hidden="true" />
                  Začít znovu
                </button>
              </div>
            </div>
          </section>
        ) : (
          <FinishedScreen
            result={lastResult}
            saveMessage={saveMessage}
            onRestart={restartGame}
            onLeaderboard={openLeaderboard}
          />
        )}
      </div>

      {showLeaderboard ? (
        <LeaderboardModal
          results={results}
          difficulty={leaderboardDifficulty}
          period={leaderboardPeriod}
          schoolFilter={schoolFilter}
          classFilter={classFilter}
          onDifficultyChange={setLeaderboardDifficulty}
          onPeriodChange={setLeaderboardPeriod}
          onSchoolFilterChange={setSchoolFilter}
          onClassFilterChange={setClassFilter}
          onClose={() => setShowLeaderboard(false)}
        />
      ) : null}
    </main>
  );
}

function SetupScreen({
  playerName,
  school,
  className,
  difficulty,
  message,
  results,
  leaderboardDifficulty,
  leaderboardPeriod,
  schoolFilter,
  classFilter,
  onPlayerNameChange,
  onSchoolChange,
  onClassNameChange,
  onDifficultyChange,
  onLeaderboardDifficultyChange,
  onLeaderboardPeriodChange,
  onSchoolFilterChange,
  onClassFilterChange,
  onStart,
}: {
  playerName: string;
  school: string;
  className: string;
  difficulty: TypingDifficulty;
  message: string;
  results: TypingResult[];
  leaderboardDifficulty: TypingDifficulty;
  leaderboardPeriod: TypingPeriod;
  schoolFilter: string;
  classFilter: string;
  onPlayerNameChange: (value: string) => void;
  onSchoolChange: (value: string) => void;
  onClassNameChange: (value: string) => void;
  onDifficultyChange: (value: TypingDifficulty) => void;
  onLeaderboardDifficultyChange: (value: TypingDifficulty) => void;
  onLeaderboardPeriodChange: (value: TypingPeriod) => void;
  onSchoolFilterChange: (value: string) => void;
  onClassFilterChange: (value: string) => void;
  onStart: () => void;
}) {
  return (
    <section className="flex flex-1 items-center justify-center py-10">
      <div className="w-full max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.86fr]">
          <div className="rounded-[2rem] border border-white/14 bg-white/10 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
            <div className="grid size-18 place-items-center rounded-[1.5rem] bg-gradient-to-br from-cyan-300 via-lime-200 to-yellow-200 text-slate-950 shadow-xl shadow-black/20">
              <Keyboard className="size-10" aria-hidden="true" />
            </div>
            <p className="mt-7 font-mono text-xs uppercase tracking-[0.32em] text-cyan-200">
              ZŠ Aktivity / trénink
            </p>
            <h1 className="mt-3 text-5xl font-black leading-none text-white drop-shadow-[0_5px_0_rgba(20,184,166,0.35)] sm:text-7xl">
              Psaní na klávesnici
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-cyan-50">
              Před startem přepni počítač na české rozložení klávesnice. Hra rozlišuje malá a
              velká písmena i českou diakritiku podle skutečně stisknuté klávesy.
            </p>

            <div className="mt-7 grid gap-4 sm:grid-cols-3">
              <label className="grid min-w-0 gap-2 sm:col-span-3">
                <span className="text-sm font-black text-white">Jméno nebo přezdívka</span>
                <input
                  value={playerName}
                  onChange={(event) => onPlayerNameChange(event.target.value)}
                  maxLength={40}
                  placeholder="Napiš přezdívku..."
                  className="h-13 w-full min-w-0 rounded-2xl border border-white/14 bg-slate-950/70 px-4 text-base font-bold text-white outline-none placeholder:text-white/35 focus:ring-2 focus:ring-lime-200"
                />
              </label>
              <label className="grid min-w-0 gap-2 sm:col-span-2">
                <span className="text-sm font-black text-white">Škola</span>
                <input
                  value={school}
                  onChange={(event) => onSchoolChange(event.target.value)}
                  maxLength={60}
                  placeholder="Nepovinné"
                  className="h-13 w-full min-w-0 rounded-2xl border border-white/14 bg-slate-950/70 px-4 text-base font-bold text-white outline-none placeholder:text-white/35 focus:ring-2 focus:ring-lime-200"
                />
              </label>
              <label className="grid min-w-0 gap-2">
                <span className="text-sm font-black text-white">Třída</span>
                <input
                  value={className}
                  onChange={(event) => onClassNameChange(event.target.value)}
                  maxLength={30}
                  placeholder="Nepovinné"
                  className="h-13 w-full min-w-0 rounded-2xl border border-white/14 bg-slate-950/70 px-4 text-base font-bold text-white outline-none placeholder:text-white/35 focus:ring-2 focus:ring-lime-200"
                />
              </label>
            </div>

            <div className="mt-6 grid gap-3">
              <span className="text-sm font-black text-white">Obtížnost</span>
              <div className="grid gap-3 lg:grid-cols-3">
                {typingDifficulties.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onDifficultyChange(item.id)}
                    className={`rounded-2xl border p-4 text-left transition-transform hover:-translate-y-1 ${
                      difficulty === item.id
                        ? "border-lime-200 bg-white/18"
                        : "border-white/12 bg-slate-950/45"
                    }`}
                  >
                    <span
                      className={`inline-flex rounded-full bg-gradient-to-r px-3 py-1 text-xs font-black ${item.tone}`}
                    >
                      {item.shortLabel}. {item.label}
                    </span>
                    <span className="mt-3 block text-sm font-bold text-cyan-50">
                      {item.description}
                    </span>
                    <span className="mt-2 block text-xs font-semibold text-cyan-100/70">
                      {typingRoundLength} správných znaků
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {message ? (
              <p role="alert" className="mt-5 rounded-2xl border border-amber-200/30 bg-amber-200/12 px-4 py-3 text-sm font-bold text-amber-50">
                {message}
              </p>
            ) : null}

            <button
              type="button"
              onClick={onStart}
              className="mt-7 inline-flex h-16 w-full items-center justify-center gap-3 rounded-[1.5rem] bg-gradient-to-r from-cyan-300 via-lime-200 to-yellow-200 text-xl font-black text-slate-950 shadow-2xl shadow-cyan-950/30 transition-transform hover:-translate-y-1"
            >
              <Play className="size-6" aria-hidden="true" />
              Spustit hru
            </button>
          </div>

          <LeaderboardPanel
            results={results}
            difficulty={leaderboardDifficulty}
            period={leaderboardPeriod}
            schoolFilter={schoolFilter}
            classFilter={classFilter}
            onDifficultyChange={onLeaderboardDifficultyChange}
            onPeriodChange={onLeaderboardPeriodChange}
            onSchoolFilterChange={onSchoolFilterChange}
            onClassFilterChange={onClassFilterChange}
          />
        </div>
      </div>
    </section>
  );
}

function FinishedScreen({
  result,
  saveMessage,
  onRestart,
  onLeaderboard,
}: {
  result: TypingResult | null;
  saveMessage: string;
  onRestart: () => void;
  onLeaderboard: () => void;
}) {
  const medal = getTypingMedal(result?.points ?? 0, result?.accuracy ?? 0);

  if (!result) {
    return null;
  }

  return (
    <section className="flex flex-1 items-center justify-center py-10">
      <div className="w-full max-w-4xl rounded-[2rem] border border-white/14 bg-white/10 p-6 text-center shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
        <div className={`mx-auto grid size-22 place-items-center rounded-[1.5rem] bg-gradient-to-br ${medal.tone}`}>
          <Trophy className="size-12" aria-hidden="true" />
        </div>
        <p className="mt-6 font-mono text-xs uppercase tracking-[0.32em] text-lime-200">
          Dokončeno
        </p>
        <h1 className="mt-3 text-5xl font-black text-white">{medal.label}</h1>
        <p className="mt-4 text-lg leading-8 text-cyan-50">
          {result.playerName}, napsal/a jsi {typingRoundLength} znaků za {formatTime(result.elapsedMs)}.
        </p>

        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ResultStat label="Body" value={String(result.points)} />
          <ResultStat label="Chyby" value={String(result.mistakes)} />
          <ResultStat label="Přesnost" value={`${result.accuracy.toFixed(1)} %`} />
          <ResultStat label="Rychlost" value={`${result.charsPerMinute.toFixed(1)} zn./min`} />
          <ResultStat label="Nejdelší combo" value={String(result.maxCombo)} />
          <ResultStat label="Čas" value={formatTime(result.elapsedMs)} />
        </div>

        <p className="mt-5 rounded-2xl border border-white/12 bg-slate-950/45 px-4 py-3 text-sm font-semibold leading-6 text-cyan-50">
          Body = rychlost až 1260 bodů, přesnost až 1500 bodů, combo až 600 bodů minus 12
          bodů za každou chybu. Každá obtížnost má vlastní žebříček.
        </p>

        {saveMessage ? (
          <p className="mt-4 rounded-2xl border border-amber-200/30 bg-amber-200/12 px-4 py-3 text-sm font-bold text-amber-50">
            {saveMessage}
          </p>
        ) : null}

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={onRestart}
            className="inline-flex h-13 items-center gap-2 rounded-full bg-white px-5 text-sm font-black text-slate-950 shadow-xl shadow-black/20"
          >
            <RotateCcw className="size-5" aria-hidden="true" />
            Hrát znovu
          </button>
          <button
            type="button"
            onClick={onLeaderboard}
            className="inline-flex h-13 items-center gap-2 rounded-full bg-lime-200 px-5 text-sm font-black text-slate-950 shadow-xl shadow-black/20"
          >
            <BarChart3 className="size-5" aria-hidden="true" />
            Žebříček
          </button>
          <Link
            href="/zs"
            className="inline-flex h-13 items-center gap-2 rounded-full border border-white/14 bg-white/10 px-5 text-sm font-black text-white shadow-xl shadow-black/20 backdrop-blur-md"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
            Zpět
          </Link>
        </div>
      </div>
    </section>
  );
}

function ResultStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/12 bg-slate-950/45 p-4 text-left">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function LeaderboardModal({
  results,
  difficulty,
  period,
  schoolFilter,
  classFilter,
  onDifficultyChange,
  onPeriodChange,
  onSchoolFilterChange,
  onClassFilterChange,
  onClose,
}: {
  results: TypingResult[];
  difficulty: TypingDifficulty;
  period: TypingPeriod;
  schoolFilter: string;
  classFilter: string;
  onDifficultyChange: (value: TypingDifficulty) => void;
  onPeriodChange: (value: TypingPeriod) => void;
  onSchoolFilterChange: (value: string) => void;
  onClassFilterChange: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/72 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-full w-full max-w-5xl overflow-y-auto rounded-[2rem] border border-white/14 bg-[#081225] p-5 shadow-2xl shadow-black/50 sm:p-7">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-3xl font-black text-white">Žebříček</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid size-11 place-items-center rounded-full bg-white text-slate-950"
            aria-label="Zavřít žebříček"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <LeaderboardPanel
          results={results}
          difficulty={difficulty}
          period={period}
          schoolFilter={schoolFilter}
          classFilter={classFilter}
          onDifficultyChange={onDifficultyChange}
          onPeriodChange={onPeriodChange}
          onSchoolFilterChange={onSchoolFilterChange}
          onClassFilterChange={onClassFilterChange}
        />
      </div>
    </div>
  );
}

function LeaderboardPanel({
  results,
  difficulty,
  period,
  schoolFilter,
  classFilter,
  onDifficultyChange,
  onPeriodChange,
  onSchoolFilterChange,
  onClassFilterChange,
}: {
  results: TypingResult[];
  difficulty: TypingDifficulty;
  period: TypingPeriod;
  schoolFilter: string;
  classFilter: string;
  onDifficultyChange: (value: TypingDifficulty) => void;
  onPeriodChange: (value: TypingPeriod) => void;
  onSchoolFilterChange: (value: string) => void;
  onClassFilterChange: (value: string) => void;
}) {
  const filteredResults = useMemo(
    () => results.filter((result) => result.difficulty === difficulty).slice(0, 10),
    [difficulty, results],
  );

  return (
    <section className="rounded-[2rem] border border-white/14 bg-white/10 p-5 shadow-2xl shadow-black/25 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.26em] text-lime-200">
            Veřejné výsledky
          </p>
          <h2 className="mt-2 text-3xl font-black text-white">Žebříček</h2>
        </div>
        <Medal className="size-9 text-yellow-200" aria-hidden="true" />
      </div>

      <div className="mt-5 grid gap-3">
        <div className="flex flex-wrap gap-2">
          {typingDifficulties.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onDifficultyChange(item.id)}
              className={`h-10 rounded-full px-4 text-xs font-black ${
                difficulty === item.id ? "bg-lime-200 text-slate-950" : "bg-white/10 text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {typingPeriods.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onPeriodChange(item.id)}
              className={`h-10 rounded-full px-4 text-xs font-black ${
                period === item.id ? "bg-cyan-200 text-slate-950" : "bg-white/10 text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={schoolFilter}
            onChange={(event) => onSchoolFilterChange(event.target.value)}
            placeholder="Filtrovat školu"
            className="h-11 rounded-2xl border border-white/14 bg-slate-950/70 px-4 text-sm font-bold text-white outline-none placeholder:text-white/35 focus:ring-2 focus:ring-cyan-200"
          />
          <input
            value={classFilter}
            onChange={(event) => onClassFilterChange(event.target.value)}
            placeholder="Filtrovat třídu"
            className="h-11 rounded-2xl border border-white/14 bg-slate-950/70 px-4 text-sm font-bold text-white outline-none placeholder:text-white/35 focus:ring-2 focus:ring-cyan-200"
          />
        </div>
      </div>

      <ol className="mt-5 space-y-2">
        {filteredResults.length === 0 ? (
          <li className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-5 text-sm font-bold text-cyan-50">
            Zatím tu není žádný výsledek.
          </li>
        ) : (
          filteredResults.map((result, index) => (
            <li
              key={result.id}
              className={`grid gap-3 rounded-2xl border px-4 py-3 text-sm sm:grid-cols-[3rem_1fr_auto_auto_auto_auto] sm:items-center ${
                index === 0
                  ? "border-yellow-200/50 bg-yellow-200/18"
                  : index === 1
                    ? "border-slate-200/40 bg-white/12"
                    : index === 2
                      ? "border-orange-300/40 bg-orange-300/12"
                      : "border-white/10 bg-slate-950/45"
              }`}
            >
              <span className="text-xl font-black text-yellow-100">{medalForPlace(index)}</span>
              <span className="min-w-0">
                <span className="block truncate text-base font-black text-white">
                  {result.playerName}
                </span>
                <span className="block truncate text-xs font-semibold text-cyan-100/65">
                  {[result.school, result.className].filter(Boolean).join(" / ") || "Bez školy"}
                </span>
              </span>
              <span className="font-black text-white">{result.points} b.</span>
              <span className="font-bold text-cyan-50">{formatTime(result.elapsedMs)}</span>
              <span className="font-bold text-cyan-50">{result.accuracy.toFixed(1)} %</span>
              <span className="text-xs font-semibold text-cyan-100/70">
                {formatDate(result.createdAt)}
              </span>
            </li>
          ))
        )}
      </ol>
    </section>
  );
}

async function saveResult(result: TypingResult) {
  const response = await fetch("/api/zs/typing-results", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      playerName: result.playerName,
      school: result.school,
      className: result.className,
      difficulty: result.difficulty,
      elapsedMs: result.elapsedMs,
      mistakes: result.mistakes,
      maxCombo: result.maxCombo,
    }),
  });

  if (!response.ok) {
    throw new Error("Typing result could not be saved.");
  }

  return (await response.json()) as { result: TypingResult; results: TypingResult[] };
}

function medalForPlace(index: number) {
  if (index === 0) {
    return "1.";
  }

  if (index === 1) {
    return "2.";
  }

  if (index === 2) {
    return "3.";
  }

  return `${index + 1}.`;
}

function formatTime(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const tenths = Math.floor((Math.max(0, ms) % 1000) / 100);

  return `${minutes}:${String(seconds).padStart(2, "0")}.${tenths}`;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("cs-CZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}
