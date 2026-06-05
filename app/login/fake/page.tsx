import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getSectionPosts } from "@/lib/section-posts";
import { getSiteSettings, getSupabaseServerClient } from "@/lib/site-settings";
import { mapTopicRow, topicSeeds } from "@/lib/topics";
import { loginAdmin, logoutAdmin, saveSiteSettings } from "../../admin/actions";
import { AdminArea, AdminField, SectionPostForm, TopicForm } from "../../admin/admin-forms";
import { AdminLists } from "../../admin/admin-lists";
import type { AdminTopic } from "../../admin/admin-types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Skutecna administrace | Havelka Vitek",
  description: "Chranena administrace uvodniho diagramu.",
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; saved?: string }>;
}) {
  const isLoggedIn = await isAdminAuthenticated();
  const params = searchParams ? await searchParams : {};

  if (!isLoggedIn) {
    return <AdminLogin showError={params.error === "login"} />;
  }

  const [settings, topics, posts] = await Promise.all([
    getSiteSettings(),
    getAdminTopics(),
    getSectionPosts(),
  ]);

  return (
    <main className="min-h-screen bg-[#050507] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(20,184,166,0.2),transparent_28rem),radial-gradient(circle_at_82%_72%,rgba(244,114,182,0.16),transparent_30rem)]" />
      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 py-6 sm:px-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-teal-200/75">
              real admin
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">Skutecna administrace</h1>
          </div>
          <form action={logoutAdmin}>
            <button className="h-11 rounded-full border border-white/12 bg-white/8 px-5 text-sm font-semibold text-zinc-200 backdrop-blur-md transition-colors hover:bg-white/14 hover:text-white">
              Odhlasit
            </button>
          </form>
        </header>

        <AdminStatus error={params.error} saved={params.saved} />

        <section className="mb-8 rounded-[2rem] border border-white/12 bg-zinc-950/78 p-6 shadow-2xl shadow-black/40 backdrop-blur-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-pink-200">
            uvodni texty
          </p>
          <h2 className="mt-2 text-3xl font-semibold">Nastaveni hlavni stranky</h2>
          <form action={saveSiteSettings} className="mt-6 grid gap-4 lg:grid-cols-2">
            <AdminField label="Brand label" name="brand_label" defaultValue={settings.brand_label} />
            <AdminField label="Login label" name="login_label" defaultValue={settings.login_label} />
            <AdminField label="Eyebrow CS" name="eyebrow_cs" defaultValue={settings.eyebrow_cs} />
            <AdminField label="Eyebrow EN" name="eyebrow_en" defaultValue={settings.eyebrow_en} />
            <AdminField label="Headline CS" name="headline_cs" defaultValue={settings.headline_cs} wide />
            <AdminField label="Headline EN" name="headline_en" defaultValue={settings.headline_en} wide />
            <AdminArea label="Intro CS" name="intro_cs" defaultValue={settings.intro_cs} />
            <AdminArea label="Intro EN" name="intro_en" defaultValue={settings.intro_en} />
            <div className="lg:col-span-2">
              <button className="h-12 rounded-full bg-teal-200 px-6 text-sm font-bold text-zinc-950 transition-colors hover:bg-white">
                Ulozit texty
              </button>
            </div>
          </form>
        </section>

        <section className="mb-8 rounded-[2rem] border border-white/12 bg-zinc-950/78 p-6 shadow-2xl shadow-black/40 backdrop-blur-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-teal-200">
            nova polozka
          </p>
          <h2 className="mt-2 text-3xl font-semibold">Pridat polozku diagramu</h2>
          <TopicForm actionLabel="Pridat polozku" />
        </section>

        <section className="mt-8 rounded-[2rem] border border-white/12 bg-zinc-950/78 p-6 shadow-2xl shadow-black/40 backdrop-blur-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-pink-200">
            prispevky sekci
          </p>
          <h2 className="mt-2 text-3xl font-semibold">Pridat prispevek do sekce</h2>
          <SectionPostForm topics={topics} actionLabel="Pridat prispevek" />
        </section>

        <AdminLists topics={topics} posts={posts} />
      </div>
    </main>
  );
}

function AdminStatus({ error, saved }: { error?: string; saved?: string }) {
  if (error) {
    const message =
      error === "supabase-admin-key"
        ? "Ukladani potrebuje SUPABASE_SERVICE_ROLE_KEY v .env.local nebo na Vercelu."
        : "Zmenu se nepodarilo ulozit. Zkontroluj prosim Supabase tabulky a opravneni.";

    return (
      <div className="mb-8 rounded-3xl border border-pink-300/20 bg-pink-300/10 px-5 py-4 text-sm font-semibold text-pink-100">
        {message}
      </div>
    );
  }

  if (saved) {
    return (
      <div className="mb-8 rounded-3xl border border-teal-200/20 bg-teal-200/10 px-5 py-4 text-sm font-semibold text-teal-50">
        Ulozeno. Hlavni stranka je obnovena.
      </div>
    );
  }

  return null;
}

function AdminLogin({ showError }: { showError: boolean }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050507] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(20,184,166,0.2),transparent_28rem),radial-gradient(circle_at_82%_72%,rgba(244,114,182,0.16),transparent_30rem)]" />
      <section className="relative z-10 flex min-h-screen items-center justify-center px-5 py-10">
        <form
          action={loginAdmin}
          className="w-full max-w-md rounded-[2rem] border border-white/12 bg-zinc-950/78 p-6 shadow-2xl shadow-black/50 backdrop-blur-2xl sm:p-8"
        >
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-teal-200/75">
            admin login
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Prihlaseni administratora</h1>
          <label className="mt-7 grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
              Jmeno
            </span>
            <input name="username" defaultValue="Admin" className="admin-input" />
          </label>
          <label className="mt-4 grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
              Heslo
            </span>
            <input name="password" type="password" className="admin-input" autoFocus />
          </label>
          {showError ? (
            <p className="mt-4 rounded-2xl border border-pink-300/20 bg-pink-300/10 px-4 py-3 text-sm font-semibold text-pink-100">
              Spatne prihlaseni.
            </p>
          ) : null}
          <button className="mt-6 h-12 w-full rounded-full bg-teal-200 px-5 text-sm font-bold text-zinc-950 transition-colors hover:bg-white">
            Prihlasit
          </button>
        </form>
      </section>
    </main>
  );
}

async function getAdminTopics(): Promise<AdminTopic[]> {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return topicSeeds.map((topic, index) => ({ ...topic, sort_order: index + 1 }));
  }

  const { data, error } = await supabase.from("topics").select("*").order("sort_order", {
    ascending: true,
  });

  if (error || !data || data.length === 0) {
    return topicSeeds.map((topic, index) => ({ ...topic, sort_order: index + 1 }));
  }

  const mapped: AdminTopic[] = [];

  for (const row of data) {
    const topic = mapTopicRow(row);

    if (topic) {
      mapped.push({ ...topic, persistedId: String(row.id) });
    }
  }

  return mapped;
}
