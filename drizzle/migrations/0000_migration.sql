create type public.app_role as enum ('admin','user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create policy "own roles readable" on public.user_roles for select to authenticated
using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text not null unique,
  created_at timestamptz not null default now()
);
grant select on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile" on public.profiles for select to authenticated
using (id = auth.uid() or public.has_role(auth.uid(),'admin'));

create table public.admin_phones (phone text primary key);
grant all on public.admin_phones to service_role;
alter table public.admin_phones enable row level security;

create table public.campaigns (
  id int primary key default 1 check (id = 1),
  name text not null default 'Festive Spin & Win',
  is_active boolean not null default true,
  coupon_validity_days int not null default 7,
  updated_at timestamptz not null default now()
);
grant select on public.campaigns to anon, authenticated;
grant all on public.campaigns to service_role;
alter table public.campaigns enable row level security;
create policy "campaign public read" on public.campaigns for select to anon, authenticated using (true);
create policy "campaign admin update" on public.campaigns for update to authenticated
using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
insert into public.campaigns (id) values (1);

create table public.prizes (
  id text primary key,
  label text not null,
  discount int not null,
  probability numeric(5,2) not null default 0,
  sort_order int not null
);
grant select on public.prizes to anon, authenticated;
grant all on public.prizes to service_role;
alter table public.prizes enable row level security;
create policy "prizes public read" on public.prizes for select to anon, authenticated using (true);
insert into public.prizes (id,label,discount,probability,sort_order) values
('p10','10% OFF',10,30,1),('p20','20% OFF',20,34,2),('p30','30% OFF',30,30,3),
('p50','50% OFF',50,5,4),('p80','80% OFF',80,1,5),('p100','100% OFF',100,0,6),
('none','Better Luck Next Time',0,0,7);

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  user_id uuid not null,
  phone text not null,
  discount int not null,
  status text not null default 'active',
  expires_at timestamptz not null,
  redeemed_at timestamptz,
  created_at timestamptz not null default now()
);
grant select on public.coupons to authenticated;
grant all on public.coupons to service_role;
alter table public.coupons enable row level security;
create policy "own coupons" on public.coupons for select to authenticated
using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "admin update coupons" on public.coupons for update to authenticated
using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.spins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  phone text not null,
  prize_id text not null,
  prize_label text not null,
  discount int not null,
  coupon_id uuid references public.coupons(id) on delete set null,
  created_at timestamptz not null default now()
);
grant select on public.spins to authenticated;
grant all on public.spins to service_role;
alter table public.spins enable row level security;
create policy "own spins" on public.spins for select to authenticated
using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create table public.spin_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null, phone text not null, prize_label text not null, discount int not null,
  coupon_code text, created_at timestamptz not null default now()
);
grant select on public.spin_history to authenticated;
grant all on public.spin_history to service_role;
alter table public.spin_history enable row level security;
create policy "admin history" on public.spin_history for select to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null unique references public.coupons(id) on delete cascade,
  redeemed_by uuid not null,
  redeemed_at timestamptz not null default now()
);
grant select on public.coupon_redemptions to authenticated;
grant all on public.coupon_redemptions to service_role;
alter table public.coupon_redemptions enable row level security;
create policy "admin redemptions" on public.coupon_redemptions for select to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.otp_codes (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  code_hash text not null,
  attempts int not null default 0,
  used boolean not null default false,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index on public.otp_codes (phone, created_at desc);
grant all on public.otp_codes to service_role;
alter table public.otp_codes enable row level security;

-- Atomic spin
create or replace function public.perform_spin()
returns json language plpgsql security definer set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _phone text; _camp record; _r numeric; _acc numeric := 0; _p record; _chosen record;
  _code text; _cid uuid; _exp timestamptz; _existing record;
begin
  if _uid is null then raise exception 'Not signed in'; end if;
  select phone into _phone from profiles where id = _uid;
  if _phone is null then raise exception 'Profile missing'; end if;
  select * into _camp from campaigns where id = 1;
  perform pg_advisory_xact_lock(hashtext(_uid::text));
  select s.*, c.code, c.expires_at into _existing from spins s left join coupons c on c.id = s.coupon_id where s.user_id = _uid;
  if found then
    return json_build_object('already', true, 'prize_id', _existing.prize_id, 'label', _existing.prize_label,
      'discount', _existing.discount, 'code', _existing.code, 'expires_at', _existing.expires_at);
  end if;
  if not _camp.is_active then raise exception 'Campaign is not active'; end if;
  _r := random() * 100;
  for _p in select * from prizes where probability > 0 order by sort_order loop
    _acc := _acc + _p.probability;
    if _r < _acc and _chosen is null then _chosen := _p; end if;
  end loop;
  if _chosen is null then
    select * into _chosen from prizes where probability > 0 order by sort_order desc limit 1;
  end if;
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
revoke all on function public.perform_spin() from public, anon;
grant execute on function public.perform_spin() to authenticated;

create or replace function public.redeem_coupon(_code text)
returns json language plpgsql security definer set search_path = public
as $$
declare _c record;
begin
  if not has_role(auth.uid(),'admin') then raise exception 'Not authorized'; end if;
  update coupons set status = 'redeemed', redeemed_at = now()
   where code = upper(trim(_code)) and status = 'active' and expires_at > now()
   returning * into _c;
  if not found then raise exception 'Coupon not found, expired or already redeemed'; end if;
  insert into coupon_redemptions (coupon_id, redeemed_by) values (_c.id, auth.uid());
  return json_build_object('code', _c.code, 'discount', _c.discount);
end $$;
revoke all on function public.redeem_coupon(text) from public, anon;
grant execute on function public.redeem_coupon(text) to authenticated;

create or replace function public.update_prize_probabilities(_items jsonb)
returns void language plpgsql security definer set search_path = public
as $$
declare _sum numeric;
begin
  if not has_role(auth.uid(),'admin') then raise exception 'Not authorized'; end if;
  select sum((x->>'probability')::numeric) into _sum from jsonb_array_elements(_items) x;
  if _sum is distinct from 100 then raise exception 'Probabilities must total exactly 100 (got %)', _sum; end if;
  if exists (select 1 from jsonb_array_elements(_items) x where (x->>'probability')::numeric < 0) then
    raise exception 'Probabilities cannot be negative'; end if;
  update prizes p set probability = (x->>'probability')::numeric
    from jsonb_array_elements(_items) x where p.id = x->>'id';
end $$;
revoke all on function public.update_prize_probabilities(jsonb) from public, anon;
grant execute on function public.update_prize_probabilities(jsonb) to authenticated;

create or replace function public.reset_spin(_user_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
begin
  if not has_role(auth.uid(),'admin') then raise exception 'Not authorized'; end if;
  delete from spins where user_id = _user_id;
end $$;
revoke all on function public.reset_spin(uuid) from public, anon;
grant execute on function public.reset_spin(uuid) to authenticated;

create or replace function public.set_coupon_expiry(_coupon_id uuid, _expires timestamptz)
returns void language plpgsql security definer set search_path = public
as $$
begin
  if not has_role(auth.uid(),'admin') then raise exception 'Not authorized'; end if;
  update coupons set expires_at = _expires where id = _coupon_id;
end $$;
revoke all on function public.set_coupon_expiry(uuid, timestamptz) from public, anon;
grant execute on function public.set_coupon_expiry(uuid, timestamptz) to authenticated;