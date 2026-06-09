"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Languages, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { SectionPost } from "@/lib/section-posts";
import type { SiteSettings } from "@/lib/site-settings";
import type { Language, Topic } from "@/lib/topics";

type PersonalSiteProps = {
  topics: Topic[];
  settings: SiteSettings;
  posts: SectionPost[];
};

export function PersonalSite({ topics, settings, posts }: PersonalSiteProps) {
  const [language, setLanguage] = useState<Language>("cs");
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  const activeTitle = selectedTopic ? getTitle(selectedTopic, language) : "";

  return (
    <main className="relative min-h-screen w-screen max-w-[100vw] overflow-hidden bg-[#050507] text-zinc-50">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:72px_72px] opacity-30" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,rgba(5,5,7,0.1)_34%,rgba(5,5,7,0.92)_100%)]" />

      <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex max-w-[100vw] items-center justify-between gap-3 px-4 py-5 sm:px-8">
        <motion.div
          initial={{ y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="pointer-events-auto"
        >
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-teal-200/75">
            {settings.brand_label}
          </p>
        </motion.div>

        <div className="pointer-events-auto flex items-center gap-2">
          <Link
            href="/login/fake"
            className="hidden h-9 items-center rounded-full border border-white/12 bg-white/8 px-3 text-xs font-semibold text-zinc-300 shadow-2xl shadow-black/30 backdrop-blur-xl transition-colors hover:bg-white/14 hover:text-white sm:inline-flex"
          >
            {settings.login_label}
          </Link>
          <motion.div
            initial={{ y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="flex h-10 shrink-0 items-center gap-1 rounded-full border border-white/12 bg-white/8 p-1 shadow-2xl shadow-black/30 backdrop-blur-xl sm:h-11"
            aria-label="Language switcher"
          >
            <Languages className="ml-2 size-4 text-zinc-400 sm:ml-3" aria-hidden="true" />
            {(["cs", "en"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setLanguage(item)}
                className={`relative h-8 min-w-9 rounded-full px-2 text-xs font-semibold uppercase transition-colors sm:min-w-10 sm:px-3 ${
                  language === item ? "text-zinc-950" : "text-zinc-400 hover:text-zinc-100"
                }`}
                aria-pressed={language === item}
              >
                {language === item ? (
                  <motion.span
                    layoutId="language-pill"
                    className="absolute inset-0 rounded-full bg-teal-200"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                ) : null}
                <span className="relative">{item}</span>
              </button>
            ))}
          </motion.div>
        </div>
      </header>

      <section className="relative z-10 flex min-h-screen w-screen max-w-[100vw] min-w-0 items-center justify-center overflow-hidden px-4 py-24 sm:px-8">
        <div className="grid w-full min-w-0 max-w-7xl items-center gap-8 lg:grid-cols-[0.82fr_1.18fr]">
          <motion.div
            initial={{ y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="mx-auto w-full max-w-xl text-center lg:mx-0 lg:text-left"
          >
            <p className="mb-5 font-mono text-xs uppercase tracking-[0.32em] text-pink-200/70">
              {language === "cs" ? settings.eyebrow_cs : settings.eyebrow_en}
            </p>
            <h1 className="mx-auto max-w-[11ch] text-4xl font-semibold leading-none text-white sm:text-7xl lg:mx-0 lg:max-w-none lg:text-8xl">
              {language === "cs" ? (
                <>
                  <HeadlineWithAdminDot text={settings.headline_cs} />
                </>
              ) : (
                <>
                  <HeadlineWithAdminDot text={settings.headline_en} />
                </>
              )}
            </h1>
            <p className="mx-auto mt-6 max-w-[31ch] text-base leading-8 text-zinc-200 sm:max-w-xl sm:text-lg lg:mx-0">
              {language === "cs" ? settings.intro_cs : settings.intro_en}
            </p>
          </motion.div>

          <NodeNetwork
            topics={topics}
            language={language}
            selectedTopic={selectedTopic}
            onSelect={setSelectedTopic}
          />
        </div>
      </section>

      <AnimatePresence>
        {selectedTopic ? (
          <TopicPanel
            key={selectedTopic.slug}
            topic={selectedTopic}
            language={language}
            title={activeTitle}
            posts={posts.filter((post) => post.topic_slug === selectedTopic.slug)}
            onClose={() => setSelectedTopic(null)}
          />
        ) : null}
      </AnimatePresence>
    </main>
  );
}

function AdminDot() {
  return (
    <Link
      href="/admin"
      className="rounded-full text-white outline-none transition-colors hover:text-pink-200 focus-visible:ring-2 focus-visible:ring-teal-200"
      aria-label="Admin login"
      title="Admin"
    >
      .
    </Link>
  );
}

function HeadlineWithAdminDot({ text }: { text: string }) {
  const trimmed = text.trim();
  const withoutLastDot = trimmed.endsWith(".") ? trimmed.slice(0, -1) : trimmed;
  const lastSpace = withoutLastDot.lastIndexOf(" ");

  if (lastSpace === -1) {
    return (
      <span className="whitespace-nowrap">
        {withoutLastDot}
        <AdminDot />
      </span>
    );
  }

  return (
    <>
      {withoutLastDot.slice(0, lastSpace)}{" "}
      <span className="whitespace-nowrap">
        {withoutLastDot.slice(lastSpace + 1)}
        <AdminDot />
      </span>
    </>
  );
}

type NodeNetworkProps = {
  topics: Topic[];
  language: Language;
  selectedTopic: Topic | null;
  onSelect: (topic: Topic) => void;
};

function NodeNetwork({ topics, language, selectedTopic, onSelect }: NodeNetworkProps) {
  const nodes = useMemo(() => {
    const coordinates = [
      { x: 50, y: 15 },
      { x: 78, y: 30 },
      { x: 71, y: 66 },
      { x: 50, y: 82 },
      { x: 24, y: 67 },
      { x: 17, y: 34 },
      { x: 37, y: 43 },
      { x: 61, y: 48 },
      { x: 49, y: 51 },
      { x: 84, y: 57 },
    ];

    return topics.map((topic, index) => ({
      topic,
      ...coordinates[index % coordinates.length],
    }));
  }, [topics]);

  const links = [
    [0, 2],
    [0, 5],
    [1, 2],
    [1, 7],
    [2, 4],
    [3, 4],
    [3, 6],
    [4, 5],
    [4, 7],
    [5, 6],
    [6, 7],
    [0, 8],
    [2, 8],
    [3, 8],
    [6, 8],
    [1, 9],
    [2, 9],
    [7, 9],
  ];

  return (
    <motion.div
      initial={{ scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
      className="relative mx-auto aspect-square w-full max-w-[78vw] sm:max-w-[720px]"
    >
      <motion.div
        className="absolute inset-[10%] rounded-full border border-white/10"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      />
      <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="network-line" x1="0" x2="1" y1="0" y2="1">
            <stop stopColor="#5eead4" stopOpacity="0.85" />
            <stop offset="1" stopColor="#f9a8d4" stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {links.map(([from, to], index) => {
          const start = nodes[from];
          const end = nodes[to];

          if (!start || !end) {
            return null;
          }

          return (
            <motion.line
              key={`${from}-${to}`}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke="url(#network-line)"
              strokeWidth="0.22"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1, opacity: 0.9 }}
              transition={{ duration: 0.7, delay: 0.08 * index }}
            />
          );
        })}
      </svg>

      {nodes.map(({ topic, x, y }, index) => {
        const isSelected = selectedTopic?.slug === topic.slug;

        return (
          <motion.button
            key={topic.slug}
            type="button"
            onClick={() => onSelect(topic)}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2 text-center"
            style={{ left: `${x}%`, top: `${y}%` }}
            initial={{ scale: 0.7 }}
            animate={{ opacity: 1, scale: 1, y: [0, -7, 0] }}
            transition={{
              scale: { delay: 0.1 + index * 0.05, type: "spring", stiffness: 240, damping: 18 },
              y: { duration: 4.5 + index * 0.28, repeat: Infinity, ease: "easeInOut" },
            }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.97 }}
            aria-label={getTitle(topic, language)}
          >
            <span
              className={`relative grid size-12 place-items-center rounded-full border shadow-2xl backdrop-blur-md transition-colors sm:size-17 ${
                isSelected
                  ? "border-teal-200 bg-teal-200 text-zinc-950 shadow-teal-500/30"
                  : "border-white/22 bg-white/16 text-zinc-50 shadow-black/40 hover:border-pink-200/80 hover:bg-white/22"
              }`}
            >
              <span className="absolute inset-[-8px] rounded-full border border-white/8" />
              <span className="font-mono text-sm font-semibold">{index + 1}</span>
            </span>
            <span className="w-24 rounded-full border border-white/14 bg-zinc-950/80 px-2 py-1.5 text-xs font-medium leading-tight text-white shadow-xl shadow-black/25 backdrop-blur-md sm:w-auto sm:max-w-28 sm:px-3 sm:text-sm">
              {getTitle(topic, language)}
            </span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}

type TopicPanelProps = {
  topic: Topic;
  language: Language;
  title: string;
  posts: SectionPost[];
  onClose: () => void;
};

function TopicPanel({ topic, language, title, posts, onClose }: TopicPanelProps) {
  return (
    <>
      <motion.button
        type="button"
        className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px]"
        aria-label="Close panel"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.aside
        className="fixed inset-x-3 bottom-3 z-50 max-h-[86vh] overflow-hidden rounded-[2rem] border border-white/12 bg-zinc-950/92 shadow-2xl shadow-black/60 backdrop-blur-2xl sm:inset-x-auto sm:bottom-6 sm:right-6 sm:top-6 sm:w-[430px]"
        initial={{ opacity: 0, y: 28, x: 0 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        exit={{ opacity: 0, y: 28, x: 24 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="topic-title"
      >
        <div className="relative h-64 overflow-hidden sm:h-72">
          <Image
            src={topic.image_url}
            alt={title}
            fill
            sizes="(min-width: 640px) 430px, 100vw"
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 grid size-10 place-items-center rounded-full border border-white/14 bg-black/45 text-zinc-100 backdrop-blur-md transition-colors hover:bg-white/16"
            aria-label="Close panel"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto px-6 pb-7 pt-2 sm:px-7">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal-200/70">
            {language === "cs" ? "detail uzlu" : "node detail"}
          </p>
          <h2 id="topic-title" className="text-4xl font-semibold tracking-tight text-zinc-50">
            {title}
          </h2>
          <p className="text-base leading-8 text-zinc-300">{getDescription(topic, language)}</p>
          {posts.length > 0 ? (
            <div className="space-y-3">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-white/6"
                >
                  {post.image_url ? (
                    <div className="relative h-36">
                      <Image
                        src={post.image_url}
                        alt={post.title}
                        fill
                        sizes="360px"
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : null}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-white">{post.title}</h3>
                    {post.body ? (
                      <p className="mt-2 text-sm leading-6 text-zinc-400">{post.body}</p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : null}
          {topic.slug === "emicka" ? (
            <Link
              href="/emicka"
              className="inline-flex h-12 items-center justify-center rounded-full bg-teal-200 px-6 text-sm font-semibold text-zinc-950 shadow-xl shadow-teal-950/30 transition-colors hover:bg-white"
            >
              Prohlížej
            </Link>
          ) : null}
          {topic.slug === "adamek" ? (
            <Link
              href="/adamek"
              className="inline-flex h-12 items-center justify-center rounded-full bg-teal-200 px-6 text-sm font-semibold text-zinc-950 shadow-xl shadow-teal-950/30 transition-colors hover:bg-white"
            >
              Prohlížej
            </Link>
          ) : null}
        </div>
      </motion.aside>
    </>
  );
}

function getTitle(topic: Topic, language: Language) {
  return language === "cs" ? topic.title_cs : topic.title_en;
}

function getDescription(topic: Topic, language: Language) {
  return language === "cs" ? topic.description_cs : topic.description_en;
}
