-- Ajout à ta schema Supabase existante
create table strategy_cache (
  id uuid default gen_random_uuid() primary key,
  platform text not null,
  profile_hash text not null, -- Hash du profil utilisateur
  strategy jsonb not null,
  hit_count int default 0,
  created_at timestamp default now(),
  last_accessed_at timestamp default now(),
  
  -- Index pour les lookups rapides
  unique(platform, profile_hash)
);

-- TTL: effacer les caches non accédées depuis 30 jours
create policy "cache_cleanup"
  on strategy_cache
  using (now() - last_accessed_at > interval '30 days');
