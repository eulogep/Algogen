-- Historique de santé du cron et seuils d'alerte applicatifs.
-- Les écritures sont réalisées uniquement par le service role côté serveur.

create table if not exists public.cron_run_health (
  id uuid primary key default gen_random_uuid(),
  job_name text not null,
  started_at timestamptz not null,
  finished_at timestamptz not null default now(),
  status text not null check (status in ('success', 'degraded', 'failure')),
  failure_reason text,
  articles_scraped integer not null default 0,
  analyzer_attempted integer not null default 0,
  analyzer_failed integer not null default 0,
  signals_collected integer not null default 0,
  trends_detected integer not null default 0,
  updates_detected integer not null default 0,
  alert_kind text check (alert_kind in ('failure_threshold', 'recovered')),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists cron_run_health_job_finished_idx
  on public.cron_run_health (job_name, finished_at desc);

create index if not exists cron_run_health_active_alert_idx
  on public.cron_run_health (job_name, alert_kind, finished_at desc)
  where alert_kind is not null;

alter table public.cron_run_health enable row level security;

-- Aucune politique client : le suivi est interne au serveur via la service role.
