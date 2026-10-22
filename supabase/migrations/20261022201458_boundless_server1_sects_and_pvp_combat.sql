create table if not exists public.boundless_sects (
 id uuid primary key default gen_random_uuid(),
 name text not null check (char_length(btrim(name)) between 2 and 48),
 description text not null default '' check (char_length(description) <= 300),
 leader_id uuid not null references auth.users(id) on delete cascade,
 region text not null default 'Puncak Xuefeng',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create unique index if not exists boundless_sects_name_lower_idx on public.boundless_sects (lower(name));
create table if not exists public.boundless_sect_members (
 sect_id uuid not null references public.boundless_sects(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null default 'disciple' check (role in ('leader','elder','core_disciple','disciple')),
 joined_at timestamptz not null default now(),
 primary key (sect_id,user_id),
 unique (user_id)
);
create table if not exists public.boundless_pvp_battles (
 id uuid primary key default gen_random_uuid(),
 challenge_id uuid unique references public.boundless_multiplayer_challenges(id) on delete set null,
 player_one uuid not null references auth.users(id) on delete cascade,
 player_two uuid not null references auth.users(id) on delete cascade,
 status text not null default 'active' check (status in ('active','finished','cancelled')),
 turn_user_id uuid not null references auth.users(id),
 hp_one integer not null check (hp_one >= 0),
 hp_two integer not null check (hp_two >= 0),
 max_hp integer not null check (max_hp > 0),
 guard_user_id uuid,
 winner_id uuid references auth.users(id),
 round_no integer not null default 1 check (round_no > 0),
 last_action text not null default '',
 log jsonb not null default '[]'::jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check (player_one <> player_two),
 check (winner_id is null or winner_id in (player_one,player_two))
);
create index if not exists boundless_pvp_battles_players_idx on public.boundless_pvp_battles (player_one,player_two,status);
alter table public.boundless_sects enable row level security;
alter table public.boundless_sect_members enable row level security;
alter table public.boundless_pvp_battles enable row level security;
drop policy if exists "sect list authenticated" on public.boundless_sects;
create policy "sect list authenticated" on public.boundless_sects for select to authenticated using (true);
drop policy if exists "sect member list authenticated" on public.boundless_sect_members;
create policy "sect member list authenticated" on public.boundless_sect_members for select to authenticated using (true);
drop policy if exists "battle participants read" on public.boundless_pvp_battles;
create policy "battle participants read" on public.boundless_pvp_battles for select to authenticated using (auth.uid()=player_one or auth.uid()=player_two);
grant select on public.boundless_sects,public.boundless_sect_members,public.boundless_pvp_battles to authenticated;
revoke insert,update,delete on public.boundless_sects,public.boundless_sect_members,public.boundless_pvp_battles from anon,authenticated;

create or replace function public.boundless_sect_create(p_name text,p_description text default '')
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_uid uuid:=auth.uid(); v_sect public.boundless_sects%rowtype;
begin
 if v_uid is null then raise exception 'Log masuk diperlukan.'; end if;
 if char_length(btrim(coalesce(p_name,''))) not between 2 and 48 then raise exception 'Nama sekte mesti 2–48 aksara.'; end if;
 if exists(select 1 from public.boundless_sect_members where user_id=v_uid) then raise exception 'Anda sudah menjadi ahli sekte.'; end if;
 insert into public.boundless_sects(name,description,leader_id) values(btrim(p_name),left(coalesce(p_description,''),300),v_uid) returning * into v_sect;
 insert into public.boundless_sect_members(sect_id,user_id,role) values(v_sect.id,v_uid,'leader');
 return jsonb_build_object('ok',true,'sect_id',v_sect.id,'name',v_sect.name);
end $$;
create or replace function public.boundless_sect_join(p_sect_id uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null then raise exception 'Log masuk diperlukan.'; end if;
 if exists(select 1 from public.boundless_sect_members where user_id=auth.uid()) then raise exception 'Anda sudah menjadi ahli sekte.'; end if;
 if not exists(select 1 from public.boundless_sects where id=p_sect_id) then raise exception 'Sekte tidak ditemui.'; end if;
 insert into public.boundless_sect_members(sect_id,user_id,role) values(p_sect_id,auth.uid(),'disciple');
 return jsonb_build_object('ok',true,'sect_id',p_sect_id);
end $$;
create or replace function public.boundless_sect_leave()
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_sect_id uuid; v_leader uuid; v_next uuid;
begin
 if auth.uid() is null then raise exception 'Log masuk diperlukan.'; end if;
 select sect_id into v_sect_id from public.boundless_sect_members where user_id=auth.uid() for update;
 if v_sect_id is null then raise exception 'Anda bukan ahli sekte.'; end if;
 select leader_id into v_leader from public.boundless_sects where id=v_sect_id for update;
 if v_leader=auth.uid() then
   select user_id into v_next from public.boundless_sect_members where sect_id=v_sect_id and user_id<>auth.uid() order by case role when 'elder' then 1 when 'core_disciple' then 2 else 3 end,joined_at limit 1;
   if v_next is null then delete from public.boundless_sects where id=v_sect_id; return jsonb_build_object('ok',true,'disbanded',true); end if;
   update public.boundless_sects set leader_id=v_next,updated_at=now() where id=v_sect_id;
   update public.boundless_sect_members set role=case when user_id=v_next then 'leader' else role end where sect_id=v_sect_id;
 end if;
 delete from public.boundless_sect_members where sect_id=v_sect_id and user_id=auth.uid();
 return jsonb_build_object('ok',true,'disbanded',false);
end $$;
create or replace function public.boundless_server1_battle_action(p_battle_id uuid,p_action text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
 v_uid uuid:=auth.uid(); v_b public.boundless_pvp_battles%rowtype;
 v_damage integer; v_h1 integer; v_h2 integer; v_winner uuid; v_log jsonb; v_name text;
begin
 if v_uid is null then raise exception 'Log masuk diperlukan.'; end if;
 if p_action not in ('attack','heavy','guard','skill') then raise exception 'Aksi pertarungan tidak sah.'; end if;
 select * into v_b from public.boundless_pvp_battles where id=p_battle_id for update;
 if not found then raise exception 'Pertarungan tidak ditemui.'; end if;
 if v_b.status<>'active' then raise exception 'Pertarungan sudah tamat.'; end if;
 if v_uid not in (v_b.player_one,v_b.player_two) then raise exception 'Anda bukan peserta pertarungan.'; end if;
 if v_uid<>v_b.turn_user_id then raise exception 'Belum giliran anda.'; end if;
 v_damage:=case p_action when 'attack' then 14 when 'heavy' then 23 when 'skill' then 19 else 0 end;
 if p_action='heavy' and random()<0.25 then v_damage:=0; end if;
 if p_action='skill' then v_damage:=v_damage+floor(random()*7)::int; end if;
 v_h1:=v_b.hp_one; v_h2:=v_b.hp_two; v_log:=v_b.log;
 if p_action='guard' then
   v_log:=v_log||jsonb_build_array(jsonb_build_object('round',v_b.round_no,'user_id',v_uid,'action','guard','damage',0,'message','Bertahan dan mengurangkan serangan seterusnya.'));
   update public.boundless_pvp_battles set guard_user_id=v_uid,turn_user_id=case when v_uid=player_one then player_two else player_one end,round_no=round_no+1,last_action='guard',log=v_log,updated_at=now() where id=p_battle_id returning * into v_b;
   return jsonb_build_object('ok',true,'battle',to_jsonb(v_b));
 end if;
 if v_b.guard_user_id is not null and v_b.guard_user_id<>v_uid then v_damage:=greatest(1,ceil(v_damage*0.5)::int); end if;
 if v_uid=v_b.player_one then v_h2:=greatest(0,v_h2-v_damage); else v_h1:=greatest(0,v_h1-v_damage); end if;
 if v_h1=0 then v_winner:=v_b.player_two; elsif v_h2=0 then v_winner:=v_b.player_one; end if;
 select character_name into v_name from public.boundless_multiplayer_characters where user_id=v_uid;
 v_log:=v_log||jsonb_build_array(jsonb_build_object('round',v_b.round_no,'user_id',v_uid,'character_name',coalesce(v_name,'Pemain'),'action',p_action,'damage',v_damage,'message',case p_action when 'attack' then 'Serangan biasa' when 'heavy' then 'Serangan berat' else 'Teknik khas' end));
 update public.boundless_pvp_battles set hp_one=v_h1,hp_two=v_h2,status=case when v_winner is null then 'active' else 'finished' end,winner_id=v_winner,guard_user_id=null,turn_user_id=case when v_winner is not null then v_uid when v_uid=player_one then player_two else player_one end,round_no=case when v_winner is not null then round_no else round_no+1 end,last_action=p_action,log=v_log,updated_at=now() where id=p_battle_id returning * into v_b;
 return jsonb_build_object('ok',true,'battle',to_jsonb(v_b));
end $$;
create or replace function public.boundless_server1_challenge_accept(p_challenge_id uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_uid uuid:=auth.uid(); v_c public.boundless_multiplayer_challenges%rowtype; v_hp integer:=100; v_b public.boundless_pvp_battles%rowtype;
begin
 if v_uid is null then raise exception 'Log masuk diperlukan.'; end if;
 select * into v_c from public.boundless_multiplayer_challenges where id=p_challenge_id for update;
 if not found or v_c.challenged_id<>v_uid then raise exception 'Cabaran tidak ditemui atau bukan milik anda.'; end if;
 if v_c.status<>'pending' then raise exception 'Cabaran ini telah diproses.'; end if;
 if v_c.challenger_id=v_uid then raise exception 'Tidak boleh mencabar diri sendiri.'; end if;
 if not exists(select 1 from public.boundless_multiplayer_characters where user_id=v_c.challenger_id) or not exists(select 1 from public.boundless_multiplayer_characters where user_id=v_uid) then raise exception 'Kedua-dua pemain perlu mendaftarkan watak Multiplayer.'; end if;
 update public.boundless_multiplayer_challenges set status='accepted',updated_at=now() where id=p_challenge_id;
 insert into public.boundless_pvp_battles(challenge_id,player_one,player_two,turn_user_id,hp_one,hp_two,max_hp) values(p_challenge_id,v_c.challenger_id,v_uid,v_c.challenger_id,v_hp,v_hp,v_hp) returning * into v_b;
 return jsonb_build_object('ok',true,'battle',to_jsonb(v_b));
end $$;
revoke all on function public.boundless_sect_create(text,text) from public,anon;
revoke all on function public.boundless_sect_join(uuid) from public,anon;
revoke all on function public.boundless_sect_leave() from public,anon;
revoke all on function public.boundless_server1_battle_action(uuid,text) from public,anon;
revoke all on function public.boundless_server1_challenge_accept(uuid) from public,anon;
grant execute on function public.boundless_sect_create(text,text) to authenticated;
grant execute on function public.boundless_sect_join(uuid) to authenticated;
grant execute on function public.boundless_sect_leave() to authenticated;
grant execute on function public.boundless_server1_battle_action(uuid,text) to authenticated;
grant execute on function public.boundless_server1_challenge_accept(uuid) to authenticated;
