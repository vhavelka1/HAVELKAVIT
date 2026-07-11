create extension if not exists pgcrypto;

create table if not exists public.photo_images (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.photo_categories(id) on delete cascade,
  image_url text not null,
  title text not null default '',
  description text not null default '',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists photo_images_category_order_idx
  on public.photo_images (category_id, is_active, sort_order, created_at);

alter table public.photo_images enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.photo_images to anon, authenticated;
grant all on public.photo_images to service_role;

drop policy if exists "Allow public read photo images" on public.photo_images;

create policy "Allow public read photo images"
  on public.photo_images
  for select
  using (true);
