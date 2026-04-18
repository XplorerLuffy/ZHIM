-- =============================================================================
-- Wellexus Database Schema
-- Run this in the Supabase SQL Editor after creating your project.
-- =============================================================================

create extension if not exists "uuid-ossp";

-- =============================================================================
-- Tables
-- =============================================================================

-- mirrors auth.users — populated by the on_auth_user_created trigger
create table if not exists public.users (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  created_at timestamptz default now() not null
);

create table if not exists public.mood_logs (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.users(id) on delete cascade,
  mood       text not null check (mood in ('happy', 'anxious', 'tired', 'motivated', 'sad')),
  intensity  smallint not null check (intensity between 1 and 5),
  date       date not null default current_date,
  created_at timestamptz default now() not null
);

create table if not exists public.plans (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.users(id) on delete cascade,
  mood_log_id  uuid references public.mood_logs(id) on delete set null,
  meal         jsonb,
  workout      jsonb,
  mindfulness  text,
  date         date not null default current_date,
  created_at   timestamptz default now() not null
);

-- one row per user — upserted by wellness-plan edge function
create table if not exists public.nexi_stats (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid unique not null references public.users(id) on delete cascade,
  xp          integer not null default 0 check (xp >= 0),
  level       smallint not null default 1 check (level >= 1),
  streak      integer not null default 0 check (streak >= 0),
  last_active date
);

-- =============================================================================
-- Indexes
-- =============================================================================

create index if not exists idx_mood_logs_user_date    on public.mood_logs  (user_id, date desc);
create index if not exists idx_mood_logs_user_created on public.mood_logs  (user_id, created_at desc);
create index if not exists idx_plans_user_date        on public.plans      (user_id, date desc);
create index if not exists idx_plans_mood_log         on public.plans      (mood_log_id);
create index if not exists idx_nexi_stats_user        on public.nexi_stats (user_id);

-- =============================================================================
-- Row Level Security
-- =============================================================================

alter table public.users      enable row level security;
alter table public.mood_logs  enable row level security;
alter table public.plans      enable row level security;
alter table public.nexi_stats enable row level security;

-- Drop + recreate to make this idempotent
drop policy if exists "own rows" on public.users;
drop policy if exists "own rows" on public.mood_logs;
drop policy if exists "own rows" on public.plans;
drop policy if exists "own rows" on public.nexi_stats;

create policy "own rows" on public.users
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "own rows" on public.mood_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows" on public.plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own rows" on public.nexi_stats
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =============================================================================
-- Triggers
-- =============================================================================

-- Auto-create users + nexi_stats rows when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email)
    values (new.id, new.email)
    on conflict (id) do nothing;

  insert into public.nexi_stats (user_id)
    values (new.id)
    on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-reset streak when a user hasn't logged in > 1 day
-- Called by a scheduled Supabase cron job (pg_cron) or manually
create or replace function public.reset_broken_streaks()
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.nexi_stats
  set streak = 0
  where last_active is not null
    and last_active < current_date - interval '1 day';
end;
$$;

-- =============================================================================
-- Useful views
-- =============================================================================

-- Per-user monthly mood summary (used by history screen stats)
create or replace view public.monthly_mood_summary as
  select
    user_id,
    date_trunc('month', date) as month,
    count(*)                  as total_logs,
    mode() within group (order by mood) as dominant_mood,
    avg(intensity)::numeric(3,1)        as avg_intensity
  from public.mood_logs
  group by user_id, date_trunc('month', date);

-- Grant select on view to authenticated users (RLS on base table already filters)
grant select on public.monthly_mood_summary to authenticated;
