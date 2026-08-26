-- supabase/migrations/008_algorithm_observatory.sql
-- Algorithm Observatory : preuves explicites, confiance et tendances multi-sources.
-- Réconcilie également la première table historique utilisée en production,
-- dont les colonnes étaient title/impact/detected_at au lieu du schéma versionné.

alter table algorithm_updates
  add column if not exists summary text not null default '',
  add column if not exists impact_level text not null default 'medium'
    check (impact_level in ('low', 'medium', 'high')),
  add column if not exists affected_areas text[] not null default '{}',
  add column if not exists action_for_creators text not null default '',
  add column if not exists source_title text not null default '',
  add column if not exists date_detected date not null default current_date;

-- Backfill non destructif lorsque les anciennes colonnes sont présentes.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'algorithm_updates' and column_name = 'title'
  ) then
    execute 'update algorithm_updates set summary = coalesce(nullif(summary, ''''), title, ''''), source_title = coalesce(nullif(source_title, ''''), title, '''') where summary = '''' or source_title = ''''';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'algorithm_updates' and column_name = 'impact'
  ) then
    execute 'update algorithm_updates set impact_level = case when impact in (''low'', ''medium'', ''high'') then impact else impact_level end';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'algorithm_updates' and column_name = 'detected_at'
  ) then
    execute 'update algorithm_updates set date_detected = coalesce(date_detected, detected_at::date)';
  end if;
end $$;

create index if not exists idx_algo_updates_platform on algorithm_updates(platform);
create index if not exists idx_algo_updates_date on algorithm_updates(date_detected desc);
create index if not exists idx_algo_updates_impact on algorithm_updates(impact_level);

alter table algorithm_updates
  add column if not exists signal_confidence smallint not null default 0
    check (signal_confidence between 0 and 100),
  add column if not exists evidence_count integer not null default 0
    check (evidence_count >= 0),
  add column if not exists source_type text not null default 'official_newsroom'
    check (source_type in (
      'official_newsroom',
      'creator_post',
      'trend_feed',
      'community_discussion',
      'competitor_content',
      'manual'
    )),
  add column if not exists affected_formats text[] not null default '{}',
  add column if not exists affected_creators text[] not null default '{}',
  add column if not exists observatory_evidence jsonb not null default '[]'::jsonb;

create index if not exists idx_algo_updates_confidence
  on algorithm_updates(signal_confidence desc);

create index if not exists idx_algo_updates_source_type
  on algorithm_updates(source_type);

create table if not exists trend_observations (
  id uuid default gen_random_uuid() primary key,
  topic text not null,
  topic_key text not null,
  platforms text[] not null default '{}',
  source_types text[] not null default '{}',
  velocity numeric(14, 2) not null default 0,
  acceleration numeric(8, 2) not null default 0,
  engagement numeric(8, 2) not null default 0,
  novelty numeric(8, 2) not null default 0,
  cross_platform_spread integer not null default 0,
  trend_score smallint not null check (trend_score between 0 and 100),
  confidence smallint not null check (confidence between 0 and 100),
  evidence_count integer not null default 0 check (evidence_count >= 0),
  evidence jsonb not null default '[]'::jsonb,
  detected_at timestamptz not null default now(),
  detected_on date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(topic_key, detected_on)
);

create index if not exists idx_trend_observations_score
  on trend_observations(trend_score desc, detected_at desc);

create index if not exists idx_trend_observations_platforms
  on trend_observations using gin(platforms);

create index if not exists idx_trend_observations_source_types
  on trend_observations using gin(source_types);

alter table trend_observations enable row level security;

drop policy if exists "Public read trend observations" on trend_observations;
create policy "Public read trend observations"
  on trend_observations for select
  using (true);

drop policy if exists "Service role inserts trend observations" on trend_observations;
create policy "Service role inserts trend observations"
  on trend_observations for insert
  with check (true);

drop policy if exists "Service role updates trend observations" on trend_observations;
create policy "Service role updates trend observations"
  on trend_observations for update
  using (true)
  with check (true);

create or replace view algorithm_observatory_stats as
select
  platform,
  count(*) as update_count,
  round(avg(signal_confidence), 1) as average_confidence,
  sum(evidence_count) as evidence_count,
  max(date_detected) as last_detected_at
from algorithm_updates
group by platform;
