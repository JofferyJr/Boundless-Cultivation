alter table public.boundless_multiplayer_trade_offers
  add column if not exists item_id text,
  add column if not exists item_kind text not null default 'inventory',
  add column if not exists currency_type text,
  add column if not exists currency_amount bigint not null default 0,
  add column if not exists requested_currency_type text,
  add column if not exists requested_currency_amount bigint not null default 0;

alter table public.boundless_multiplayer_trade_offers
  add constraint boundless_trade_item_kind_check check (item_kind in ('inventory','spiritBeasts')),
  add constraint boundless_trade_currency_type_check check (currency_type is null or currency_type in ('stones','gold','silver','copper')),
  add constraint boundless_trade_requested_currency_type_check check (requested_currency_type is null or requested_currency_type in ('stones','gold','silver','copper')),
  add constraint boundless_trade_currency_amount_check check (currency_amount >= 0 and requested_currency_amount >= 0);

create or replace function public.boundless_server1_trade(p_offer_id uuid, p_action text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_offer public.boundless_multiplayer_trade_offers%rowtype;
  v_from_payload jsonb;
  v_to_payload jsonb;
  v_from_save jsonb;
  v_to_save jsonb;
  v_item jsonb;
  v_arr jsonb;
  v_new_arr jsonb;
  v_idx integer;
  v_qty integer;
  v_have bigint;
  v_currency text;
  v_sender_id uuid;
  v_receiver_id uuid;
  v_save_key text := 'boundless-save';
begin
  if v_uid is null then raise exception 'Log masuk diperlukan.'; end if;
  if p_action not in ('accept','decline','cancel') then raise exception 'Tindakan dagangan tidak sah.'; end if;
  select * into v_offer from public.boundless_multiplayer_trade_offers where id=p_offer_id for update;
  if not found then raise exception 'Tawaran dagang tidak ditemui.'; end if;
  if p_action in ('accept','decline') and v_offer.to_user_id<>v_uid then raise exception 'Hanya penerima boleh memproses tawaran ini.'; end if;
  if p_action='cancel' and v_offer.from_user_id<>v_uid then raise exception 'Hanya penghantar boleh membatalkan tawaran ini.'; end if;
  if v_offer.status<>'pending' then raise exception 'Tawaran ini telah diproses.'; end if;
  if p_action<>'accept' then
    update public.boundless_multiplayer_trade_offers set status=case when p_action='cancel' then 'cancelled' else 'declined' end,updated_at=now() where id=p_offer_id;
    return jsonb_build_object('ok',true,'status',case when p_action='cancel' then 'cancelled' else 'declined' end);
  end if;
  v_sender_id:=v_offer.from_user_id; v_receiver_id:=v_offer.to_user_id;
  if v_sender_id=v_receiver_id then raise exception 'Tidak boleh berdagang dengan akaun sendiri.'; end if;
  perform 1 from public.boundless_cloud_saves where user_id in (v_sender_id,v_receiver_id) order by user_id for update;
  select payload into v_from_payload from public.boundless_cloud_saves where user_id=v_sender_id;
  select payload into v_to_payload from public.boundless_cloud_saves where user_id=v_receiver_id;
  if v_from_payload is null or v_to_payload is null then raise exception 'Simpanan awan kedua-dua pemain diperlukan.'; end if;
  if coalesce(v_from_payload->>v_save_key,'')='' or coalesce(v_to_payload->>v_save_key,'')='' then raise exception 'Simpanan watak aktif tidak ditemui di awan.'; end if;
  begin
    v_from_save:=(v_from_payload->>v_save_key)::jsonb; v_to_save:=(v_to_payload->>v_save_key)::jsonb;
  exception when others then raise exception 'Format simpanan awan tidak sah; dagangan dibatalkan.'; end;
  if v_offer.item_id is null or v_offer.item_id='' then raise exception 'Tawaran lama tanpa ID barang tidak boleh dipindahkan. Buat tawaran baharu.'; end if;
  if v_offer.item_kind='spiritBeasts' then
    if v_offer.quantity<>1 then raise exception 'Haiwan roh dipindahkan satu demi satu.'; end if;
    v_arr:=coalesce(v_from_save->'spiritBeasts','[]'::jsonb); v_idx:=null;
    for v_qty in 0..greatest(jsonb_array_length(v_arr)-1,-1) loop if v_arr->v_qty->>'id'=v_offer.item_id then v_idx:=v_qty; exit; end if; end loop;
    if v_idx is null then raise exception 'Haiwan roh itu tiada lagi dalam simpanan penghantar.'; end if;
    v_item:=v_arr->v_idx;
    v_from_save:=jsonb_set(v_from_save,'{spiritBeasts}',(select coalesce(jsonb_agg(value),'[]'::jsonb) from jsonb_array_elements(v_arr) with ordinality a(value,ord) where ord<>v_idx+1),true);
    v_to_save:=jsonb_set(v_to_save,'{spiritBeasts}',coalesce(v_to_save->'spiritBeasts','[]'::jsonb)||jsonb_build_array(v_item),true);
  else
    v_arr:=coalesce(v_from_save->'inventory','[]'::jsonb); v_idx:=null;
    for v_qty in 0..greatest(jsonb_array_length(v_arr)-1,-1) loop if v_arr->v_qty->>'id'=v_offer.item_id then v_idx:=v_qty; exit; end if; end loop;
    if v_idx is null then raise exception 'Barang itu tiada lagi dalam inventori penghantar.'; end if;
    v_item:=v_arr->v_idx;
    if coalesce((v_item->>'quantity')::integer,0)<v_offer.quantity then raise exception 'Kuantiti barang tidak mencukupi.'; end if;
    v_new_arr:='[]'::jsonb;
    for v_qty in 0..greatest(jsonb_array_length(v_arr)-1,-1) loop
      if v_qty=v_idx then
        if coalesce((v_item->>'quantity')::integer,0)>v_offer.quantity then v_new_arr:=v_new_arr||jsonb_build_array(jsonb_set(v_item,'{quantity}',to_jsonb((v_item->>'quantity')::integer-v_offer.quantity),true)); end if;
      else v_new_arr:=v_new_arr||jsonb_build_array(v_arr->v_qty); end if;
    end loop;
    v_from_save:=jsonb_set(v_from_save,'{inventory}',v_new_arr,true);
    v_arr:=coalesce(v_to_save->'inventory','[]'::jsonb); v_idx:=null;
    for v_qty in 0..greatest(jsonb_array_length(v_arr)-1,-1) loop if v_arr->v_qty->>'id'=v_offer.item_id then v_idx:=v_qty; exit; end if; end loop;
    if v_idx is null then v_to_save:=jsonb_set(v_to_save,'{inventory}',v_arr||jsonb_build_array(jsonb_set(v_item,'{quantity}',to_jsonb(v_offer.quantity),true)),true);
    else v_item:=v_arr->v_idx; v_to_save:=jsonb_set(v_to_save,array['inventory',v_idx::text,'quantity'],to_jsonb(coalesce((v_item->>'quantity')::integer,0)+v_offer.quantity),true); end if;
  end if;
  if v_offer.currency_amount>0 then
    v_currency:=v_offer.currency_type; if v_currency is null then raise exception 'Jenis mata wang ditawarkan tidak sah.'; end if;
    v_have:=coalesce((v_from_save->>v_currency)::bigint,0); if v_have<v_offer.currency_amount then raise exception 'Mata wang penghantar tidak mencukupi.'; end if;
    v_from_save:=jsonb_set(v_from_save,array[v_currency],to_jsonb(v_have-v_offer.currency_amount),true);
    v_to_save:=jsonb_set(v_to_save,array[v_currency],to_jsonb(coalesce((v_to_save->>v_currency)::bigint,0)+v_offer.currency_amount),true);
  end if;
  if v_offer.requested_currency_amount>0 then
    v_currency:=v_offer.requested_currency_type; if v_currency is null then raise exception 'Jenis mata wang diminta tidak sah.'; end if;
    v_have:=coalesce((v_to_save->>v_currency)::bigint,0); if v_have<v_offer.requested_currency_amount then raise exception 'Mata wang penerima tidak mencukupi.'; end if;
    v_to_save:=jsonb_set(v_to_save,array[v_currency],to_jsonb(v_have-v_offer.requested_currency_amount),true);
    v_from_save:=jsonb_set(v_from_save,array[v_currency],to_jsonb(coalesce((v_from_save->>v_currency)::bigint,0)+v_offer.requested_currency_amount),true);
  end if;
  update public.boundless_cloud_saves set payload=jsonb_set(v_from_payload,array[v_save_key],to_jsonb(v_from_save::text),true),updated_at=now() where user_id=v_sender_id;
  update public.boundless_cloud_saves set payload=jsonb_set(v_to_payload,array[v_save_key],to_jsonb(v_to_save::text),true),updated_at=now() where user_id=v_receiver_id;
  update public.boundless_multiplayer_trade_offers set status='accepted',updated_at=now() where id=p_offer_id;
  return jsonb_build_object('ok',true,'status','accepted','save_key',v_save_key,'save',v_to_save);
end;
$$;
revoke all on function public.boundless_server1_trade(uuid,text) from public,anon;
grant execute on function public.boundless_server1_trade(uuid,text) to authenticated;