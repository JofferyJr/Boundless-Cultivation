-- Boundless Server 1 authoritative shared-world clock and leased sessions.
create table if not exists public.boundless_server1_state (
  server_id text primary key check (server_id = 'server-1'),
  world_time_seconds bigint not null default 0 check (world_time_seconds >= 0),
  is_running boolean not null default false,
  last_tick_at timestamptz,
  updated_at timestamptz not null default now()
);
insert into public.boundless_server1_state(server_id, world_time_seconds, is_running, last_tick_at)
values ('server-1', 0, false, null)
on conflict (server_id) do nothing;

create table if not exists public.boundless_server1_sessions (
  session_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  region text not null default 'Puncak Xuefeng',
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists boundless_server1_sessions_seen_idx
  on public.boundless_server1_sessions(last_seen_at);
create index if not exists boundless_server1_sessions_user_idx
  on public.boundless_server1_sessions(user_id);

alter table public.boundless_server1_state enable row level security;
alter table public.boundless_server1_sessions enable row level security;
revoke all on public.boundless_server1_state from anon, authenticated;
revoke all on public.boundless_server1_sessions from anon, authenticated;
grant select on public.boundless_server1_state to authenticated;
drop policy if exists "Server 1 state readable by authenticated players" on public.boundless_server1_state;
create policy "Server 1 state readable by authenticated players"
  on public.boundless_server1_state for select to authenticated using (true);

create or replace function public.boundless_server1_heartbeat(
  p_session_id uuid,
  p_region text default 'Puncak Xuefeng'
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_uid uuid := auth.uid();
  v_now timestamptz := clock_timestamp();
  v_previous_seen timestamptz;
  v_other_active integer := 0;
  v_active integer := 0;
  v_was_active boolean := false;
  v_state public.boundless_server1_state%rowtype;
  v_delta bigint := 0;
  v_region text := left(coalesce(nullif(trim(p_region), ''), 'Puncak Xuefeng'), 120);
begin
  if v_uid is null then raise exception 'Log masuk diperlukan untuk Server 1.'; end if;
  if p_session_id is null then raise exception 'ID sesi Server 1 tidak sah.'; end if;

  select last_seen_at into v_previous_seen
    from public.boundless_server1_sessions
    where session_id = p_session_id and user_id = v_uid;

  delete from public.boundless_server1_sessions
    where last_seen_at < v_now - interval '35 seconds'
      and session_id <> p_session_id;

  select count(*)::integer into v_other_active
    from public.boundless_server1_sessions
    where session_id <> p_session_id
      and last_seen_at >= v_now - interval '35 seconds';

  v_was_active := (v_previous_seen is not null and v_previous_seen >= v_now - interval '35 seconds')
                  or v_other_active > 0;

  select * into v_state
    from public.boundless_server1_state
    where server_id = 'server-1'
    for update;

  if v_state.is_running and v_was_active and v_state.last_tick_at is not null
     and v_state.last_tick_at >= v_now - interval '35 seconds' then
    v_delta := greatest(0, least(15, floor(extract(epoch from (v_now - v_state.last_tick_at)))::bigint));
  end if;

  insert into public.boundless_server1_sessions(session_id, user_id, region, last_seen_at)
    values(p_session_id, v_uid, v_region, v_now)
    on conflict(session_id) do update
      set user_id = excluded.user_id, region = excluded.region, last_seen_at = excluded.last_seen_at;

  update public.boundless_server1_state
    set world_time_seconds = world_time_seconds + v_delta,
        is_running = true,
        last_tick_at = v_now,
        updated_at = v_now
    where server_id = 'server-1';

  select count(*)::integer into v_active
    from public.boundless_server1_sessions
    where last_seen_at >= v_now - interval '35 seconds';

  select * into v_state from public.boundless_server1_state where server_id = 'server-1';
  return jsonb_build_object(
    'server_id', v_state.server_id,
    'world_time_seconds', v_state.world_time_seconds,
    'is_running', v_state.is_running,
    'active_players', v_active,
    'server_now', v_now
  );
end;
$function$;

create or replace function public.boundless_server1_disconnect(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_uid uuid := auth.uid();
  v_now timestamptz := clock_timestamp();
  v_active integer := 0;
  v_state public.boundless_server1_state%rowtype;
begin
  if v_uid is null then raise exception 'Log masuk diperlukan untuk Server 1.'; end if;
  if p_session_id is null then raise exception 'ID sesi Server 1 tidak sah.'; end if;

  delete from public.boundless_server1_sessions
    where session_id = p_session_id and user_id = v_uid;
  delete from public.boundless_server1_sessions
    where last_seen_at < v_now - interval '35 seconds';

  select count(*)::integer into v_active
    from public.boundless_server1_sessions
    where last_seen_at >= v_now - interval '35 seconds';

  if v_active = 0 then
    update public.boundless_server1_state
      set is_running = false, last_tick_at = null, updated_at = v_now
      where server_id = 'server-1';
  end if;

  select * into v_state from public.boundless_server1_state where server_id = 'server-1';
  return jsonb_build_object(
    'server_id', v_state.server_id,
    'world_time_seconds', v_state.world_time_seconds,
    'is_running', v_state.is_running,
    'active_players', v_active,
    'server_now', v_now
  );
end;
$function$;

revoke all on function public.boundless_server1_heartbeat(uuid, text) from public, anon;
revoke all on function public.boundless_server1_disconnect(uuid) from public, anon;
grant execute on function public.boundless_server1_heartbeat(uuid, text) to authenticated;
grant execute on function public.boundless_server1_disconnect(uuid) to authenticated;
