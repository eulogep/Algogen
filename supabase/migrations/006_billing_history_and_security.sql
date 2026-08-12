-- Réconciliation du socle production : profils, facturation Stripe et historique d'analyses.
-- Cette migration complète les migrations 002 à 005 et remplace les dépendances implicites
-- du code applicatif par des objets versionnés et reproductibles.

-- ── Profils et facturation ──────────────────────────────────────────────────
alter table public.profiles
  add column if not exists expires_at timestamptz,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists student_used boolean not null default false;

create unique index if not exists profiles_stripe_customer_id_unique
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;

create index if not exists profiles_plan_idx on public.profiles (plan);

-- ── Historique utilisé à la fois par le produit et les quotas ───────────────
create table if not exists public.analysis_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform_id text not null,
  niche text not null,
  objective text not null,
  level text not null,
  score integer not null default 0 check (score between 0 and 100),
  strategy jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists analysis_history_user_created_at_idx
  on public.analysis_history (user_id, created_at desc);

alter table public.analysis_history enable row level security;

drop policy if exists "Users can read own analysis history" on public.analysis_history;
create policy "Users can read own analysis history"
  on public.analysis_history for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create own analysis history" on public.analysis_history;
create policy "Users can create own analysis history"
  on public.analysis_history for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own analysis history" on public.analysis_history;
create policy "Users can delete own analysis history"
  on public.analysis_history for delete
  using (auth.uid() = user_id);

-- Conservation de la table utilisée par la route d'analyse historique.
create table if not exists public.strategies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null,
  profile jsonb not null,
  strategy jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists strategies_user_created_at_idx
  on public.strategies (user_id, created_at desc);

alter table public.strategies enable row level security;

drop policy if exists "Users can read own strategies" on public.strategies;
create policy "Users can read own strategies"
  on public.strategies for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create own strategies" on public.strategies;
create policy "Users can create own strategies"
  on public.strategies for insert
  with check (auth.uid() = user_id);

-- ── Fonctions de facturation (appelées exclusivement côté serveur) ─────────
create or replace function public.set_stripe_customer(
  p_user_id uuid,
  p_customer_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set stripe_customer_id = p_customer_id
  where id = p_user_id;

  if not found then
    raise exception 'Profile not found for user %', p_user_id;
  end if;
end;
$$;

create or replace function public.activate_pro_plan(
  p_user_id uuid,
  p_subscription text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set
    plan = 'pro',
    expires_at = null,
    stripe_subscription_id = p_subscription
  where id = p_user_id;

  if not found then
    raise exception 'Profile not found for user %', p_user_id;
  end if;
end;
$$;

create or replace function public.activate_student_plan(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set
    plan = 'student',
    expires_at = now() + interval '2 months',
    student_used = true,
    stripe_subscription_id = null
  where id = p_user_id
    and student_used = false;

  if not found then
    raise exception 'Student plan is unavailable for user %', p_user_id;
  end if;
end;
$$;

create or replace function public.downgrade_to_free_by_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and auth.uid() <> p_user_id then
    raise exception 'Cannot downgrade another user profile';
  end if;

  update public.profiles
  set
    plan = 'free',
    expires_at = null,
    stripe_subscription_id = null
  where id = p_user_id;

  if not found then
    raise exception 'Profile not found for user %', p_user_id;
  end if;
end;
$$;

create or replace function public.downgrade_to_free_by_customer(p_customer_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set
    plan = 'free',
    expires_at = null,
    stripe_subscription_id = null
  where stripe_customer_id = p_customer_id;
end;
$$;

revoke all on function public.set_stripe_customer(uuid, text) from public;
revoke all on function public.activate_pro_plan(uuid, text) from public;
revoke all on function public.activate_student_plan(uuid) from public;
revoke all on function public.downgrade_to_free_by_user(uuid) from public;
revoke all on function public.downgrade_to_free_by_customer(text) from public;

grant execute on function public.downgrade_to_free_by_user(uuid) to authenticated;
grant execute on function public.set_stripe_customer(uuid, text) to service_role;
grant execute on function public.activate_pro_plan(uuid, text) to service_role;
grant execute on function public.activate_student_plan(uuid) to service_role;
grant execute on function public.downgrade_to_free_by_user(uuid) to service_role;
grant execute on function public.downgrade_to_free_by_customer(text) to service_role;
