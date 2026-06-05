"use client";

import { useState } from "react";
import type { SectionPost } from "@/lib/section-posts";
import { deleteSectionPost, deleteTopic } from "./actions";
import { SectionPostForm, TopicForm } from "./admin-forms";
import type { AdminTopic } from "./admin-types";

type AdminListsProps = {
  topics: AdminTopic[];
  posts: SectionPost[];
};

export function AdminLists({ topics, posts }: AdminListsProps) {
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  return (
    <section className="mt-8 grid gap-6 xl:grid-cols-2">
      <div className="rounded-[2rem] border border-white/12 bg-zinc-950/78 p-5 shadow-2xl shadow-black/40 backdrop-blur-2xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-teal-200">
              diagram
            </p>
            <h2 className="mt-1 text-2xl font-semibold">Polozky diagramu</h2>
          </div>
          <span className="rounded-full bg-white/8 px-3 py-1 text-sm text-zinc-300">
            {topics.length}
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10">
          {topics.map((topic, index) => {
            const editId = topic.persistedId ?? topic.slug;
            const isEditing = editingTopicId === editId;

            return (
              <div key={`${topic.slug}-${index}`} className="border-b border-white/10 last:border-b-0">
                <div className="grid gap-3 bg-white/5 p-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div className="min-w-0">
                    <p className="font-mono text-xs uppercase tracking-[0.18em] text-zinc-500">
                      {topic.slug} | order {topic.sort_order ?? 0}
                    </p>
                    <h3 className="truncate text-lg font-semibold text-white">{topic.title_en}</h3>
                    <p className="truncate text-sm text-zinc-400">{topic.description_en}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingTopicId(isEditing ? null : editId)}
                      className="h-9 rounded-full bg-teal-200 px-4 text-sm font-bold text-zinc-950"
                    >
                      {isEditing ? "Zavrit" : "Upravit"}
                    </button>
                    {topic.persistedId ? (
                      <form action={deleteTopic}>
                        <input type="hidden" name="id" value={topic.persistedId} />
                        <button className="h-9 rounded-full bg-pink-300 px-4 text-sm font-bold text-pink-950">
                          Smazat
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
                {isEditing ? (
                  <div className="bg-black/20 p-4">
                    <TopicForm topic={topic} actionLabel="Ulozit polozku" />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/12 bg-zinc-950/78 p-5 shadow-2xl shadow-black/40 backdrop-blur-2xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-pink-200">
              obsah
            </p>
            <h2 className="mt-1 text-2xl font-semibold">Prispevky v sekcich</h2>
          </div>
          <span className="rounded-full bg-white/8 px-3 py-1 text-sm text-zinc-300">
            {posts.length}
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10">
          {posts.length === 0 ? (
            <p className="p-4 text-sm text-zinc-400">Zatim nejsou zadne prispevky.</p>
          ) : null}
          {posts.map((post) => {
            const isEditing = editingPostId === post.id;

            return (
              <div key={post.id} className="border-b border-white/10 last:border-b-0">
                <div className="grid gap-3 bg-white/5 p-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div className="min-w-0">
                    <p className="font-mono text-xs uppercase tracking-[0.18em] text-zinc-500">
                      {post.topic_slug} | order {post.sort_order}
                    </p>
                    <h3 className="truncate text-lg font-semibold text-white">{post.title}</h3>
                    <p className="truncate text-sm text-zinc-400">{post.body || post.image_url}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingPostId(isEditing ? null : post.id)}
                      className="h-9 rounded-full bg-teal-200 px-4 text-sm font-bold text-zinc-950"
                    >
                      {isEditing ? "Zavrit" : "Upravit"}
                    </button>
                    <form action={deleteSectionPost}>
                      <input type="hidden" name="id" value={post.id} />
                      <button className="h-9 rounded-full bg-pink-300 px-4 text-sm font-bold text-pink-950">
                        Smazat
                      </button>
                    </form>
                  </div>
                </div>
                {isEditing ? (
                  <div className="bg-black/20 p-4">
                    <SectionPostForm topics={topics} post={post} actionLabel="Ulozit prispevek" />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
