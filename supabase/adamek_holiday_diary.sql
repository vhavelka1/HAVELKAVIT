create extension if not exists pgcrypto;

create table if not exists public.adamek_holiday_entries (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null unique,
  title text not null,
  description text not null,
  image_url text,
  storage_path text,
  image_width integer,
  image_height integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint adamek_holiday_entries_month_check
    check (extract(month from entry_date) in (7, 8)),
  constraint adamek_holiday_entries_title_check
    check (length(trim(title)) > 0),
  constraint adamek_holiday_entries_description_check
    check (length(trim(description)) > 0),
  constraint adamek_holiday_entries_image_width_check
    check (image_width is null or image_width > 0),
  constraint adamek_holiday_entries_image_height_check
    check (image_height is null or image_height > 0)
);

create or replace function public.set_adamek_holiday_entries_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_adamek_holiday_entries_updated_at on public.adamek_holiday_entries;

create trigger set_adamek_holiday_entries_updated_at
before update on public.adamek_holiday_entries
for each row
execute function public.set_adamek_holiday_entries_updated_at();

alter table public.adamek_holiday_entries enable row level security;

drop policy if exists "Public can read active Adamek holiday entries" on public.adamek_holiday_entries;

create policy "Public can read active Adamek holiday entries"
on public.adamek_holiday_entries
for select
to anon, authenticated
using (is_active = true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'adamek-holiday-diary',
  'adamek-holiday-diary',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read Adamek holiday diary images" on storage.objects;

create policy "Public can read Adamek holiday diary images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'adamek-holiday-diary');
