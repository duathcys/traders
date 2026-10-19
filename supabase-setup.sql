-- Run once in Supabase Dashboard > SQL Editor for shared group reservations.
create extension if not exists pgcrypto;

create table if not exists public.share_rounds (
  id uuid primary key default gen_random_uuid(),
  product_id integer not null,
  group_size integer not null check (group_size > 0),
  joined_qty integer not null default 0 check (joined_qty >= 0 and joined_qty <= group_size),
  status text not null default 'open' check (status in ('open','filled')),
  created_at timestamptz not null default now()
);
create unique index if not exists one_open_share_round_per_product
  on public.share_rounds(product_id) where status = 'open';

create table if not exists public.share_orders (
  id uuid primary key default gen_random_uuid(),
  public_code text not null unique,
  round_id uuid not null references public.share_rounds(id),
  product_id integer not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  qty integer not null check (qty > 0),
  amount integer not null check (amount >= 0),
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled')),
  created_at timestamptz not null default now()
);
create index if not exists share_orders_user_status on public.share_orders(user_id,status);

create table if not exists public.share_waitlist (
  id uuid primary key default gen_random_uuid(),
  product_id integer not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  qty integer not null check (qty > 0),
  amount integer not null check (amount >= 0),
  status text not null default 'waiting' check (status in ('waiting','promoted','cancelled')),
  created_at timestamptz not null default now()
);
create unique index if not exists one_active_wait_per_user_product
  on public.share_waitlist(product_id,user_id) where status = 'waiting';

alter table public.share_rounds enable row level security;
alter table public.share_orders enable row level security;
alter table public.share_waitlist enable row level security;
drop policy if exists "Anyone can read share progress" on public.share_rounds;
create policy "Anyone can read share progress" on public.share_rounds for select using (true);
drop policy if exists "Users read own share orders" on public.share_orders;
create policy "Users read own share orders" on public.share_orders for select to authenticated using (user_id = auth.uid());
drop policy if exists "Users read own wait entries" on public.share_waitlist;
create policy "Users read own wait entries" on public.share_waitlist for select to authenticated using (user_id = auth.uid());
grant select on public.share_rounds, public.share_orders, public.share_waitlist to anon, authenticated;

create or replace view public.share_round_progress as
select r.id, r.product_id, r.group_size, r.joined_qty, r.status, r.created_at,
  (select count(*)::integer from public.share_waitlist w where w.product_id=r.product_id and w.status='waiting') as waiting_count
from public.share_rounds r;
grant select on public.share_round_progress to anon, authenticated;

create or replace function public.join_share(p_product_id integer, p_qty integer, p_amount integer)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_uid uuid := auth.uid(); v_round public.share_rounds%rowtype; v_order public.share_orders%rowtype; v_total integer;
begin
  if v_uid is null then raise exception 'LOGIN_REQUIRED'; end if;
  if p_qty < 1 or p_amount < 0 then raise exception 'INVALID_QUANTITY'; end if;
  perform pg_advisory_xact_lock(71001,p_product_id);
  select * into v_round from public.share_rounds where product_id=p_product_id and status='open' order by created_at limit 1 for update;
  if not found then raise exception 'ROUND_CLOSED'; end if;
  if p_qty > v_round.group_size-v_round.joined_qty then raise exception 'NOT_ENOUGH_SPOTS'; end if;
  if exists(select 1 from public.share_orders where round_id=v_round.id and user_id=v_uid and status in ('pending','confirmed')) then raise exception 'ALREADY_JOINED'; end if;
  insert into public.share_orders(public_code,round_id,product_id,user_id,qty,amount,status)
    values ('TS'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)),v_round.id,p_product_id,v_uid,p_qty,p_amount,'pending') returning * into v_order;
  update public.share_waitlist set status='promoted' where product_id=p_product_id and user_id=v_uid and status='waiting';
  v_total := v_round.joined_qty+p_qty;
  update public.share_rounds set joined_qty=v_total, status=case when v_total=group_size then 'filled' else 'open' end where id=v_round.id;
  if v_total=v_round.group_size then update public.share_orders set status='confirmed' where round_id=v_round.id and status='pending'; end if;
  return jsonb_build_object('public_code',v_order.public_code,'round_id',v_round.id,'status',case when v_total=v_round.group_size then 'confirmed' else 'pending' end,'joined_qty',v_total,'group_size',v_round.group_size);
end $$;

create or replace function public.join_share_waitlist(p_product_id integer,p_qty integer,p_amount integer)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_uid uuid := auth.uid(); v_row public.share_waitlist%rowtype;
begin
  if v_uid is null then raise exception 'LOGIN_REQUIRED'; end if;
  if p_qty < 1 or p_amount < 0 then raise exception 'INVALID_QUANTITY'; end if;
  perform pg_advisory_xact_lock(71001,p_product_id);
  if exists(select 1 from public.share_rounds where product_id=p_product_id and status='open') then raise exception 'ROUND_AVAILABLE'; end if;
  insert into public.share_waitlist(product_id,user_id,qty,amount) values(p_product_id,v_uid,p_qty,p_amount)
    on conflict (product_id,user_id) where status='waiting' do update set qty=excluded.qty,amount=excluded.amount returning * into v_row;
  return jsonb_build_object('id',v_row.id,'status',v_row.status);
end $$;

create or replace function public.leave_share_waitlist(p_product_id integer)
returns boolean language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null then raise exception 'LOGIN_REQUIRED'; end if;
  update public.share_waitlist set status='cancelled' where product_id=p_product_id and user_id=auth.uid() and status='waiting';
  return found;
end $$;

create or replace function public.start_share_round(p_product_id integer,p_group_size integer)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_round public.share_rounds%rowtype; v_wait public.share_waitlist%rowtype; v_total integer:=0; v_code text;
begin
  if auth.uid() is null then raise exception 'LOGIN_REQUIRED'; end if;
  if p_group_size < 1 then raise exception 'INVALID_QUANTITY'; end if;
  perform pg_advisory_xact_lock(71001,p_product_id);
  select * into v_round from public.share_rounds where product_id=p_product_id and status='open' order by created_at limit 1 for update;
  if not found then
    insert into public.share_rounds(product_id,group_size) values(p_product_id,p_group_size) returning * into v_round;
    for v_wait in select * from public.share_waitlist where product_id=p_product_id and status='waiting' and qty<=p_group_size order by created_at for update skip locked loop
      exit when v_total+v_wait.qty>p_group_size;
      v_code := 'TS'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10));
      insert into public.share_orders(public_code,round_id,product_id,user_id,qty,amount,status) values(v_code,v_round.id,p_product_id,v_wait.user_id,v_wait.qty,v_wait.amount,'pending');
      update public.share_waitlist set status='promoted' where id=v_wait.id;
      v_total:=v_total+v_wait.qty;
    end loop;
    update public.share_rounds set joined_qty=v_total,status=case when v_total=group_size then 'filled' else 'open' end where id=v_round.id returning * into v_round;
    if v_total=v_round.group_size then update public.share_orders set status='confirmed' where round_id=v_round.id and status='pending'; end if;
  end if;
  return jsonb_build_object('id',v_round.id,'group_size',v_round.group_size,'joined_qty',v_round.joined_qty,'status',v_round.status);
end $$;

create or replace function public.cancel_share(p_public_code text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_uid uuid:=auth.uid(); v_order public.share_orders%rowtype; v_round public.share_rounds%rowtype; v_wait public.share_waitlist%rowtype; v_total integer; v_room integer; v_promoted boolean:=false;
begin
  if v_uid is null then raise exception 'LOGIN_REQUIRED'; end if;
  select * into v_order from public.share_orders where public_code=p_public_code and user_id=v_uid and status in ('pending','confirmed') for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  perform pg_advisory_xact_lock(71001,v_order.product_id);
  select * into v_round from public.share_rounds where id=v_order.round_id for update;
  update public.share_orders set status='cancelled' where id=v_order.id;
  if v_order.status='confirmed' and exists(select 1 from public.share_rounds where product_id=v_order.product_id and status='open' and id<>v_round.id) then
    select * into v_wait from public.share_waitlist where product_id=v_order.product_id and status='waiting' and qty<=v_order.qty order by created_at limit 1 for update skip locked;
    if found then
      insert into public.share_orders(public_code,round_id,product_id,user_id,qty,amount,status)
        values('TS'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)),v_round.id,v_order.product_id,v_wait.user_id,v_wait.qty,v_wait.amount,'confirmed');
      update public.share_waitlist set status='promoted' where id=v_wait.id;
    end if;
    return jsonb_build_object('cancelled',true,'waiter_promoted',found);
  end if;
  v_total:=greatest(0,v_round.joined_qty-v_order.qty);
  update public.share_rounds set joined_qty=v_total,status='open' where id=v_round.id returning * into v_round;
  v_room:=v_round.group_size-v_total;
  for v_wait in select * from public.share_waitlist where product_id=v_order.product_id and status='waiting' and qty<=v_room order by created_at for update skip locked loop
    exit when v_total+v_wait.qty>v_round.group_size;
    insert into public.share_orders(public_code,round_id,product_id,user_id,qty,amount,status)
      values('TS'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)),v_round.id,v_order.product_id,v_wait.user_id,v_wait.qty,v_wait.amount,'pending');
    update public.share_waitlist set status='promoted' where id=v_wait.id;
    v_promoted:=true;
    v_total:=v_total+v_wait.qty;
  end loop;
  update public.share_rounds set joined_qty=v_total,status=case when v_total=group_size then 'filled' else 'open' end where id=v_round.id;
  if v_total=v_round.group_size then update public.share_orders set status='confirmed' where round_id=v_round.id and status='pending'; end if;
  return jsonb_build_object('cancelled',true,'waiter_promoted',v_promoted,'round_status',case when v_total=v_round.group_size then 'filled' else 'open' end);
end $$;

revoke all on function public.join_share(integer,integer,integer) from public;
revoke all on function public.join_share_waitlist(integer,integer,integer) from public;
revoke all on function public.leave_share_waitlist(integer) from public;
revoke all on function public.start_share_round(integer,integer) from public;
revoke all on function public.cancel_share(text) from public;
grant execute on function public.join_share(integer,integer,integer), public.join_share_waitlist(integer,integer,integer), public.leave_share_waitlist(integer), public.start_share_round(integer,integer), public.cancel_share(text) to authenticated;

-- Create the first open cohort for each sample product. Re-running this file is safe.
insert into public.share_rounds(product_id,group_size)
select seed.product_id,seed.group_size from (values
  (1,5),(2,4),(3,4),(4,3),(5,5),(6,4),
  (7,5),(8,5),(9,5),(10,5),(11,5),(12,5),(13,5),(14,5),(15,5),(16,5),(17,5),(18,5),
  (19,5),(20,5),(21,5),(22,5),(23,5),
  (24,5),(25,5),(26,5),(27,5),(28,5),(29,5),(30,5),(31,5),(32,5),(33,5),
  (34,5),(35,5),(36,5),(37,5),(38,5),(39,5),(40,5),(41,5),(42,5),(44,5),
  (45,5),(46,5),(47,5),(48,5),(49,5),(50,5),(51,5),(52,5),(53,5),(54,5),(55,5),
  (56,5),(57,5),(58,5),(59,5),(60,5),(61,5),(62,5),(63,5),(64,5),(65,5),(66,5),
  (67,5),(68,5),(69,5),(70,5),(71,5),(72,5),(74,5),(75,5),(76,5),(77,5),
  (79,5),(80,5),(81,5),(82,5),(83,5),(84,5),(85,5),(86,5),(87,5),(88,5),
  (89,5),(90,5),(91,5),(92,5),(93,5),(94,5)
) as seed(product_id,group_size)
where not exists(select 1 from public.share_rounds r where r.product_id=seed.product_id);
