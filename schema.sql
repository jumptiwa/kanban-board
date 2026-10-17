create extension if not exists pgcrypto;
create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  description text not null default '',
  status text not null default 'todo' check (status in ('todo','doing','done')),
  created_at timestamptz not null default now()
);
create index if not exists cards_created_at_idx on public.cards (created_at);
alter table public.cards enable row level security;
-- No public table policies: access is through the backend service role only.
