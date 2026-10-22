begin;
create extension if not exists pgtap with schema extensions;

select plan(4);

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

select * from finish();
rollback;
