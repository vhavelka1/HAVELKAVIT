create extension if not exists pgcrypto;

insert into public.topics (
  slug,
  title_cs,
  title_en,
  description_cs,
  description_en,
  image_url,
  sort_order
)
values (
  'marcelka',
  'Marcelka',
  'Marcelka',
  'Rozcestnik vyukovych aplikaci pro skolni deti, kde se uceni potkava s hravym treninkem.',
  'A learning apps hub for school children, where practice meets playful training.',
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80',
  11
)
on conflict (slug) do update set
  title_cs = excluded.title_cs,
  title_en = excluded.title_en,
  description_cs = excluded.description_cs,
  description_en = excluded.description_en,
  image_url = excluded.image_url,
  sort_order = excluded.sort_order;

create table if not exists public.marcelka_typing_results (
  id uuid primary key default gen_random_uuid(),
  player_name text not null check (char_length(player_name) between 1 and 40),
  school text not null default '' check (char_length(school) <= 60),
  class_name text not null default '' check (char_length(class_name) <= 30),
  difficulty text not null check (difficulty in ('beginner', 'advanced', 'master')),
  points integer not null check (points >= 0 and points <= 5000),
  elapsed_ms integer not null check (elapsed_ms between 1000 and 1800000),
  mistakes integer not null check (mistakes >= 0 and mistakes <= 500),
  accuracy numeric(5, 2) not null check (accuracy >= 0 and accuracy <= 100),
  max_combo integer not null check (max_combo >= 0 and max_combo <= 30),
  chars_per_minute numeric(6, 2) not null check (chars_per_minute >= 0 and chars_per_minute <= 1000),
  created_at timestamptz not null default now()
);

create index if not exists marcelka_typing_results_leaderboard_idx
  on public.marcelka_typing_results (difficulty, points desc, elapsed_ms, accuracy desc, created_at desc);

create index if not exists marcelka_typing_results_created_at_idx
  on public.marcelka_typing_results (created_at desc);

create index if not exists marcelka_typing_results_school_class_idx
  on public.marcelka_typing_results (school, class_name);

alter table public.marcelka_typing_results enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.marcelka_typing_results to anon, authenticated;
grant all on public.marcelka_typing_results to service_role;

drop policy if exists "Allow public read marcelka typing results" on public.marcelka_typing_results;

create policy "Allow public read marcelka typing results"
  on public.marcelka_typing_results
  for select
  using (true);
