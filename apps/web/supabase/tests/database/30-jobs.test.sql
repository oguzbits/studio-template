begin;
create extension if not exists pgtap with schema extensions;
create extension if not exists dblink with schema extensions;

select plan(23);

-- SKIP LOCKED ----------------------------------------------
-- Session B sees only committed rows, so it commits the two fixture jobs itself,
-- locks job c1 in an open transaction and deletes both at the end.
-- Password auth is required for dblink as non-superuser, hence the TCP address.
do $$
begin
  perform dblink_connect('b', format(
    'host=%s port=%s dbname=%s user=postgres password=postgres',
    host(inet_server_addr()), inet_server_port(), current_database()));

  perform dblink_exec('b', $q$
    delete from public.jobs where id in
      ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000c2');
    insert into public.jobs (id, type, run_at) values
      ('00000000-0000-0000-0000-0000000000c1', 'test', now() - interval '100 years'),
      ('00000000-0000-0000-0000-0000000000c2', 'test', now() - interval '100 years');
  $q$);

  perform dblink_exec('b', 'begin');
  perform * from dblink('b', $q$
    select id from public.jobs
    where id = '00000000-0000-0000-0000-0000000000c1' for update
  $q$) as t(id uuid);
end;
$$;

-- The claim runs in a subtransaction that is rolled back, so its row lock on c2
-- is released before session B deletes the fixtures.
create function pg_temp.claim_then_undo() returns uuid[]
language plpgsql as $$
declare
  claimed uuid[];
begin
  begin
    select array_agg(id) into claimed
    from public.claim_jobs(10)
    where id in ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000c2');

    raise exception 'undo claim';
  exception when raise_exception then
    null;
  end;

  return claimed;
end;
$$;

-- without SKIP LOCKED the claim waits for session B and fails here instead of hanging
set local lock_timeout = '2s';

select is(
  pg_temp.claim_then_undo(),
  array['00000000-0000-0000-0000-0000000000c2']::uuid[],
  'claim_jobs skips a job locked by another session'
);

set local lock_timeout = default;

do $$
begin
  perform dblink_exec('b', 'rollback');
  perform dblink_exec('b', $q$
    delete from public.jobs where id in
      ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000c2');
  $q$);
  perform dblink_disconnect('b');
end;
$$;

-- Visibility timeout --------------------------------------
insert into public.jobs (id, type, status, attempts, run_at) values
  ('00000000-0000-0000-0000-0000000000d1', 'test', 'running', 1, now() - interval '100 years'),
  ('00000000-0000-0000-0000-0000000000d2', 'test', 'running', 1, now() + interval '5 minutes'),
  ('00000000-0000-0000-0000-0000000000d5', 'test', 'running', 5, now() - interval '100 years');

select is(
  (select array_agg(id) from public.claim_jobs(10)
   where id in ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000d2',
                '00000000-0000-0000-0000-0000000000d5')),
  array['00000000-0000-0000-0000-0000000000d1']::uuid[],
  'an expired running job is reclaimed, one within its timeout or out of attempts is not'
);

select is(
  (select row(status, last_error)::text from public.jobs
   where id = '00000000-0000-0000-0000-0000000000d5'),
  row('failed'::public.job_status, 'abandoned after 5 attempts (worker crashed or timed out)')::text,
  'an expired running job without attempts left is marked failed'
);

select is(
  (select attempts from public.jobs where id = '00000000-0000-0000-0000-0000000000d1'),
  2,
  'claim increments attempts'
);

select is(
  (select run_at from public.jobs where id = '00000000-0000-0000-0000-0000000000d1'),
  now() + interval '10 minutes',
  'claim sets the visibility timeout'
);

select is(
  (select attempts from public.jobs where id = '00000000-0000-0000-0000-0000000000d2'),
  1,
  'a job within its timeout is untouched'
);

-- complete_job / fail_job ---------------------------------
insert into public.jobs (id, type, status, attempts) values
  ('00000000-0000-0000-0000-0000000000e1', 'test', 'running', 1),
  ('00000000-0000-0000-0000-0000000000e4', 'test', 'running', 4),
  ('00000000-0000-0000-0000-0000000000e5', 'test', 'running', 5),
  ('00000000-0000-0000-0000-0000000000e6', 'test', 'queued', 1),
  ('00000000-0000-0000-0000-0000000000e7', 'test', 'queued', 5);

select public.complete_job('00000000-0000-0000-0000-0000000000e1');
select public.fail_job('00000000-0000-0000-0000-0000000000e4', 'boom 4', '2030-01-01T00:00:00Z');
select public.fail_job('00000000-0000-0000-0000-0000000000e5', 'boom 5', '2030-01-01T00:00:00Z');
select public.complete_job('00000000-0000-0000-0000-0000000000e6');
select public.fail_job('00000000-0000-0000-0000-0000000000e7', 'stale', '2030-01-01T00:00:00Z');

select is(
  (select status from public.jobs where id = '00000000-0000-0000-0000-0000000000e1'),
  'done'::public.job_status,
  'complete_job marks the job done'
);

select is(
  (select row(status, run_at, last_error)::text from public.jobs
   where id = '00000000-0000-0000-0000-0000000000e4'),
  row('queued'::public.job_status, '2030-01-01T00:00:00Z'::timestamptz, 'boom 4')::text,
  'fail_job before the 5th attempt requeues at p_retry_at'
);

select is(
  (select row(status, last_error)::text from public.jobs
   where id = '00000000-0000-0000-0000-0000000000e5'),
  row('failed'::public.job_status, 'boom 5')::text,
  'fail_job on the 5th attempt marks the job failed'
);

select is(
  (select status from public.jobs where id = '00000000-0000-0000-0000-0000000000e6'),
  'queued'::public.job_status,
  'complete_job from a stale worker leaves a job that is no longer running alone'
);

select is(
  (select row(status, last_error)::text from public.jobs
   where id = '00000000-0000-0000-0000-0000000000e7'),
  row('queued'::public.job_status, null::text)::text,
  'fail_job from a stale worker leaves a job that is no longer running alone'
);

-- Account deletion cancels billing ------------------------
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000f1', 'jobs-f1@test.local'),
  ('00000000-0000-0000-0000-0000000000f2', 'jobs-f2@test.local');

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000f3', 'jobs-f3@test.local');

insert into public.billing_customers (user_id, provider, customer_id) values
  ('00000000-0000-0000-0000-0000000000f1', 'stripe', 'cus_jobs_test'),
  ('00000000-0000-0000-0000-0000000000f3', 'other', 'cus_jobs_other');

delete from auth.users where id in
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000f3');

select is(
  (select count(*) from public.jobs
   where type = 'billing-cancel' and payload = '{"customer_id": "cus_jobs_test"}'::jsonb),
  1::bigint,
  'deleting a user enqueues one billing-cancel job for the customer'
);

select is(
  (select count(*) from public.jobs
   where type = 'billing-cancel' and payload->>'customer_id' = 'cus_jobs_other'),
  0::bigint,
  'a customer of another provider gets no Stripe cancel job'
);

-- Daily digest --------------------------------------------
delete from public.jobs where type = 'daily-digest';

insert into auth.users (id, phone) values
  ('00000000-0000-0000-0000-0000000000f4', '+491700000000');

-- the Vercel fallback (/api/jobs/worker?daily=1) calls it as service_role
set local role service_role;
select lives_ok('select public.enqueue_daily_digests()', 'service_role can enqueue daily digests');
select public.enqueue_daily_digests();
set local role authenticated;
select throws_ok('select public.enqueue_daily_digests()', '42501', null, 'authenticated cannot enqueue daily digests');
reset role;

select is(
  (select count(*) from public.jobs where type = 'daily-digest'),
  (select count(*) from auth.users where email is not null),
  'enqueue_daily_digests adds one job per user with email, also when called twice'
);

select is(
  (select count(*) from public.jobs
   where type = 'daily-digest' and payload->>'user_id' = '00000000-0000-0000-0000-0000000000f4'),
  0::bigint,
  'a user without email gets no digest job'
);

select is(
  (select payload from public.jobs
   where type = 'daily-digest' and payload->>'user_id' = '00000000-0000-0000-0000-0000000000f2'),
  jsonb_build_object(
    'user_id', '00000000-0000-0000-0000-0000000000f2',
    'day', (now() at time zone 'utc')::date),
  'the digest payload carries user_id and the UTC day'
);

-- pg_cron / pg_net ----------------------------------------
select is(
  (select count(*) from cron.job where jobname in ('studio-worker', 'studio-daily-digest')),
  2::bigint,
  'worker and daily digest are scheduled'
);

delete from vault.secrets where name in ('worker_url', 'cron_secret');

select kit.trigger_worker();

select is(
  (select count(*) from net.http_request_queue where url = 'https://worker.test/api/jobs/worker'),
  0::bigint,
  'trigger_worker is a no-op without vault secrets'
);

select vault.create_secret('https://worker.test/api/jobs/worker', 'worker_url');
select vault.create_secret('s3cret', 'cron_secret');

select kit.trigger_worker();

select is(
  (select headers->>'Authorization' from net.http_request_queue
   where url = 'https://worker.test/api/jobs/worker' and method = 'POST'),
  'Bearer s3cret',
  'trigger_worker posts to the vault URL with the cron secret'
);

-- Privileges ----------------------------------------------
select ok(
  not has_function_privilege('authenticated', 'public.complete_job(uuid)', 'execute')
  and not has_function_privilege('authenticated', 'public.fail_job(uuid, text, timestamptz)', 'execute')
  and not has_function_privilege('authenticated', 'public.enqueue_daily_digests()', 'execute')
  and not has_function_privilege('anon', 'public.claim_jobs(integer)', 'execute')
  and not has_function_privilege('authenticated', 'kit.trigger_worker()', 'execute')
  and not has_function_privilege('authenticated', 'kit.enqueue_billing_cancel()', 'execute')
  and has_function_privilege('service_role', 'public.claim_jobs(integer)', 'execute'),
  'job functions are service_role only'
);

set local role authenticated;

select throws_ok(
  'select public.claim_jobs(10)',
  '42501',
  null,
  'authenticated cannot execute claim_jobs'
);

reset role;

select * from finish();
rollback;
