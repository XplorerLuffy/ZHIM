-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users (mirrors Supabase auth.users)
create table public.users (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  created_at timestamptz default now()
);

-- Mood logs
create table public.mood_logs (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.users(id) on delete cascade,
  mood       text not null check (mood in ('happy', 'anxious', 'tired', 'motivated', 'sad')),
  intensity  smallint not null check (intensity between 1 and 5),
  date       date not null default current_date,
  created_at timestamptz default now()
);

-- Wellness plans
create table public.plans (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.users(id) on delete cascade,
  mood_log_id  uuid references public.mood_logs(id),
  meal         jsonb,
  workout      jsonb,
  mindfulness  text,
  date         date not null default current_date,
  created_at   timestamptz default now()
);

-- Nexi stats (one row per user)
create table public.nexi_stats (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid unique not null references public.users(id) on delete cascade,
  xp          integer not null default 0,
  level       smallint not null default 1,
  streak      integer not null default 0,
  last_active date
);

-- Row Level Security
alter table public.users      enable row level security;
alter table public.mood_logs  enable row level security;
alter table public.plans      enable row level security;
alter table public.nexi_stats enable row level security;

-- Policies: users can only access their own rows
create policy "own rows" on public.users
  for all using (auth.uid() = id);

create policy "own rows" on public.mood_logs
  for all using (auth.uid() = user_id);

create policy "own rows" on public.plans
  for all using (auth.uid() = user_id);

create policy "own rows" on public.nexi_stats
  for all using (auth.uid() = user_id);

-- Trigger: auto-create user + nexi_stats rows on auth signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email)
    values (new.id, new.email);
  insert into public.nexi_stats (user_id)
    values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
