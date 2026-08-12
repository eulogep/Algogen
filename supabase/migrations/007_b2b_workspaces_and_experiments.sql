-- Premier noyau B2B : espaces collaboratifs, marques et expériences de contenu.

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 120),
  kind text not null default 'team' check (kind in ('team', 'agency')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 120),
  primary_platform text,
  primary_objective text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_experiments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  platform text not null,
  title text not null check (char_length(trim(title)) between 3 and 180),
  hypothesis text not null check (char_length(trim(hypothesis)) between 8 and 1200),
  content_format text,
  target_kpi text not null default 'Portée',
  priority smallint not null default 2 check (priority between 1 and 3),
  status text not null default 'planned' check (status in ('draft', 'planned', 'published', 'learning', 'completed')),
  scheduled_for date,
  published_at timestamptz,
  baseline_metric numeric,
  observed_metric numeric,
  learnings text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workspaces_owner_id_idx on public.workspaces(owner_id);
create index if not exists workspace_members_user_id_idx on public.workspace_members(user_id);
create index if not exists brands_workspace_id_idx on public.brands(workspace_id);
create index if not exists content_experiments_workspace_status_idx on public.content_experiments(workspace_id, status, created_at desc);
create index if not exists content_experiments_brand_id_idx on public.content_experiments(brand_id, created_at desc);

-- Évite les politiques RLS récursives sur workspace_members.
create or replace function public.is_workspace_member(p_workspace_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = p_workspace_id
      and user_id = auth.uid()
  );
$$;

revoke all on function public.is_workspace_member(uuid) from public;
grant execute on function public.is_workspace_member(uuid) to authenticated;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.brands enable row level security;
alter table public.content_experiments enable row level security;

create policy "Workspace members can view workspaces"
  on public.workspaces for select
  using (owner_id = auth.uid() or public.is_workspace_member(id));

create policy "Users can create owned workspaces"
  on public.workspaces for insert
  with check (owner_id = auth.uid());

create policy "Workspace owners can update workspaces"
  on public.workspaces for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Workspace owners can delete workspaces"
  on public.workspaces for delete
  using (owner_id = auth.uid());

create policy "Workspace members can view membership"
  on public.workspace_members for select
  using (public.is_workspace_member(workspace_id));

create policy "Workspace owners can invite members"
  on public.workspace_members for insert
  with check (
    exists (
      select 1 from public.workspaces
      where id = workspace_id and owner_id = auth.uid()
    )
  );

create policy "Workspace owners can update membership"
  on public.workspace_members for update
  using (
    exists (
      select 1 from public.workspaces
      where id = workspace_id and owner_id = auth.uid()
    )
  );

create policy "Workspace owners can remove members"
  on public.workspace_members for delete
  using (
    exists (
      select 1 from public.workspaces
      where id = workspace_id and owner_id = auth.uid()
    )
  );

create policy "Workspace members can view brands"
  on public.brands for select
  using (public.is_workspace_member(workspace_id));

create policy "Workspace members can create brands"
  on public.brands for insert
  with check (public.is_workspace_member(workspace_id));

create policy "Workspace members can update brands"
  on public.brands for update
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "Workspace members can delete brands"
  on public.brands for delete
  using (public.is_workspace_member(workspace_id));

create policy "Workspace members can view experiments"
  on public.content_experiments for select
  using (public.is_workspace_member(workspace_id));

create policy "Workspace members can create experiments"
  on public.content_experiments for insert
  with check (
    created_by = auth.uid()
    and public.is_workspace_member(workspace_id)
    and exists (
      select 1 from public.brands
      where id = brand_id and workspace_id = content_experiments.workspace_id
    )
  );

create policy "Workspace members can update experiments"
  on public.content_experiments for update
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "Workspace members can delete experiments"
  on public.content_experiments for delete
  using (public.is_workspace_member(workspace_id));

-- Création atomique du premier espace et de sa marque. Elle évite un espace sans
-- membre propriétaire ou sans marque en cas de défaillance intermédiaire.
create or replace function public.create_workspace_with_brand(
  p_workspace_name text,
  p_workspace_kind text,
  p_brand_name text,
  p_primary_platform text default null,
  p_primary_objective text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_workspace_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_workspace_kind not in ('team', 'agency') then
    raise exception 'Invalid workspace kind';
  end if;

  insert into public.workspaces (owner_id, name, kind)
  values (auth.uid(), trim(p_workspace_name), p_workspace_kind)
  returning id into v_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (v_workspace_id, auth.uid(), 'owner');

  insert into public.brands (workspace_id, name, primary_platform, primary_objective)
  values (
    v_workspace_id,
    trim(p_brand_name),
    nullif(trim(p_primary_platform), ''),
    nullif(trim(p_primary_objective), '')
  );

  return v_workspace_id;
end;
$$;

revoke all on function public.create_workspace_with_brand(text, text, text, text, text) from public;
grant execute on function public.create_workspace_with_brand(text, text, text, text, text) to authenticated;
