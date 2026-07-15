-- Run this in Supabase Dashboard → SQL Editor → New query → Run
-- Creates the invoices table used by Console Billing

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  status text not null default 'unpaid',
  issue_date date,
  due_date date,
  from_company text,
  from_address text,
  from_email text,
  from_phone text,
  to_company text,
  to_address text,
  to_email text,
  to_phone text,
  currency text default '₹',
  amount_paid numeric default 0,
  discount_type text default 'amount',
  discount_value numeric default 0,
  payment_mode text,
  upi_id text,
  upi_payee_name text,
  bank_details text,
  extra_notes text,
  terms text,
  items jsonb default '[]'::jsonb,
  subtotal numeric default 0,
  discount numeric default 0,
  total numeric default 0,
  balance_due numeric default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invoices_created_at_idx on public.invoices (created_at desc);

alter table public.invoices enable row level security;

-- Public app access (anon key). Tighten later if you add auth.
drop policy if exists "Allow anon read invoices" on public.invoices;
create policy "Allow anon read invoices"
  on public.invoices for select
  to anon, authenticated
  using (true);

drop policy if exists "Allow anon insert invoices" on public.invoices;
create policy "Allow anon insert invoices"
  on public.invoices for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Allow anon update invoices" on public.invoices;
create policy "Allow anon update invoices"
  on public.invoices for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "Allow anon delete invoices" on public.invoices;
create policy "Allow anon delete invoices"
  on public.invoices for delete
  to anon, authenticated
  using (true);

-- Ensure anon can delete (needed in some projects even with RLS policies)
grant select, insert, update, delete on table public.invoices to anon, authenticated;
