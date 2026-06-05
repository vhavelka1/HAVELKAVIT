"use client";

import { ArrowLeft, Edit3, Plus, RefreshCw, Save, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  getSupabaseBrowserClient,
  quizTopics,
  type CorrectOption,
  type QuizDifficulty,
  type QuizQuestionRow,
} from "@/lib/quiz";

type QuestionForm = {
  id?: string | number;
  topic_slug: string;
  difficulty: QuizDifficulty;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: CorrectOption | "";
  sort_order: number;
};

const emptyForm: QuestionForm = {
  topic_slug: "animals",
  difficulty: "easy",
  question: "",
  option_a: "",
  option_b: "",
  option_c: "",
  option_d: "",
  correct_option: "",
  sort_order: 1,
};

const difficultyOptions: QuizDifficulty[] = ["easy", "medium", "hard"];

export function QuizAdmin() {
  const [questions, setQuestions] = useState<QuizQuestionRow[]>([]);
  const [form, setForm] = useState<QuestionForm>(emptyForm);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [topicFilter, setTopicFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState<QuizDifficulty | "all">("all");

  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  useEffect(() => {
    void loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const groupedQuestions = useMemo(
    () =>
      quizTopics
        .filter((topic) => topicFilter === "all" || topicFilter === topic.id)
        .map((topic) => ({
          topic,
          difficulties: difficultyOptions
            .filter((difficulty) => difficultyFilter === "all" || difficultyFilter === difficulty)
            .map((difficulty) => ({
              difficulty,
              questions: questions
                .filter((question) => question.topic_slug === topic.id)
                .filter((question) => (question.difficulty ?? "easy") === difficulty)
                .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0)),
            })),
        })),
    [difficultyFilter, questions, topicFilter],
  );

  async function loadQuestions() {
    if (!supabase) {
      setMessage("Supabase env vars nejsou nastavené.");
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from("quiz_questions")
      .select("id, topic_slug, difficulty, question, option_a, option_b, option_c, option_d, correct_option, sort_order")
      .order("topic_slug", { ascending: true })
      .order("difficulty", { ascending: true })
      .order("sort_order", { ascending: true });

    setIsLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setQuestions((data ?? []) as QuizQuestionRow[]);
    setMessage("");
  }

  async function saveQuestion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setMessage("Supabase env vars nejsou nastavené.");
      return;
    }

    const payload = {
      topic_slug: form.topic_slug,
      difficulty: form.difficulty || "easy",
      question: form.question.trim(),
      option_a: form.option_a.trim(),
      option_b: form.option_b.trim(),
      option_c: form.option_c.trim(),
      option_d: form.option_d.trim(),
      correct_option: form.correct_option,
      sort_order: Number(form.sort_order),
    };

    if (!payload.correct_option) {
      setMessage("Vyber správnou odpověď.");
      return;
    }

    setIsLoading(true);
    const result = form.id
      ? await supabase.from("quiz_questions").update(payload).eq("id", form.id)
      : await supabase.from("quiz_questions").insert(payload);
    setIsLoading(false);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    setMessage(form.id ? "Otázka je upravená." : "Otázka je přidaná.");
    setForm(emptyForm);
    await loadQuestions();
  }

  async function deleteQuestion(id: string | number) {
    if (!supabase) {
      setMessage("Supabase env vars nejsou nastavené.");
      return;
    }

    if (!window.confirm("Smazat tuhle otázku?")) {
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.from("quiz_questions").delete().eq("id", id);
    setIsLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Otázka je smazaná.");
    await loadQuestions();
  }

  function editQuestion(question: QuizQuestionRow) {
    setForm({
      id: question.id,
      topic_slug: question.topic_slug,
      difficulty: question.difficulty ?? "easy",
      question: question.question,
      option_a: question.option_a,
      option_b: question.option_b,
      option_c: question.option_c,
      option_d: question.option_d,
      correct_option: question.correct_option,
      sort_order: Number(question.sort_order ?? 1),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="min-h-screen bg-[#060817] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(168,85,247,0.24),transparent_28rem),radial-gradient(circle_at_78%_24%,rgba(59,130,246,0.2),transparent_24rem),radial-gradient(circle_at_50%_92%,rgba(34,197,94,0.16),transparent_24rem)]" />
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/emicka"
            className="inline-flex h-12 items-center gap-2 rounded-full border border-violet-300/30 bg-white/8 px-4 text-sm font-semibold text-white shadow-xl shadow-violet-950/30 backdrop-blur-md transition-colors hover:bg-white/14"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
            <span>Zpět</span>
          </Link>
          <button
            type="button"
            onClick={() => void loadQuestions()}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-lime-300 px-4 text-sm font-black text-emerald-950"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            Načíst znovu
          </button>
        </header>

        <section className="mb-8 rounded-[2rem] border border-violet-300/25 bg-slate-950/72 p-5 shadow-2xl shadow-violet-950/30 backdrop-blur-xl sm:p-7">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-cyan-200">
                quiz_questions
              </p>
              <h1 className="mt-2 text-4xl font-black text-white">
                {form.id ? "Upravit otázku" : "Přidat otázku"}
              </h1>
            </div>
            {form.id ? (
              <button
                type="button"
                onClick={() => setForm(emptyForm)}
                className="grid size-11 place-items-center rounded-full border border-white/12 bg-white/8"
                aria-label="Zrušit editaci"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            ) : null}
          </div>

          <form onSubmit={saveQuestion} className="grid gap-4 lg:grid-cols-2">
            <Field label="topic_slug">
              <select
                value={form.topic_slug}
                onChange={(event) => setForm({ ...form, topic_slug: event.target.value })}
                className="admin-input"
              >
                {quizTopics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.id} - {topic.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Obtížnost">
              <select
                value={form.difficulty}
                onChange={(event) =>
                  setForm({ ...form, difficulty: event.target.value as QuizDifficulty })
                }
                className="admin-input"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </Field>
            <Field label="sort_order">
              <input
                type="number"
                min="1"
                value={form.sort_order}
                onChange={(event) => setForm({ ...form, sort_order: Number(event.target.value) })}
                className="admin-input"
                required
              />
            </Field>
            <Field label="Správná odpověď">
              <select
                value={form.correct_option}
                onChange={(event) =>
                  setForm({ ...form, correct_option: event.target.value as CorrectOption | "" })
                }
                className="admin-input"
                required
              >
                <option value="">Vyber správnou odpověď</option>
                {(["A", "B", "C", "D"] as const).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="question" wide>
              <textarea
                value={form.question}
                onChange={(event) => setForm({ ...form, question: event.target.value })}
                className="admin-input min-h-28"
                required
              />
            </Field>
            <Field label="option_a">
              <input
                value={form.option_a}
                onChange={(event) => setForm({ ...form, option_a: event.target.value })}
                className="admin-input"
                required
              />
            </Field>
            <Field label="option_b">
              <input
                value={form.option_b}
                onChange={(event) => setForm({ ...form, option_b: event.target.value })}
                className="admin-input"
                required
              />
            </Field>
            <Field label="option_c">
              <input
                value={form.option_c}
                onChange={(event) => setForm({ ...form, option_c: event.target.value })}
                className="admin-input"
                required
              />
            </Field>
            <Field label="option_d">
              <input
                value={form.option_d}
                onChange={(event) => setForm({ ...form, option_d: event.target.value })}
                className="admin-input"
                required
              />
            </Field>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex h-13 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-6 text-lg font-black text-white disabled:opacity-60"
              >
                {form.id ? <Save className="size-5" /> : <Plus className="size-5" />}
                {form.id ? "Uložit změny" : "Přidat otázku"}
              </button>
            </div>
          </form>

          {message ? (
            <p className="mt-5 rounded-2xl border border-cyan-200/20 bg-cyan-200/10 px-4 py-3 text-sm font-semibold text-cyan-100">
              {message}
            </p>
          ) : null}
        </section>

        <section className="mb-6 rounded-[2rem] border border-white/10 bg-white/7 p-5 shadow-xl shadow-black/25 backdrop-blur-xl">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Filtr podle tématu">
              <select
                value={topicFilter}
                onChange={(event) => setTopicFilter(event.target.value)}
                className="admin-input"
              >
                <option value="all">Všechna témata</option>
                {quizTopics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Filtr podle obtížnosti">
              <select
                value={difficultyFilter}
                onChange={(event) =>
                  setDifficultyFilter(event.target.value as QuizDifficulty | "all")
                }
                className="admin-input"
              >
                <option value="all">Všechny obtížnosti</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </Field>
          </div>
        </section>

        <section className="space-y-5">
          {groupedQuestions.map(({ topic, difficulties }) => (
            <div
              key={topic.id}
              className="rounded-[2rem] border border-white/10 bg-white/7 p-5 shadow-xl shadow-black/25 backdrop-blur-xl"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl font-black text-white">{topic.title}</h2>
                <span className="rounded-full bg-black/30 px-3 py-1 font-mono text-xs text-zinc-300">
                  {topic.id}
                </span>
              </div>

              <div className="grid gap-5">
                {difficulties.map(({ difficulty, questions: difficultyQuestions }) => (
                  <div key={difficulty}>
                    <div className="mb-3 flex flex-wrap items-center gap-3">
                      <DifficultyBadge difficulty={difficulty} />
                      <span className="font-bold text-lime-300">
                        {difficultyQuestions.length}/10
                      </span>
                      {difficultyQuestions.length < 10 ? (
                        <span className="rounded-full border border-amber-300/30 bg-amber-300/12 px-3 py-1 text-sm font-semibold text-amber-100">
                          Tato obtížnost zatím nemá 10 otázek.
                        </span>
                      ) : null}
                    </div>

                    <div className="grid gap-3">
                      {difficultyQuestions.length === 0 ? (
                        <p className="rounded-2xl border border-white/10 bg-black/20 p-4 text-zinc-300">
                          Zatím tu nejsou žádné otázky.
                        </p>
                      ) : (
                        difficultyQuestions.map((question) => (
                          <article
                            key={question.id}
                            className="rounded-2xl border border-white/10 bg-slate-950/55 p-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-violet-200">
                                  <span>{topic.title}</span>
                                  <DifficultyBadge difficulty={question.difficulty ?? "easy"} />
                                  <span>
                                    {question.question}
                                  </span>
                                  <span className="text-lime-300">
                                    Správně: {question.correct_option}
                                  </span>
                                </p>
                                <h3 className="mt-1 text-lg font-black text-white">
                                  {question.question}
                                </h3>
                                <p className="mt-2 text-sm leading-6 text-zinc-300">
                                  A: {question.option_a} | B: {question.option_b} | C:{" "}
                                  {question.option_c} | D: {question.option_d}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => editQuestion(question)}
                                  className="grid size-10 place-items-center rounded-full bg-cyan-300 text-cyan-950"
                                  aria-label="Upravit otázku"
                                >
                                  <Edit3 className="size-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void deleteQuestion(question.id)}
                                  className="grid size-10 place-items-center rounded-full bg-rose-400 text-rose-950"
                                  aria-label="Smazat otázku"
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              </div>
                            </div>
                          </article>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  wide,
  children,
}: {
  label: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`grid gap-2 ${wide ? "lg:col-span-2" : ""}`}>
      <span className="font-mono text-xs uppercase tracking-[0.18em] text-violet-200">{label}</span>
      {children}
    </label>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: QuizDifficulty }) {
  const classes = {
    easy: "bg-emerald-300 text-emerald-950",
    medium: "bg-yellow-300 text-yellow-950",
    hard: "bg-rose-400 text-rose-950",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${classes[difficulty]}`}>
      {difficulty}
    </span>
  );
}
