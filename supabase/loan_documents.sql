-- Run this in Supabase Dashboard → SQL Editor → New query → Run
-- Loan types + customer records for Console Projects Documents workspace

create table if not exists public.loan_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  portal_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists loan_types_name_idx on public.loan_types (lower(name));
create index if not exists loan_types_created_at_idx on public.loan_types (created_at desc);

create table if not exists public.loan_documents (
  id uuid primary key default gen_random_uuid(),
  loan_type_id uuid references public.loan_types(id) on delete cascade,
  customer_name text not null,
  loan_reference text,
  status text not null default 'draft',
  notes text,
  personal_details jsonb not null default '{}'::jsonb,
  kyc_details jsonb not null default '{}'::jsonb,
  bank_details jsonb not null default '{}'::jsonb,
  login_credentials jsonb not null default '{}'::jsonb,
  customer_profile jsonb not null default '{}'::jsonb,
  edit_password text not null default '3455',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Migration for tables created before loan types existed
alter table public.loan_documents
  add column if not exists loan_type_id uuid references public.loan_types(id) on delete cascade;

alter table public.loan_documents
  add column if not exists edit_password text not null default '3455';

alter table public.loan_documents
  add column if not exists customer_profile jsonb not null default '{}'::jsonb;

-- Migrate legacy loan_portal column into loan_types (safe to re-run)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'loan_documents' and column_name = 'loan_portal'
  ) then
    insert into public.loan_types (name)
    select distinct trim(loan_portal)
    from public.loan_documents
    where trim(loan_portal) <> ''
      and not exists (
        select 1 from public.loan_types t where lower(t.name) = lower(trim(loan_documents.loan_portal))
      );

    update public.loan_documents d
    set loan_type_id = t.id
    from public.loan_types t
    where d.loan_type_id is null
      and trim(d.loan_portal) <> ''
      and lower(t.name) = lower(trim(d.loan_portal));

    update public.loan_documents d
    set loan_portal = t.name
    from public.loan_types t
    where d.loan_type_id = t.id
      and (d.loan_portal is null or trim(d.loan_portal) = '');

    alter table public.loan_documents alter column loan_portal drop not null;
    alter table public.loan_documents alter column loan_portal set default '';
  end if;
end $$;

-- Drop legacy loan_portal once loan_type_id is populated (safe to re-run)
alter table public.loan_documents drop column if exists loan_portal;

create index if not exists loan_documents_loan_type_id_idx on public.loan_documents (loan_type_id);
create index if not exists loan_documents_status_idx on public.loan_documents (status);
create index if not exists loan_documents_created_at_idx on public.loan_documents (created_at desc);
create index if not exists loan_documents_customer_name_idx on public.loan_documents (lower(customer_name));

alter table public.loan_types enable row level security;
alter table public.loan_documents enable row level security;

drop policy if exists "Allow anon read loan_types" on public.loan_types;
create policy "Allow anon read loan_types"
  on public.loan_types for select to anon, authenticated using (true);

drop policy if exists "Allow anon insert loan_types" on public.loan_types;
create policy "Allow anon insert loan_types"
  on public.loan_types for insert to anon, authenticated with check (true);

drop policy if exists "Allow anon update loan_types" on public.loan_types;
create policy "Allow anon update loan_types"
  on public.loan_types for update to anon, authenticated using (true) with check (true);

drop policy if exists "Allow anon delete loan_types" on public.loan_types;
create policy "Allow anon delete loan_types"
  on public.loan_types for delete to anon, authenticated using (true);

drop policy if exists "Allow anon read loan_documents" on public.loan_documents;
create policy "Allow anon read loan_documents"
  on public.loan_documents for select to anon, authenticated using (true);

drop policy if exists "Allow anon insert loan_documents" on public.loan_documents;
create policy "Allow anon insert loan_documents"
  on public.loan_documents for insert to anon, authenticated with check (true);

drop policy if exists "Allow anon update loan_documents" on public.loan_documents;
create policy "Allow anon update loan_documents"
  on public.loan_documents for update to anon, authenticated using (true) with check (true);

drop policy if exists "Allow anon delete loan_documents" on public.loan_documents;
create policy "Allow anon delete loan_documents"
  on public.loan_documents for delete to anon, authenticated using (true);

grant select, insert, update, delete on table public.loan_types to anon, authenticated;
grant select, insert, update, delete on table public.loan_documents to anon, authenticated;

-- Suggested starter loan types (skip if name already exists)
insert into public.loan_types (name, description)
select v.name, v.description
from (values
  ('JanSamarth Portal', 'Government loan schemes via JanSamarth'),
  ('PM-Vidyalaxmi', 'Education loan scheme'),
  ('Vidya Lakshmi Portal (Education Loans)', 'Education loan portal'),
  ('Stand-Up India Portal', 'Stand-Up India loan applications'),
  ('PM SVANidhi Portal', 'Street vendor loan scheme'),
  ('PSB Loans in 59 Minutes', 'MSME loan in 59 minutes'),
  ('Udyami Mitra (Mudra Loan Portal)', 'Mudra loan portal')
) as v(name, description)
where not exists (
  select 1 from public.loan_types t where lower(t.name) = lower(v.name)
);
