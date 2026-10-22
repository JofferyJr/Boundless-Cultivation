do $$
begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='boundless_sects') then alter publication supabase_realtime add table public.boundless_sects; end if;
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='boundless_sect_members') then alter publication supabase_realtime add table public.boundless_sect_members; end if;
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='boundless_pvp_battles') then alter publication supabase_realtime add table public.boundless_pvp_battles; end if;
end $$;
