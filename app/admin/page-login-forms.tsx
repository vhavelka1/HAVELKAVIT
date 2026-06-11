import type { PageAdminSetting } from "@/lib/page-admin";
import { savePageLoginPassword } from "./actions";

export function PageLoginForms({ settings }: { settings: PageAdminSetting[] }) {
  return (
    <section id="login-stranek" className="mb-8 rounded-[2rem] border border-white/12 bg-zinc-950/78 p-6 shadow-2xl shadow-black/40 backdrop-blur-2xl">
      <p className="font-mono text-xs uppercase tracking-[0.28em] text-yellow-200">
        login stránek
      </p>
      <h2 className="mt-2 text-3xl font-semibold">Jednoduchá hesla pro dětské administrace</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
        Tady nastavíš samostatné heslo pro administraci Emičky a Adámka. Tyto stránky nepoužívají
        Supabase login, jen heslo uložené jako hash.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {settings.map((setting) => (
          <form
            key={setting.page_id}
            action={savePageLoginPassword}
            className="rounded-3xl border border-white/10 bg-white/6 p-5"
          >
            <input type="hidden" name="page_id" value={setting.page_id} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-zinc-500">
                  /{setting.page_id}/admin
                </p>
                <h3 className="mt-1 text-2xl font-semibold text-white">{setting.label}</h3>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  setting.has_password
                    ? "bg-teal-200 text-teal-950"
                    : "bg-pink-300 text-pink-950"
                }`}
              >
                {setting.has_password ? "Heslo nastavené" : "Bez hesla"}
              </span>
            </div>

            <label className="mt-5 grid gap-2">
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-violet-200">
                Nové heslo
              </span>
              <input
                name="password"
                type="password"
                className="admin-input"
                autoComplete="new-password"
                required
              />
            </label>

            <button className="mt-4 h-11 rounded-full bg-yellow-200 px-5 text-sm font-bold text-yellow-950 transition-colors hover:bg-white">
              Uložit heslo
            </button>
          </form>
        ))}
      </div>
    </section>
  );
}
