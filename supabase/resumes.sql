-- Run this in Supabase Dashboard → SQL Editor → New query → Run
-- Stores resume profiles by career category for Console Projects Resume Builder

create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  location text,
  linkedin text,
  portfolio text,
  category text not null default 'IT',
  headline text,
  summary text,
  skills jsonb default '[]'::jsonb,
  experience jsonb default '[]'::jsonb,
  education jsonb default '[]'::jsonb,
  certifications jsonb default '[]'::jsonb,
  languages jsonb default '[]'::jsonb,
  projects jsonb default '[]'::jsonb,
  edit_password text not null default '3455',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- If the table already exists, add the edit password column (safe to re-run):
alter table public.resumes
  add column if not exists edit_password text not null default '3455';

create index if not exists resumes_category_idx on public.resumes (category);
create index if not exists resumes_created_at_idx on public.resumes (created_at desc);
create index if not exists resumes_full_name_idx on public.resumes (lower(full_name));

alter table public.resumes enable row level security;

drop policy if exists "Allow anon read resumes" on public.resumes;
create policy "Allow anon read resumes"
  on public.resumes for select
  to anon, authenticated
  using (true);

drop policy if exists "Allow anon insert resumes" on public.resumes;
create policy "Allow anon insert resumes"
  on public.resumes for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Allow anon update resumes" on public.resumes;
create policy "Allow anon update resumes"
  on public.resumes for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "Allow anon delete resumes" on public.resumes;
create policy "Allow anon delete resumes"
  on public.resumes for delete
  to anon, authenticated
  using (true);

grant select, insert, update, delete on table public.resumes to anon, authenticated;

-- Optional seed categories reference (not a separate table; values used by the app)
-- Banking | IT | Healthcare | Education | Marketing | Finance | Engineering | Hospitality | Government | Other
