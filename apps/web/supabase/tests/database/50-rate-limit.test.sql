begin;
create extension if not exists pgtap with schema extensions;

select plan(7);

select set_config('role', 'authenticated', true);
select throws_ok($$ select public.check_rate_limit('t:a', 5, 3600) $$, '42501', null, 'authenticated cannot execute check_rate_limit');

select set_config('role', 'anon', true);
select throws_ok($$ select public.check_rate_limit('t:a', 5, 3600) $$, '42501', null, 'anon cannot execute check_rate_limit');
select throws_ok($$ select * from public.rate_limits $$, '42501', null, 'anon cannot read rate_limits');

select set_config('role', 'service_role', true);
select is(
  (select bool_and(public.check_rate_limit('t:a', 5, 3600)) from generate_series(1, 5)),
  true,
  'first 5 calls in a window are allowed'
);
select is(public.check_rate_limit('t:a', 5, 3600), false, '6th call in the window is rejected');
select is(public.check_rate_limit('t:b', 5, 3600), true, 'another key has its own counter');

select set_config('role', 'postgres', true);
select is(
  (select count from public.rate_limits where key = 't:a'),
  6,
  'counter is stored per key and window'
);

select * from finish();
rollback;
