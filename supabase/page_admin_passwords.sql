create table if not exists public.page_admin_passwords (
  page_id text primary key check (page_id in ('emicka', 'adamek')),
  label text not null,
  password_hash text not null,
  password_salt text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.page_admin_passwords enable row level security;

grant usage on schema public to service_role;
grant all on public.page_admin_passwords to service_role;

-- Hesla se nastavuji pres skutecnou administraci /login/fake.
-- Cteni a zapis pouziva SUPABASE_SERVICE_ROLE_KEY, takze hash hesel neni verejne dostupny pres anon key.
