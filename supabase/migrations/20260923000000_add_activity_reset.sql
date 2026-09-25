alter table public.activities
  add column if not exists starting_grid_size integer;

update public.activities
set starting_grid_size = 20
where starting_grid_size is null;

alter table public.activities
  alter column starting_grid_size set default 20,
  alter column starting_grid_size set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'activities_starting_grid_size_check'
      and conrelid = 'public.activities'::regclass
  ) then
    alter table public.activities
      add constraint activities_starting_grid_size_check
      check (starting_grid_size in (20, 30, 40, 50));
  end if;
end
$$;

create or replace function public.reset_activity(p_activity_id uuid)
returns public.activities
language plpgsql
security invoker
set search_path = public
as $$
declare
  reset_row public.activities;
begin
  delete from public.cells
  where activity_id = p_activity_id;

  update public.activities
  set
    status = 'ready',
    started_at = null,
    ends_at = null,
    grid_size = starting_grid_size
  where id = p_activity_id
  returning * into reset_row;

  if reset_row.id is null then
    raise exception 'Activity not found';
  end if;

  return reset_row;
end;
$$;

revoke all on function public.reset_activity(uuid) from public, anon, authenticated;
grant execute on function public.reset_activity(uuid) to service_role;

notify pgrst, 'reload schema';
