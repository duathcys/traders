-- One-time migration for single-use QR / barcode pickup tracking.
alter table public.share_orders add column if not exists barcode_issued_at timestamptz;
alter table public.share_orders add column if not exists completed_at timestamptz;
alter table public.share_orders drop constraint if exists share_orders_status_check;
alter table public.share_orders add constraint share_orders_status_check
  check (status in ('pending','confirmed','barcode_issued','completed','cancelled'));

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

revoke all on function public.mark_share_barcode_issued(text) from public;
revoke all on function public.complete_share_order(text) from public;
grant execute on function public.mark_share_barcode_issued(text), public.complete_share_order(text) to authenticated;
