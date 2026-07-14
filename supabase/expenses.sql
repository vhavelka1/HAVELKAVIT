create extension if not exists pgcrypto;

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  expense_date date not null,
  title text not null,
  supplier text,
  amount numeric(12, 2) not null default 0,
  category text not null,
  note text,
  document_path text,
  document_name text,
  document_mime_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists expenses_expense_date_idx on public.expenses(expense_date desc);
create index if not exists expenses_category_idx on public.expenses(category);

create table if not exists public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists expense_categories_sort_order_idx
  on public.expense_categories(sort_order, name);

alter table public.expenses enable row level security;
alter table public.expense_categories enable row level security;

grant usage on schema public to service_role;
grant all on public.expenses to service_role;
grant all on public.expense_categories to service_role;

insert into public.expense_categories (name, sort_order)
values
  ('Fototechnika', 1),
  ('Objektivy', 2),
  ('Paměťové karty', 3),
  ('Software', 4),
  ('Cestovné', 5),
  ('Telefon a internet', 6),
  ('Kancelář', 7),
  ('Ostatní', 8)
on conflict (name) do update
set sort_order = excluded.sort_order;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'expense-documents',
  'expense-documents',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Danova evidence se cte a zapisuje pouze server-side pres SUPABASE_SERVICE_ROLE_KEY.
