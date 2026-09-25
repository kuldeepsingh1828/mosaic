-- wCare Digital Wall Activity: word-pool voting + mention tallies.
-- Run this in the Supabase SQL editor for this project (same as the two
-- earlier migrations in this folder — there is no automated migration
-- runner wired up for this project).

create table if not exists public.word_tallies (
  activity_id uuid not null references public.activities(id) on delete cascade,
  word text not null check (word in (
    'Empathy', 'Reliability', 'Inclusivity', 'Resourcefulness',
    'Humour', 'Authenticity', 'Advocacy', 'Transparency'
  )),
  count integer not null default 0,
  primary key (activity_id, word)
);

alter table public.word_tallies enable row level security;

drop policy if exists "Public read word tallies" on public.word_tallies;
create policy "Public read word tallies" on public.word_tallies
  for select using (true);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'word_tallies'
  ) then
    alter publication supabase_realtime add table public.word_tallies;
  end if;
end
$$;

-- increment_word_tally ------------------------------------------------------
-- Called once per selected word when an associate submits the word-pool
-- prompt. Upserts so the first vote for a word on an activity creates the row.

create or replace function public.increment_word_tally(p_activity_id uuid, p_word text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  insert into public.word_tallies (activity_id, word, count)
  values (p_activity_id, p_word, 1)
  on conflict (activity_id, word)
  do update set count = word_tallies.count + 1
  returning count into new_count;

  return new_count;
end;
$$;

grant execute on function public.increment_word_tally(uuid, text) to anon, authenticated, service_role;

-- reset_activity must also clear tallies, otherwise an admin reset leaves
-- stale mention counts next to a freshly-cleared canvas.

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

  delete from public.word_tallies
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
