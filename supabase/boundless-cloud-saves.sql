-- Boundless Cultivation cloud saves
-- Run this in Supabase SQL Editor. RLS restricts each row to its owner.
create table if not exists public.boundless_cloud_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.boundless_cloud_saves enable row level security;

drop policy if exists "Players read own Boundless saves" on public.boundless_cloud_saves;
create policy "Players read own Boundless saves"
  on public.boundless_cloud_saves for select
  to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Players insert own Boundless saves" on public.boundless_cloud_saves;
create policy "Players insert own Boundless saves"
  on public.boundless_cloud_saves for insert
  to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Players update own Boundless saves" on public.boundless_cloud_saves;
create policy "Players update own Boundless saves"
  on public.boundless_cloud_saves for update
  to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- No public/anon policy is intentionally created.
