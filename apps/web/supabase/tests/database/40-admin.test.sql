begin;
create extension if not exists pgtap with schema extensions;

select plan(7);

select set_config('role', 'authenticated', true);
select throws_ok('select public.admin_metrics()', '42501', null, 'authenticated cannot execute admin_metrics');

select set_config('role', 'anon', true);
select throws_ok('select public.admin_metrics()', '42501', null, 'anon cannot execute admin_metrics');

select set_config('role', 'service_role', true);
select lives_ok('select public.admin_metrics()', 'service_role can execute admin_metrics');
select is(
  json_typeof((public.admin_metrics() -> 'failed_jobs')::json),
  'array',
  'admin_metrics returns a failed_jobs array'
);


-- fixtures as postgres: one confirmed and one unconfirmed user, a paying and a trialing entitlement
select set_config('role', 'postgres', true);
insert into auth.users (id, email, email_confirmed_at, created_at) values
  ('00000000-0000-0000-0000-0000000000a1', 'paid@example.com', now(), now()),
  ('00000000-0000-0000-0000-0000000000a2', 'trial@example.com', null, now());
insert into public.entitlements (user_id, product_key, status, provider) values
  ('00000000-0000-0000-0000-0000000000a1', 'pro', 'active', 'stripe'),
  ('00000000-0000-0000-0000-0000000000a2', 'pro', 'trialing', 'stripe');

select set_config('role', 'service_role', true);
select is(
  (public.admin_metrics() -> 'active_by_product' ->> 'pro')::int,
  1,
  'trials are not counted as paying subscriptions'
);
select is((public.admin_metrics() ->> 'trialing_total')::int, 1, 'trials are counted separately');
-- owner role: the comparison query reads auth.users
select set_config('role', 'postgres', true);
select is(
  (public.admin_metrics() ->> 'signups_30d')::int,
  (select count(*)::int from auth.users where email_confirmed_at is not null and created_at > now() - interval '30 days'),
  'unconfirmed users are not counted as sign-ups'
);

select * from finish();
rollback;
