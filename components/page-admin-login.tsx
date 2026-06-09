import Link from "next/link";
import { loginPageAdmin } from "@/app/page-admin-actions";
import type { PageAdminId } from "@/lib/page-admin";

export function PageAdminLogin({
  pageId,
  title,
  subtitle,
  showError,
}: {
  pageId: PageAdminId;
  title: string;
  subtitle: string;
  showError: boolean;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050507] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(20,184,166,0.2),transparent_28rem),radial-gradient(circle_at_82%_72%,rgba(244,114,182,0.16),transparent_30rem)]" />
      <div className="relative z-20 px-5 pt-6 sm:px-8">
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-full border border-white/12 bg-white/8 px-4 text-sm font-semibold text-zinc-200 shadow-xl shadow-black/20 backdrop-blur-md transition-colors hover:bg-white/14 hover:text-white"
        >
          Zpět na homepage
        </Link>
      </div>
      <section className="relative z-10 flex min-h-screen items-center justify-center px-5 py-10">
        <form
          action={loginPageAdmin}
          className="w-full max-w-md rounded-[2rem] border border-white/12 bg-zinc-950/78 p-6 shadow-2xl shadow-black/50 backdrop-blur-2xl sm:p-8"
        >
          <input type="hidden" name="page_id" value={pageId} />
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-teal-200/75">
            jednoduchý přístup
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">{subtitle}</p>
          <label className="mt-7 grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
              Heslo
            </span>
            <input
              name="password"
              type="password"
              className="admin-input"
              autoComplete="current-password"
              autoFocus
              required
            />
          </label>
          {showError ? (
            <p className="mt-4 rounded-2xl border border-pink-300/20 bg-pink-300/10 px-4 py-3 text-sm font-semibold text-pink-100">
              Špatné heslo nebo heslo ještě není nastavené.
            </p>
          ) : null}
          <button className="mt-6 h-12 w-full rounded-full bg-teal-200 px-5 text-sm font-bold text-zinc-950 transition-colors hover:bg-white">
            Vstoupit
          </button>
        </form>
      </section>
    </main>
  );
}
