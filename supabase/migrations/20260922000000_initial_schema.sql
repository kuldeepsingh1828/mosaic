-- Base schema for the "Create Together" shared pixel canvas activity.
-- Reverse-engineered from app/api/activity/route.ts, app/api/admin/*,
-- app/page.tsx and app/admin/page.tsx, since no earlier migration existed
-- to create these objects (20260923000000_add_activity_reset.sql assumes
-- they already exist).

create extension if not exists pgcrypto;

-- activities --------------------------------------------------------------

-- One row per physical location running its own independent canvas.
-- Keep this list in sync with lib/locations.ts (LOCATIONS).
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  location text not null unique
    check (location in ('idc-blr', 'idc-chn', 'site-c')),
  grid_size integer not null default 20,
  starting_grid_size integer not null default 20
    check (starting_grid_size in (20, 30, 40, 50)),
  timer_duration_seconds integer not null default 300,
  status text not null default 'ready'
    check (status in ('ready', 'running', 'locked')),
  started_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

-- cells ---------------------------------------------------------------------

create table if not exists public.cells (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  row integer not null,
  col integer not null,
  color text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (activity_id, row, col)
);

create index if not exists cells_activity_id_idx on public.cells (activity_id);

-- expand_activity_if_full ----------------------------------------------------
-- Called after every successful paint; grows the canvas to the next size
-- (20 -> 30 -> 40 -> 50) once every cell in the current grid is filled.

create or replace function public.expand_activity_if_full(p_activity_id uuid)
returns table(expanded boolean, new_grid_size integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_grid_size integer;
  filled_count integer;
  next_size integer;
begin
  select grid_size into current_grid_size
  from public.activities
  where id = p_activity_id;

  if current_grid_size is null then
    raise exception 'Activity not found';
  end if;

  select count(*) into filled_count
  from public.cells
  where activity_id = p_activity_id;

  if filled_count < current_grid_size * current_grid_size then
    return query select false, current_grid_size;
    return;
  end if;

  next_size := case current_grid_size
    when 20 then 30
    when 30 then 40
    when 40 then 50
    else null
  end;

  if next_size is null then
    return query select false, current_grid_size;
    return;
  end if;

  update public.activities
  set grid_size = next_size
  where id = p_activity_id;

  return query select true, next_size;
end;
$$;

grant execute on function public.expand_activity_if_full(uuid) to anon, authenticated, service_role;

-- row level security ----------------------------------------------------------
-- Writes go through the service-role client (app/api routes), which bypasses
-- RLS. Public read policies are needed so the browser's anon-key client can
-- do its initial select and receive postgres_changes realtime events.

alter table public.activities enable row level security;
alter table public.cells enable row level security;

drop policy if exists "Public read activities" on public.activities;
create policy "Public read activities" on public.activities
  for select using (true);

drop policy if exists "Public read cells" on public.cells;
create policy "Public read cells" on public.cells
  for select using (true);

-- realtime ----------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'activities'
  ) then
    alter publication supabase_realtime add table public.activities;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'cells'
  ) then
    alter publication supabase_realtime add table public.cells;
  end if;
end
$$;

-- seed ------------------------------------------------------------------------
-- One activity per location. Safe to re-run: skips locations that already
-- have a row (e.g. if you added a 4th location later via a new migration).

insert into public.activities (location, grid_size, starting_grid_size, timer_duration_seconds, status)
select loc, 20, 20, 300, 'ready'
from unnest(array['idc-blr', 'idc-chn', 'site-c']) as loc
where not exists (select 1 from public.activities a where a.location = loc);
