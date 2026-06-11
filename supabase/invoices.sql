create extension if not exists pgcrypto;

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  variable_symbol text not null,
  issue_date date not null,
  due_date date not null,
  taxable_supply_date date not null,
  customer_name text not null,
  customer_address text not null,
  customer_ico text,
  customer_dic text,
  note text,
  total_amount numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  quantity numeric(12, 2) not null default 1,
  unit text not null default 'ks',
  unit_price numeric(12, 2) not null default 0,
  total_price numeric(12, 2) not null default 0,
  sort_order integer not null default 0
);

create index if not exists invoices_issue_date_idx on public.invoices(issue_date desc);
create index if not exists invoice_items_invoice_id_idx on public.invoice_items(invoice_id, sort_order);

alter table public.invoices
  add column if not exists customer_dic text;

alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;

grant usage on schema public to service_role;
grant all on public.invoices to service_role;
grant all on public.invoice_items to service_role;

-- Faktury se vytvareji a ctou pouze server-side pres SUPABASE_SERVICE_ROLE_KEY.
