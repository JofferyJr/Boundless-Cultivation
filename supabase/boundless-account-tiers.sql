-- Boundless account tiers: Mortal -> Cultivator -> Immortal
-- Apply to the Boundless Supabase project. Never expose service-role keys in the client.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists public.boundless_account_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  account_tier text not null default 'mortal' check (account_tier in ('mortal','cultivator','immortal')),
  account_exp bigint not null default 0 check (account_exp >= 0),
  requested_tier text check (requested_tier in ('cultivator','immortal')),
  request_note text,
  request_status text not null default 'none' check (request_status in ('none','pending','approved','rejected')),
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.boundless_account_achievements (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_code text not null,
  awarded_at timestamptz not null default now(),
  awarded_by uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  unique (user_id, achievement_code)
);

create table if not exists public.boundless_account_exp_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null check (amount > 0),
  reason_code text not null,
  reference_id text,
  awarded_at timestamptz not null default now(),
  awarded_by uuid references auth.users(id) on delete set null,
  unique (user_id, reason_code, reference_id)
);

create table if not exists public.boundless_account_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.boundless_account_tier_requirements (
  tier text primary key check (tier in ('cultivator','immortal')),
  minimum_exp bigint not null check (minimum_exp >= 0),
  minimum_achievements integer not null check (minimum_achievements >= 0),
  updated_at timestamptz not null default now()
);

insert into public.boundless_account_tier_requirements (tier, minimum_exp, minimum_achievements)
values ('cultivator', 2500, 3), ('immortal', 25000, 10)
on conflict (tier) do update set minimum_exp = excluded.minimum_exp,
  minimum_achievements = excluded.minimum_achievements, updated_at = now();

alter table public.boundless_account_progress enable row level security;
alter table public.boundless_account_achievements enable row level security;
alter table public.boundless_account_exp_ledger enable row level security;
alter table public.boundless_account_admins enable row level security;
alter table public.boundless_account_tier_requirements enable row level security;

drop policy if exists "Players read own account progression" on public.boundless_account_progress;
create policy "Players read own account progression" on public.boundless_account_progress
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Players submit own tier request" on public.boundless_account_progress;
create policy "Players submit own tier request" on public.boundless_account_progress
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
drop policy if exists "Players read own account achievements" on public.boundless_account_achievements;
create policy "Players read own account achievements" on public.boundless_account_achievements
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Players read own account EXP ledger" on public.boundless_account_exp_ledger;
create policy "Players read own account EXP ledger" on public.boundless_account_exp_ledger
  for select to authenticated using ((select auth.uid()) = user_id);

revoke all privileges on table public.boundless_account_progress from anon, authenticated;
revoke all privileges on table public.boundless_account_achievements from anon, authenticated;
revoke all privileges on table public.boundless_account_exp_ledger from anon, authenticated;
revoke all privileges on table public.boundless_account_admins from anon, authenticated;
revoke all privileges on table public.boundless_account_tier_requirements from anon, authenticated;
grant select on table public.boundless_account_progress to authenticated;
grant update (requested_tier, request_note) on public.boundless_account_progress to authenticated;
grant select on table public.boundless_account_achievements to authenticated;
grant select on public.boundless_account_exp_ledger to authenticated;

create or replace function private.create_boundless_account_progress()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.boundless_account_progress (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;
revoke all on function private.create_boundless_account_progress() from public, anon, authenticated;
drop trigger if exists boundless_create_account_progress on auth.users;
create trigger boundless_create_account_progress after insert on auth.users
  for each row execute function private.create_boundless_account_progress();

create or replace function private.mark_boundless_tier_request_pending()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare v_min_exp bigint; v_min_achievements integer; v_achievement_count bigint;
begin
  if new.requested_tier is distinct from old.requested_tier then
    if new.requested_tier = 'cultivator' and old.account_tier <> 'mortal' then
      raise exception 'Akaun hanya boleh memohon Cultivator dari Mortal.';
    end if;
    if new.requested_tier = 'immortal' and old.account_tier <> 'cultivator' then
      raise exception 'Akaun hanya boleh memohon Immortal dari Cultivator.';
    end if;
    select minimum_exp, minimum_achievements into v_min_exp, v_min_achievements
      from public.boundless_account_tier_requirements where tier = new.requested_tier;
    if not found then raise exception 'Syarat tingkatan tidak dikonfigurasi.'; end if;
    if old.account_exp < v_min_exp then raise exception 'EXP akaun tidak mencukupi untuk permohonan ini.'; end if;
    select count(*) into v_achievement_count from public.boundless_account_achievements where user_id = old.user_id;
    if v_achievement_count < v_min_achievements then raise exception 'Pencapaian akaun belum mencukupi untuk permohonan ini.'; end if;
    new.request_status := 'pending'; new.approved_by := null; new.approved_at := null;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function private.mark_boundless_tier_request_pending() from public, anon, authenticated;
drop trigger if exists boundless_tier_request_pending on public.boundless_account_progress;
create trigger boundless_tier_request_pending before update on public.boundless_account_progress
  for each row execute function private.mark_boundless_tier_request_pending();

create or replace function public.boundless_admin_award_account_exp(
  p_user_id uuid, p_amount integer, p_reason_code text, p_reference_id text, p_admin_id uuid
) returns bigint language plpgsql security definer set search_path = ''
as $$
declare v_inserted integer; v_total bigint;
begin
  if p_user_id is null or p_admin_id is null or p_amount is null or p_amount < 1 or p_amount > 1000000 then raise exception 'Invalid account EXP award.'; end if;
  if coalesce(length(trim(p_reason_code)),0) < 1 or length(p_reason_code)>80 or coalesce(length(trim(p_reference_id)),0)<1 or length(p_reference_id)>160 then raise exception 'Reason code and reference ID are required.'; end if;
  if not exists (select 1 from public.boundless_account_admins where user_id=p_admin_id) and not exists (select 1 from public.boundless_account_special_roles where user_id=p_admin_id and special_role='admin') then raise exception 'Admin authorization required.'; end if;
  insert into public.boundless_account_exp_ledger(user_id,amount,reason_code,reference_id,awarded_by)
    values(p_user_id,p_amount,trim(p_reason_code),trim(p_reference_id),p_admin_id)
    on conflict(user_id,reason_code,reference_id) do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted=1 then
    update public.boundless_account_progress set account_exp=account_exp+p_amount,updated_at=now()
      where user_id=p_user_id returning account_exp into v_total;
  else
    select account_exp into v_total from public.boundless_account_progress where user_id=p_user_id;
  end if;
  if v_total is null then raise exception 'Account progress profile not found.'; end if;
  return v_total;
end;
$$;

create or replace function public.boundless_admin_award_account_achievement(
  p_user_id uuid, p_achievement_code text, p_metadata jsonb, p_admin_id uuid
) returns boolean language plpgsql security definer set search_path = ''
as $$
declare v_inserted integer;
begin
  if p_user_id is null or p_admin_id is null or coalesce(length(trim(p_achievement_code)),0)<1 or length(p_achievement_code)>100 then raise exception 'Invalid achievement award.'; end if;
  if not exists (select 1 from public.boundless_account_admins where user_id=p_admin_id) and not exists (select 1 from public.boundless_account_special_roles where user_id=p_admin_id and special_role='admin') then raise exception 'Admin authorization required.'; end if;
  insert into public.boundless_account_achievements(user_id,achievement_code,metadata,awarded_by)
    values(p_user_id,trim(p_achievement_code),coalesce(p_metadata,'{}'::jsonb),p_admin_id)
    on conflict(user_id,achievement_code) do nothing;
  get diagnostics v_inserted = row_count;
  return v_inserted=1;
end;
$$;
revoke all on function public.boundless_admin_award_account_exp(uuid,integer,text,text,uuid) from public, anon, authenticated;
revoke all on function public.boundless_admin_award_account_achievement(uuid,text,jsonb,uuid) from public, anon, authenticated;
grant execute on function public.boundless_admin_award_account_exp(uuid,integer,text,text,uuid) to service_role;
grant execute on function public.boundless_admin_award_account_achievement(uuid,text,jsonb,uuid) to service_role;

insert into public.boundless_account_progress(user_id) select id from auth.users on conflict(user_id) do nothing;
