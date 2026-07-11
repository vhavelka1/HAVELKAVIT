create extension if not exists pgcrypto;

create table if not exists public.photo_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  long_description text not null default '',
  icon text not null default 'Camera',
  accent_color text not null default '#5eead4',
  image_url text not null default '',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists photo_categories_active_order_idx
  on public.photo_categories (is_active, sort_order, name);

alter table public.photo_categories enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.photo_categories to anon, authenticated;
grant all on public.photo_categories to service_role;

drop policy if exists "Allow public read photo categories" on public.photo_categories;

create policy "Allow public read photo categories"
  on public.photo_categories
  for select
  using (true);

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

grant select on public.photo_images to anon, authenticated;
grant all on public.photo_images to service_role;

drop policy if exists "Allow public read photo images" on public.photo_images;

create policy "Allow public read photo images"
  on public.photo_images
  for select
  using (true);

insert into public.photo_categories (
  name,
  slug,
  description,
  long_description,
  icon,
  accent_color,
  image_url,
  is_active,
  sort_order
)
values
  (
    'Sport',
    'sport',
    'Akce, pohyb, emoce a soustredeni v jednom zaberu.',
    'Sportovni foceni plne energie, detailu, vykonu a okamziku, ktere se neopakuji.',
    'Zap',
    '#5eead4',
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80',
    true,
    10
  ),
  (
    'Svatby',
    'svatby',
    'Prirozene emoce, detaily a atmosfera svatebniho dne.',
    'Svatby zachycene nenapadne a citlive, aby zustal pribeh dne opravdovy.',
    'Heart',
    '#f9a8d4',
    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80',
    true,
    20
  ),
  (
    'Spolecenske akce',
    'spolecenske-akce',
    'Lide, svetlo a atmosfera udalosti.',
    'Reportazni fotografie z akci, ktere zachyti hosty, prostor i naladu vecera.',
    'Sparkles',
    '#facc15',
    'https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=1200&q=80',
    true,
    30
  ),
  (
    'Rodiny',
    'rodiny',
    'Pohoda, smich a prirozene rodinne chvile.',
    'Rodinne foceni postavene na klidu, hre, blizkosti a okamzicich bez nuceneho pozovani.',
    'Smile',
    '#38bdf8',
    'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1200&q=80',
    true,
    40
  ),
  (
    'Portrety',
    'portrety',
    'Svetlo, vyraz a osobnost cloveka.',
    'Portretni fotografie pro osobni prezentaci, socialni site i vzpominky.',
    'User',
    '#c4b5fd',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1200&q=80',
    true,
    50
  ),
  (
    'Fitness & Bodybuilding',
    'fitness-bodybuilding',
    'Forma, kontrast, sila a detail postavy.',
    'Fitness a bodybuilding foceni s durazem na svetlo, strukturu, vykon a charakter.',
    'Dumbbell',
    '#fb7185',
    'https://images.unsplash.com/photo-1571019613914-85f342c6a11e?auto=format&fit=crop&w=1200&q=80',
    true,
    60
  ),
  (
    'Krajina',
    'krajina',
    'Svetlo, prostor, priroda a klid.',
    'Krajinarina pro momenty, kdy priroda sama kresli scenu.',
    'Mountain',
    '#86efac',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    true,
    70
  ),
  (
    'Eventy',
    'eventy',
    'Firemni i verejne udalosti s jasnym pribehem.',
    'Eventove foceni zachycuje prubeh, hosty, detaily i vystupy tak, aby akce zustala ziva.',
    'Calendar',
    '#60a5fa',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
    true,
    80
  )
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  long_description = excluded.long_description,
  icon = excluded.icon,
  accent_color = excluded.accent_color,
  image_url = excluded.image_url,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order,
  updated_at = now();
