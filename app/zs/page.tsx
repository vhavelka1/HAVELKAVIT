import { ArrowLeft, Keyboard, Sparkles } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "ZŠ Aktivity | Výukové aplikace",
  description: "Rozcestník výukových aplikací pro školní děti.",
};

const apps = [
  {
    title: "Psaní na klávesnici",
    description:
      "Procvičej jednotlivé znaky na české klávesnici, sbírej combo a zapiš se do žebříčku.",
    href: "/zs/psani-na-klavesnici",
    accent: "from-cyan-300 via-lime-200 to-yellow-200",
    icon: Keyboard,
    action: "Spustit",
  },
];

export default function SchoolActivitiesPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#07111f] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_16%_20%,rgba(34,211,238,0.24),transparent_24rem),radial-gradient(circle_at_84%_22%,rgba(190,242,100,0.22),transparent_28rem),radial-gradient(circle_at_52%_92%,rgba(251,191,36,0.18),transparent_30rem)]" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex h-12 items-center gap-2 rounded-full border border-white/14 bg-white/10 px-5 text-sm font-bold text-white shadow-xl shadow-black/25 backdrop-blur-md transition-colors hover:bg-white/16"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
            Zpět
          </Link>
          <div className="inline-flex h-12 items-center gap-2 rounded-full border border-cyan-200/30 bg-cyan-200 px-5 text-sm font-black text-slate-950 shadow-xl shadow-cyan-950/20">
            <Sparkles className="size-5" aria-hidden="true" />
            Výukové aplikace
          </div>
        </header>

        <section className="flex flex-1 flex-col justify-center py-12">
          <p className="font-mono text-xs uppercase tracking-[0.32em] text-cyan-200">
            ZŠ Aktivity
          </p>
          <h1 className="mt-4 max-w-4xl text-5xl font-black leading-none text-white drop-shadow-[0_6px_0_rgba(8,145,178,0.35)] sm:text-7xl">
            Hry, které pomáhají trénovat
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-cyan-50">
            Vyber aplikaci a pusť se do krátkého cvičení. Časem tady můžou přibývat další
            školní hry a tréninky.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {apps.map((app) => {
              const Icon = app.icon;

              return (
                <Link
                  key={app.href}
                  href={app.href}
                  className="group rounded-[2rem] border border-white/14 bg-white/10 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl transition-transform hover:-translate-y-1"
                >
                  <div
                    className={`grid size-18 place-items-center rounded-[1.5rem] bg-gradient-to-br ${app.accent} text-slate-950 shadow-xl shadow-black/25`}
                  >
                    <Icon className="size-10" aria-hidden="true" />
                  </div>
                  <h2 className="mt-6 text-3xl font-black text-white">{app.title}</h2>
                  <p className="mt-3 text-base leading-7 text-cyan-100">{app.description}</p>
                  <span className="mt-6 inline-flex h-12 items-center rounded-full bg-white px-5 text-sm font-black text-slate-950 transition-colors group-hover:bg-lime-200">
                    {app.action}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
