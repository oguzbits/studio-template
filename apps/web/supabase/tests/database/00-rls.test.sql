begin;
create extension if not exists pgtap with schema extensions;

select plan(8);

-- Guard for every future migration: no table in public without RLS.
select is_empty(
  $$ select c.relname from pg_class c
     join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity $$,
  'every table in public has RLS enabled'
);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@test.local'),
  ('00000000-0000-0000-0000-00000000000b', 'b@test.local');

insert into public.entitlements (user_id, product_key, status) values
  ('00000000-0000-0000-0000-00000000000a', 'pro', 'active'),
  ('00000000-0000-0000-0000-00000000000b', 'pro', 'active');

insert into public.billing_customers (user_id, customer_id) values
  ('00000000-0000-0000-0000-00000000000a', 'cus_a'),
  ('00000000-0000-0000-0000-00000000000b', 'cus_b');

-- As user A
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

select is((select count(*)::int from public.entitlements), 1, 'A sees exactly one entitlement');
select is(
  (select count(*)::int from public.entitlements where user_id = '00000000-0000-0000-0000-00000000000b'),
  0,
  'A does not see entitlements of B'
);
select is((select customer_id from public.billing_customers), 'cus_a', 'A sees only own billing customer');
select throws_ok(
  $$ insert into public.entitlements (user_id, product_key, status)
     values ('00000000-0000-0000-0000-00000000000a', 'free-upgrade', 'active') $$,
  '42501',
  null,
  'authenticated cannot grant itself an entitlement'
);
select throws_ok($$ select * from public.jobs $$, '42501', null, 'authenticated cannot read jobs');

-- As anon
reset role;
set local role anon;
select throws_ok($$ select * from public.waitlist $$, '42501', null, 'anon cannot read waitlist');
select throws_ok(
  $$ insert into public.waitlist (email) values ('x@test.local') $$,
  '42501',
  null,
  'anon cannot write waitlist directly'
);

select * from finish();
rollback;
