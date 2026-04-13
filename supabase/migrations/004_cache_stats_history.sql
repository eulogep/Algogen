-- Table pour stocker l'historique des métriques du cache
create table cache_stats_history (
                                   id uuid default gen_random_uuid() primary key,
                                   l1_hits int not null,
                                   l2_hits int not null,
                                   misses int not null,
                                   total_requests int not null,
                                   l1_hit_rate int not null,
                                   l2_hit_rate int not null,
                                   miss_rate int not null,
                                   estimated_savings_dollars numeric not null,
                                   recorded_at timestamptz default now()
);

-- Index pour optimiser les requêtes chronologiques
create index idx_cache_stats_recorded_at on cache_stats_history(recorded_at desc);

-- RLS: Lecture publique pour le dashboard, écriture réservée au service role (bot)
alter table cache_stats_history enable row level security;

create policy "Lecture publique pour cache_stats_history"
  on cache_stats_history for select
  using (true);

-- L'insertion sera gérée par le Cron Vercel via Supabase Service Role Key 
-- (qui contourne le RLS nativement), donc pas besoin de politique d'insertion.
