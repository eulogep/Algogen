-- supabase/migrations/003_algorithm_updates.sql
-- Table pour stocker les changements d'algorithme détectés

create table if not exists algorithm_updates (
  id uuid default gen_random_uuid() primary key,
  platform text not null,
  summary text not null,
  impact_level text not null check (impact_level in ('low', 'medium', 'high')),
  affected_areas text[] default '{}',
  action_for_creators text default '',
  source_url text not null,
  source_title text not null,
  date_detected date not null default current_date,
  bookmarked_by uuid[] default '{}',         -- user_ids qui ont bookmarké
  created_at timestamptz default now()
);

-- Index pour les requêtes courantes
create index if not exists idx_algo_updates_platform on algorithm_updates(platform);
create index if not exists idx_algo_updates_date on algorithm_updates(date_detected desc);
create index if not exists idx_algo_updates_impact on algorithm_updates(impact_level);

-- RLS : lecture publique, écriture service role uniquement
alter table algorithm_updates enable row level security;

create policy "Public read"
  on algorithm_updates for select
  using (true);

create policy "Service role insert"
  on algorithm_updates for insert
  with check (true);  -- Le service role bypass RLS de toute façon

-- Vue pour les stats (optionnel)
create or replace view algo_update_stats as
select
  platform,
  count(*) as total_updates,
  count(*) filter (where impact_level = 'high') as high_impact,
  count(*) filter (where impact_level = 'medium') as medium_impact,
  count(*) filter (where impact_level = 'low') as low_impact,
  max(date_detected) as last_update
from algorithm_updates
group by platform;
