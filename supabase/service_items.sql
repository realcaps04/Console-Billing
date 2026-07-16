-- Run this in Supabase Dashboard → SQL Editor → New query → Run
-- Catalog of billable service descriptions + default rates for Console Billing

create table if not exists public.service_items (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  rate numeric not null default 0,
  category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists service_items_description_uidx
  on public.service_items (lower(description));

create index if not exists service_items_category_idx
  on public.service_items (category);

alter table public.service_items enable row level security;

drop policy if exists "Allow anon read service_items" on public.service_items;
create policy "Allow anon read service_items"
  on public.service_items for select
  to anon, authenticated
  using (true);

drop policy if exists "Allow anon insert service_items" on public.service_items;
create policy "Allow anon insert service_items"
  on public.service_items for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Allow anon update service_items" on public.service_items;
create policy "Allow anon update service_items"
  on public.service_items for update
  to anon, authenticated
  using (true)
  with check (true);

grant select, insert, update, delete on table public.service_items to anon, authenticated;

drop policy if exists "Allow anon delete service_items" on public.service_items;
create policy "Allow anon delete service_items"
  on public.service_items for delete
  to anon, authenticated
  using (true);

-- Seed catalog (skip rows that already exist by description)
insert into public.service_items (description, rate, category)
select v.description, v.rate, v.category
from (values
  ('Udyam Registration', 0, 'Business & Compliance'),
  ('K-SWIFT (Kerala Single Window Interface for Fast and Transparent Clearances)', 0, 'Business & Compliance'),
  ('Startup India Portal', 0, 'Business & Compliance'),
  ('GeM (Government e-Marketplace)', 0, 'Business & Compliance'),
  ('GST Portal', 0, 'Business & Compliance'),
  ('Income Tax e-Filing Portal', 0, 'Business & Compliance'),
  ('MCA21 (Ministry of Corporate Affairs)', 0, 'Business & Compliance'),
  ('Shram Suvidha Portal', 0, 'Business & Compliance'),
  ('e-Way Bill System', 0, 'Business & Compliance'),
  ('Make in India Portal', 0, 'Business & Compliance'),

  ('JanSamarth Portal', 0, 'Loans, Finance & Banking'),
  ('PM-Vidyalaxmi', 0, 'Loans, Finance & Banking'),
  ('Vidya Lakshmi Portal (Education Loans)', 0, 'Loans, Finance & Banking'),
  ('Stand-Up India Portal', 0, 'Loans, Finance & Banking'),
  ('PM SVANidhi Portal', 0, 'Loans, Finance & Banking'),
  ('PSB Loans in 59 Minutes', 0, 'Loans, Finance & Banking'),
  ('Udyami Mitra (Mudra Loan Portal)', 0, 'Loans, Finance & Banking'),

  ('DigiLocker', 0, 'Citizen Services & Identification'),
  ('Parivahan Sewa (Vahan & Sarathi)', 0, 'Citizen Services & Identification'),
  ('Passport Seva', 0, 'Citizen Services & Identification'),
  ('UIDAI (Aadhaar Services) Portal', 0, 'Citizen Services & Identification'),
  ('NVSP (National Voter''s Service Portal)', 0, 'Citizen Services & Identification'),
  ('Civil Registration System (CRS - Birth/Death)', 0, 'Citizen Services & Identification'),
  ('e-Courts Services', 0, 'Citizen Services & Identification'),
  ('e-District (State-specific citizen services, e.g., e-District Kerala)', 0, 'Citizen Services & Identification'),

  ('National Scholarship Portal (NSP)', 0, 'Education, Skills & Employment'),
  ('Skill India Digital', 0, 'Education, Skills & Employment'),
  ('National Career Service (NCS)', 0, 'Education, Skills & Employment'),
  ('Apprenticeship India Portal', 0, 'Education, Skills & Employment'),
  ('SWAYAM Portal', 0, 'Education, Skills & Employment'),

  ('e-Shram Portal', 0, 'Social Security & Welfare'),
  ('UMANG', 0, 'Social Security & Welfare'),
  ('EPFO Member Portal', 0, 'Social Security & Welfare'),
  ('Jeevan Pramaan (Digital Life Certificate)', 0, 'Social Security & Welfare'),
  ('MyScheme Portal', 0, 'Social Security & Welfare'),

  ('PM-KISAN Portal', 0, 'Agriculture & Rural Development'),
  ('e-NAM (National Agriculture Market)', 0, 'Agriculture & Rural Development'),
  ('NREGA (MGNREGA) Portal', 0, 'Agriculture & Rural Development'),
  ('Kisan Suvidha', 0, 'Agriculture & Rural Development'),

  ('Ayushman Bharat (PM-JAY)', 0, 'Health & Housing'),
  ('CoWIN', 0, 'Health & Housing'),
  ('e-Sanjeevani', 0, 'Health & Housing'),
  ('PMAY (Pradhan Mantri Awas Yojana) Portal', 0, 'Health & Housing')
) as v(description, rate, category)
where not exists (
  select 1
  from public.service_items s
  where lower(s.description) = lower(v.description)
);
