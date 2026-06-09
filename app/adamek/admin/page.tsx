import Link from "next/link";
import { getMemoryThemes } from "@/lib/adamek";
import { isPageAdminAuthenticated } from "@/lib/page-admin";
import { PageAdminLogin } from "@/components/page-admin-login";
import { logoutPageAdmin } from "@/app/page-admin-actions";
import { MemoryThemeAdmin } from "./theme-admin";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Adámek | Administrace pexesa",
  description: "Chráněná administrace témat a obrázků pro Adamovo pexeso.",
};

export default async function AdamekAdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; saved?: string }>;
}) {
  const [isLoggedIn, params] = await Promise.all([
    isPageAdminAuthenticated("adamek"),
    searchParams ?? Promise.resolve({} as { error?: string; saved?: string }),
  ]);

  if (!isLoggedIn) {
    return (
      <PageAdminLogin
        pageId="adamek"
        title="Administrace Adámka"
        subtitle="Zadej jednoduché heslo pro správu pexesa."
        showError={params.error === "login"}
      />
    );
  }

  const themes = await getMemoryThemes();

  return (
    <main className="min-h-screen bg-[#06111f] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(250,204,21,0.2),transparent_28rem),radial-gradient(circle_at_82%_72%,rgba(56,189,248,0.18),transparent_30rem)]" />
      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 py-6 sm:px-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-yellow-200">
              chráněná správa
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight">Administrace pexesa</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/adamek"
              className="inline-flex h-11 items-center rounded-full border border-white/12 bg-white/8 px-5 text-sm font-semibold text-zinc-200 backdrop-blur-md transition-colors hover:bg-white/14 hover:text-white"
            >
              Zpět na Adámka
            </Link>
            <form action={logoutPageAdmin}>
              <input type="hidden" name="page_id" value="adamek" />
              <button className="h-11 rounded-full border border-white/12 bg-white/8 px-5 text-sm font-semibold text-zinc-200 backdrop-blur-md transition-colors hover:bg-white/14 hover:text-white">
                Odhlásit
              </button>
            </form>
          </div>
        </header>

        <AdminStatus error={params.error} saved={params.saved} />
        <MemoryThemeAdmin themes={themes} />
      </div>
    </main>
  );
}

function AdminStatus({ error, saved }: { error?: string; saved?: string }) {
  if (error) {
    const messages: Record<string, string> = {
      "supabase-admin-key": "Ukládání potřebuje SUPABASE_SERVICE_ROLE_KEY v .env.local nebo na Vercelu.",
      "theme-name": "Téma musí mít název.",
      "save-image": "Obrázek se nepodařilo uložit. Zkontroluj Storage oprávnění.",
    };
    const message = messages[error] ?? "Změnu se nepodařilo uložit. Zkontroluj Supabase tabulky a oprávnění.";

    return (
      <div className="mb-8 rounded-3xl border border-pink-300/20 bg-pink-300/10 px-5 py-4 text-sm font-semibold text-pink-100">
        {message}
      </div>
    );
  }

  if (saved) {
    return (
      <div className="mb-8 rounded-3xl border border-lime-200/20 bg-lime-200/10 px-5 py-4 text-sm font-semibold text-lime-50">
        Uloženo. Pexeso je obnovené.
      </div>
    );
  }

  return null;
}
