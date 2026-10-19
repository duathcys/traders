-- Run once in Supabase Dashboard > SQL Editor for shared group reservations.
create extension if not exists pgcrypto;


create table if not exists public.products (
  id integer primary key,
  type text not null,
  category text,
  name text not null,
  weight text,
  regular_price integer,
  price integer,
  discount integer,
  price_100g integer,
  rating numeric(2,1),
  review_count integer,
  portions integer not null default 5 check (portions > 0),
  emoji text not null default '📦',
  cls text not null default '',
  availability text,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.products enable row level security;
drop policy if exists "Anyone can read active products" on public.products;
create policy "Anyone can read active products" on public.products for select to anon, authenticated using (is_active);
grant select on public.products to anon, authenticated;

create table if not exists public.product_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_name text not null check (char_length(product_name) between 1 and 100),
  details text not null default '' check (char_length(details) <= 240),
  status text not null default 'active' check (status in ('active','hidden')),
  created_at timestamptz not null default now()
);
create index if not exists product_suggestions_status_created on public.product_suggestions(status,created_at desc);
create table if not exists public.suggestion_votes (
  suggestion_id uuid not null references public.product_suggestions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(suggestion_id,user_id)
);
-- Demo popularity is kept separate from account-owned votes so sample data never
-- impersonates real users. Keep this table private; the list RPC exposes only totals.
create table if not exists public.community_demo_vote_counts (
  suggestion_id uuid primary key references public.product_suggestions(id) on delete cascade,
  vote_count integer not null default 0 check (vote_count >= 0)
);
alter table public.community_demo_vote_counts enable row level security;
revoke all on public.community_demo_vote_counts from public, anon, authenticated;
grant all on public.community_demo_vote_counts to service_role;
alter table public.product_suggestions enable row level security;
alter table public.suggestion_votes enable row level security;
drop policy if exists "Anyone can read active suggestions" on public.product_suggestions;
create policy "Anyone can read active suggestions" on public.product_suggestions for select to anon, authenticated using (status='active');
drop policy if exists "Users can suggest products" on public.product_suggestions;
create policy "Users can suggest products" on public.product_suggestions for insert to authenticated with check (user_id=auth.uid());
drop policy if exists "Users can read own votes" on public.suggestion_votes;
create policy "Users can read own votes" on public.suggestion_votes for select to authenticated using (user_id=auth.uid());
drop policy if exists "Users can vote as themselves" on public.suggestion_votes;
create policy "Users can vote as themselves" on public.suggestion_votes for insert to authenticated with check (user_id=auth.uid());
drop policy if exists "Users can remove own votes" on public.suggestion_votes;
create policy "Users can remove own votes" on public.suggestion_votes for delete to authenticated using (user_id=auth.uid());
grant select,insert on public.product_suggestions to authenticated;
grant select on public.product_suggestions to anon;
grant select,insert,delete on public.suggestion_votes to authenticated;

create or replace function public.list_product_suggestions()
returns table(id uuid, product_name text, details text, created_at timestamptz, vote_count bigint, voted_by_me boolean)
language sql stable security definer set search_path=public as $$
  select s.id,s.product_name,s.details,s.created_at,(count(v.user_id)+coalesce(max(d.vote_count),0))::bigint,
    coalesce(bool_or(v.user_id=auth.uid()),false)
  from public.product_suggestions s
  left join public.suggestion_votes v on v.suggestion_id=s.id
  left join public.community_demo_vote_counts d on d.suggestion_id=s.id
  where s.status='active'
  group by s.id,d.vote_count
  order by (count(v.user_id)+coalesce(max(d.vote_count),0)) desc,s.created_at desc
$$;
revoke all on function public.list_product_suggestions() from public;
grant execute on function public.list_product_suggestions() to anon,authenticated;

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
  status text not null default 'pending' check (status in ('pending','confirmed','barcode_issued','completed','cancelled')),
  created_at timestamptz not null default now()
);
alter table public.share_orders add column if not exists barcode_issued_at timestamptz;
alter table public.share_orders add column if not exists completed_at timestamptz;
alter table public.share_orders drop constraint if exists share_orders_status_check;
alter table public.share_orders add constraint share_orders_status_check
  check (status in ('pending','confirmed','barcode_issued','completed','cancelled'));
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

create or replace function public.mark_share_barcode_issued(p_public_code text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_order public.share_orders%rowtype;
begin
  if auth.uid() is null then raise exception 'LOGIN_REQUIRED'; end if;
  select * into v_order from public.share_orders
    where public_code=p_public_code and user_id=auth.uid() and status='confirmed' for update;
  if not found then raise exception 'ORDER_NOT_AVAILABLE_FOR_QR'; end if;
  if not exists(select 1 from public.share_rounds where id=v_order.round_id and status='filled') then
    raise exception 'ROUND_NOT_FILLED';
  end if;
  update public.share_orders set status='barcode_issued',barcode_issued_at=now() where id=v_order.id;
  return jsonb_build_object('updated',true,'status','barcode_issued');
end $$;

create or replace function public.complete_share_order(p_public_code text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_order public.share_orders%rowtype;
begin
  if auth.uid() is null then raise exception 'LOGIN_REQUIRED'; end if;
  select * into v_order from public.share_orders
    where public_code=p_public_code and user_id=auth.uid() and status='barcode_issued' for update;
  if not found then raise exception 'ORDER_NOT_READY_FOR_COMPLETION'; end if;
  update public.share_orders set status='completed',completed_at=now() where id=v_order.id;
  return jsonb_build_object('updated',true,'status','completed');
end $$;

revoke all on function public.join_share(integer,integer,integer) from public;
revoke all on function public.join_share_waitlist(integer,integer,integer) from public;
revoke all on function public.leave_share_waitlist(integer) from public;
revoke all on function public.start_share_round(integer,integer) from public;
revoke all on function public.cancel_share(text) from public;
revoke all on function public.mark_share_barcode_issued(text) from public;
revoke all on function public.complete_share_order(text) from public;
grant execute on function public.join_share(integer,integer,integer), public.join_share_waitlist(integer,integer,integer), public.leave_share_waitlist(integer), public.start_share_round(integer,integer), public.cancel_share(text) to authenticated;
grant execute on function public.mark_share_barcode_issued(text), public.complete_share_order(text) to authenticated;


-- Seed the complete catalog from the local catalog data; safe to rerun.
insert into public.products(id,type,category,name,weight,regular_price,price,discount,price_100g,rating,review_count,portions,emoji,cls,availability)
select p.id,p.type,p.category,p.name,p.weight,p."regularPrice",p.price,p.discount,p."price100g",p.rating,p."reviewCount",p.portions,p.emoji,p.cls,p.availability
from jsonb_to_recordset($products$[{"id":1,"type":"정육","name":"호주산 냉장 안심 2.5kg","price":55800,"portions":5,"emoji":"🥩","cls":""},{"id":2,"type":"수산","name":"생연어 필렛 2.0kg","price":49800,"portions":4,"emoji":"🐟","cls":"fish"},{"id":3,"type":"정육","name":"한우 불고기 1.0kg","price":32800,"portions":4,"emoji":"🍖","cls":"beef"},{"id":4,"type":"수산","name":"손질 새우 1.0kg","price":24900,"portions":3,"emoji":"🦐","cls":"fish"},{"id":5,"type":"신선식품","category":"과일류","name":"국내산 사과 2kg","price":19900,"portions":5,"emoji":"🍎","cls":"fresh"},{"id":6,"type":"신선식품","category":"과일류","name":"제주 감귤 3kg","price":17900,"portions":4,"emoji":"🍊","cls":"fresh"},{"id":7,"type":"신선식품","category":"뿌리채소·고구마·호박류","name":"햇 밤고구마","weight":"5kg","regularPrice":29800,"price":19040,"discount":36,"price100g":381,"rating":4.7,"reviewCount":351,"portions":5,"emoji":"🍠","cls":"fresh"},{"id":8,"type":"신선식품","category":"뿌리채소·고구마·호박류","name":"감자","weight":"5kg","regularPrice":25900,"price":11840,"discount":54,"price100g":237,"rating":4.7,"reviewCount":668,"portions":5,"emoji":"🥔","cls":"fresh"},{"id":9,"type":"신선식품","category":"뿌리채소·고구마·호박류","name":"햇연근(흙연근)","weight":"3kg","regularPrice":39900,"price":19984,"discount":49,"price100g":666,"rating":4.8,"reviewCount":146,"portions":5,"emoji":"🪷","cls":"fresh"},{"id":10,"type":"신선식품","category":"뿌리채소·고구마·호박류","name":"미니양배추","weight":"5입","regularPrice":9980,"price":8982,"discount":10,"price100g":299,"rating":5,"reviewCount":17,"portions":5,"emoji":"🥬","cls":"fresh"},{"id":11,"type":"신선식품","category":"뿌리채소·고구마·호박류","name":"국내산 단호박","weight":"10kg (8~12개)","regularPrice":29800,"price":16800,"discount":43,"price100g":null,"rating":4.4,"reviewCount":65,"portions":5,"emoji":"🎃","cls":"fresh"},{"id":12,"type":"신선식품","category":"뿌리채소·고구마·호박류","name":"국내산 미니단호박","weight":"5kg (12~17개)","regularPrice":29800,"price":15800,"discount":46,"price100g":null,"rating":4.6,"reviewCount":457,"portions":5,"emoji":"🎃","cls":"fresh"},{"id":13,"type":"신선식품","category":"뿌리채소·고구마·호박류","name":"호풍미 고구마","weight":"5kg","regularPrice":29800,"price":23800,"discount":20,"price100g":476,"rating":4.5,"reviewCount":73,"portions":5,"emoji":"🍠","cls":"fresh"},{"id":14,"type":"신선식품","category":"뿌리채소·고구마·호박류","name":"아삭달콤한 햇당근","weight":"5kg","regularPrice":19900,"price":12800,"discount":35,"price100g":256,"rating":4.8,"reviewCount":828,"portions":5,"emoji":"🥕","cls":"fresh"},{"id":15,"type":"신선식품","category":"뿌리채소·고구마·호박류","name":"우엉대","weight":"3kg (10~15개)","regularPrice":29850,"price":21980,"discount":26,"price100g":733,"rating":4.8,"reviewCount":87,"portions":5,"emoji":"🥕","cls":"fresh"},{"id":16,"type":"신선식품","category":"뿌리채소·고구마·호박류","name":"장마","weight":"5kg","regularPrice":89800,"price":59900,"discount":33,"price100g":1198,"rating":4.7,"reviewCount":16,"portions":5,"emoji":"🥔","cls":"fresh"},{"id":17,"type":"신선식품","category":"뿌리채소·고구마·호박류","name":"고흥 햇 통마늘","weight":"3kg (약 45~50개)","regularPrice":35400,"price":21500,"discount":39,"price100g":717,"rating":4.6,"reviewCount":122,"portions":5,"emoji":"🧄","cls":"fresh"},{"id":18,"type":"신선식품","category":"뿌리채소·고구마·호박류","name":"국내산 아이스 군고구마","weight":"900g","regularPrice":14980,"price":12980,"discount":13,"price100g":1442,"rating":4.8,"reviewCount":89,"portions":5,"emoji":"🍠","cls":"fresh"},{"id":19,"type":"신선식품","category":"버섯류","name":"국산품종 설원버섯","weight":"1.8kg","regularPrice":22410,"price":18800,"discount":16,"price100g":1044,"rating":4.5,"reviewCount":131,"portions":5,"emoji":"🍄","cls":"fresh"},{"id":20,"type":"신선식품","category":"버섯류","name":"참송이버섯","weight":"1kg","regularPrice":null,"price":32800,"discount":null,"price100g":3280,"rating":3.5,"reviewCount":7,"portions":5,"emoji":"🍄","cls":"fresh"},{"id":21,"type":"신선식품","category":"버섯류","name":"귀리로 키운 동충하초버섯","weight":"170g × 4입","regularPrice":null,"price":17980,"discount":null,"price100g":2644,"rating":null,"reviewCount":null,"portions":5,"emoji":"🍄","cls":"fresh"},{"id":22,"type":"신선식품","category":"버섯류","name":"고기맛이 나는 느타리버섯","weight":"1.8kg","regularPrice":23880,"price":19800,"discount":17,"price100g":1100,"rating":null,"reviewCount":null,"portions":5,"emoji":"🍄","cls":"fresh"},{"id":23,"type":"신선식품","category":"버섯류","name":"국내산 신품종 노랑느타리버섯","weight":"1kg","regularPrice":null,"price":22800,"discount":null,"price100g":2280,"rating":null,"reviewCount":null,"portions":5,"emoji":"🍄","cls":"fresh"},{"id":24,"type":"신선식품","category":"신선 채소·샐러드류","name":"창녕 다진마늘","weight":"1.6kg (400g × 4팩)","regularPrice":35100,"price":19800,"discount":43,"price100g":1238,"rating":4.8,"reviewCount":828,"portions":5,"emoji":"🧄","cls":"fresh"},{"id":25,"type":"신선식품","category":"신선 채소·샐러드류","name":"모닝샐러드","weight":"700g (100g × 7입)","regularPrice":13260,"price":8980,"discount":32,"price100g":1283,"rating":4.7,"reviewCount":298,"portions":5,"emoji":"🥗","cls":"fresh"},{"id":26,"type":"신선식품","category":"신선 채소·샐러드류","name":"눈꽃양배추","weight":"1.4kg (200g × 7입)","regularPrice":12180,"price":11800,"discount":3,"price100g":843,"rating":4,"reviewCount":5,"portions":5,"emoji":"🥬","cls":"fresh"},{"id":27,"type":"신선식품","category":"신선 채소·샐러드류","name":"7가지 채소 모둠쌈","weight":"1kg","regularPrice":13800,"price":8700,"discount":36,"price100g":870,"rating":4.8,"reviewCount":486,"portions":5,"emoji":"🥬","cls":"fresh"},{"id":28,"type":"신선식품","category":"신선 채소·샐러드류","name":"청도미나리","weight":"2kg","regularPrice":37800,"price":27800,"discount":26,"price100g":1390,"rating":4.7,"reviewCount":31,"portions":5,"emoji":"🌿","cls":"fresh"},{"id":29,"type":"신선식품","category":"신선 채소·샐러드류","name":"추부 깻잎(절임소스 증정)","weight":"1kg","regularPrice":34800,"price":29400,"discount":15,"price100g":2940,"rating":3.9,"reviewCount":9,"portions":5,"emoji":"🌿","cls":"fresh"},{"id":30,"type":"신선식품","category":"신선 채소·샐러드류","name":"국내산 셀러리","weight":"2kg","regularPrice":12980,"price":9980,"discount":23,"price100g":499,"rating":4,"reviewCount":124,"portions":5,"emoji":"🥬","cls":"fresh"},{"id":31,"type":"신선식품","category":"신선 채소·샐러드류","name":"주스용 비트","weight":"3kg","regularPrice":10980,"price":8980,"discount":18,"price100g":299,"rating":4.8,"reviewCount":127,"portions":5,"emoji":"🫜","cls":"fresh"},{"id":32,"type":"신선식품","category":"신선 채소·샐러드류","name":"착즙용 케일","weight":"1kg","regularPrice":null,"price":9980,"discount":null,"price100g":null,"rating":5,"reviewCount":24,"portions":5,"emoji":"🥬","cls":"fresh"},{"id":33,"type":"신선식품","category":"신선 채소·샐러드류","name":"샬롯","weight":"500g","regularPrice":null,"price":11800,"discount":null,"price100g":2360,"rating":4,"reviewCount":5,"portions":5,"emoji":"🧅","cls":"fresh"},{"id":34,"type":"정육","category":"스테이크·캠핑용 육류","name":"헤비앤텐더 토마호크 캠핑팩","weight":"500g","regularPrice":59000,"price":36800,"discount":37,"price100g":7360,"rating":5,"reviewCount":219,"portions":5,"emoji":"🥩","cls":"beef"},{"id":35,"type":"정육","category":"스테이크·캠핑용 육류","name":"헤비앤텐더 티본스테이크 캠핑팩","weight":"500g","regularPrice":58000,"price":40950,"discount":29,"price100g":8190,"rating":5,"reviewCount":8,"portions":5,"emoji":"🥩","cls":"beef"},{"id":36,"type":"정육","category":"스테이크·캠핑용 육류","name":"헤비앤텐더 엘본스테이크 캠핑팩","weight":"500g","regularPrice":57000,"price":40050,"discount":29,"price100g":8010,"rating":5,"reviewCount":1,"portions":5,"emoji":"🥩","cls":"beef"},{"id":37,"type":"정육","category":"돼지고기·한돈","name":"수육용 국내산 금한돈 앞다리","weight":"2kg","regularPrice":null,"price":33800,"discount":null,"price100g":1690,"rating":4.8,"reviewCount":532,"portions":5,"emoji":"🥓","cls":"beef"},{"id":38,"type":"정육","category":"돼지고기·한돈","name":"온가족 삼겹살 구이용(캐나다산)","weight":"2.4kg","regularPrice":47519,"price":36800,"discount":22,"price100g":1533,"rating":4.1,"reviewCount":28,"portions":5,"emoji":"🥓","cls":"beef"},{"id":39,"type":"정육","category":"돼지고기·한돈","name":"캠핑용 국내산 금한돈 삼겹살","weight":"1.5kg","regularPrice":47700,"price":43800,"discount":8,"price100g":2920,"rating":4.8,"reviewCount":330,"portions":5,"emoji":"🥓","cls":"beef"},{"id":40,"type":"정육","category":"돼지고기·한돈","name":"캠핑용 국내산 금한돈 돈목심","weight":"1.5kg","regularPrice":47700,"price":43800,"discount":8,"price100g":2920,"rating":4.3,"reviewCount":7,"portions":5,"emoji":"🥓","cls":"beef"},{"id":41,"type":"정육","category":"돼지고기·한돈","name":"도드람한돈 특수부위 스페셜 모둠","weight":"1.7kg","regularPrice":38000,"price":29800,"discount":21,"price100g":1753,"rating":4.7,"reviewCount":307,"portions":5,"emoji":"🥓","cls":"beef"},{"id":42,"type":"정육","category":"돼지고기·한돈","name":"온가족 한돈 돼지갈비 찜용","weight":"2.4kg","regularPrice":46500,"price":34800,"discount":25,"price100g":1450,"rating":4.5,"reviewCount":181,"portions":5,"emoji":"🍖","cls":"beef"},{"id":43,"type":"정육","category":"돼지고기·한돈","name":"청정돈 한입 냉동 삼겹살","weight":"2kg","regularPrice":null,"price":null,"discount":null,"price100g":1499,"rating":4.5,"reviewCount":190,"portions":5,"emoji":"🥓","cls":"beef","availability":"판매 종료"},{"id":44,"type":"정육","category":"돼지고기·한돈","name":"한돈 돼지갈비 모둠 세트","weight":"미표기","regularPrice":null,"price":49800,"discount":null,"price100g":2264,"rating":null,"reviewCount":null,"portions":5,"emoji":"🍖","cls":"beef"},{"id":45,"type":"정육","category":"한우·소고기","name":"몸보신 곰탕용 한우 모둠 곰거리","weight":"3kg","regularPrice":32000,"price":23400,"discount":26,"price100g":780,"rating":4.9,"reviewCount":2026,"portions":5,"emoji":"🥩","cls":"beef"},{"id":46,"type":"정육","category":"한우·소고기","name":"한우 알스지 수육·전골용","weight":"800g","regularPrice":24980,"price":22800,"discount":8,"price100g":2850,"rating":4.8,"reviewCount":466,"portions":5,"emoji":"🥩","cls":"beef"},{"id":47,"type":"정육","category":"한우·소고기","name":"한우 통 사태살","weight":"2kg","regularPrice":97600,"price":70700,"discount":27,"price100g":3535,"rating":4.8,"reviewCount":251,"portions":5,"emoji":"🥩","cls":"beef"},{"id":48,"type":"정육","category":"한우·소고기","name":"한우 육마카세","weight":"900g","regularPrice":null,"price":134200,"discount":null,"price100g":14911,"rating":5,"reviewCount":24,"portions":5,"emoji":"🥩","cls":"beef"},{"id":49,"type":"정육","category":"한우·소고기","name":"한우 구이의 정석(등심·채끝·갈비살)","weight":"600g","regularPrice":80000,"price":79100,"discount":1,"price100g":13183,"rating":4.7,"reviewCount":85,"portions":5,"emoji":"🥩","cls":"beef"},{"id":50,"type":"정육","category":"한우·소고기","name":"한우 금바구니 구이 세트","weight":"1kg","regularPrice":160000,"price":147400,"discount":7,"price100g":14740,"rating":4.8,"reviewCount":68,"portions":5,"emoji":"🥩","cls":"beef"},{"id":51,"type":"정육","category":"수입육·양고기","name":"냉동 양꼬치(어깨살)","weight":"400g","regularPrice":18400,"price":16500,"discount":10,"price100g":4125,"rating":5,"reviewCount":2,"portions":5,"emoji":"🍢","cls":"beef"},{"id":52,"type":"정육","category":"수입육·양고기","name":"미국산 생 LA갈비 냉장구이","weight":"800g","regularPrice":67800,"price":47600,"discount":29,"price100g":5950,"rating":4.7,"reviewCount":40,"portions":5,"emoji":"🍖","cls":"beef"},{"id":53,"type":"정육","category":"수입육·양고기","name":"달링다운 와규 홈파티팩","weight":"600g","regularPrice":50000,"price":39800,"discount":20,"price100g":6633,"rating":4.1,"reviewCount":22,"portions":5,"emoji":"🥩","cls":"beef"},{"id":54,"type":"정육","category":"양념육·갈비·제육볶음","name":"포천이동 양념 소갈비","weight":"1.5kg","regularPrice":65000,"price":49980,"discount":23,"price100g":3332,"rating":4.4,"reviewCount":275,"portions":5,"emoji":"🍖","cls":"beef"},{"id":55,"type":"정육","category":"양념육·갈비·제육볶음","name":"양념우대갈비 캠핑 세트","weight":"800g","regularPrice":78000,"price":59800,"discount":23,"price100g":1977,"rating":4.4,"reviewCount":8,"portions":5,"emoji":"🍖","cls":"beef"},{"id":56,"type":"정육","category":"양념육·갈비·제육볶음","name":"동물복지 간장·고추장 제육볶음","weight":"2.4kg","regularPrice":45000,"price":34800,"discount":22,"price100g":1450,"rating":4.9,"reviewCount":296,"portions":5,"emoji":"🍲","cls":"beef"},{"id":57,"type":"정육","category":"양념육·갈비·제육볶음","name":"춘천 닭갈비 순한맛","weight":"1kg","regularPrice":29000,"price":26500,"discount":8,"price100g":2650,"rating":4.9,"reviewCount":102,"portions":5,"emoji":"🍗","cls":"beef"},{"id":58,"type":"정육","category":"양념육·갈비·제육볶음","name":"원조 춘천닭갈비 매운맛","weight":"1kg","regularPrice":29000,"price":26500,"discount":8,"price100g":2650,"rating":5,"reviewCount":97,"portions":5,"emoji":"🍗","cls":"beef"},{"id":59,"type":"정육","category":"양념육·갈비·제육볶음","name":"강원도청정돼지 생돼지갈비","weight":"1.9kg","regularPrice":42900,"price":33900,"discount":20,"price100g":1784,"rating":4.5,"reviewCount":64,"portions":5,"emoji":"🍖","cls":"beef"},{"id":60,"type":"정육","category":"양념육·갈비·제육볶음","name":"강원도청정돼지 생제육볶음","weight":"1.6kg","regularPrice":29900,"price":21900,"discount":26,"price100g":1369,"rating":4.8,"reviewCount":116,"portions":5,"emoji":"🍲","cls":"beef"},{"id":61,"type":"정육","category":"양념육·갈비·제육볶음","name":"남영돈 양념돼지갈비","weight":"1.6kg","regularPrice":45000,"price":33800,"discount":24,"price100g":2113,"rating":5,"reviewCount":5,"portions":5,"emoji":"🍖","cls":"beef"},{"id":62,"type":"정육","category":"닭고기·닭 특수부위","name":"올품 IQF 냉동 닭발","weight":"2.4kg","regularPrice":26000,"price":18900,"discount":27,"price100g":788,"rating":4.9,"reviewCount":61,"portions":5,"emoji":"🍗","cls":"beef"},{"id":63,"type":"정육","category":"닭고기·닭 특수부위","name":"올품 IQF 냉동 닭가슴살","weight":"2.4kg","regularPrice":33000,"price":24000,"discount":27,"price100g":1000,"rating":5,"reviewCount":20,"portions":5,"emoji":"🍗","cls":"beef"},{"id":64,"type":"정육","category":"닭고기·닭 특수부위","name":"올품 IQF 냉동 닭안심","weight":"2.4kg","regularPrice":33000,"price":24000,"discount":27,"price100g":1000,"rating":null,"reviewCount":null,"portions":5,"emoji":"🍗","cls":"beef"},{"id":65,"type":"수산","category":"회·해산물·프리미엄 수산물","name":"흑산도 자연산 홍어","weight":"300g","regularPrice":45900,"price":22112,"discount":51,"price100g":7371,"rating":4.6,"reviewCount":52,"portions":5,"emoji":"🐟","cls":"fish"},{"id":66,"type":"수산","category":"회·해산물·프리미엄 수산물","name":"자연산 거제 돌멍게","weight":"2kg (12~18미)","regularPrice":39800,"price":26010,"discount":34,"price100g":1301,"rating":5,"reviewCount":40,"portions":5,"emoji":"🦪","cls":"fish"},{"id":67,"type":"수산","category":"회·해산물·프리미엄 수산물","name":"명인 명품 백굴비","weight":"1.8kg (10미)","regularPrice":42980,"price":35082,"discount":18,"price100g":1949,"rating":4.3,"reviewCount":44,"portions":5,"emoji":"🐟","cls":"fish"},{"id":68,"type":"수산","category":"회·해산물·프리미엄 수산물","name":"국산 생새우","weight":"1kg (35~45미)","regularPrice":33900,"price":29500,"discount":12,"price100g":2950,"rating":4.2,"reviewCount":29,"portions":5,"emoji":"🦐","cls":"fish"},{"id":69,"type":"수산","category":"회·해산물·프리미엄 수산물","name":"홈마카세 우니세트(단새우·성게알·감태)","weight":"미표기","regularPrice":43800,"price":34900,"discount":20,"price100g":null,"rating":4.6,"reviewCount":170,"portions":5,"emoji":"🍣","cls":"fish"},{"id":70,"type":"수산","category":"회·해산물·프리미엄 수산물","name":"참다랑어 2번 뱃살","weight":"900g","regularPrice":138000,"price":92000,"discount":33,"price100g":10222,"rating":4.6,"reviewCount":78,"portions":5,"emoji":"🐟","cls":"fish"},{"id":71,"type":"수산","category":"조개류·꽃게·골뱅이","name":"자연산 거제 바위굴(하프쉘)","weight":"1kg (3~4미)","regularPrice":29800,"price":20900,"discount":29,"price100g":null,"rating":2.5,"reviewCount":2,"portions":5,"emoji":"🦪","cls":"fish"},{"id":72,"type":"수산","category":"조개류·꽃게·골뱅이","name":"서해안 가을 생물 꽃게","weight":"2kg (5~10미)","regularPrice":44850,"price":29900,"discount":33,"price100g":null,"rating":3.7,"reviewCount":458,"portions":5,"emoji":"🦀","cls":"fish"},{"id":73,"type":"수산","category":"조개류·꽃게·골뱅이","name":"서해안 제철 참소라","weight":"2kg (12~15미/kg)","regularPrice":null,"price":null,"discount":null,"price100g":1225,"rating":4.5,"reviewCount":76,"portions":5,"emoji":"🐚","cls":"fish","availability":"일시 품절"},{"id":74,"type":"수산","category":"조개류·꽃게·골뱅이","name":"남해안 홍가리비","weight":"5kg","regularPrice":32120,"price":28900,"discount":10,"price100g":578,"rating":4.7,"reviewCount":265,"portions":5,"emoji":"🦪","cls":"fish"},{"id":75,"type":"수산","category":"조개류·꽃게·골뱅이","name":"동해안 골뱅이살(무침소스 증정)","weight":"700g","regularPrice":31500,"price":28500,"discount":9,"price100g":4071,"rating":5,"reviewCount":4,"portions":5,"emoji":"🐚","cls":"fish"},{"id":76,"type":"수산","category":"조개류·꽃게·골뱅이","name":"마요꽃게구이","weight":"1.2kg (4미)","regularPrice":42800,"price":36800,"discount":14,"price100g":null,"rating":5,"reviewCount":2,"portions":5,"emoji":"🦀","cls":"fish"},{"id":77,"type":"수산","category":"조개류·꽃게·골뱅이","name":"서해바다 절단꽃게(냉동)","weight":"2kg (8~10미)","regularPrice":29980,"price":25500,"discount":14,"price100g":1275,"rating":3.6,"reviewCount":80,"portions":5,"emoji":"🦀","cls":"fish"},{"id":78,"type":"수산","category":"조개류·꽃게·골뱅이","name":"자연산 냉동 대하세트","weight":"1kg (약 20미)","regularPrice":null,"price":null,"discount":null,"price100g":3560,"rating":4.2,"reviewCount":6,"portions":5,"emoji":"🦐","cls":"fish","availability":"일시 품절"},{"id":79,"type":"수산","category":"전복·장어·문어","name":"완도활전복(대)","weight":"1.4kg (19~22미)","regularPrice":105000,"price":57000,"discount":45,"price100g":4071,"rating":4.8,"reviewCount":23,"portions":5,"emoji":"🐚","cls":"fish"},{"id":80,"type":"수산","category":"전복·장어·문어","name":"완도활전복(특대)","weight":"1.4kg (14~17미)","regularPrice":135000,"price":64930,"discount":51,"price100g":4638,"rating":4.8,"reviewCount":113,"portions":5,"emoji":"🐚","cls":"fish"},{"id":81,"type":"수산","category":"전복·장어·문어","name":"프리미엄 황제전복","weight":"1.92kg (12마리)","regularPrice":148000,"price":128000,"discount":13,"price100g":null,"rating":5,"reviewCount":4,"portions":5,"emoji":"🐚","cls":"fish"},{"id":82,"type":"수산","category":"전복·장어·문어","name":"국산 자포니카 생 민물장어","weight":"2kg (손질 전)","regularPrice":70630,"price":50750,"discount":28,"price100g":2538,"rating":4.8,"reviewCount":63,"portions":5,"emoji":"🐟","cls":"fish"},{"id":83,"type":"수산","category":"전복·장어·문어","name":"자연산 생 바다장어","weight":"2kg (손질 전)","regularPrice":53590,"price":38510,"discount":28,"price100g":1926,"rating":4.5,"reviewCount":11,"portions":5,"emoji":"🐟","cls":"fish"},{"id":84,"type":"수산","category":"전복·장어·문어","name":"국산 데친문어","weight":"약 2.4kg","regularPrice":94800,"price":85100,"discount":10,"price100g":null,"rating":4.6,"reviewCount":12,"portions":5,"emoji":"🐙","cls":"fish"},{"id":85,"type":"수산","category":"전복·장어·문어","name":"국산 데친문어","weight":"약 2kg","regularPrice":84800,"price":74480,"discount":12,"price100g":null,"rating":5,"reviewCount":91,"portions":5,"emoji":"🐙","cls":"fish"},{"id":86,"type":"수산","category":"간고등어·냉동 생선","name":"안동간고등어살 세트","weight":"1.8kg (120g × 15)","regularPrice":49800,"price":44800,"discount":10,"price100g":null,"rating":5,"reviewCount":6,"portions":5,"emoji":"🐟","cls":"fish"},{"id":87,"type":"수산","category":"간고등어·냉동 생선","name":"안동간고등어 세트","weight":"1.8kg (900g × 2)","regularPrice":49800,"price":44800,"discount":10,"price100g":null,"rating":4.3,"reviewCount":7,"portions":5,"emoji":"🐟","cls":"fish"},{"id":88,"type":"수산","category":"간고등어·냉동 생선","name":"서해바다 냉동 덕자병어 특대","weight":"1.2~1.8kg (2마리)","regularPrice":null,"price":59800,"discount":null,"price100g":null,"rating":5,"reviewCount":6,"portions":5,"emoji":"🐟","cls":"fish"},{"id":89,"type":"수산","category":"간고등어·냉동 생선","name":"서해바다 냉동 덕자병어 왕왕","weight":"약 2kg (1마리)","regularPrice":null,"price":99800,"discount":null,"price100g":null,"rating":null,"reviewCount":null,"portions":5,"emoji":"🐟","cls":"fish"},{"id":90,"type":"수산","category":"제주 수산물·선물세트","name":"서귀포수협 제주 냉동 갈치(왕)","weight":"900g (450g × 2팩)","regularPrice":93500,"price":88000,"discount":5,"price100g":9778,"rating":5,"reviewCount":3,"portions":5,"emoji":"🐟","cls":"fish"},{"id":91,"type":"수산","category":"제주 수산물·선물세트","name":"서귀포수협 제주 냉동 갈치(특대)","weight":"700g (350g × 2팩)","regularPrice":63000,"price":58000,"discount":7,"price100g":8286,"rating":5,"reviewCount":1,"portions":5,"emoji":"🐟","cls":"fish"},{"id":92,"type":"수산","category":"제주 수산물·선물세트","name":"서귀포수협 제주 냉동 옥돔(특대)","weight":"800g (400g × 2팩)","regularPrice":87000,"price":80000,"discount":8,"price100g":10000,"rating":3.4,"reviewCount":3,"portions":5,"emoji":"🐟","cls":"fish"},{"id":93,"type":"수산","category":"제주 수산물·선물세트","name":"서귀포수협 제주 냉동 옥돔(대)","weight":"600g (300g × 2팩)","regularPrice":74200,"price":68000,"discount":8,"price100g":11333,"rating":5,"reviewCount":1,"portions":5,"emoji":"🐟","cls":"fish"},{"id":94,"type":"수산","category":"제주 수산물·선물세트","name":"제주 옥돔·갈치 세트","weight":"1.3kg","regularPrice":120000,"price":110000,"discount":8,"price100g":8462,"rating":5,"reviewCount":4,"portions":5,"emoji":"🐟","cls":"fish"}]$products$::jsonb) as p(
  id integer,type text,category text,name text,weight text,"regularPrice" integer,price integer,discount integer,
  "price100g" integer,rating numeric,"reviewCount" integer,portions integer,emoji text,cls text,availability text
)
on conflict(id) do update set
  type=excluded.type,category=excluded.category,name=excluded.name,weight=excluded.weight,
  regular_price=excluded.regular_price,price=excluded.price,discount=excluded.discount,price_100g=excluded.price_100g,
  rating=excluded.rating,review_count=excluded.review_count,portions=excluded.portions,emoji=excluded.emoji,
  cls=excluded.cls,availability=excluded.availability,is_active=true,updated_at=now();

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
