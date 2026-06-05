"use client";

import { ArrowLeft, Check, KeyRound, Laugh, LockKeyhole, Save, Shield, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type Stage = "login" | "dashboard" | "caught";

const actions = [
  "Načítám interní projekty",
  "Ověřuji supertajné oprávnění",
  "Připravuji administrátorský panel",
];

export function FakeAdmin() {
  const [stage, setStage] = useState<Stage>("login");
  const [name, setName] = useState("Admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);

  const login = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (name.trim().toLowerCase() === "admin" && password.trim().toLowerCase() === "admin") {
      setError("");
      setStage("dashboard");
      return;
    }

    setError("Přístup zamítnut. Nápověda je podezřele blízko.");
  };

  const doAdminThing = () => {
    if (step >= actions.length - 1) {
      setStage("caught");
      return;
    }

    setStep((current) => current + 1);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050507] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(20,184,166,0.2),transparent_28rem),radial-gradient(circle_at_82%_72%,rgba(244,114,182,0.16),transparent_30rem)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:72px_72px] opacity-25" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-6 sm:px-8">
        <header className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex h-11 items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 text-sm font-semibold text-zinc-200 backdrop-blur-md transition-colors hover:bg-white/14 hover:text-white"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Zpět
          </Link>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-teal-200/75">
            private access
          </p>
        </header>

        <section className="flex flex-1 items-center justify-center py-14">
          {stage === "login" ? (
            <form
              onSubmit={login}
              className="w-full max-w-md rounded-[2rem] border border-white/12 bg-zinc-950/78 p-6 shadow-2xl shadow-black/50 backdrop-blur-2xl sm:p-8"
            >
              <div className="mb-7 grid size-14 place-items-center rounded-2xl bg-teal-200 text-zinc-950">
                <LockKeyhole className="size-7" aria-hidden="true" />
              </div>
              <h1 className="text-4xl font-semibold tracking-tight">Admin login</h1>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Přístup do experimentální administrace. Některé dveře jsou tady trochu hravé.
              </p>

              <label className="mt-7 grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
                  Jméno
                </span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="h-12 rounded-2xl border border-white/12 bg-white/8 px-4 text-white outline-none transition-colors focus:border-teal-200"
                />
              </label>

              <label className="mt-4 grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
                  Heslo
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-12 rounded-2xl border border-white/12 bg-white/8 px-4 text-white outline-none transition-colors focus:border-teal-200"
                  autoFocus
                />
              </label>

              {error ? (
                <p className="mt-4 rounded-2xl border border-pink-300/20 bg-pink-300/10 px-4 py-3 text-sm font-semibold text-pink-100">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-teal-200 px-5 text-sm font-bold text-zinc-950 transition-colors hover:bg-white"
              >
                <KeyRound className="size-4" aria-hidden="true" />
                Přihlásit
              </button>
            </form>
          ) : null}

          {stage === "dashboard" ? (
            <div className="w-full max-w-3xl rounded-[2rem] border border-white/12 bg-zinc-950/78 p-6 shadow-2xl shadow-black/50 backdrop-blur-2xl sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.28em] text-teal-200/75">
                    fake admin
                  </p>
                  <h1 className="mt-2 text-4xl font-semibold tracking-tight">Vítej, Admin</h1>
                </div>
                <div className="grid size-14 place-items-center rounded-2xl bg-white/8 text-teal-200">
                  <Shield className="size-7" aria-hidden="true" />
                </div>
              </div>

              <div className="mt-8 grid gap-3">
                {actions.map((item, index) => (
                  <div
                    key={item}
                    className={`flex items-center gap-3 rounded-2xl border p-4 ${
                      index <= step
                        ? "border-teal-200/30 bg-teal-200/10 text-teal-50"
                        : "border-white/10 bg-white/6 text-zinc-400"
                    }`}
                  >
                    <span className="grid size-9 place-items-center rounded-full bg-black/25">
                      {index < step ? <Check className="size-4" /> : index + 1}
                    </span>
                    <span className="font-semibold">{item}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={doAdminThing}
                className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-teal-200 px-6 text-sm font-bold text-zinc-950 transition-colors hover:bg-white"
              >
                <Save className="size-4" aria-hidden="true" />
                Pokračovat v administraci
              </button>
            </div>
          ) : null}

          {stage === "caught" ? (
            <div className="w-full max-w-2xl rounded-[2rem] border border-pink-200/20 bg-zinc-950/82 p-7 text-center shadow-2xl shadow-black/50 backdrop-blur-2xl sm:p-10">
              <div className="mx-auto grid size-20 place-items-center rounded-[1.5rem] bg-pink-200 text-zinc-950">
                <Laugh className="size-10" aria-hidden="true" />
              </div>
              <p className="mt-7 font-mono text-xs uppercase tracking-[0.28em] text-pink-200">
                audit complete
              </p>
              <h1 className="mt-3 text-5xl font-semibold tracking-tight">Nachytán!</h1>
              <p className="mx-auto mt-5 max-w-lg text-lg leading-8 text-zinc-300">
                Tohle byla jen falešná administrace. Skutečný vstup bude později,
                ale tajná tečka funguje výborně.
              </p>
              <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-5 py-3 text-sm font-semibold text-zinc-200">
                <Sparkles className="size-4 text-teal-200" aria-hidden="true" />
                Systém se ti právě zasmál.
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
