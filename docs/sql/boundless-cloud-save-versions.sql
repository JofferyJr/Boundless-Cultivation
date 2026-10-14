-- Additive cloud-save version history for Boundless.
-- Applied to the connected Supabase project as migration boundless_cloud_save_versions.
-- Each row is an immutable snapshot owned by one authenticated account.

create table if not exists public.boundless_cloud_save_versions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  payload_hash text not null,
  source text not null default 'manual_backup'
    check (source in ('manual_backup','pre_replace','restore_point')),
  created_at timestamptz not null default now()
);

create index if not exists boundless_cloud_save_versions_user_created_idx
  on public.boundless_cloud_save_versions (user_id, created_at desc);

alter table public.boundless_cloud_save_versions enable row level security;

drop policy if exists "Players read own Boundless save versions" on public.boundless_cloud_save_versions;
create policy "Players read own Boundless save versions"
  on public.boundless_cloud_save_versions
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Players insert own Boundless save versions" on public.boundless_cloud_save_versions;
create policy "Players insert own Boundless save versions"
  on public.boundless_cloud_save_versions
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

revoke all on public.boundless_cloud_save_versions from anon;
revoke update, delete on public.boundless_cloud_save_versions from authenticated;
grant select, insert on public.boundless_cloud_save_versions to authenticated;
grant usage, select on sequence public.boundless_cloud_save_versions_id_seq to authenticated;
