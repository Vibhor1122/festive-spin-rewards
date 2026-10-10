create or replace function public.perform_spin()
returns json language plpgsql security definer set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _phone text; _camp record; _r numeric; _acc numeric := 0; _p record; _chosen record; _chosen_id text;
  _code text; _cid uuid; _exp timestamptz; _existing record;
begin
  if _uid is null then raise exception 'Not signed in'; end if;
  select phone into _phone from profiles where id = _uid;
  if _phone is null then raise exception 'Profile missing'; end if;
  select * into _camp from campaigns where id = 1;
  perform pg_advisory_xact_lock(hashtext(_uid::text));
  select s.prize_id, s.prize_label, s.discount, c.code, c.expires_at into _existing
    from spins s left join coupons c on c.id = s.coupon_id where s.user_id = _uid;
  if found then
    return json_build_object('already', true, 'prize_id', _existing.prize_id, 'label', _existing.prize_label,
      'discount', _existing.discount, 'code', _existing.code, 'expires_at', _existing.expires_at);
  end if;
  if not _camp.is_active then raise exception 'Campaign is not active'; end if;
  _r := random() * 100;
  for _p in select id, probability from prizes where probability > 0 order by sort_order loop
    _acc := _acc + _p.probability;
    if _chosen_id is null and _r < _acc then _chosen_id := _p.id; end if;
  end loop;
  if _chosen_id is null then
    select id into _chosen_id from prizes where probability > 0 order by sort_order desc limit 1;
  end if;
  select * into _chosen from prizes where id = _chosen_id;
  if _chosen.discount > 0 then
    loop
      _code := 'ANUSHKA-' || _chosen.discount || '-' ||
        (select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random()*32)::int, 1), '') from generate_series(1,5));
      exit when not exists (select 1 from coupons where code = _code);
    end loop;
    _exp := now() + make_interval(days => _camp.coupon_validity_days);
    insert into coupons (code,user_id,phone,discount,expires_at) values (_code,_uid,_phone,_chosen.discount,_exp) returning id into _cid;
  end if;
  insert into spins (user_id,phone,prize_id,prize_label,discount,coupon_id)
    values (_uid,_phone,_chosen.id,_chosen.label,_chosen.discount,_cid);
  insert into spin_history (user_id,phone,prize_label,discount,coupon_code) values (_uid,_phone,_chosen.label,_chosen.discount,_code);
  return json_build_object('already', false, 'prize_id', _chosen.id, 'label', _chosen.label,
    'discount', _chosen.discount, 'code', _code, 'expires_at', _exp);
end $$;