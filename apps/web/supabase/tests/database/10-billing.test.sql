begin;
create extension if not exists pgtap with schema extensions;

select plan(6);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000c', 'c@test.local');

select is(
  public.apply_billing_event('evt_1', '00000000-0000-0000-0000-00000000000c', 'pro', 'active', null, null, 'sub_1'),
  true,
  'first delivery of an event is applied'
);

select is(
  public.apply_billing_event('evt_1', '00000000-0000-0000-0000-00000000000c', 'pro', 'canceled', null, null, 'sub_1'),
  false,
  'redelivery of the same event is ignored'
);

select is(
  (select status from public.entitlements
   where user_id = '00000000-0000-0000-0000-00000000000c' and product_key = 'pro'),
  'active'::public.entitlement_status,
  'entitlement keeps the status of the first delivery'
);

select is(
  public.apply_billing_event('evt_2', '00000000-0000-0000-0000-00000000000c', 'pro', 'past_due', '2026-11-22T00:00:00Z', null, 'sub_1'),
  true,
  'a new event is applied'
);

select is(
  (select status from public.entitlements
   where user_id = '00000000-0000-0000-0000-00000000000c' and product_key = 'pro'),
  'past_due'::public.entitlement_status,
  'a new event updates the status'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);

select throws_ok(
  $$ select public.apply_billing_event('evt_3', '00000000-0000-0000-0000-00000000000c', 'pro', 'active', null, null, 'sub_1') $$,
  '42501',
  null,
  'authenticated cannot execute apply_billing_event'
);

select * from finish();
rollback;
