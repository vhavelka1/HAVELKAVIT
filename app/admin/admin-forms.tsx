"use client";

import type { SectionPost } from "@/lib/section-posts";
import { saveSectionPost, saveTopic } from "./actions";
import type { AdminTopic } from "./admin-types";

export function TopicForm({ topic, actionLabel }: { topic?: AdminTopic; actionLabel: string }) {
  return (
    <form action={saveTopic} className="mt-5 grid gap-4 lg:grid-cols-2">
      <input type="hidden" name="id" value={topic?.persistedId ?? ""} />
      <AdminField label="Slug" name="slug" defaultValue={topic?.slug ?? ""} />
      <AdminField label="Sort order" name="sort_order" defaultValue={String(topic?.sort_order ?? 0)} />
      <AdminField label="Title CS" name="title_cs" defaultValue={topic?.title_cs ?? ""} />
      <AdminField label="Title EN" name="title_en" defaultValue={topic?.title_en ?? ""} />
      <AdminArea label="Description CS" name="description_cs" defaultValue={topic?.description_cs ?? ""} />
      <AdminArea label="Description EN" name="description_en" defaultValue={topic?.description_en ?? ""} />
      <ImageUploadField label="Fotka polozky" currentUrl={topic?.image_url ?? ""} />
      <div className="lg:col-span-2">
        <button className="h-12 rounded-full bg-teal-200 px-6 text-sm font-bold text-zinc-950 transition-colors hover:bg-white">
          {actionLabel}
        </button>
      </div>
    </form>
  );
}

export function SectionPostForm({
  topics,
  post,
  actionLabel,
}: {
  topics: AdminTopic[];
  post?: SectionPost;
  actionLabel: string;
}) {
  return (
    <form action={saveSectionPost} className="mt-5 grid gap-4 lg:grid-cols-2">
      <input type="hidden" name="id" value={post?.id ?? ""} />
      <label className="grid gap-2">
        <span className="font-mono text-xs uppercase tracking-[0.18em] text-violet-200">
          Sekce
        </span>
        <select name="topic_slug" defaultValue={post?.topic_slug ?? topics[0]?.slug ?? ""} className="admin-input">
          {topics.map((topic) => (
            <option key={topic.slug} value={topic.slug}>
              {topic.title_en} ({topic.slug})
            </option>
          ))}
        </select>
      </label>
      <AdminField label="Sort order" name="sort_order" defaultValue={String(post?.sort_order ?? 0)} />
      <AdminField label="Titulek" name="title" defaultValue={post?.title ?? ""} wide />
      <AdminArea label="Text prispevku" name="body" defaultValue={post?.body ?? ""} />
      <ImageUploadField label="Fotka prispevku" currentUrl={post?.image_url ?? ""} />
      <div className="lg:col-span-2">
        <button className="h-12 rounded-full bg-teal-200 px-6 text-sm font-bold text-zinc-950 transition-colors hover:bg-white">
          {actionLabel}
        </button>
      </div>
    </form>
  );
}

function ImageUploadField({ label, currentUrl }: { label: string; currentUrl: string }) {
  return (
    <label className="grid gap-2 lg:col-span-2">
      <span className="font-mono text-xs uppercase tracking-[0.18em] text-violet-200">{label}</span>
      <input type="hidden" name="existing_image_url" value={currentUrl} />
      <input
        name="image_file"
        type="file"
        accept="image/*"
        className="admin-input file:mr-4 file:rounded-full file:border-0 file:bg-teal-200 file:px-4 file:py-2 file:text-sm file:font-bold file:text-zinc-950"
      />
      {currentUrl ? (
        <span className="truncate text-xs font-semibold text-zinc-400">
          Aktualni fotka: {currentUrl}
        </span>
      ) : null}
    </label>
  );
}

export function AdminField({
  label,
  name,
  defaultValue,
  wide,
}: {
  label: string;
  name: string;
  defaultValue: string;
  wide?: boolean;
}) {
  return (
    <label className={`grid gap-2 ${wide ? "lg:col-span-2" : ""}`}>
      <span className="font-mono text-xs uppercase tracking-[0.18em] text-violet-200">{label}</span>
      <input name={name} defaultValue={defaultValue} className="admin-input" />
    </label>
  );
}

export function AdminArea({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="font-mono text-xs uppercase tracking-[0.18em] text-violet-200">{label}</span>
      <textarea name={name} defaultValue={defaultValue} className="admin-input min-h-28" />
    </label>
  );
}
