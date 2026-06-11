import Link from "next/link";

export const metadata = {
  title: "Adámek | Playground",
  description: "Adamův playground pro hry a malé projekty.",
};

const games = [
  {
    title: "Adamovo pexeso",
    description: "Barevné pexeso s vlastními tématy a velkými kartami.",
    href: "/adamek/pexeso",
    accent: "from-yellow-300 via-orange-300 to-pink-300",
  },
];

export default function AdamekPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#06111f] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(250,204,21,0.24),transparent_24rem),radial-gradient(circle_at_82%_28%,rgba(56,189,248,0.22),transparent_26rem),radial-gradient(circle_at_50%_92%,rgba(244,114,182,0.18),transparent_28rem)]" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex h-12 items-center rounded-full border border-white/14 bg-white/10 px-5 text-sm font-bold text-white shadow-xl shadow-black/25 backdrop-blur-md transition-colors hover:bg-white/16"
          >
            Zpět
          </Link>
          <Link
            href="/adamek/admin"
            className="inline-flex h-12 items-center rounded-full border border-yellow-200/30 bg-yellow-200 px-5 text-sm font-black text-slate-950 shadow-xl shadow-yellow-950/20 transition-colors hover:bg-white"
          >
            Login
          </Link>
        </header>

        <section className="flex flex-1 flex-col justify-center py-12">
          <p className="font-mono text-xs uppercase tracking-[0.32em] text-yellow-200">
            Adámkův svět
          </p>
          <h1 className="mt-4 max-w-3xl text-5xl font-black leading-none text-white drop-shadow-[0_6px_0_rgba(234,88,12,0.35)] sm:text-7xl">
            Adamův Playground
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-sky-50">
            Místo pro hry, objevování a malé projekty. První připravená hra je pexeso.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {games.map((game) => (
              <Link
                key={game.href}
                href={game.href}
                className="group rounded-[2rem] border border-white/14 bg-white/10 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl transition-transform hover:-translate-y-1"
              >
                <div
                  className={`grid size-18 place-items-center rounded-[1.5rem] bg-gradient-to-br ${game.accent} text-4xl shadow-xl shadow-black/25`}
                >
                  🙂
                </div>
                <h2 className="mt-6 text-3xl font-black text-white">{game.title}</h2>
                <p className="mt-3 text-base leading-7 text-sky-100">{game.description}</p>
                <span className="mt-6 inline-flex h-12 items-center rounded-full bg-white px-5 text-sm font-black text-slate-950 transition-colors group-hover:bg-yellow-200">
                  Hrát
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
