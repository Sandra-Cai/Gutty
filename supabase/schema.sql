-- Gutty Supabase setup
-- Run this in Supabase: SQL Editor -> New query -> paste -> Run.

create extension if not exists pgcrypto;

create table if not exists public.signups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  reason text,
  created_at timestamptz not null default now()
);

alter table public.signups enable row level security;

drop policy if exists "Allow public signup inserts" on public.signups;
create policy "Allow public signup inserts"
on public.signups
for insert
to anon
with check (
  length(trim(name)) > 0
  and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
);

create table if not exists public.donation_pledges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  amount numeric(10,2) not null,
  message text,
  created_at timestamptz not null default now()
);

alter table public.donation_pledges enable row level security;

drop policy if exists "Allow public donation pledge inserts" on public.donation_pledges;
create policy "Allow public donation pledge inserts"
on public.donation_pledges
for insert
to anon
with check (
  length(trim(name)) > 0
  and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  and amount > 0
);
